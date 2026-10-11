import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, firstValueFrom, from } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  CardStatus,
  CardVerificationResponse,
  ChoreCardResponse,
  ChoreCardTemplateResponse,
  CreateChoreCardRequest,
  CreateChoreCardTemplateRequest,
  CreateTeamRequest,
  ExtendSeasonRequest,
  SeasonResponse,
  SeasonResultResponse,
  SetSeasonLengthRequest,
  AcceptInvitationRequest,
  CreateInvitationRequest,
  InvitationResponse,
  AssignRoleRequest,
  PagedResponse,
  PurchaseRequest,
  SetFulfilledRequest,
  ShopItemRequest,
  ShopItemResponse,
  ShopPurchaseResponse,
  SetGoldRequest,
  TeamMemberResponse,
  TeamResponse,
  UpdateChoreCardRequest,
  UpdateChoreCardTemplateRequest,
  UserResponse,
} from '../models/api.model';

const ALL_CARD_STATUSES: CardStatus[] = ['AVAILABLE', 'CLAIMED', 'COMPLETED', 'VERIFIED'];
const TEAM_CARDS_PAGE_SIZE = 100;

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiBaseUrl}/api/v1`;

  getMe(): Observable<UserResponse> {
    return this.http.get<UserResponse>(`${this.base}/users/me`);
  }

  getHand(userId: string): Observable<ChoreCardResponse[]> {
    return this.http.get<ChoreCardResponse[]>(`${this.base}/users/${userId}/hand`);
  }

  createTeam(request: CreateTeamRequest): Observable<TeamResponse> {
    return this.http.post<TeamResponse>(`${this.base}/teams`, request);
  }

  getTeamInvitations(teamId: string): Observable<InvitationResponse[]> {
    return this.http.get<InvitationResponse[]>(`${this.base}/teams/${teamId}/invitations`);
  }

  inviteToTeam(teamId: string, request: CreateInvitationRequest): Observable<unknown> {
    return this.http.post<unknown>(`${this.base}/teams/${teamId}/invitations`, request);
  }

  revokeInvitation(teamId: string, invitationId: string): Observable<unknown> {
    return this.http.delete<unknown>(`${this.base}/teams/${teamId}/invitations/${invitationId}`);
  }

  getSeasons(teamId: string): Observable<SeasonResponse[]> {
    return this.http.get<SeasonResponse[]>(`${this.base}/teams/${teamId}/seasons`);
  }

  getCurrentSeason(teamId: string): Observable<SeasonResponse> {
    return this.http.get<SeasonResponse>(`${this.base}/teams/${teamId}/seasons/current`);
  }

  getSeasonResults(teamId: string, seasonId: string): Observable<SeasonResultResponse[]> {
    return this.http.get<SeasonResultResponse[]>(`${this.base}/teams/${teamId}/seasons/${seasonId}/results`);
  }

  setSeasonLength(teamId: string, request: SetSeasonLengthRequest): Observable<TeamResponse> {
    return this.http.put<TeamResponse>(`${this.base}/teams/${teamId}/season-length`, request);
  }

  endSeason(teamId: string): Observable<SeasonResponse> {
    return this.http.post<SeasonResponse>(`${this.base}/teams/${teamId}/seasons/end`, {});
  }

  extendSeason(teamId: string, request: ExtendSeasonRequest): Observable<SeasonResponse> {
    return this.http.post<SeasonResponse>(`${this.base}/teams/${teamId}/seasons/extend`, request);
  }

  getMyInvitations(): Observable<InvitationResponse[]> {
    return this.http.get<InvitationResponse[]>(`${this.base}/invitations`);
  }

  acceptInvitationByCode(request: AcceptInvitationRequest): Observable<TeamResponse> {
    return this.http.post<TeamResponse>(`${this.base}/invitations/accept`, request);
  }

  getTeamCardsPage(
    teamId: string,
    page: number,
    size: number = TEAM_CARDS_PAGE_SIZE,
    statuses: CardStatus[] = ALL_CARD_STATUSES,
  ): Observable<PagedResponse<ChoreCardResponse>> {
    return this.http.get<PagedResponse<ChoreCardResponse>>(`${this.base}/teams/${teamId}/cards`, {
      params: { page, size, status: statuses.join(',') },
    });
  }

  /** Fetches every page of the team's cards and flattens them into a single list. */
  getTeamCards(teamId: string, statuses: CardStatus[] = ALL_CARD_STATUSES): Observable<ChoreCardResponse[]> {
    return from(this.fetchAllTeamCards(teamId, statuses));
  }

  private async fetchAllTeamCards(teamId: string, statuses: CardStatus[]): Promise<ChoreCardResponse[]> {
    const cards: ChoreCardResponse[] = [];
    let page = 0;
    let totalPages = 1;
    do {
      const response = await firstValueFrom(this.getTeamCardsPage(teamId, page, TEAM_CARDS_PAGE_SIZE, statuses));
      cards.push(...response.items);
      totalPages = response.totalPages;
      page++;
    } while (page < totalPages);
    return cards;
  }

  createCard(request: CreateChoreCardRequest): Observable<ChoreCardResponse> {
    return this.http.post<ChoreCardResponse>(`${this.base}/cards`, request);
  }

  updateCard(cardId: string, request: UpdateChoreCardRequest): Observable<ChoreCardResponse> {
    return this.http.put<ChoreCardResponse>(`${this.base}/cards/${cardId}`, request);
  }

  deleteCard(cardId: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/cards/${cardId}`);
  }

  getLeaderboard(teamId: string): Observable<TeamMemberResponse[]> {
    return this.http.get<TeamMemberResponse[]>(`${this.base}/teams/${teamId}/leaderboard`);
  }

  setMemberGold(teamId: string, userId: string, request: SetGoldRequest): Observable<TeamMemberResponse> {
    return this.http.put<TeamMemberResponse>(`${this.base}/teams/${teamId}/members/${userId}/gold`, request);
  }

  assignRole(teamId: string, request: AssignRoleRequest): Observable<TeamMemberResponse> {
    return this.http.post<TeamMemberResponse>(`${this.base}/teams/${teamId}/role`, request);
  }

  claimCard(cardId: string): Observable<ChoreCardResponse> {
    return this.http.post<ChoreCardResponse>(`${this.base}/cards/${cardId}/claim`, {});
  }

  unclaimCard(cardId: string): Observable<ChoreCardResponse> {
    return this.http.post<ChoreCardResponse>(`${this.base}/cards/${cardId}/unclaim`, {});
  }

  completeCard(cardId: string): Observable<ChoreCardResponse> {
    return this.http.post<ChoreCardResponse>(`${this.base}/cards/${cardId}/complete`, {});
  }

  verifyCard(cardId: string): Observable<CardVerificationResponse> {
    return this.http.post<CardVerificationResponse>(`${this.base}/cards/${cardId}/verify`, {});
  }

  acknowledgeReward(cardId: string): Observable<ChoreCardResponse> {
    return this.http.post<ChoreCardResponse>(`${this.base}/cards/${cardId}/acknowledge-reward`, {});
  }

  getTeamCardTemplates(teamId: string): Observable<ChoreCardTemplateResponse[]> {
    return this.http.get<ChoreCardTemplateResponse[]>(`${this.base}/teams/${teamId}/card-templates`);
  }

  createCardTemplate(request: CreateChoreCardTemplateRequest): Observable<ChoreCardTemplateResponse> {
    return this.http.post<ChoreCardTemplateResponse>(`${this.base}/card-templates`, request);
  }

  updateCardTemplate(
    templateId: string,
    request: UpdateChoreCardTemplateRequest,
  ): Observable<ChoreCardTemplateResponse> {
    return this.http.put<ChoreCardTemplateResponse>(`${this.base}/card-templates/${templateId}`, request);
  }

  deleteCardTemplate(templateId: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/card-templates/${templateId}`);
  }

  getShopItems(teamId: string): Observable<ShopItemResponse[]> {
    return this.http.get<ShopItemResponse[]>(`${this.base}/teams/${teamId}/shop/items`);
  }

  createShopItem(teamId: string, request: ShopItemRequest): Observable<ShopItemResponse> {
    return this.http.post<ShopItemResponse>(`${this.base}/teams/${teamId}/shop/items`, request);
  }

  updateShopItem(teamId: string, itemId: string, request: ShopItemRequest): Observable<ShopItemResponse> {
    return this.http.put<ShopItemResponse>(`${this.base}/teams/${teamId}/shop/items/${itemId}`, request);
  }

  deleteShopItem(teamId: string, itemId: string): Observable<unknown> {
    return this.http.delete<unknown>(`${this.base}/teams/${teamId}/shop/items/${itemId}`);
  }

  purchaseShopItem(teamId: string, itemId: string, request: PurchaseRequest): Observable<ShopPurchaseResponse> {
    return this.http.post<ShopPurchaseResponse>(`${this.base}/teams/${teamId}/shop/items/${itemId}/purchase`, request);
  }

  /** With `all`, admins get every member's purchases instead of just their own. */
  getShopPurchases(teamId: string, all = false): Observable<ShopPurchaseResponse[]> {
    return this.http.get<ShopPurchaseResponse[]>(`${this.base}/teams/${teamId}/shop/purchases`, {
      params: { all },
    });
  }

  setPurchaseFulfilled(
    teamId: string,
    purchaseId: string,
    request: SetFulfilledRequest,
  ): Observable<ShopPurchaseResponse> {
    return this.http.put<ShopPurchaseResponse>(
      `${this.base}/teams/${teamId}/shop/purchases/${purchaseId}/fulfilled`,
      request,
    );
  }
}
