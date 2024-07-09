import * as dotenv from "dotenv";
import fs from "fs";
import "node-fetch";
import * as readline from "readline";

import { CreditExport, GridExport } from "../../common/src/interfaces";
import { famousActorIds } from "./famousActorIds";
import {
  ActorNode,
  CreditNode,
  Graph,
  generateGraph,
  getCreditUniqueString,
  getSharedCreditsForActors,
  readGraphFromFile,
  writeGraphToFile,
} from "./graph";
import { getAndSaveAllImagesForGrid } from "./images";
import { Actor } from "./interfaces";
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
  const graph = await getGraph();

  // Generate across/down until the user approves
  let across: ActorNode[], down: ActorNode[];
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  do {
    // Generate the across and down
    [across, down] = await pickRandomStartingActorAndGetValidAcrossAndDown(graph);
    if (across.length === 0 || down.length === 0) {
      console.log("No valid actor groups found");
      return;
    }

    // Ask the user if they want to continue
    const answer = await new Promise<string>((resolve) => rl.question("Continue? (y/n) ", resolve));
    if (answer.toLowerCase() === "y") {
      rl.close();
      break;
    }
  } while (true);

  // Get grid from across and down actors
  const grid = getGridFromGraphAndActors(graph, across, down, gridDate);

  // Get images for actors and credits and save them to S3
  await getAndSaveAllImagesForGrid(grid, overwriteImages);

  // Convert to JSON
  const jsonGrid = convertGridToJSON(grid);
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
async function getGraph(): Promise<Graph> {
  // If graph exists, read it and return
  const GRAPH_PATH = "./src/complete_graph.json";
  if (fs.existsSync(GRAPH_PATH)) {
    console.log("Graph exists, reading from file");
    return readGraphFromFile(GRAPH_PATH);
  }

  // Otherwise, scrape the data, generate the graph, and write it to file
  else {
    // Get all actor information
    const actorsWithCredits = await getAllActorInformation(famousActorIds);
    console.log("Actors with credits:", actorsWithCredits.length);

    // Generate graph
    const graph = generateGraph(actorsWithCredits);

    // Write graph to file
    // NOTE: This file cannot be called graph.json because it somehow conflicts with
    //       the graph.ts file in the same directory.
    writeGraphToFile(graph, GRAPH_PATH);

    return graph;
  }
}

/**
 * Get actor and credit information for a list of actor IDs
 * @param actorIds the list of actor IDs to get information for
 * @returns A promise that resolves to a list of actors with their credits
 */
async function getAllActorInformation(actorIds: number[]): Promise<Actor[]> {
  const actorsWithCredits: Actor[] = [];
  // for (const id of famousActorIds) {
  for (const id of famousActorIds) {
    const actor = await getActorWithCreditsById(id);
    actorsWithCredits.push(actor);
    console.log(`Got actor ${actor.name} with ${actor.credits.size} credits`);
  }

  return actorsWithCredits;
}

async function pickRandomStartingActorAndGetValidAcrossAndDown(
  graph: Graph
): Promise<[ActorNode[], ActorNode[]]> {
  // Pick random starting actor
  const actorIds = Object.keys(graph.actors);
  const randomActorId = actorIds[Math.floor(Math.random() * actorIds.length)];

  // Get valid across and down groups of actors
  const startingActor: ActorNode = graph.actors[randomActorId];
  console.log(`Starting actor: ${startingActor.name} with ID = ${startingActor.id}`);
  const [across, down] = getValidAcrossAndDown(graph, startingActor, [], [isLegitCredit], true);

  console.log(`Across: ${across.map((actor) => actor.name).join(", ")}`);
  console.log(`Down: ${down.map((actor) => actor.name).join(", ")}`);

  return [across, down];
}

/**
 * Get a valid pair of across and down actors for a grid.
 *
 * This function is effectively a breadth-first search over the graph of actors
 * and credits, starting with the given actor. It recursively searches for valid
 * pairs of actors that share credits with each other, satisfying the given
 * actor and credit conditions.
 *
 * At the moment, we are only considering movie credits while traversing the
 * graph. There are too many TV shows that are BS answers, so by only
 * considering movie credits while **creating** the graph, we guarantee that
 * there's a movie answer for every actor pair. TV shows will still be valid
 * answers while playing the game, though.
 *
 * The random flag determines whether to shuffle the lists of actors and credits
 * used while searching. If random is false, the function will iterate over
 * actors and credits in the same order every time. This is useful for
 * debugging.
 *
 * @param graph The graph of actors and credits
 * @param startingActor The first actor in the grid
 * @param actorConditions A list of functions that take an actor and return true if the actor satisfies some condition
 * @param creditConditions A list of functions that take a credit and return true if the credit satisfies some condition
 * @param random Whether to randomize the order of actors and credits while searching
 * @returns A tuple of two lists of actors, representing the across and down groups of actors in the grid
 */
