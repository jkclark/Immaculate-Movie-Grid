import { Credit } from "src/interfaces";
import { Graph, GraphData, GraphEntity, GraphEntityData, LinkData } from "src/ports/graph";

/***** For describing a graph's data *****/
export type ActorOrCategoryGraphEntityData = GraphEntityData;
export interface CreditGraphEntityData extends GraphEntityData {
  genre_ids: number[];
}

export interface ActorCreditGraphData extends GraphData {
  axisEntities: { [key: string]: ActorOrCategoryGraphEntityData };
  connections: { [key: string]: CreditGraphEntityData };
  links: LinkData[];
}
/*****************************************/

/***** For an actual graph *****/
export interface ActorCreditGraph extends Graph {
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
