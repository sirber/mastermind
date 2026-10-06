import { GetLeaderboardQueryHandler } from '../application/queries/GetLeaderboardQueryHandler';
import { PrismaLeaderboardRepository } from '../infrastructure/PrismaLeaderboardRepository';

export const getLeaderboard = new GetLeaderboardQueryHandler(new PrismaLeaderboardRepository());
