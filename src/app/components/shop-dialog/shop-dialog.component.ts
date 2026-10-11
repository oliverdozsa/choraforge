import { ChangeDetectionStrategy, Component, EventEmitter, OnInit, Output, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslocoDirective } from '@jsverse/transloco';
import { AppDialogComponent } from '../app-dialog/app-dialog.component';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';
import { LocalizedDatePipe } from '../../pipes/localized-date.pipe';
import { ChoreStoreService } from '../../services/chore-store.service';
import { ShopItemResponse, ShopPurchaseResponse } from '../../models/api.model';

type ShopTab = 'items' | 'mine' | 'orders';

@Component({
  selector: 'app-shop-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslocoDirective, AppDialogComponent, ConfirmDialogComponent, LocalizedDatePipe],
  templateUrl: './shop-dialog.component.html',
  styleUrl: './shop-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShopDialogComponent implements OnInit {
  @Output() closed = new EventEmitter<void>();

  private readonly store = inject(ChoreStoreService);

  readonly isTeamAdmin = this.store.isTeamAdmin;
  readonly gold = computed(() => this.store.currentMembership()?.gold ?? 0);
  readonly memberNames = this.store.assignedUserNames;

  readonly tab = signal<ShopTab>('items');
  readonly items = signal<ShopItemResponse[]>([]);
  readonly myPurchases = signal<ShopPurchaseResponse[]>([]);
  readonly orders = signal<ShopPurchaseResponse[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  /** Translation key of the current error or confirmation message. */
  readonly formError = signal<string | null>(null);
  readonly notice = signal<string | null>(null);

  readonly quantities = signal<Record<string, number>>({});

  // Admin item form: `editingId` is null while creating a new item.
  readonly formOpen = signal(false);
  readonly editingId = signal<string | null>(null);
  name = '';
  price: number | null = null;
  stock: number | null = null;
  imageUrl = '';
  readonly deletingItem = signal<ShopItemResponse | null>(null);
  readonly previewItem = signal<ShopItemResponse | null>(null);

  readonly openOrders = computed(() => this.orders().filter((o) => !o.fulfilled));
  readonly doneOrders = computed(() => this.orders().filter((o) => o.fulfilled));

  ngOnInit(): void {
    void this.reload();
  }

  private async reload(): Promise<void> {
    this.loading.set(true);
    const [items, mine, orders] = await Promise.all([
      this.store.loadShopItems(),
      this.store.loadShopPurchases(false),
      this.isTeamAdmin() ? this.store.loadShopPurchases(true) : Promise.resolve(null),
    ]);
    if (items) this.items.set(items);
    if (mine) this.myPurchases.set(mine);
    if (orders) this.orders.set(orders);
    this.loading.set(false);
  }

  /** Escape reaches both stacked dialogs; the preview closes first and the shop stays open. */
  onShopClosed(): void {
    if (this.previewItem()) this.previewItem.set(null);
    else this.closed.emit();
  }

  setTab(tab: ShopTab): void {
    this.tab.set(tab);
    this.formError.set(null);
    this.notice.set(null);
  }

  quantity(item: ShopItemResponse): number {
    return this.quantities()[item.id] ?? 1;
  }

  setQuantity(item: ShopItemResponse, value: number | null): void {
    this.quantities.update((q) => ({ ...q, [item.id]: Number.isInteger(value) && value! > 0 ? value! : 1 }));
  }

  maxQuantity(item: ShopItemResponse): number | null {
    return item.stock ?? null;
  }

  soldOut(item: ShopItemResponse): boolean {
    return item.stock !== undefined && item.stock !== null && item.stock <= 0;
  }

  total(item: ShopItemResponse): number {
    return item.price * this.quantity(item);
  }

  canAfford(item: ShopItemResponse): boolean {
    return this.total(item) <= this.gold();
  }

  async buy(item: ShopItemResponse): Promise<void> {
    const quantity = this.quantity(item);
    const stock = item.stock;
    if (stock !== undefined && stock !== null && quantity > stock) {
      this.formError.set('shop.errors.overStock');
      this.notice.set(null);
      return;
    }
    await this.run(
      () => this.store.purchaseShopItem(item.id, quantity),
      'shop.purchased',
      'errors.purchase',
      () => this.quantities.update((q) => ({ ...q, [item.id]: 1 })),
    );
  }

  openForm(item?: ShopItemResponse): void {
    this.editingId.set(item?.id ?? null);
    this.name = item?.name ?? '';
    this.price = item?.price ?? null;
    this.stock = item?.stock ?? null;
    this.imageUrl = item?.imageUrl ?? '';
    this.formError.set(null);
    this.notice.set(null);
    this.formOpen.set(true);
  }

  closeForm(): void {
    this.formOpen.set(false);
  }

  async saveItem(): Promise<void> {
    const name = this.name.trim();
    const imageUrl = this.imageUrl.trim();
    if (!name) return this.fail('shop.errors.nameRequired');
    if (this.price === null || !Number.isInteger(this.price) || this.price < 0) return this.fail('shop.errors.priceInvalid');
    if (this.stock !== null && (!Number.isInteger(this.stock) || this.stock < 0)) return this.fail('shop.errors.stockInvalid');
    if (imageUrl && !/^https?:\/\/\S+$/.test(imageUrl)) return this.fail('shop.errors.imageInvalid');
    await this.run(
      () =>
        this.store.saveShopItem(this.editingId(), {
          name,
          price: this.price!,
          ...(this.stock !== null ? { stock: this.stock } : {}),
          ...(imageUrl ? { imageUrl } : {}),
        }),
      'shop.itemSaved',
      'errors.saveItem',
      () => this.closeForm(),
    );
  }

  async confirmDelete(): Promise<void> {
    const item = this.deletingItem();
    if (!item) return;
    await this.run(() => this.store.deleteShopItem(item.id), 'shop.itemDeleted', 'errors.deleteItem');
    this.deletingItem.set(null);
  }

  async toggleFulfilled(order: ShopPurchaseResponse): Promise<void> {
    if (this.saving()) return;
    this.saving.set(true);
    this.formError.set(null);
    this.notice.set(null);
    const updated = await this.store.setPurchaseFulfilled(order.id, !order.fulfilled);
    this.saving.set(false);
    if (!updated) {
      this.formError.set(this.store.error() ?? 'errors.generic');
      return;
    }
    const replace = (list: ShopPurchaseResponse[]) => list.map((p) => (p.id === updated.id ? updated : p));
    this.orders.update(replace);
    this.myPurchases.update(replace);
  }

  private fail(key: string): void {
    this.notice.set(null);
    this.formError.set(key);
  }

  private async run(action: () => Promise<boolean>, doneKey: string, errorKey: string, onSuccess?: () => void): Promise<void> {
    if (this.saving()) return;
    this.saving.set(true);
    this.formError.set(null);
    this.notice.set(null);
    const ok = await action();
    if (ok) {
      onSuccess?.();
      await this.reload();
      this.notice.set(doneKey);
    } else {
      this.formError.set(this.store.error() ?? errorKey);
    }
    this.saving.set(false);
  }
}
