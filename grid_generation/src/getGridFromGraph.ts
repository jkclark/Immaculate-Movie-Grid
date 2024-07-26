export interface GraphEntity {
  id: string;
  connections: { [key: string]: Connection };
  entityType: string;
}

export type AxisEntity = GraphEntity;
export type Connection = GraphEntity;

export interface Graph {
  axisEntities: { [key: string]: AxisEntity };
  connections: { [key: string]: Connection };
}

export interface Grid {
  across: GraphEntity[];
  down: GraphEntity[];
}

export function getGridFromGraph(
  graph: Graph,
  size: number,
  connectionTypeWeights: { [key: string]: number }
): Grid {
  const across: GraphEntity[] = [];
  const down: GraphEntity[] = [];

  // Pick random starting axis entity
  const startingAxisEntityType = getRandomKeyByWeight(connectionTypeWeights);
  const axisEntitiesOfType = Object.values(graph.axisEntities).filter(
    (entity) => entity.entityType === startingAxisEntityType
  );
  const startingAxisEntity = axisEntitiesOfType[Math.floor(Math.random() * axisEntitiesOfType.length)];

  // Add starting axis entity to across
  across.push(startingAxisEntity);

  // Keep track of the connections used
  const usedConnections = new Set<string>();

  function getGridRecursively(): boolean {
    // Base case
    if (across.length === size && down.length === size) {
      return true;
    }

    // Determine the next axis to which we want to add an entity
    const fillDirection = across.length > down.length ? "down" : "across";
    const mostRecentAxisEntity = fillDirection === "down" ? across[across.length - 1] : down[down.length - 1];
    const [fillAxis, compareAxis] = fillDirection === "down" ? [down, across] : [across, down];

    // Iterate over most recent axis entity's connections
    for (const connection of Object.values(mostRecentAxisEntity.connections)) {
      // If we've already used this connection, skip it
      if (usedConnections.has(connection.id)) {
        continue;
      }

      // Add this connection to the used connections
      usedConnections.add(connection.id);

      // Determine what kind of axis entity we want to use next
      // (e.g., actor, category)
      const nextAxisEntityType = getRandomKeyByWeight(connectionTypeWeights);

      // Sort this connection's connections by whether or not their entity type matches nextAxisEntityType
      const sortedConnectedAxisEntities = sortByFieldMatch(
        Object.values(connection.connections),
        "entityType",
        nextAxisEntityType
      );

      // Iterate over the axis entities in this connection
      for (const axisEntity of sortedConnectedAxisEntities) {
        // If this axis entity is already present in either axis, skip it
        if (across.includes(axisEntity) || down.includes(axisEntity)) {
          continue;
        }

        // Compare this axis entity to the other axis's entities,
        // except for the most recent axis entity, because we're already connected to it
        const newConnections: Set<string> = axisEntityWorksWithAxis(
          axisEntity,
          compareAxis.slice(0, compareAxis.length - 1),
          usedConnections
        );
        if (newConnections) {
          // Add the axis entity to the grid
          fillAxis.push(axisEntity);

          // Add the connections to the other entities in the compare axis to the used connections
          for (const newConnection of newConnections) {
            usedConnections.add(newConnection);
          }

          // Recurse
          if (getGridRecursively()) {
            return true;
          }

          // Recursion failed, remove the axis entity and
          // connections used for this axis entity
          fillAxis.pop();
          for (const newConnection of newConnections) {
            usedConnections.delete(newConnection);
          }
        }
      }

      // Remove this connection from the used connections
      usedConnections.delete(connection.id);
    }

    // No connections worked, so we need to backtrack
    return false;
  }

  if (getGridRecursively()) {
    return { across, down };
  }

  return { across: [], down: [] };
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

function sortByFieldMatch<T>(objects: T[], field: keyof T, value: any): T[] {
  return objects.slice().sort((a, b) => {
    const aMatches = a[field] === value;
    const bMatches = b[field] === value;
    if (aMatches && !bMatches) {
      return -1;
    } else if (!aMatches && bMatches) {
      return 1;
    } else {
      return 0;
    }
  });
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
  excludeConnections: Set<string>
): Set<string> {
  const connections: Set<string> = new Set();
  for (const otherAxisEntity of axis) {
    const sharedConnection: string = axisEntitiesShareConnection(
      axisEntity,
      otherAxisEntity,
      new Set([...excludeConnections, ...connections])
    );

    if (!sharedConnection) {
      return null;
    }

    // connections.add(sharedConnection);
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
  excludeConnections: Set<string>
): string {
  for (const connection of Object.values(axisEntity1.connections)) {
    if (excludeConnections.has(connection.id)) {
      continue;
    }

    if (axisEntity2.connections[connection.id]) {
      return connection.id;
    }
  }

  return null;
}
