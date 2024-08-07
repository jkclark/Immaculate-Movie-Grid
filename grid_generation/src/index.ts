import * as dotenv from "dotenv";
import fs from "fs";
import "node-fetch";
import * as readline from "readline";

import { ActorExport, CategoryExport, CreditExport, GridExport } from "../../common/src/interfaces";
import { allCategories, Category } from "./categories";
import { CreditExtraInfo, getAllCreditExtraInfo } from "./creditExtraInfo";
import { famousActorIds } from "./famousActorIds";
import {
  getGridFromGraph,
  Graph,
  GraphEntity,
  Grid,
  UsedConnectionsWithAxisEntities,
} from "./getGridFromGraph";
import { ActorCreditGraph, CreditNode, generateGraph, readGraphFromFile, writeGraphToFile } from "./graph";
import { getAndSaveAllImagesForGrid } from "./images";
import { Actor, getCreditUniqueString } from "./interfaces";
import { writeTextToS3 } from "./s3";
import { getActorWithCreditsById } from "./tmdbAPI";

dotenv.config();

async function main(): Promise<void> {
  // Read arguments
  const [gridDate, overwriteImages] = processArgs();
  if (!gridDate) {
    console.error(
      "Usage: npm run generate-grid -- <grid-date> [--overwrite-images]\n\ngrid-date should be supplied in the format YYYY-MM-DD\n"
    );
    return;
  }

  // Load the graph, or generate it if it doesn't exist
  const graph = await loadOrFetchGraph();

  // Load the extra info for all credits from file, or generate it if it doesn't exist
  const allCreditExtraInfo = await getAllCreditExtraInfo(graph.credits);

  // Merge the extra info into the graph, in place
  mergeGraphAndExtraInfo(graph, allCreditExtraInfo);

  // Get a generic graph from the actor credit graph
  const genericGraph = getGenericGraphFromActorCreditGraph(graph);

  // Get category GraphEntities
  const categories = getCategoryGraphEntities(allCategories, graph);

  // Add categories to generic graph
  addCategoriesToGenericGraph(categories, genericGraph);

  // Generate across/down until the user approves
  let grid: Grid;
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  do {
    // Get a valid grid from the generic graph
    grid = getGridFromGraph(
      genericGraph,
      3,
      { actor: 0, category: 1 },
      // This function serves to eliminate all TV shows from consideration during
      // grid generation, as well as filtering out "invalid" movies.
      // Even though `Connection`s are passed into this function, we know that all connections
      // in the graph are also `CreditNode`s, so we can safely cast them.
      isLegitMovie,
      true
    );

    // If no valid grid was found, exit
    if (grid.across.length === 0 || grid.down.length === 0) {
      console.log("No valid actor groups found");
      return;
    }

    printGrid(grid, graph, allCategories);

    // Ask the user if they want to continue
    const answer = await new Promise<string>((resolve) => rl.question("Continue? (y/n) ", resolve));
    if (answer.toLowerCase() === "y") {
      rl.close();
      break;
    }
  } while (true);

  // Get GridExport from grid, graph, and categories
  const gridExport = getGridExportFromGridGraphAndCategories(grid, graph, allCategories, gridDate);

  // Get images for actors and credits and save them to S3
  await getAndSaveAllImagesForGrid(gridExport, overwriteImages);

  // Convert to JSON
  const jsonGrid = convertGridToJSON(gridExport);
  console.log(jsonGrid);

  // Write grid to S3
  await writeTextToS3(jsonGrid, "immaculate-movie-grid-daily-grids", `${gridDate}.json`);
}

function processArgs(): [string, boolean] {
  const args = process.argv.slice(2);
  let gridDate = "";
  let overwriteImages = false;

  if (args.length < 1) {
    return [gridDate, overwriteImages];
  }

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--overwrite-images") {
      overwriteImages = true;
    } else {
      gridDate = args[i];
    }
  }

  return [gridDate, overwriteImages];
}

