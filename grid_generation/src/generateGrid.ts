import * as dotenv from "dotenv";
import "node-fetch";
import * as readline from "readline";

import { GridExport } from "common/src/interfaces";
import {
  generateRandomGridAxes,
  GridAxesWithUsedConnections,
  UsedConnectionsWithAxisEntities,
} from "./getGridFromGraph";
import DataStoreHandler from "./ports/dataStoreHandler";
import {
  AxisEntityTypeWeightInfo,
  buildGraphFromGraphData,
  Connection,
  deepCopyGraph,
  EntityType,
  Graph,
  GraphData,
  GraphEntity,
  pruneGraph,
} from "./ports/graph";

dotenv.config();

export interface GridGenArgs {
  dataStoreHandler: DataStoreHandler;
  connectionFilter: (connection: Connection) => boolean;
  gridSize: number;
  axisEntityTypeWeightInfo: AxisEntityTypeWeightInfo;
  gridDate: string;
  autoYes: boolean;
  autoRetry: boolean;
  overwriteImages: boolean;
}

export async function generateGrid(args: GridGenArgs): Promise<GridExport> {
  /* Make sure we have all the required arguments */
  if (
    !args.dataStoreHandler ||
    !args.connectionFilter ||
    !args.gridSize ||
    !args.axisEntityTypeWeightInfo ||
    !args.gridDate
  ) {
    console.error("Missing gridDate or dataStoreHandler");
    return;
  }

  /* Initialize the data store handler */
  await args.dataStoreHandler.init();

  /* Get the data from the data store */
  const graphData: GraphData = await args.dataStoreHandler.getGraphData();

  /* Build the graph from the data */
  const graph = buildGraphFromGraphData(graphData);

  /* Filter the graph to exclude connections that don't pass the connection filter */
  const filteredGraph: Graph = prefilterGraph(graph, args.connectionFilter, args.gridSize);

  /* Set up readline interface */
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  /* Get axis entity type weights */
  const axisEntityTypeWeights = getAxisEntityTypeWeights(args.axisEntityTypeWeightInfo);

  /* Generate across/down until the user approves */
  let grid: GridAxesWithUsedConnections;
  do {
    // Get a valid grid from the generic graph
    grid = generateRandomGridAxes(filteredGraph, args.gridSize, axisEntityTypeWeights, true);

    // If no valid grid was found, exit
    if (grid.axes.across.length === 0 || grid.axes.down.length === 0) {
      console.log("No valid actor groups found");

      if (args.autoRetry) {
        continue;
      }

      rl.close();
      throw new NoValidActorGroupsFoundError("No valid actor groups found");
    }

    printGridAxesWithUsedConnections(grid, filteredGraph);

    // If autoYes is true, skip asking the user for approval
    if (args.autoYes) {
      rl.close();
      break;
    }

    // Ask the user if they want to continue
    const answer = await new Promise<string>((resolve) => rl.question("Continue? (y/n) ", resolve));
    if (answer.toLowerCase() === "y") {
      rl.close();
      break;
    }
  } while (true);

  /*
  // Get GridExport from grid, graph, and categories
  const gridExport = getGridExportFromGridGraphAndCategories(grid, graph, args.gridDate);

  // Get images for actors and credits and save them to S3
  await getAndSaveAllImagesForGrid(gridExport, args.overwriteImages);

  // Convert to JSON
  const jsonGrid = serializeGridExport(gridExport);

  // Write grid to S3
  await writeTextToS3(jsonGrid, "immaculate-movie-grid-daily-grids", `${args.gridDate}.json`);

  return gridExport;
  */
}

/**
 * Get a graph that has had "invalid" connections removed and then pruned.
 *
 * In general, the data store will contain information about a lot of connections, some of which
 * we might not want to include as candidates during grid generation. This function creates a copy
 * of the input graph, removes any connections that aren't "valid" according to a filtering function,
 * and then further removes any axis entities that subsequently don't have enough connections to be
 * included in a grid.
 *
 * Since connections cannot be reused in a grid, the minimum number of connections for an axis entity
 * to fit into a grid is the size of the grid (e.g., 3 for a 3x3 grid).
 *
 * @param graph the graph to be filtered
 * @param connectionFilter the function used to filter connections
 * @param minimumConnections the minimum number of connections an axis entity must have to be kept in the graph
 * @returns a graph that has been filtered based on the connectionFilter, and then pruned
 */
function prefilterGraph(
  graph: Graph,
  connectionFilter: (connection: Connection) => boolean,
  minimumConnections: number
): Graph {
  /* Remove "invalid" connections */
  const graphWithoutInvalidConnections: Graph = removeInvalidConnections(graph, connectionFilter);

  /* Remove axis entities that subsequently don't have enough connections */
  const prunedGraph: Graph = pruneGraph(graphWithoutInvalidConnections, minimumConnections);

  return prunedGraph;
}

