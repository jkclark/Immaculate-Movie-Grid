export interface Actor {
  id: string;
  name: string;
  credits: Set<Credit>;
}

export interface Credit {
  type: "movie" | "tv";
  id: string;
  name: string;
  genre_ids: number[];
  popularity: number;
  rating?: CreditRating;
}

export type CreditRating =
  | "G"
  | "PG"
  | "PG-13"
  | "R"
  | "TV-Y"
  | "TV-Y7"
  | "TV-G"
  | "TV-PG"
  | "TV-14"
  | "TV-MA"
  | "NR";

export function getCreditUniqueString(credit: Credit): string {
  return `${credit.type}-${credit.id}`;
}