/**
 * Get a graph object from a file if it exists, otherwise scrape the data, generate the graph, and write it to file.
 *
 * @returns A promise that resolves to a Graph object
 */
async function loadOrFetchGraph(): Promise<ActorCreditGraph> {
  // If graph exists, read it and return
  const GRAPH_PATH = "./src/complete_graph.json";
  if (fs.existsSync(GRAPH_PATH)) {
    console.log("Graph exists, reading from file");
    return readGraphFromFile(GRAPH_PATH);
  }

  // Otherwise, scrape the data, generate the graph, and write it to file
  // Get all actor information
  const actorsWithCredits = await getAllActorInformation();
  console.log("Actors with credits:", actorsWithCredits.length);

  // Generate graph
  const graph = generateGraph(actorsWithCredits);

  // Write graph to file
  // NOTE: This file cannot be called graph.json because it somehow conflicts with
  //       the graph.ts file in the same directory.
  writeGraphToFile(graph, GRAPH_PATH);

  return graph;
}

/**
 * Add extra info for graph credits into the graph.
 *
 * Note: This function modifies the graph in place.
 *
 * @param graph the graph to update with extra info
 * @param allCreditExtraInfo the extra info to merge into the graph
 */
function mergeGraphAndExtraInfo(
  graph: ActorCreditGraph,
  allCreditExtraInfo: { [key: string]: CreditExtraInfo }
): void {
  // Iterate over extra info and add them to the graph
  for (const [creditUniqueString, extraInfo] of Object.entries(allCreditExtraInfo)) {
    const credit = graph.credits[creditUniqueString];
    credit.rating = extraInfo.rating;
  }
}

function getGenericGraphFromActorCreditGraph(graph: ActorCreditGraph): Graph {
  const genericGraph: Graph = {
    axisEntities: graph.actors,
    connections: graph.credits,
  };

  // For the generic algorithm, connections' IDs must be the same as their keys
  // in the connections object. This was a problem because we use keys like 'movie-123'
  // everywhere, but the IDs in the connections object are just '123'.
  for (const credit of Object.values(graph.credits)) {
    const uniqueString = getCreditUniqueString(credit);
    genericGraph.connections[uniqueString].id = uniqueString;
  }

  return genericGraph;
}

function getCategoryGraphEntities(
  categories: { [key: number]: Category },
  graph: ActorCreditGraph
): GraphEntity[] {
  const categoryGraphEntities = [];
  for (const category of Object.values(categories)) {
    // Create the base object
    const categoryGraphEntity = {
      id: category.id,
      connections: {},
      entityType: "category",
    };

    // Iterate over all credits, adding to the connections object if they match the category
    for (const [creditUniqueString, credit] of Object.entries(graph.credits)) {
      if (category.creditFilter(credit)) {
        categoryGraphEntity.connections[creditUniqueString] = graph.credits[creditUniqueString];
      }
    }

    // Append to the output list
    categoryGraphEntities.push(categoryGraphEntity);
  }

  return categoryGraphEntities;
}

function addCategoriesToGenericGraph(categories: GraphEntity[], genericGraph: Graph): void {
  for (const category of categories) {
    // Add the category to the axisEntities object
    genericGraph.axisEntities[category.id] = category;

    // Add the category to all connections that match it
    for (const creditUniqueString in category.connections) {
      genericGraph.connections[creditUniqueString].connections[category.id] = category;
    }
  }
}

