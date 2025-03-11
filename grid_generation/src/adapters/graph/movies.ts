import { Graph, GraphData, GraphEntity, GraphEntityData, LinkData } from "src/ports/graph";

/***** For describing a graph's data *****/
export interface Actor {
  id: string;
  name: string;
  credits: Set<Credit>;
}

const CREDIT_RATINGS = [
  "G",
  "PG",
  "PG-13",
  "R",
  "TV-Y",
  "TV-Y7",
  "TV-G",
  "TV-PG",
  "TV-14",
  "TV-MA",
  "NR",
] as const;
export type CreditRating = (typeof CREDIT_RATINGS)[number];

export function isCreditRating(rating: string): rating is CreditRating {
  return CREDIT_RATINGS.includes(rating as CreditRating);
}

export interface Credit {
  id: string; // Remember, id is "movie-123" or "tv-456"
  name: string;
  genre_ids: number[];
  popularity: number;
  release_date: string;

  rating?: CreditRating;
  last_air_date?: string;
}

export type ActorOrCategoryData = GraphEntityData;
export interface CreditData extends Credit, GraphEntityData {
  name: string; // Because Credit has name required and GraphEntity does not
}

export interface MovieGraphData extends GraphData {
  axisEntities: { [key: string]: ActorOrCategoryData };
  connections: { [key: string]: CreditData };
  // For movies/tv shows, the credit IDs for links should be of the form
  // "movie-123" or "tv0456".
  links: LinkData[];
}

/**
 * When we populate the data store, we need to know the genres' names.
 * When we load the data from the data store in order to generate a grid,
 * we don't need the genres' names, just their IDs.
 *
 * NOTE: I think in reality we could never store the genres' names, since
 * the categories operate on their IDs, not their names. But as it stands now,
 * the data base has a name column for genres, so we need to account for that.
 */
export interface MovieGraphDataWithGenres extends MovieGraphData {
  genres: { [key: number]: string };
}
/*****************************************/

/***** For an actual graph *****/
export interface MovieGraph extends Graph {
  axisEntities: { [key: string]: ActorNode };
  connections: { [key: string]: CreditNode };
}

export interface ActorNode extends GraphEntity {
  name: string;
  links: { [key: string]: CreditNode };
}

export interface CreditNode extends Credit, GraphEntity {
  name: string; // Because Credit has name required and GraphEntity does not
  links: { [key: string]: ActorNode };
}
/*******************************/
