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
  JoinTeamRequest,
  AssignRoleRequest,
  PagedResponse,
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

  joinTeam(teamId: string, request: JoinTeamRequest): Observable<TeamResponse> {
    return this.http.post<TeamResponse>(`${this.base}/team/${teamId}/join`, request);
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
}
