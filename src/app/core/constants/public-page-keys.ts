export const DEFAULT_PUBLIC_PAGE_KEY = 'default';

export const PUBLIC_PAGE_KEYS = [
  DEFAULT_PUBLIC_PAGE_KEY,
  'home',
  'actualites',
  'resultats',
  'classements',
  'calendrier',
  'coaching',
  'portraits',
  'international',
  'live',
  'videos',
  'apropos',
] as const;

export type PublicPageKey = (typeof PUBLIC_PAGE_KEYS)[number];

export const PUBLIC_PAGE_LABELS: Record<PublicPageKey, string> = {
  default: 'Par défaut (fallback)',
  home: 'Accueil',
  actualites: 'Actualités',
  resultats: 'Résultats',
  classements: 'Classements',
  calendrier: 'Calendrier',
  coaching: 'Coaching',
  portraits: 'Portraits',
  international: 'International',
  live: 'Live',
  videos: 'Vidéos',
  apropos: 'À propos',
};

export function isSidebarAdSlot(slot: string): boolean {
  return slot === 'sidebar_top' || slot === 'sidebar_bottom';
}
