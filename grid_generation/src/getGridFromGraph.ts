interface AxisEntity {
  id: string;
  connections: { [key: string]: Connection };
}

interface Connection {
  id: string;
  axisEntities: { [key: string]: AxisEntity };
}

interface Graph {
  axisEntities: { [key: string]: AxisEntity };
  connections: { [key: string]: Connection };
}

interface Grid {
  across: AxisEntity[];
  down: AxisEntity[];
}

export function getGridFromGraph(graph: Graph, size: number): Grid {
  const across: AxisEntity[] = [];
  const down: AxisEntity[] = [];

  // Pick random starting axis entity
  const startingAxisEntity = getRandomFromObject(graph.axisEntities);

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

      // Iterate over the axis entities in the connection
      for (const axisEntity of Object.values(connection.axisEntities)) {
        // If this axis entity is already present in either axis, skip it
        if (across.includes(axisEntity) || down.includes(axisEntity)) {
          continue;
        }

        // Compare this axis entity to the other axis's entities,
        // except for the most recent axis entity, because we're already connected to it
        const newConnections: Connection[] = axisEntityWorksWithAxis(
          axisEntity,
          compareAxis.slice(0, compareAxis.length - 1)
        );
        if (newConnections) {
          // Add the axis entity to the grid
          fillAxis.push(axisEntity);

          // Add this connection to the used connections
          usedConnections.add(connection.id);

          // Add the connections to the other entities in the compare axis to the used connections
          for (const newConnection of newConnections) {
            usedConnections.add(newConnection.id);
          }

          // Recurse
          if (getGridRecursively()) {
            return true;
          }

          // Recursion failed, remove the axis entity and connections from the grid
          compareAxis.pop();
          usedConnections.delete(connection.id);
          for (const newConnection of newConnections) {
            usedConnections.delete(newConnection.id);
          }
        }
      }
    }

    // No connections worked, so we need to backtrack
    return false;
  }

  if (getGridRecursively()) {
    return { across, down };
  }

  return { across: [], down: [] };
}

function getRandomFromObject<T>(obj: { [key: string]: T }): T {
  const keys = Object.keys(obj);
  const randomKey = keys[Math.floor(Math.random() * keys.length)];
  return obj[randomKey];
}

function axisEntityWorksWithAxis(axisEntity: AxisEntity, axis: AxisEntity[]): Connection[] {
  const connections: Connection[] = [];
  for (const otherAxisEntity of axis) {
    const sharedConnection: Connection = axisEntitiesShareConnection(axisEntity, otherAxisEntity);

    if (!sharedConnection) {
      return null;
    }

    connections.push(sharedConnection);
  }

  return connections;
}

function axisEntitiesShareConnection(axisEntity1: AxisEntity, axisEntity2: AxisEntity): Connection {
  for (const connection of Object.values(axisEntity1.connections)) {
    if (axisEntity2.connections[connection.id]) {
      return connection;
    }
  }

  return null;
}
