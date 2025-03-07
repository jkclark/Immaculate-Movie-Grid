import DataScraper from "./dataScraper";
import DataStoreHandler from "./dataStoreHandler";
import { AxisEntity, Connection, Graph } from "./interfaces/graph";

export default abstract class GraphHandler {
  protected dataStoreHandler: DataStoreHandler;
  protected dataScraper: DataScraper;

  constructor(dataStoreHandler: DataStoreHandler, dataScraper: DataScraper) {
    this.dataStoreHandler = dataStoreHandler;
    this.dataScraper = dataScraper;
  }

  async init(): Promise<void> {
    await this.dataStoreHandler.init();
  }

  /* To be implemented by subclasses */
  abstract populateDataStore(): Promise<void>;

  async loadGraph(): Promise<Graph> {
    return this.dataStoreHandler.loadGraph();
  }

  /**
   * Add an axis entity to the graph.
   *
   * @param graph the graph to which the axis entity will be added
   * @param id the id of the axis entity
   * @param name the name of the axis entity
   * @param entityType the entityType of the axis entity
   */
  addAxisEntityToGraph(graph: Graph, id: string, name: string, entityType: string): void {
    if (graph.axisEntities[id]) {
      throw new RepeatError(`Axis entity with id ${id} already exists: ${graph.axisEntities[id].name}`);
    }

    graph.axisEntities[id] = { id, name, entityType, connections: {} };
  }

  /**
   * Add a connection to the graph.
   *
   * @param graph the graph to which the connection will be added
   * @param id the id of the connection
   * @param name the name of the connection
   * @param entityType the entityType of the connection
   */
  addConnectionToGraph(graph: Graph, id: string, name: string, entityType: string): void {
    if (graph.connections[id]) {
      throw new RepeatError(`Connection with id ${id} already exists: ${graph.connections[id].name}`);
    }

    graph.connections[id] = { id, name, entityType, connections: {} };
  }

  /**
   * Connect an axis entity and a connection.
   *
   * @param axisEntity the axis entity to which the connection will be linked
   * @param connection the connection to which the axis entity will be linked
   */
  linkAxisEntityAndConnection(axisEntity: AxisEntity, connection: Connection): void {
    axisEntity.connections[connection.id] = connection;
    connection.connections[axisEntity.id] = axisEntity;
  }
}

export class RepeatError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RepeatError";
  }
}
