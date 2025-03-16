import {
  AxisEntityTypeWeightInfo,
  EntityType,
  Graph,
  GraphData,
  GraphEntity,
  GraphEntityData,
  LinkData,
} from "src/ports/graph";

/***** For describing a graph's data *****/
const CREDIT_RATINGS = [
  "G",
  "PG",
  "PG-13",
  "R",
  "NC-17",
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
export interface CreditData extends Credit, GraphEntityData {}

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
  links: { [key: string]: ActorNode };
}
/*******************************/

/***** Grid generation *****/
const MOVIES_AXIS_ENTITY_TYPE_WEIGHTS_YES_CATEGORIES: { [key: string]: number } = {
  [EntityType.NON_CATEGORY]: 0.95,
  [EntityType.CATEGORY]: 0.05,
};
export const MOVIES_AXIS_ENTITY_TYPE_WEIGHT_INFO: AxisEntityTypeWeightInfo = {
  chanceOfNoCategories: 0.4,
  axisEntityTypeWeights: MOVIES_AXIS_ENTITY_TYPE_WEIGHTS_YES_CATEGORIES,
};

/**
 * Determine if a credit should be used during grid generation.
 *
 * The data store contains information about a lot of credits, some of which should
 * not be used for grid generation. For example, we might not want to include talk shows,
 * documentaries, movies in certain languages, etc. Instead of removing those credits prior
 * to storing them, we can just check if they are valid for grid generation when we
 * generate the grid.
 *
 * @param credit the credit to check
 * @returns true if the credit should be used for grid generation, false otherwise
 */
export function isCreditValidForGridGen(credit: Credit): boolean {
  /* Only consider movies */
  const { type } = getTypeAndIdFromCreditUniqueId(credit.id);
  if (!(type === "movie")) {
    return false;
  }

  /* Do not consider movies with certain genres */
  const INVALID_MOVIE_GENRE_IDS: number[] = [
    99, // Documentary
  ];
  const isInvalidGenre: boolean = credit.genre_ids.some((id) => INVALID_MOVIE_GENRE_IDS.includes(id));

  /* Do not consider certain movies */
  const INVALID_MOVIE_IDS: number[] = [
    10788, // Kambakkht Ishq
  ];
  const isInvalidMovie: boolean = INVALID_MOVIE_IDS.includes(parseInt(credit.id));

  // Still need to tweak this
  // TODO: It seems that on or around 3/11/2025, TMDB drastically changed the way popularity worked,
  // lowering the values for actors and credits alike. This resulted in several grid-generation
  // failures. I've now set this value to 0, but clearly, we need a better way of using this popularity
  // value, or we need not to use it at all. One option is to say that a movie or TV show should be in
  // the top X% (maybe 20?) of all movies or TV shows in terms of popularity.
  const MINIMUM_POPULARITY = 0;
  const popularEnough = credit.popularity > MINIMUM_POPULARITY;

  return !isInvalidGenre && !isInvalidMovie && popularEnough;
}
/***************************/

/***** Other functions *****/
/**
 * Split a credit's unique ID into its type and ID.
 *
 * Movie and TV shows are in the format "movie-123" or "tv-456".
 *
 * @param creditUniqueId the unique ID of a credit, which is of the form "type-id"
 * @returns the type and id of the credit
 */
export function getTypeAndIdFromCreditUniqueId(creditUniqueId: string): { type: string; id: string } {
  const [type, id] = creditUniqueId.split("-");
  return { type, id };
}
/***************************/
