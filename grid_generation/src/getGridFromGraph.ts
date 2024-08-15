export interface GraphEntity {
  id: string;
  connections: { [key: string]: Connection };
  entityType: string;
  incompatibleWith?: string[]; // A list of axisEntity IDs with which this entity cannot be connected
  name?: string;
}

export type AxisEntity = GraphEntity;
export type Connection = GraphEntity;

export interface Graph {
  axisEntities: { [key: string]: AxisEntity };
  connections: { [key: string]: Connection };
}

export interface UsedConnectionsWithAxisEntities {
  [key: string]: Set<string>;
}

export interface Grid {
  across: string[];
  down: string[];
  usedConnections: UsedConnectionsWithAxisEntities;
}

export function getGridFromGraph(
  graph: Graph,
  size: number,
  axisEntityTypeWeights: { [key: string]: number },
  random: boolean
): Grid {
  const across: GraphEntity[] = [];
  const down: GraphEntity[] = [];

  // Pick random starting axis entity
  const startingAxisEntityType = getRandomKeyByWeight(axisEntityTypeWeights);
  const axisEntitiesOfType = Object.values(graph.axisEntities).filter(
    (entity) => entity.entityType === startingAxisEntityType
  );
  const startingAxisEntity = axisEntitiesOfType[Math.floor(Math.random() * axisEntitiesOfType.length)];
  if ("name" in startingAxisEntity) {
    console.log(
      `Starting with ${startingAxisEntity.name} with ${Object.keys(startingAxisEntity.connections).length} connections`
    );
  } else {
    console.log(
      `Starting with ${startingAxisEntity.id} with ${Object.keys(startingAxisEntity.connections).length} connections`
    );
  }

  // Add starting axis entity to across
  across.push(startingAxisEntity);

  // Keep track of the connections used
  const usedConnections: UsedConnectionsWithAxisEntities = {};

  function getGridRecursively(): boolean {
    // Base case
    if (across.length === size && down.length === size) {
      return true;
    }

    // Determine the next axis to which we want to add an entity
    const fillDirection = across.length > down.length ? "down" : "across";
    const mostRecentAxisEntity = fillDirection === "down" ? across[across.length - 1] : down[down.length - 1];
    const [fillAxis, compareAxis] = fillDirection === "down" ? [down, across] : [across, down];

    let mostRecentAxisEntityConnections = Object.values(mostRecentAxisEntity.connections);
    // Randomize order of connections, if random is true
    if (random) {
      mostRecentAxisEntityConnections = randomizeListOrder(mostRecentAxisEntityConnections);
    }

    // Iterate over most recent axis entity's connections
    for (const connection of mostRecentAxisEntityConnections) {
      // If we've already used this connection, skip it
      if (Object.keys(usedConnections).includes(connection.id)) {
        continue;
      }

      // Add this connection to the used connections, only with the most recent axis entity
      // (we'll add the other axis entity later)
      usedConnections[connection.id] = new Set([mostRecentAxisEntity.id]);

      // Determine what kind of axis entity we want to use next
      // (e.g., actor, category)
      const nextAxisEntityType = getRandomKeyByWeight(axisEntityTypeWeights);

      // Get separate lists of axis entities that match and don't match nextAxisEntityType
      // Remember, connection.connections are axis entities
      let [matchingAxisEntities, nonMatchingAxisEntities] = splitByFieldMatch(
        Object.values(connection.connections),
        "entityType",
        nextAxisEntityType
      );

      // If random is true, randomize the order of the matching and non-matching axis entities
      if (random) {
        matchingAxisEntities = randomizeListOrder(matchingAxisEntities);
        nonMatchingAxisEntities = randomizeListOrder(nonMatchingAxisEntities);
      }

      // Append the non-matching axis entities to the matching axis entities
      const sortedConnectedAxisEntities = matchingAxisEntities.concat(nonMatchingAxisEntities);

      // Iterate over the axis entities in this connection
      for (const axisEntity of sortedConnectedAxisEntities) {
        // If this axis entity is already present in either axis, skip it
        if (across.includes(axisEntity) || down.includes(axisEntity)) {
          continue;
        }

        // Compare this axis entity to the other axis's entities,
        // except for the most recent axis entity, because we're already connected to it
        const newConnections: UsedConnectionsWithAxisEntities = axisEntityWorksWithAxis(
          axisEntity,
          compareAxis.slice(0, compareAxis.length - 1),
          usedConnections
        );
        if (newConnections) {
          // Add the axis entity to the grid
          fillAxis.push(axisEntity);

          // Add this axisEntity to the usedConnections entry for this connection
          usedConnections[connection.id].add(axisEntity.id);

          // Add the connections to the other entities in the compare axis to the used connections
          for (const [connectionId, axisEntityIds] of Object.entries(newConnections)) {
            usedConnections[connectionId] = axisEntityIds;
          }

          // Recurse
          if (getGridRecursively()) {
            return true;
          }

          // Recursion failed, remove the axis entity and
          // connections used for this axis entity
          fillAxis.pop();
          usedConnections[connection.id].delete(axisEntity.id);
          for (const connectionId of Object.keys(newConnections)) {
            delete usedConnections[connectionId];
          }
        }
      }

      // Remove this connection from the used connections
      delete usedConnections[connection.id];
    }

    // No connections worked, so we need to backtrack
    return false;
  }

  if (getGridRecursively()) {
    return {
      across: across.map((axisEntity) => axisEntity.id),
      down: down.map((axisEntity) => axisEntity.id),
      usedConnections,
    };
  }

  return { across: [], down: [], usedConnections: {} };
}

