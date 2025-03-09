import { Credit } from "src/interfaces";
import { Graph, GraphEntity, GraphEntityData } from "src/ports/interfaces/graph";

/***** For describing a graph's data *****/
export type ActorOrCategoryGraphEntityData = GraphEntityData;
export interface CreditGraphEntityData extends GraphEntityData {
  genre_ids: number[];
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