function removeInvalidConnections(
  graph: Graph,
  connectionFilter: (connection: Connection) => boolean
): Graph {
  const graphWithoutInvalidConnections: Graph = deepCopyGraph(graph);

  const connectionIdsToDelete: string[] = [];
  const connectionIdsToDeletePerAxisEntity: { [axisEntityId: string]: string[] } = {};

  /* Collect the axis entity IDs and connection IDs to be deleted */
  for (const [connectionId, connection] of Object.entries(graphWithoutInvalidConnections.connections)) {
    if (!connectionFilter(connection)) {
      // Remove the connection from all axis entities
      for (const axisEntityId of Object.keys(connection.links)) {
        // If this axis entity ID doesn't already have a list of connection IDs to delete, create one
        if (!connectionIdsToDeletePerAxisEntity[axisEntityId]) {
          connectionIdsToDeletePerAxisEntity[axisEntityId] = [];
        }

        // Add the connection ID to the list for this axis entity
        connectionIdsToDeletePerAxisEntity[axisEntityId].push(connectionId);
      }

      // Add the connection ID to the list of connections to delete
      connectionIdsToDelete.push(connectionId);
    }
  }

  /* Delete the connections from all axis entities */
  for (const [axisEntityId, connectionIds] of Object.entries(connectionIdsToDeletePerAxisEntity)) {
    for (const connectionId of connectionIds) {
      delete graphWithoutInvalidConnections.axisEntities[axisEntityId].links[connectionId];
    }
  }

  /* Delete the connections from the filtered graph */
  for (const connectionId of connectionIdsToDelete) {
    delete graphWithoutInvalidConnections.connections[connectionId];
  }

  return graphWithoutInvalidConnections;
}

/**
 * Get a dictionary of weights for each entity type for use in the grid generation algorithm.
 *
 * Even with a very low weight for categories, we usually end up with a grid that is largely categories.
 * To resolve this, we want to dynamically choose the weights each time we generate a grid. One way
 * to accomplish a lower ratio of categories is to sometimes force the grid to contain no categories at all.
 * Thus, we randomly choose to include/exclude categories.
 *
 * @returns A dictionary of weights for each entity type for use in the grid generation algorithm.
 */
function getAxisEntityTypeWeights(axisEntityTypeWeightInfo: AxisEntityTypeWeightInfo): {
  [key: string]: number;
} {
  // No categories
  if (Math.random() < axisEntityTypeWeightInfo.chanceOfNoCategories) {
    console.log("Categories included? No");
    return {
      [EntityType.NON_CATEGORY]: 1.0,
      [EntityType.CATEGORY]: 0.0,
    };
  }

  // Categories included
  console.log("Categories included? Yes");
  return axisEntityTypeWeightInfo.axisEntityTypeWeights;
}

function printGridAxesWithUsedConnections(
  gridAxesWithUsedConnections: GridAxesWithUsedConnections,
  graph: Graph
): void {
  const [acrossIds, downIds] = [
    gridAxesWithUsedConnections.axes.across,
    gridAxesWithUsedConnections.axes.down,
  ];
  const across = getOriginalGraphEntitiesFromIds(acrossIds, graph);
  const down = getOriginalGraphEntitiesFromIds(downIds, graph);
  const fixedLength = 30;

  // Collect across entities into a single string
  let acrossLine = "".padEnd(fixedLength + 5);
  for (const axisEntity of across) {
    let entityString = "";
    entityString = graph.axisEntities[axisEntity.id].name;
    acrossLine += entityString.padEnd(fixedLength);
  }

  console.log(acrossLine);
  console.log("-".repeat((across.length + 1) * fixedLength));

  // Print down entities and their connections
  for (const axisEntity of down) {
    let lineString = "";

    // Print the axis entity's name
    let entityString = "";
    entityString = graph.axisEntities[axisEntity.id].name;

    lineString += entityString.padEnd(fixedLength);

    // For each of the across axis entities, find the used connection and print its name
    for (const acrossAxisEntity of across) {
      let connectionName = findConnectionName(
        axisEntity.id,
        acrossAxisEntity.id,
        gridAxesWithUsedConnections.usedConnections,
        graph
      );

      // Truncate the connection name to fit in the fixed length
      // TODO: BUG Sometimes there is no connection... don't know if this is in findConnectionName or grid alg BUG
      if (connectionName.length > fixedLength - 2) {
        connectionName = connectionName.slice(0, fixedLength - 5) + "...";
      }

      lineString += connectionName.padEnd(fixedLength);
    }

    console.log(lineString);
  }
}

