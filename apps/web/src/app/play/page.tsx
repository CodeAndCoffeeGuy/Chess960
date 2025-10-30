import { Metadata } from 'next';
import { pageSEO } from '@/lib/seo';
import PlayPageClient from '../PlayPageClient';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export const metadata: Metadata = pageSEO.play;

export default function PlayPage() {
  return <PlayPageClient />;
}