import { RankingBadge } from './ranking-badge';

export interface User {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string | null;
    university: string | null;
    gender: string | null;
    status: string | null;
    image: string | null;
    role: string | null;
    totalPoints: number;
    experiencePoints: number;
    rxCoinBalance: number;
    rxCoinOnHold: number;
    level: number;
    currentStreak: number;
    canRedeemDailyStreakToday: boolean;
    dailyStreakRewardPoints: number;
    rankingBadges: RankingBadge[];
    jwt: string;
}
