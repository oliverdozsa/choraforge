import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  CardVerificationResponse,
  ChoreCardResponse,
  CreateTeamRequest,
  JoinTeamRequest,
  TeamMemberResponse,
  TeamResponse,
  UserResponse,
} from '../models/api.model';

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

  getTeamCards(teamId: string): Observable<ChoreCardResponse[]> {
    return this.http.get<ChoreCardResponse[]>(`${this.base}/teams/${teamId}/cards`);
  }

  getLeaderboard(teamId: string): Observable<TeamMemberResponse[]> {
    return this.http.get<TeamMemberResponse[]>(`${this.base}/teams/${teamId}/leaderboard`);
  }

  claimCard(cardId: string): Observable<ChoreCardResponse> {
    return this.http.post<ChoreCardResponse>(`${this.base}/cards/${cardId}/claim`, {});
  }

  completeCard(cardId: string): Observable<ChoreCardResponse> {
    return this.http.post<ChoreCardResponse>(`${this.base}/cards/${cardId}/complete`, {});
  }

  verifyCard(cardId: string): Observable<CardVerificationResponse> {
    return this.http.post<CardVerificationResponse>(`${this.base}/cards/${cardId}/verify`, {});
  }
}
