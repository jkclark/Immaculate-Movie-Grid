/**
 * It should be noted that AxisEntity and Connection are the same type, but they are separated for clarity.
 * The grid-generation algorithm could work in either direction. The graph is really just a network of two
 * different sets of nodes, and we could generate a grid with either set as the axis entities and the other
 * as the connections.
 */

/***** For describing a graph's data *****/
export interface GraphEntityData {
  id: string;
  entityType: string;
  name?: string;
}

export type AxisEntityData = GraphEntityData;
export type ConnectionData = GraphEntityData;

export interface GraphData {
  axisEntities: { [key: string]: AxisEntityData };
  connections: { [key: string]: ConnectionData };
}
/*****************************************/

/***** For an actual graph *****/
export interface GraphEntity extends GraphEntityData {
  links: { [key: string]: Connection };
}

export type AxisEntity = GraphEntity;
export type Connection = GraphEntity;

export interface Graph {
  axisEntities: { [key: string]: AxisEntity };
  connections: { [key: string]: Connection };
}
/*******************************/
