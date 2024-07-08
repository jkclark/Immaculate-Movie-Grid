export interface Actor {
  id: number;
  name: string;
  credits: Set<Credit>;
}

export interface Credit {
  type: "movie" | "tv";
  id: number;
  name: string;
  genre_ids: number[];
  popularity: number;
}

export interface CreditExtraInfo {
  type: "movie" | "tv";
  id: number;
  rating: "G" | "PG" | "PG-13" | "R" | "TV-Y" | "TV-Y7" | "TV-G" | "TV-PG" | "TV-14" | "TV-MA" | "NR";
}
