export interface ActorExport {
  id: number;
  name: string;
}

export interface CategoryExport {
  id: number;
  name: string;
}

export interface CreditExport {
  type: "movie" | "tv";
  id: number;
  name: string;
}

export interface GridExport {
  id: string; // this is typically the grid's date

  // axes will contain strings like "actor-4495" or "category-1",
  // which allow the frontend to know which actor or category to use.
  // axes contains both across and down axes' information.
  axes: string[];

  actors: ActorExport[];
  categories: CategoryExport[];
  credits: CreditExport[];

  // A mapping of actor/category ID -> credit IDs
  answers: { [key: number]: { type: "movie" | "tv"; id: number }[] }; // actor id -> [{type, id}, ...]
}

export interface SearchResult {
  media_type: "movie" | "tv";
  id: number;
  title: string;
  release_date?: string; // Only for movies
  first_air_date?: string; // Only for TV shows
  last_air_date?: string; // Only for TV shows
}
