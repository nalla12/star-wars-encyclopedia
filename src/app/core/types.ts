export type Category = 'characters' | 'planets' | 'films' | 'transports' | 'species';

export const CATEGORIES: readonly Category[] = [
  'characters',
  'planets',
  'films',
  'transports',
  'species',
];

export function isCategory(value: unknown): value is Category {
  return typeof value === 'string' && CATEGORIES.includes(value as Category);
}

export const CATEGORY_LABELS: Record<Category, string> = {
  characters: 'Characters',
  planets: 'Planets',
  films: 'Films',
  transports: 'Transports',
  species: 'Species',
};

export const CATEGORY_COLORS: Record<Category, string> = {
  characters: '#ED882D',
  planets: '#151B2E',
  films: '#46D36E',
  transports: '#DA3633',
  species: '#F5F5F5',
};

export interface ResourceData {
  id?: string;
  uid?: string;
  name?: string;
}
