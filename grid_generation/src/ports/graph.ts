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

/***** Functions for converting between data and graph *****/
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
export function buildGraphFromGraphData(graphData: GraphData): Graph {
  const graph: Graph = createEmptyGraph();

  // Add all axis entities to the graph
  for (const axisEntityId of Object.keys(graphData.axisEntities)) {
    const axisEntityDatum = graphData.axisEntities[axisEntityId];
    try {
      addAxisEntityToGraph(graph, axisEntityDatum);
    } catch (error) {
      if (!(error instanceof RepeatError)) {
        throw error;
      }
    }
  }

  // Add all connections to the graph
  for (const connectionId of Object.keys(graphData.connections)) {
    const connectionDatum = graphData.connections[connectionId];
    try {
      addConnectionToGraph(graph, connectionDatum);
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
      linkAxisEntityAndConnection(axisEntity, connection);
    }
  }

  return graph;
}

/**
 * Create an empty graph.
 *
 * @returns an empty graph
 */
function createEmptyGraph(): Graph {
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
function addAxisEntityToGraph(graph: Graph, axisEntityData: AxisEntityData): AxisEntity {
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
function addConnectionToGraph(graph: Graph, connectionData: ConnectionData): Connection {
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
function linkAxisEntityAndConnection(axisEntity: AxisEntity, connection: Connection): void {
  axisEntity.links[connection.id] = connection;
  connection.links[axisEntity.id] = axisEntity;
}

class RepeatError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RepeatError";
  }
}
/***********************************************************/

/***** Other graph-related functions *****/
/**
 * Create a deep copy of a graph.
 *
 * @param graph the graph to be copied
 * @returns a deep copy of the graph
 */
function deepCopyGraph(graph: Graph): Graph {
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

/**
 * Deduplicate a list of links.
 *
 * The delimiter should be a string that is not found in the axis entity ID or connection ID.
 *
 * @param links the links to deduplicate
 * @param delimiter the delimiter used to separate the axis entity ID and connection ID
 * @returns a deduplicated list of links
 */
export function deduplicateLinkData(links: LinkData[], delimiter: string): LinkData[] {
  // Deduplicate the links
  const linksSet: Set<string> = new Set();
  for (const link of links) {
    linksSet.add(combineLinkDataIntoString(link, delimiter));
  }

  // Convert the set back into a list
  const deduplicatedLinks: LinkData[] = [];
  for (const linkString of linksSet) {
    deduplicatedLinks.push(splitLinkDataString(linkString, delimiter));
  }

  return deduplicatedLinks;
}

function combineLinkDataIntoString(link: LinkData, delimiter: string): string {
  return `${link.axisEntityId}${delimiter}${link.connectionId}`;
}

function splitLinkDataString(linkString: string, delimiter: string): LinkData {
  const [axisEntityId, connectionId] = linkString.split(delimiter);
  return { axisEntityId, connectionId };
}
/*****************************************/
