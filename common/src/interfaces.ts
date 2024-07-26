export interface ActorExport {
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
  actors: ActorExport[];
  credits: CreditExport[];
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
