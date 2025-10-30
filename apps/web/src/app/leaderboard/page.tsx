import { Metadata } from 'next';
import { pageSEO } from '@/lib/seo';
import LeaderboardPageClient from '../LeaderboardPageClient';

export const metadata: Metadata = pageSEO.leaderboard;

export default function LeaderboardPage() {
  return <LeaderboardPageClient />;
}