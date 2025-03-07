/**
 * It should be noted that AxisEntity and Connection are the same type, but they are separated for clarity.
 * The grid-generation algorithm could work in either direction. The graph is really just a network of two
 * different sets of nodes, and we could generate a grid with either set as the axis entities and the other
 * as the connections.
 */
export interface GraphEntity {
  id: string;
  connections: { [key: string]: Connection };
  entityType: string;
  name?: string;
}

export type AxisEntity = GraphEntity;
export type Connection = GraphEntity;

export interface Graph {
  axisEntities: { [key: string]: AxisEntity };
  connections: { [key: string]: Connection };
}
