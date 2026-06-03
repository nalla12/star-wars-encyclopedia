export type Category = 'people' | 'planets' | 'films' | 'starships' | 'vehicles' | 'species';

export const CATEGORY_LABELS: Record<Category, string> = {
  people: 'Characters',
  planets: 'Planets',
  films: 'Films',
  starships: 'Starships',
  vehicles: 'Vehicles',
  species: 'Species',
};

export const CATEGORY_COLORS: Record<Category, string> = {
  people: '#ED882D',
  planets: '#151B2E',
  films: '#46D36E',
  starships: '#DA3633',
  vehicles: '#C98E4A',
  species: '#F5F5F5',
};

export interface ResourceData {
  name?: string;
  model?: string;
  title?: string;
  subtitle?: string;
  description?: string;
  year?: string;
  birthYear?: string;
  releaseDate?: string;
  image?: string;
  url?: string;
  id?: string;
  uid?: string;
}
