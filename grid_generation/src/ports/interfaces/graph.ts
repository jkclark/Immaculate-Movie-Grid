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
