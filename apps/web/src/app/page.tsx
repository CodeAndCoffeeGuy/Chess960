import { Metadata } from 'next';
import { pageSEO } from '@/lib/seo';
import HomePageClient from './HomePageClient';

export const metadata: Metadata = pageSEO.home;

export default function HomePage() {
  return <HomePageClient />;
}