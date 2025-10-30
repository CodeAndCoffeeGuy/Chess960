import { Metadata } from 'next';
import { pageSEO } from '@/lib/seo';
import TournamentsPageClient from '../TournamentsPageClient';

export const metadata: Metadata = pageSEO.tournaments;

export default function TournamentsPage() {
  return <TournamentsPageClient />;
}