function randomizeListOrder(list: any[]): any[] {
  return list.slice().sort(() => Math.random() - 0.5);
}

function getRandomKeyByWeight(weights: { [key: string]: number }): string {
  // Calculate the total weight
  const totalWeight = Object.values(weights).reduce((sum, weight) => sum + weight, 0);

  // Generate a random number between 0 and totalWeight
  const random = Math.random() * totalWeight;

  // Iterate through the weights and find the corresponding key
  let cumulativeWeight = 0;
  for (const key in weights) {
    cumulativeWeight += weights[key];
    if (random < cumulativeWeight) {
      return key;
    }
  }

  // Fallback in case of rounding errors
  console.log("!!! THIS SHOULD BE RARE !!! Falling back to first key");
  return Object.keys(weights)[0];
}

function splitByFieldMatch<T>(objects: T[], key: keyof T, value: any): [T[], T[]] {
  const matching: T[] = [];
  const nonMatching: T[] = [];

  for (const obj of objects) {
    if (obj[key] === value) {
      matching.push(obj);
    } else {
      nonMatching.push(obj);
    }
  }

  return [matching, nonMatching];
}

/**
 * Compare an axis entity to a list of other axis entities to see if they can be connected,
 * ignoring given connections
 *
 * @param axisEntity The axis entity to check
 * @param axis The axis against which to check the axis entity
 * @param excludeConnections The IDs of the connections to ignore
 * @returns The IDs of the connections that work, or null if nothing works
 */
function axisEntityWorksWithAxis(
  axisEntity: GraphEntity,
  axis: GraphEntity[],
  excludeConnections: UsedConnectionsWithAxisEntities
): UsedConnectionsWithAxisEntities {
  const connections: UsedConnectionsWithAxisEntities = {};
  for (const otherAxisEntity of axis) {
    // If the axis entities are incompatible, skip
    if (axisEntity.incompatibleWith && axisEntity.incompatibleWith.includes(otherAxisEntity.id)) {
      return null;
    }

    const sharedConnection: string = axisEntitiesShareConnection(axisEntity, otherAxisEntity, {
      ...excludeConnections,
      ...connections,
    });

    if (!sharedConnection) {
      return null;
    }

    connections[sharedConnection] = new Set([axisEntity.id, otherAxisEntity.id]);
  }

  return connections;
}

/**
 * Find a common connection between two axis entities, ignoring given connections
 *
 * @param axisEntity1 One of the axis entities
 * @param axisEntity2 The other axis entity
 * @param excludeConnections Connections to be ignored
 * @returns The ID of a connection shared by both axis entities, or null if none exists
 */
function axisEntitiesShareConnection(
  axisEntity1: GraphEntity,
  axisEntity2: GraphEntity,
  excludeConnections: UsedConnectionsWithAxisEntities
): string {
  for (const connection of Object.values(axisEntity1.connections)) {
    if (Object.keys(excludeConnections).includes(connection.id)) {
      continue;
    }

    if (axisEntity2.connections[connection.id]) {
      return connection.id;
    }
  }

  return null;
}
