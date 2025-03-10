import { Credit } from "src/interfaces";
import { Graph, GraphData, GraphEntity, GraphEntityData, LinkData } from "src/ports/graph";

/***** For describing a graph's data *****/
export type ActorOrCategoryGraphEntityData = GraphEntityData;
export interface CreditGraphEntityData extends GraphEntityData {
  genre_ids: number[];
}

export interface MovieGraphData extends GraphData {
  axisEntities: { [key: string]: ActorOrCategoryGraphEntityData };
  connections: { [key: string]: CreditGraphEntityData };
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
