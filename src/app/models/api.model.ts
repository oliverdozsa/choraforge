export type Rarity = 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';

export type CardStatus = 'AVAILABLE' | 'CLAIMED' | 'COMPLETED' | 'VERIFIED';

export type TeamRole = 'USER' | 'ADMIN' | 'TEAM_ADMIN';

export interface ChoreCardResponse {
  id: string;
  title: string;
  description?: string;
  rarity: Rarity;
  complexity: number;
  estimatedMinutes: number;
  xpReward: number;
  goldReward: number;
  itemDrop?: string;
  status: CardStatus;
  assignedUserId?: string;
  teamId: string;
  templateId?: string;
  createdAt: string;
  claimedAt?: string;
  completedAt?: string;
  verifiedAt?: string;
  rewardAcknowledgedAt?: string;
}

export interface PagedResponse<T> {
  items: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface CardVerificationResponse {
  cardCompleted: ChoreCardResponse;
  xpGained: number;
  goldGained: number;
  leveledUp: boolean;
  newLevel: number;
}

export interface TeamMembershipResponse {
  teamId: string;
  teamName: string;
  role: TeamRole;
  level: number;
  currentXp: number;
  nextLevelXp: number;
  gold: number;
  joinedAt: string;
}

export interface UserResponse {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  teams: TeamMembershipResponse[];
}

export interface TeamMemberResponse {
  userId: string;
  name: string;
  givenName: string;
  familyName: string;
  email: string;
  level: number;
  currentXp: number;
  nextLevelXp: number;
  gold: number;
  role: TeamRole;
}

export interface TeamResponse {
  id: string;
  name: string;
  createdAt: string;
}

export interface CreateTeamRequest {
  name: string;
}

export interface JoinTeamRequest {
  email: string;
}

export interface CreateChoreCardRequest {
  teamId: string;
  title: string;
  description?: string;
  rarity: Rarity;
  complexity: number;
  estimatedMinutes: number;
  xpReward: number;
  goldReward: number;
  itemDrop?: string;
}

export interface ChoreCardTemplateResponse {
  id: string;
  teamId: string;
  title: string;
  description?: string;
  rarity: Rarity;
  complexity: number;
  estimatedMinutes: number;
  xpReward: number;
  goldReward: number;
  itemDrop?: string;
  createdAt: string;
}

export interface CreateChoreCardTemplateRequest {
  teamId: string;
  title: string;
  description?: string;
  rarity: Rarity;
  complexity: number;
  estimatedMinutes: number;
  xpReward: number;
  goldReward: number;
  itemDrop?: string;
}
