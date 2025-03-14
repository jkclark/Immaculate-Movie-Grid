import * as dotenv from "dotenv";
import "node-fetch";
import * as readline from "readline";

import {
  ActorExport,
  CategoryExport,
  CreditExport,
  GridExport,
  serializeGridExport,
} from "common/src/interfaces";
import {
  Connection,
  getGridFromGraph,
  Graph,
  GraphEntity,
  Grid,
  UsedConnectionsWithAxisEntities,
} from "./getGridFromGraph";
import GraphHandler from "./graph_handlers/graphHandler";
import { getAndSaveAllImagesForGrid } from "./images";
import {
  ActorCreditGraph,
  ActorNode,
  CreditNode,
  deepCopyActorCreditGraph,
  getCreditUniqueString,
} from "./interfaces";
import { writeTextToS3 } from "./s3";

dotenv.config();

export interface GridGenArgs {
  gridDate: string;
  graphHandler: GraphHandler;
  autoYes: boolean;
  autoRetry: boolean;
  overwriteImages: boolean;
}

export async function main(args: GridGenArgs): Promise<GridExport> {
  if (!args.gridDate || !args.graphHandler) {
    console.error("Missing gridDate or graphHandler");
    return;
  }

  const graph = await args.graphHandler.loadGraph();

  // Filter the graph to exclude connections that don't pass a given "credit filter"
  const filteredGraph: ActorCreditGraph = prefilterGraph(graph, isLegitMovie);

  // Get a generic graph from the actor credit graph
  const genericGraph: Graph = getGenericGraphFromActorCreditGraph(filteredGraph);

  // Set up readline interface
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  // Get axis entity type weights
  const axisEntityTypeWeights = getAxisEntityTypeWeights();

  // Generate across/down until the user approves
  let grid: Grid;
  do {
    // Get a valid grid from the generic graph
    grid = getGridFromGraph(genericGraph, 3, axisEntityTypeWeights, true);

    // If no valid grid was found, exit
    if (grid.across.length === 0 || grid.down.length === 0) {
      console.log("No valid actor groups found");

      if (args.autoRetry) {
        continue;
      }

      rl.close();
      throw new NoValidActorGroupsFoundError("No valid actor groups found");
    }

    printGrid(grid, filteredGraph);

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

  // Get GridExport from grid, graph, and categories
  const gridExport = getGridExportFromGridGraphAndCategories(grid, graph, args.gridDate);

  // Get images for actors and credits and save them to S3
  await getAndSaveAllImagesForGrid(gridExport, args.overwriteImages);

  // Convert to JSON
  const jsonGrid = serializeGridExport(gridExport);

  // Write grid to S3
  await writeTextToS3(jsonGrid, "immaculate-movie-grid-daily-grids", `${args.gridDate}.json`);

  return gridExport;
}

function prefilterGraph(
  graph: ActorCreditGraph,
  creditFilter: (credit: Connection) => boolean
): ActorCreditGraph {
  console.log("--- Start prefiltering graph ---");

  const numStartingCredits = Object.keys(graph.credits).length;
  const numStartingActors = Object.keys(graph.actors).length;
  console.log(`Starting with ${numStartingActors} actors`);
  console.log(`Starting with ${numStartingCredits} credits`);

  // Remove any credits that don't pass the credit filter
  const filteredGraphNoInvalidCredits = removeInvalidCredits(graph, creditFilter);

  // Remove actors who now have fewer than 3 connections
  const filteredGraphNoInvalidCreditsNoSparseActors = removeActorsWithoutEnoughCredits(
    filteredGraphNoInvalidCredits,
    3
  );

  console.log(
    `Filtered out ${numStartingActors - Object.keys(filteredGraphNoInvalidCreditsNoSparseActors.actors).length} actors`
  );
  console.log(
    `Filtered out ${numStartingCredits - Object.keys(filteredGraphNoInvalidCreditsNoSparseActors.credits).length} credits`
  );
  console.log(`Ending with ${Object.keys(filteredGraphNoInvalidCreditsNoSparseActors.actors).length} actors`);
  console.log(
    `Ending with ${Object.keys(filteredGraphNoInvalidCreditsNoSparseActors.credits).length} credits`
  );
  console.log("--- End prefiltering graph ---");

  return filteredGraphNoInvalidCreditsNoSparseActors;
}

function removeInvalidCredits(
  graph: ActorCreditGraph,
  creditFilter: (credit: Connection) => boolean
): ActorCreditGraph {
  // Copy input graph
  const graphCopy: ActorCreditGraph = deepCopyActorCreditGraph(graph);

  const creditIdsToDeleteByActor: { [actorId: string]: string[] } = {};
  const creditsToDelete: string[] = [];

  // Collect the actor IDs and credit IDs to be deleted
  for (const [creditUniqueString, credit] of Object.entries(graphCopy.credits)) {
    if (!creditFilter(credit)) {
      for (const actorId of Object.keys(credit.connections)) {
        if (!creditIdsToDeleteByActor[actorId]) {
          creditIdsToDeleteByActor[actorId] = [];
        }
        creditIdsToDeleteByActor[actorId].push(creditUniqueString);
      }
      creditsToDelete.push(creditUniqueString);
    }
  }

  // Delete the connections from all actors
  for (const [actorId, creditUniqueStrings] of Object.entries(creditIdsToDeleteByActor)) {
    if (graphCopy.actors[actorId] && graphCopy.actors[actorId].connections) {
      for (const creditUniqueString of creditUniqueStrings) {
        delete graphCopy.actors[actorId].connections[creditUniqueString];
      }
    }
  }

  // Delete the credits from the filtered graph
  for (const creditUniqueString of creditsToDelete) {
    if (graphCopy.credits[creditUniqueString]) {
      delete graphCopy.credits[creditUniqueString];
    }
  }

  return graphCopy;
}

function removeActorsWithoutEnoughCredits(graph: ActorCreditGraph, minCredits: number): ActorCreditGraph {
  // Remove any actors who now have fewer than 3 connections
  const actorsToRemove: string[] = [];
  for (const [actorId, actor] of Object.entries(graph.actors)) {
    if (Object.keys(actor.connections).length < minCredits) {
      actorsToRemove.push(actorId);
    }
  }

  for (const actorId of actorsToRemove) {
    // Remove the actor's connections
    const actor = graph.actors[actorId];
    for (const creditId of Object.keys(actor.connections)) {
      delete graph.credits[creditId].connections[actorId];
    }

    // Remove the actor from the filtered graph
    delete graph.actors[actorId];
  }

  // At this point, it's possible that some credits have no actors
  // because we've removed the last ones, so we need to remove them from the graph
  const creditsToRemove: string[] = [];
  for (const [creditId, credit] of Object.entries(graph.credits)) {
    if (Object.keys(credit.connections).length === 0) {
      creditsToRemove.push(creditId);
    }
  }

  for (const creditId of creditsToRemove) {
    delete graph.credits[creditId];
  }

  return graph;
}

/**
 * Determine if a movie credit is "legit" based on certain criteria.
 *
 * Currently, we check that:
 * - None of the movie's genres are in a list of invalid genres
 * - The movie is not in a list of invalid movies
 *
 * @param credit The credit to check
 * @returns true if the credit is "legit", false otherwise
 */
function isLegitMovie(credit: CreditNode): boolean {
  if (!(credit.type === "movie")) {
    return false;
  }

  const INVALID_MOVIE_GENRE_IDS: number[] = [
    99, // Documentary
  ];
  const isInvalidGenre: boolean = credit.genre_ids.some((id) => INVALID_MOVIE_GENRE_IDS.includes(id));

  const INVALID_MOVIE_IDS: number[] = [
    10788, // Kambakkht Ishq
  ];
  const isInvalidMovie: boolean = INVALID_MOVIE_IDS.includes(parseInt(credit.id));

  // Still need to tweak this
  // TODO: It seems that on or around 3/11/2025, TMDB drastically changed the way popularity worked,
  // lowering the values for actors and credits alike. This resulted in several grid-generation
  // failures. I've now set this value to 0, but clearly, we need a better way of using this popularity
  // value, or we need not to use it at all. One option is to say that a movie or TV show should be in
  // the top X% (maybe 20?) of all movies or TV shows in terms of popularity.
  const MINIMUM_POPULARITY = 0;
  const popularEnough = credit.popularity > MINIMUM_POPULARITY;

  return !isInvalidGenre && !isInvalidMovie && popularEnough;
}

function getGenericGraphFromActorCreditGraph(graph: ActorCreditGraph): Graph {
  // Copy input graph
  const graphCopy: ActorCreditGraph = deepCopyActorCreditGraph(graph);

  const genericGraph: Graph = {
    axisEntities: graphCopy.actors,
    connections: graphCopy.credits,
  };

  // For the generic algorithm, connections' IDs must be the same as their keys
  // in the connections object. This was a problem because we use keys like 'movie-123'
  // everywhere, but the IDs in the connections object are just '123'.
  for (const credit of Object.values(graphCopy.credits)) {
    const uniqueString = getCreditUniqueString(credit);
    genericGraph.connections[uniqueString].id = uniqueString;
  }

  return genericGraph;
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
function getAxisEntityTypeWeights(): { [key: string]: number } {
  const CHANCE_OF_NO_CATEGORIES = 0.4;

  // No categories
  if (Math.random() < CHANCE_OF_NO_CATEGORIES) {
    console.log("Categories included? No");
    return {
      actor: 1,
      category: 0,
    };
  }

  // Categories included
  console.log("Categories included? Yes");
  return {
    actor: 0.95,
    category: 0.05,
  };
}

function printGrid(grid: Grid, graph: ActorCreditGraph): void {
  const [acrossIds, downIds] = [grid.across, grid.down];
  const across = getOriginalGraphEntitiesFromIds(acrossIds, graph);
  const down = getOriginalGraphEntitiesFromIds(downIds, graph);
  const fixedLength = 30;

  // Collect across entities into a single string
  let acrossLine = "".padEnd(fixedLength + 5);
  for (const axisEntity of across) {
    let entityString = "";
    entityString = graph.actors[axisEntity.id].name;
    acrossLine += entityString.padEnd(fixedLength);
  }

  console.log(acrossLine);
  console.log("-".repeat((across.length + 1) * fixedLength));

  // Print down entities and their connections
  for (const axisEntity of down) {
    let lineString = "";

    // Print the axis entity's name
    let entityString = "";
    entityString = graph.actors[axisEntity.id].name;

    lineString += entityString.padEnd(fixedLength);

    // For each of the across axis entities, find the used connection and print its name
    for (const acrossAxisEntity of across) {
      let connectionName = findConnectionName(
        axisEntity.id,
        acrossAxisEntity.id,
        grid.usedConnections,
        graph
      );

      // Truncate the connection name to fit in the fixed length
      // TODO: BUG Sometimes there is no connection... don't know if this is in findConnectionName or grid alg BUG
      // if (connectionName.length > fixedLength) {
      //   connectionName = connectionName.slice(0, fixedLength - 3) + "...";
      // }
      lineString += connectionName.padEnd(fixedLength);
    }

    console.log(lineString);
  }
}

function findConnectionName(
  axisEntityId: string,
  otherAxisEntityId: string,
  usedConnections: UsedConnectionsWithAxisEntities,
  graph: ActorCreditGraph
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
      return graph.credits[connectionId].name;
    }
  }
}

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
        Object.keys(acrossAxisEntity.connections).length < Object.keys(downAxisEntity.connections).length
          ? [acrossAxisEntity, downAxisEntity]
          : [downAxisEntity, acrossAxisEntity];
      for (const creditUniqueString of Object.keys(axisEntityWithFewerConnections.connections)) {
        if (axisEntityWithMoreConnections.connections[creditUniqueString]) {
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

function sortAxisActorsFirst(axis: string[]): string[] {
  const actors = axis.filter((entity) => entity.startsWith("actor"));
  const categories = axis.filter((entity) => entity.startsWith("category"));
  return actors.concat(categories);
}

function getOriginalGraphEntitiesFromIds(axisEntityIds: string[], graph: ActorCreditGraph): GraphEntity[] {
  return axisEntityIds.map((id) => {
    return getOriginalGraphEntityFromId(id, graph);
  });
}

function getOriginalGraphEntityFromId(id: string, graph: ActorCreditGraph): GraphEntity {
  const idNum = parseInt(id);
  return graph.actors[idNum.toString()];
}

class NoValidActorGroupsFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NoValidActorGroupsFoundError";
  }
}
