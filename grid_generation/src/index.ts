import * as dotenv from "dotenv";
import fs from "fs";
import "node-fetch";
import * as readline from "readline";

import { CreditExport, GridExport } from "../../common/src/interfaces";
import {
  CreditExtraInfo,
  getAllCreditExtraInfo,
  readAllCreditExtraInfoFromFile,
  writeAllCreditExtraInfoToFile,
} from "./creditExtraInfo";
import { famousActorIds } from "./famousActorIds";
import { getGridFromGraph, Graph, Grid } from "./getGridFromGraph";
import {
  ActorCreditGraph,
  ActorNode,
  CreditNode,
  generateGraph,
  readGraphFromFile,
  writeGraphToFile,
} from "./graph";
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
  const allCreditExtraInfo = await loadOrFetchAllCreditExtraInfo(graph);

  // Merge the extra info into the graph, in place
  mergeGraphAndExtraInfo(graph, allCreditExtraInfo);

  // Get a generic graph from the actor credit graph
  const genericGraph = getGenericGraphFromActorCreditGraph(graph);

  // Generate across/down until the user approves
  let grid: Grid;
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  do {
    // Get a valid grid from the generic graph
    grid = getGridFromGraph(genericGraph, 3);

    // If no valid grid was found, exit
    if (grid.across.length === 0 || grid.down.length === 0) {
      console.log("No valid actor groups found");
      return;
    }

    printGrid(grid, graph);

    // Ask the user if they want to continue
    const answer = await new Promise<string>((resolve) => rl.question("Continue? (y/n) ", resolve));
    if (answer.toLowerCase() === "y") {
      rl.close();
      break;
    }
  } while (true);

  // Get ActorNode versions of across and down
  const acrossActors = grid.across.map((axisEntity) => graph.actors[axisEntity.id]);
  const downActors = grid.down.map((axisEntity) => graph.actors[axisEntity.id]);

  // Get grid export from across and down actors
  const gridExport = getGridExportFromGraphAndActors(graph, acrossActors, downActors, gridDate);

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

async function loadOrFetchAllCreditExtraInfo(
  graph: ActorCreditGraph
): Promise<{ [key: string]: CreditExtraInfo }> {
  // If the file exists, read it and return
  const CREDIT_EXTRA_INFO_PATH = "./src/complete_credit_extra_info.json";
  if (fs.existsSync(CREDIT_EXTRA_INFO_PATH)) {
    console.log("Credit extra info exists, reading from file");
    return readAllCreditExtraInfoFromFile(CREDIT_EXTRA_INFO_PATH);
  }

  // Otherwise, scrape the data and write it to file
  const allCreditExtraInfo = await getAllCreditExtraInfo(Object.values(graph.credits));
  writeAllCreditExtraInfoToFile(allCreditExtraInfo, CREDIT_EXTRA_INFO_PATH);
  return allCreditExtraInfo;
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

function printGrid(grid: Grid, graph: ActorCreditGraph): void {
  const [across, down] = [grid.across, grid.down];
  console.log("Across:");
  for (const actor of across) {
    console.log(graph.actors[actor.id].name);
  }
  console.log("Down:");
  for (const actor of down) {
    console.log(graph.actors[actor.id].name);
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
 * Determine if a credit is "legit" based on certain criteria.
 *
 * @param credit The credit to check
 * @returns true if the credit is "legit", false otherwise
 */
function isLegitCredit(credit: CreditNode): boolean {
  if (credit.type === "movie") {
    return isLegitMovie(credit);
  }

  if (credit.type === "tv") {
    return isLegitTVShow(credit);
  }

  return false;
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
    console.log(`${credit.name} is not a movie`);
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

/**
 * Determine if a TV show credit is "legit" based on certain criteria.
 *
 * @param credit The credit to check
 * @returns true if the credit is "legit", false otherwise
 */
function isLegitTVShow(credit: CreditNode): boolean {
  if (!(credit.type === "tv")) {
    console.log(`${credit.name} is not a TV show`);
  }

  // Genre
  const INVALID_TV_GENRE_IDS: number[] = [
    99, // Documentary
    10763, // News
    10767, // Talk shows
  ];
  const isInvalidGenre: boolean = credit.genre_ids.some((id) => INVALID_TV_GENRE_IDS.includes(id));

  // Invalid TV shows
  const INVALID_TV_SHOW_IDS: number[] = [
    456, // The Simpsons
    1667, // Saturday Night Live
    2224, // The Daily Show
    3739, // E! True Hollywood Story
    4779, // Hallmark Hall of Fame
    13667, // MTV Movie & TV Awards
    23521, // Kids' Choice Awards
    27023, // The Oscars
    28464, // The Emmy Awards
    30048, // Tony Awards
    43117, // Teen Choice Awards
    89293, // Bambi Awards
    122843, // Honest Trailers
    1111889, // Carol Burnett: 90 Years of Laughter + Love
  ];
  const isInvalidShow: boolean = INVALID_TV_SHOW_IDS.includes(parseInt(credit.id));

  // Popularity
  // Still need to tweak this
  const MINIMUM_POPULARITY = 400;
  const popularEnough = credit.popularity > MINIMUM_POPULARITY;

  return !isInvalidGenre && !isInvalidShow;
}

/**
 * Get a Grid object from a graph and two lists of actors.
 *
 * The Grid object will contain the actors, credits, and answers for the grid.
 * The Grid will contain all of an actor's credits, whether or not they were
 * "legit" for the purposes of generating the two lists of actors.
 *
 * @param graph A graph of all actors and credits
 * @param across The actors going across the grid
 * @param down The actors going down the grid
 * @returns A Grid object representing the grid
 */
function getGridExportFromGraphAndActors(
  graph: ActorCreditGraph,
  across: ActorNode[],
  down: ActorNode[],
  id: string
): GridExport {
  const actors = across.concat(down).map((actorNode) => {
    return { id: parseInt(actorNode.id), name: actorNode.name };
  });
  const credits: CreditExport[] = [];
  const answers: { [key: number]: { type: "movie" | "tv"; id: number }[] } = {};

  // Create empty answers lists for each actor
  for (const actor of actors) {
    answers[actor.id] = [];
  }

  // Get all credits that the across and down actors share
  for (const actor of across) {
    for (const otherActor of down) {
      for (const creditUniqueString of Object.keys(actor.connections)) {
        if (otherActor.connections[creditUniqueString]) {
          const creditIdNum = parseInt(creditUniqueString.split("-")[1]);
          // Create the credit if it doesn't already exist
          if (!credits.map((credit) => credit.id).includes(creditIdNum)) {
            credits.push({
              type: graph.credits[creditUniqueString].type,
              id: creditIdNum,
              name: graph.credits[creditUniqueString].name,
            });
          }

          const answer = { type: graph.credits[creditUniqueString].type, id: creditIdNum };
          answers[actor.id].push(answer);
          answers[otherActor.id].push(answer);
        }
      }
    }
  }

  return {
    id,
    actors,
    credits,
    answers,
  };
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
