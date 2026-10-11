export type Rarity = 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';

export type CardStatus = 'AVAILABLE' | 'CLAIMED' | 'COMPLETED' | 'VERIFIED';

export type RecurrenceType = 'SCHEDULE' | 'AFTER_COMPLETION';

export type ScheduleFrequency = 'DAILY' | 'WEEKLY' | 'MONTHLY';

export type DayOfWeek =
  | 'MONDAY'
  | 'TUESDAY'
  | 'WEDNESDAY'
  | 'THURSDAY'
  | 'FRIDAY'
  | 'SATURDAY'
  | 'SUNDAY';

export interface ScheduleDto {
  frequency: ScheduleFrequency;
  interval?: number;
  daysOfWeek?: DayOfWeek[];
  dayOfMonth?: number;
  time: string;
  timeZone?: string;
}

export interface RecurrenceDto {
  type: RecurrenceType;
  intervalMinutes?: number;
  schedule?: ScheduleDto;
}

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
  imageUrl?: string;
  status: CardStatus;
  assignedUserId?: string;
  teamId: string;
  templateId?: string;
  createdAt: string;
  claimedAt?: string;
  completedAt?: string;
  verifiedAt?: string;
  rewardAcknowledgedAt?: string;
  dueDateIntervalHours?: number;
  dueAt?: string;
  recurrence?: RecurrenceDto;
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

export interface AssignRoleRequest {
  userId: string;
  role: TeamRole;
}

export interface SetGoldRequest {
  gold: number;
}

export interface TeamResponse {
  id: string;
  name: string;
  seasonLengthDays?: number;
  createdAt: string;
}

export interface CreateTeamRequest {
  name: string;
}

export type InvitationStatus = 'PENDING' | 'ACCEPTED' | 'REVOKED';

export interface InvitationResponse {
  id: string;
  teamId: string;
  teamName: string;
  email: string;
  status: InvitationStatus;
  createdAt: string;
  expiresAt: string;
  code?: string;
}

export interface CreateInvitationRequest {
  email: string;
}

export interface AcceptInvitationRequest {
  code: string;
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
  imageUrl?: string;
  dueDateIntervalHours?: number;
  recurrence?: RecurrenceDto;
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
  imageUrl?: string;
  createdAt: string;
  dueDateIntervalHours?: number;
  recurrence?: RecurrenceDto;
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
  imageUrl?: string;
  dueDateIntervalHours?: number;
  recurrence?: RecurrenceDto;
}

export interface UpdateChoreCardRequest {
  title: string;
  description?: string;
  rarity: Rarity;
  complexity: number;
  estimatedMinutes: number;
  xpReward: number;
  goldReward: number;
  itemDrop?: string;
  imageUrl?: string;
  dueDateIntervalHours?: number;
  recurrence?: RecurrenceDto;
}

export interface UpdateChoreCardTemplateRequest {
  title: string;
  description?: string;
  rarity: Rarity;
  complexity: number;
  estimatedMinutes: number;
  xpReward: number;
  goldReward: number;
  itemDrop?: string;
  imageUrl?: string;
  dueDateIntervalHours?: number;
  recurrence?: RecurrenceDto;
}

export type SeasonStatus = 'ACTIVE' | 'ENDED';

export interface SeasonResponse {
  id: string;
  teamId: string;
  number: number;
  status: SeasonStatus;
  startsAt: string;
  endsAt: string;
}

export interface SeasonResultResponse {
  userId: string;
  name: string;
  rank: number;
  level: number;
  currentXp: number;
  gold: number;
  cardsVerified: number;
}

export interface SetSeasonLengthRequest {
  days: number;
}

export interface ExtendSeasonRequest {
  days: number;
}
