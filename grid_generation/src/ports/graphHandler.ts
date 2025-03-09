import DataScraper from "./dataScraper";
import DataStoreHandler from "./dataStoreHandler";
import { AxisEntity, AxisEntityData, Connection, ConnectionData, Graph, GraphData } from "./interfaces/graph";

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
    const graphData = await this.dataStoreHandler.getGraphData();

    return this.buildGraphFromGraphData(graphData);
  }

  /**
   * Build a graph from graph data.
   *
   * The graph data is a dictionary of axis entities and connections, where each entity
   * has a unique ID, among other things. The links are a list of (axisEntityId, connectionId) pairs,
   * where each pair represents a link between an axis entity and a connection.
   *
   * @param graphData the data to build the graph from
   * @returns the populated graph
   */
  buildGraphFromGraphData(graphData: GraphData): Graph {
    const graph: Graph = this.createEmptyGraph();

    // Add all axis entities to the graph
    for (const axisEntityId in Object.keys(graphData.axisEntities)) {
      const axisEntityDatum = graphData.axisEntities[axisEntityId];
      try {
        this.addAxisEntityToGraph(graph, axisEntityDatum);
      } catch (error) {
        if (!(error instanceof RepeatError)) {
          throw error;
        }
      }
    }

    // Add all connections to the graph
    for (const connectionId in Object.keys(graphData.connections)) {
      const connectionDatum = graphData.connections[connectionId];
      try {
        this.addConnectionToGraph(graph, connectionDatum);
      } catch (error) {
        if (!(error instanceof RepeatError)) {
          throw error;
        }
      }
    }

    // Add all links to the graph
    for (const link of graphData.links) {
      const axisEntity = graph.axisEntities[link.axisEntityId];
      const connection = graph.connections[link.connectionId];
      if (axisEntity && connection) {
        this.linkAxisEntityAndConnection(axisEntity, connection);
      }
    }

    return graph;
  }

  /**
   * Create an empty graph.
   *
   * @returns an empty graph
   */
  createEmptyGraph(): Graph {
    return {
      axisEntities: {},
      connections: {},
    };
  }

  /**
   * Add an axis entity to the graph.
   *
   * @param graph the graph to which the axis entity will be added
   * @param id the id of the axis entity
   * @param name the name of the axis entity
   * @param entityType the entityType of the axis entity
   */
  addAxisEntityToGraph(graph: Graph, axisEntityData: AxisEntityData): AxisEntity {
    const id = axisEntityData.id;

    if (graph.axisEntities[id]) {
      throw new RepeatError(`Axis entity with id ${id} already exists: ${graph.axisEntities[id].name}`);
    }

    graph.axisEntities[id] = { ...axisEntityData, links: {} };

    return graph.axisEntities[id];
  }

  /**
   * Add a connection to the graph.
   *
   * @param graph the graph to which the connection will be added
   * @param id the id of the connection
   * @param name the name of the connection
   * @param entityType the entityType of the connection
   */
  addConnectionToGraph(graph: Graph, connectionData: ConnectionData): Connection {
    const id = connectionData.id;

    if (graph.connections[id]) {
      throw new RepeatError(`Connection with id ${id} already exists: ${graph.connections[id].name}`);
    }

    graph.connections[id] = { ...connectionData, links: {} };

    return graph.connections[id];
  }

  /**
   * Connect an axis entity and a connection.
   *
   * @param axisEntity the axis entity to which the connection will be linked
   * @param connection the connection to which the axis entity will be linked
   */
  linkAxisEntityAndConnection(axisEntity: AxisEntity, connection: Connection): void {
    axisEntity.links[connection.id] = connection;
    connection.links[axisEntity.id] = axisEntity;
  }

  /**
   * Create a deep copy of a graph.
   *
   * @param graph the graph to be copied
   * @returns a deep copy of the graph
   */
  deepCopyGraph(graph: Graph): Graph {
    const graphCopy: Graph = {
      axisEntities: {},
      connections: {},
    };

    for (const axisEntityId in graph.axisEntities) {
      const axisEntity = graph.axisEntities[axisEntityId];

      // Create a new axis entity in the copy
      graphCopy.axisEntities[axisEntityId] = {
        ...axisEntity,
        links: {},
      };

      for (const connectionId in axisEntity.links) {
        // If we haven't seen this connection yet, create a new connection in the copy
        if (!graphCopy.connections[connectionId]) {
          graphCopy.connections[connectionId] = {
            ...graph.connections[connectionId],
            links: {},
          };
        }

        // Add the link between the axis entity and the connection
        // TODO: Can we use the linkAxisEntityAndConnection method here?
        graphCopy.axisEntities[axisEntityId].links[connectionId] = graphCopy.connections[connectionId];
        graphCopy.connections[connectionId].links[axisEntityId] = graphCopy.axisEntities[axisEntityId];
      }
    }

    return graphCopy;
  }
}

export class RepeatError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RepeatError";
  }
}
