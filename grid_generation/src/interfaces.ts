import { GraphEntity } from "./getGridFromGraph";

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
  release_date: string;

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

interface CreditOnlyIdAndType {
  type: "movie" | "tv";
  id: string;
}

export function getCreditUniqueString(credit: CreditOnlyIdAndType): string {
  return `${credit.type}-${credit.id}`;
}

// Graph-related interfaces
export interface ActorCreditGraph {
  actors: { [key: string]: ActorNode };
  credits: { [key: string]: CreditNode };
}
export interface ActorNode extends GraphEntity {
  name: string;
  connections: { [key: string]: CreditNode };
}

export interface CreditNode extends Credit, GraphEntity {
  connections: { [key: string]: ActorNode };
}
