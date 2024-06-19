export interface ActorExport {
  id: number;
  name: string;
}

export interface CreditExport {
  // For now this is the same as Credit
  type: "movie" | "tv";
  id: number;
  name: string;
}

export interface GridExport {
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
