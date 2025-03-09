/**
 * It should be noted that AxisEntity and Connection are the same type, but they are separated for clarity.
 * The grid-generation algorithm could work in either direction. The graph is really just a network of two
 * different sets of nodes, and we could generate a grid with either set as the axis entities and the other
 * as the connections.
 */

/***** For describing a graph's data *****/
/**
 * The data structure for the graph is a dictionary of axis entities and connections, where each entity
 * has a unique id, a name, and an entity type. The links are a list of (axisEntityId, connectionId) pairs,
 * where each pair represents a link between an axis entity and a connection.
 */
export interface GraphEntityData {
  id: string;
  entityType: string;
  name?: string;
}

export type AxisEntityData = GraphEntityData;
export type ConnectionData = GraphEntityData;
export interface LinkData {
  axisEntityId: string;
  connectionId: string;
}

export interface GraphData {
  axisEntities: { [key: string]: AxisEntityData };
  connections: { [key: string]: ConnectionData };
  links: LinkData[];
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