function getValidAcrossAndDown(
  graph: Graph,
  startingActor: ActorNode,
  actorConditions: ((actor: ActorNode) => boolean)[],
  creditConditions: ((credit: CreditNode) => boolean)[],
  random = false
): [ActorNode[], ActorNode[]] {
  console.log(
    `Graph: ${Object.keys(graph.actors).length} actors, ${Object.keys(graph.credits).length} credits`
  );

  // Make sure starting actor satisfies all actor conditions
  if (!actorConditions.every((condition) => condition(startingActor))) {
    // console.error("Starting actor does not satisfy actor conditions");
    return [[], []];
  }

  const acrossActors: ActorNode[] = [startingActor];
  const downActors: ActorNode[] = [];
  const usedCredits: Set<string> = new Set(); // Used to make sure that every pair of actors shares a unique credit
  function getAcrossAndDownRecursive(current: ActorNode): boolean {
    // Base case: if we have a valid grid, return
    if (acrossActors.length === 3 && downActors.length === 3) {
      return true;
    }

    // If there are more across actors than down actors, we need to add a down actor
    const direction = acrossActors.length > downActors.length ? "down" : "across";
    const compareActors = direction === "down" ? acrossActors : downActors;

    // Iterate over all movie credits of the current actor
    let movieCreditIds = Object.keys(current.edges).filter((creditId) => {
      return graph.credits[creditId].type === "movie";
    });

    // Randomize the order of movie credits
    if (random) {
      movieCreditIds = movieCreditIds.sort(() => Math.random() - 0.5);
    }

    for (const creditId of movieCreditIds) {
      const credit: CreditNode = graph.credits[creditId];
      // Skip credits that have already been used
      if (usedCredits.has(getCreditUniqueString(credit))) {
        // console.log(`Skipping credit ${credit.name} because it's already been used`)
        continue;
      }

      // Skip credits that don't satisfy all credit conditions
      if (!creditConditions.every((condition) => condition(credit))) {
        // console.log(`Skipping credit ${credit.name} does not satisfy credit conditions`);
        continue;
      }

      // Iterate over this credit's actors
      const actors = random
        ? Object.keys(credit.edges).sort(() => Math.random() - 0.5)
        : Object.keys(credit.edges);
      for (const actorId of actors) {
        const actor = graph.actors[actorId];

        // Skip the current actor, who is inevitably in this credit's actors map
        // NOTE: In theory, the condition below this one should always be true
        //       if this one is, but I think it's clearer to leave this one in.
        if (parseInt(actor.id) === current.id) {
          continue;
        }

        // Skip actors that are already in the across or down lists
        if (
          acrossActors.map((actor) => actor.id).includes(parseInt(actorId)) ||
          downActors.map((actor) => actor.id).includes(parseInt(actorId))
        ) {
          continue;
        }

        // Skip actors that don't satisfy all actor conditions
        if (!actorConditions.every((condition) => condition(actor))) {
          // console.log(`Skipping actor ${actor.name} does not satisfy actor conditions`);
          continue;
        }

        // Here we're keeping track of credits we've used for this actor
        // If we end up not using this actor, we remove these credits from the used set
        const addedCredits: string[] = [];

        // Go back and check that this actor shares credit with all previous actors
        // on the other side of the grid
        let valid = true;
        for (let i = 0; i < compareActors.length - 1; i++) {
          let chosenSharedCredit: CreditNode = null;

          // Iterate over the shared movie credits between the current actor and the compare actor
          const sharedCredits = getSharedCreditsForActors(actor, compareActors[i], usedCredits, "movie");
          if (sharedCredits.length > 0) {
            // If this credit satisfies all credit conditions, choose it
            for (const sharedCredit of sharedCredits) {
              // Don't consider credits that have already been used
              // or the current credit, which we're already considering
              if (usedCredits.has(getCreditUniqueString(sharedCredit)) || sharedCredit.id === credit.id) {
                continue;
              }

              if (creditConditions.every((condition) => condition(sharedCredit))) {
                chosenSharedCredit = sharedCredit;
                break;
              }
            }

            // If we found a valid shared credit, add it to the used credits set
            if (chosenSharedCredit) {
              const uniqueCreditString = getCreditUniqueString(chosenSharedCredit);
              usedCredits.add(uniqueCreditString);
              addedCredits.push(uniqueCreditString);
              continue;
            }
          }

          // We could not find a valid shared credit for all previous actors
          // Remove the credits that were added to the used credits set
          valid = false;
          for (const addedCredit of addedCredits) {
            usedCredits.delete(addedCredit);
          }
          break;
        }

        // If the actor is valid, add it to the appropriate list and recurse
        if (valid) {
          // Add this actor to the appropriate list
          if (direction === "across") {
            acrossActors.push(actor);
          } else {
            downActors.push(actor);
          }

          // Add the credit to the used credits set
          const uniqueCreditString = getCreditUniqueString(credit);
          // console.log(`Adding credit ${uniqueCreditString} (${credit.name}) to used credits`);
          usedCredits.add(uniqueCreditString);
          addedCredits.push(uniqueCreditString);

          // Try to recurse
          if (getAcrossAndDownRecursive(actor)) {
            return true;
          }

          // If the recursion fails, remove the actor and their credits from the lists and continue
          else {
            if (direction === "across") {
              acrossActors.pop();
            } else {
              downActors.pop();
            }

            for (const addedCredit of addedCredits) {
              usedCredits.delete(addedCredit);
            }
          }
        }
      }
    }

    // If we reach this point, we've iterated over all credits for this actor
    return false;
  }

  if (getAcrossAndDownRecursive(startingActor)) {
    // List the used credits
    console.log("Used credits: " + usedCredits.size);
    for (const credit of usedCredits) {
      console.log(`${credit}: ${graph.credits[credit].name}`);
    }
    return [acrossActors, downActors];
  }

  return [[], []];
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
  const isInvalidMovie: boolean = INVALID_MOVIE_IDS.includes(credit.id);

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
  const isInvalidShow: boolean = INVALID_TV_SHOW_IDS.includes(credit.id);

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
function getGridFromGraphAndActors(
  graph: Graph,
  across: ActorNode[],
  down: ActorNode[],
  id: string
): GridExport {
  const actors = across.concat(down).map((actorNode) => {
    return { id: actorNode.id, name: actorNode.name };
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
      for (const creditUniqueString of Object.keys(actor.edges)) {
        if (otherActor.edges[creditUniqueString]) {
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