function printGrid(grid: Grid, graph: ActorCreditGraph, categories: { [key: number]: Category }): void {
  const [across, down] = [grid.across, grid.down];
  const fixedLength = 25;

  // Collect across entities into a single string
  let acrossLine = "".padEnd(fixedLength + 5);
  for (const axisEntity of across) {
    let entityString = "";
    if (axisEntity.entityType === "category") {
      entityString = categories[axisEntity.id].name;
    } else {
      entityString = graph.actors[axisEntity.id].name;
    }
    acrossLine += entityString.padEnd(fixedLength);
  }

  console.log(acrossLine);
  console.log("-".repeat((across.length + 1) * fixedLength));

  // Print down entities and their connections
  for (const axisEntity of down) {
    let lineString = "";

    // Print the axis entity's name
    let entityString = "";
    if (axisEntity.entityType === "category") {
      entityString = categories[axisEntity.id].name;
    } else {
      entityString = graph.actors[axisEntity.id].name;
    }

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

/**
 * Get actor and credit information for a list of actor IDs
 * @param actorIds the list of actor IDs to get information for
 * @returns A promise that resolves to a list of actors with their credits
 */
async function getAllActorInformation(): Promise<Actor[]> {
  const actorsWithCredits: Actor[] = [];
  for (const id of famousActorIds) {
    const actor = await getActorWithCreditsById(id);
    actorsWithCredits.push(actor);
    console.log(`Got actor ${actor.name} with ${actor.credits.size} credits`);
  }

  return actorsWithCredits;
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
    // console.log(`${credit.name} is not a movie`);
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
  const MINIMUM_POPULARITY = 40;
  const popularEnough = credit.popularity > MINIMUM_POPULARITY;

  return !isInvalidGenre && !isInvalidMovie && popularEnough;
}

function getGridExportFromGridGraphAndCategories(
  grid: Grid,
  graph: ActorCreditGraph,
  allCategories: { [key: number]: Category },
  id: string
): GridExport {
  // Get the axes, actors, and categories
  const axes: string[] = [];
  const actors: ActorExport[] = [];
  const categories: CategoryExport[] = [];
  for (const axisEntity of grid.across.concat(grid.down)) {
    if (axisEntity.entityType === "category") {
      const category = allCategories[axisEntity.id];
      // Categories have negative IDs, so make it positive to
      // avoid having two dashes in the string.
      axes.push(`category-${-1 * category.id}`);
      categories.push({ id: category.id, name: category.name });
    } else {
      const actor = graph.actors[axisEntity.id];
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

  // Create empty answer lists for each axis entity
  const answers: { [key: number]: { type: "movie" | "tv"; id: number }[] } = {};
  for (const axisEntity of grid.across.concat(grid.down)) {
    answers[axisEntity.id] = [];
  }

  // Create empty credits list
  const credits: CreditExport[] = [];

  // Add all credits that are shared by across and down pairs
  for (const acrossAxisEntity of grid.across) {
    for (const downAxisEntity of grid.down) {
      // Only iterate over the axis entity with fewer connections
      // This is particularly useful when a category with a lot of connections is present
      const [axisEntityWithFewerConnections, axisEntityWithMoreConnections] =
        acrossAxisEntity.connections.size < downAxisEntity.connections.size
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
          if (
            !credits.find(
              (existingCredit) => existingCredit.id === creditIdNum && existingCredit.type === credit.type
            )
          ) {
            credits.push(creditExport);
          }

          // Add this credit to both axis entities' answers
          const answer = { type: creditExport.type, id: creditExport.id };
          answers[acrossAxisEntity.id].push(answer);
          answers[downAxisEntity.id].push(answer);
        }
      }
    }
  }

  return {
    id,
    axes: axesActorsFirst,
    actors,
    categories,
    credits,
    answers,
  };
}

function sortAxisActorsFirst(axis: string[]): string[] {
  const actors = axis.filter((entity) => entity.startsWith("actor"));
  const categories = axis.filter((entity) => entity.startsWith("category"));
  return actors.concat(categories);
}

/**
 * Convert a Grid object to a JSON string.
 *
 * @param grid The Grid object to convert to JSON
 * @returns The JSON string representation of the Grid object
 */
function convertGridToJSON(grid: GridExport): string {
  return JSON.stringify(grid);
}

main();
