import { Credit } from "src/interfaces";
import { Graph, GraphEntity } from "src/ports/interfaces/graph";

export interface ActorCreditGraph extends Graph {
  axisEntities: { [key: string]: ActorNode };
  connections: { [key: string]: CreditNode };
}

export interface ActorNode extends GraphEntity {
  name: string;
  connections: { [key: string]: CreditNode };
}

export interface CreditNode extends Credit, GraphEntity {
  name: string; // Because Credit has name required and GraphEntity does not
  connections: { [key: string]: ActorNode };
}