function findConnectionName(
  axisEntityId: string,
  otherAxisEntityId: string,
  usedConnections: UsedConnectionsWithAxisEntities,
  graph: Graph
): string {
  // Because the keys into usedConnections are just the IDs of the connections,
  // we need to iterate over all of the values and see if the two axis entities
  // match the value
  for (const [connectionId, axisEntityIds] of Object.entries(usedConnections)) {
    const [connectionAxisEntityId1, connectionAxisEntityId2] = Array.from(axisEntityIds);
    // We need to check both possible orders of the IDs
    if (
      (connectionAxisEntityId1 === axisEntityId && connectionAxisEntityId2 === otherAxisEntityId) ||
      (connectionAxisEntityId1 === otherAxisEntityId && connectionAxisEntityId2 === axisEntityId)
    ) {
      return graph.connections[connectionId].name;
    }
  }
}

/*
function getGridExportFromGridGraphAndCategories(
  grid: Grid,
  graph: ActorCreditGraph,
  id: string
): GridExport {
  const originalGraphAcrossEntities = getOriginalGraphEntitiesFromIds(grid.across, graph);
  const originalGraphDownEntities = getOriginalGraphEntitiesFromIds(grid.down, graph);
  const gridAxisEntities = originalGraphAcrossEntities.concat(originalGraphDownEntities);

  // Get the axes, actors, and categories
  const axes: string[] = [];
  const actors: ActorExport[] = [];
  const categoriesExport: CategoryExport[] = [];
  for (const axisEntity of gridAxisEntities) {
    if (axisEntity.entityType === "category") {
      const category: GraphEntity = graph.actors[axisEntity.id];
      // Categories have negative IDs, so make it positive to
      // avoid having two dashes in the string.
      axes.push(`category-${-1 * parseInt(category.id)}`);
      categoriesExport.push({ id: parseInt(category.id), name: category.name });
    } else {
      const actor: ActorNode = graph.actors[axisEntity.id];
      axes.push(`actor-${actor.id}`);
      actors.push({ id: parseInt(actor.id), name: actor.name });
    }
  }

  // Sort each half of axes to have all categories appear after all actors
  const across = axes.slice(0, grid.across.length);
  const down = axes.slice(grid.across.length);
  const sortedAcross = sortAxisActorsFirst(across);
  const sortedDown = sortAxisActorsFirst(down);
  const axesActorsFirst = sortedAcross.concat(sortedDown);

  // Create empty answer Set for each axis entity
  const answers: { [key: number]: Set<string> } = {};
  for (const axisEntity of gridAxisEntities) {
    answers[axisEntity.id] = new Set();
  }

  // Create empty credits list
  // const credits: CreditExport[] = [];
  const credits: { [key: string]: CreditExport } = {};

  // Add all credits that are shared by across and down pairs
  for (const acrossAxisEntity of originalGraphAcrossEntities) {
    for (const downAxisEntity of originalGraphDownEntities) {
      // Only iterate over the axis entity with fewer connections
      // This is particularly useful when a category with a lot of connections is present
      const [axisEntityWithFewerConnections, axisEntityWithMoreConnections] =
        Object.keys(acrossAxisEntity.links).length < Object.keys(downAxisEntity.links).length
          ? [acrossAxisEntity, downAxisEntity]
          : [downAxisEntity, acrossAxisEntity];
      for (const creditUniqueString of Object.keys(axisEntityWithFewerConnections.links)) {
        if (axisEntityWithMoreConnections.links[creditUniqueString]) {
          const creditIdNum = parseInt(creditUniqueString.split("-")[1]);
          const credit = graph.credits[creditUniqueString];
          // Create the credit if it doesn't already exist
          const creditExport = {
            type: credit.type,
            id: creditIdNum,
            name: credit.name,
          };
          if (!credits[creditUniqueString]) {
            credits[creditUniqueString] = creditExport;
          }

          // Add this credit to both axis entities' answers
          answers[acrossAxisEntity.id].add(creditUniqueString);
          answers[downAxisEntity.id].add(creditUniqueString);
        }
      }
    }
  }

  return {
    id,
    axes: axesActorsFirst,
    actors,
    categories: categoriesExport,
    credits,
    answers,
  };
}
*/

function sortAxisActorsFirst(axis: string[]): string[] {
  const actors = axis.filter((entity) => entity.startsWith("actor"));
  const categories = axis.filter((entity) => entity.startsWith("category"));
  return actors.concat(categories);
}

function getOriginalGraphEntitiesFromIds(axisEntityIds: string[], graph: Graph): GraphEntity[] {
  return axisEntityIds.map((id) => {
    return getOriginalGraphEntityFromId(id, graph);
  });
}

function getOriginalGraphEntityFromId(id: string, graph: Graph): GraphEntity {
  const idNum = parseInt(id);
  return graph.axisEntities[idNum.toString()];
}

class NoValidActorGroupsFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NoValidActorGroupsFoundError";
  }
}
