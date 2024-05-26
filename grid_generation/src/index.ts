import * as dotenv from "dotenv";
import fs from 'fs';
import "node-fetch";
import * as readline from 'readline';

import { CreditExport, Grid } from "../../common/src/interfaces";
import { famousActorIds } from "./famousActorIds";
import { ActorNode, CreditNode, Graph, generateGraph, getCreditUniqueString, getSharedCreditsForActors, readGraphFromFile, writeGraphToFile } from "./graph";
import { getAndSaveAllImagesForGrid } from "./images";
import { Actor } from "./interfaces";
import { writeTextToS3 } from "./s3";
import { getActorWithCreditsById } from "./tmdbAPI";

dotenv.config();

async function main(): Promise<void> {
  const graph = await getGraph();

  // Pick random starting actor
  const actorIds = Object.keys(graph.actors);
  const randomActorId = actorIds[Math.floor(Math.random() * actorIds.length)];

  // Get valid across and down groups of actors
  // const startingActor: ActorNode = graph.actors[randomActorId];
  const startingActor: ActorNode = graph.actors[4495];
  console.log(`Starting actor: ${startingActor.name} with ID = ${startingActor.id}`)
  const [across, down] = getValidAcrossAndDown(graph, startingActor, [], [isLegitCredit], true);
  if (across.length === 0 || down.length === 0) {
    console.log("No valid actor groups found");
    return;
  }

  console.log(`Across: ${across.map((actor) => actor.name).join(", ")}`);
  console.log(`Down: ${down.map((actor) => actor.name).join(", ")}`);

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  rl.question('Continue? (y/n) ', async (answer) => {
    if (answer.toLowerCase() !== 'y') {
      rl.close();
      return;
    }

    // Continue with the rest of your code here...
    // Get grid from across and down actors
    const grid = getGridFromGraphAndActors(graph, across, down);

    // Get images for actors and credits and save them to S3
    await getAndSaveAllImagesForGrid(grid);

    // Convert to JSON
    const jsonGrid = convertGridToJSON(grid);
    console.log(jsonGrid);

    // Write grid to S3
    await writeTextToS3(jsonGrid, "immaculate-movie-grid-daily-grids", "test-grid-graph.json");

    rl.close();
  });
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
  for (const id of famousActorIds) {
    const actor = await getActorWithCreditsById(id);
    actorsWithCredits.push(actor);
    console.log(`Got actor ${actor.name} with ${actor.credits.size} credits`);
  }

  return actorsWithCredits;
}

/**
 * Get a valid pair of across and down actors for a grid.
 * 
 * This function is effectively a breadth-first search over the graph of actors and credits,
 * starting with the given actor. It recursively searches for valid pairs of actors that share
 * credits with each other, satisfying the given actor and credit conditions.
 * 
 * The random flag determines whether to shuffle the lists of actors and credits used
 * while searching. If random is false, the function will iterate over actors and credits
 * in the same order every time. This is useful for debugging.
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
  console.log(`Graph: ${Object.keys(graph.actors).length} actors, ${Object.keys(graph.credits).length} credits`)

  // Make sure starting actor satisfies all actor conditions
  if (!actorConditions.every((condition) => condition(startingActor))) {
    // console.error("Starting actor does not satisfy actor conditions");
    return [[], []];
  }

  const acrossActors: ActorNode[] = [startingActor];
  const downActors: ActorNode[] = [];
  const usedCredits: Set<string> = new Set();  // Used to make sure that every pair of actors shares a unique credit
  function getAcrossAndDownRecursive(current: ActorNode): boolean {
    // Base case: if we have a valid grid, return
    if (acrossActors.length === 3 && downActors.length === 3) {
      return true;
    }

    // If there are more across actors than down actors, we need to add a down actor
    const direction = acrossActors.length > downActors.length ? "down" : "across";
    const compareActors = direction === "down" ? acrossActors : downActors;

    // Iterate over all credits of the current actor
    const creditIds = random ? Object.keys(current.edges).sort(() => Math.random() - 0.5) : Object.keys(current.edges);
    for (const creditId of creditIds) {
      const credit: CreditNode = graph.credits[creditId];
      // Skip credits that have already been used
      if (usedCredits.has(getCreditUniqueString(credit.type, credit.id))) {
        // console.log(`Skipping credit ${credit.name} because it's already been used`)
        continue;
      }

      // Skip credits that don't satisfy all credit conditions
      if (!creditConditions.every((condition) => condition(credit))) {
        // console.log(`Skipping credit ${credit.name} does not satisfy credit conditions`);
        continue;
      }

      // Iterate over this credit's actors
      const actors = random ? Object.keys(credit.edges).sort(() => Math.random() - 0.5) : Object.keys(credit.edges);
      for (const actorId of actors) {
        const actor = graph.actors[actorId];

        // Skip the current actor, who is inevitably in this credit's actors map
        // NOTE: In theory, the condition below this one should always be true
        //       if this one is, but I think it's clearer to leave this one in.
        if (parseInt(actor.id) === current.id) {
          continue;
        }

        // Skip actors that are already in the across or down lists
        if (acrossActors.map((actor) => actor.id).includes(parseInt(actorId)) || downActors.map((actor) => actor.id).includes(parseInt(actorId))) {
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

          // Iterate over the shared credits between the current actor and the compare actor
          const sharedCredits = getSharedCreditsForActors(actor, compareActors[i], usedCredits);
          if (sharedCredits.length > 0) {
            // If this credit satisfies all credit conditions, choose it
            for (const sharedCredit of sharedCredits) {
              // Don't consider credits that have already been used
              // or the current credit, which we're already considering
              if (
                usedCredits.has(getCreditUniqueString(sharedCredit.type, sharedCredit.id)) ||
                sharedCredit.id === credit.id
              ) {
                console.log(`\n\n\nXXXXXXXXXXXXXXXXXX ${sharedCredit.name} XXXXXXXXXXXXXXXXXX\n\n\n`);
                continue;
              }

              if (creditConditions.every((condition) => condition(sharedCredit))) {
                chosenSharedCredit = sharedCredit;
                break;
              }
            }

            // If we found a valid shared credit, add it to the used credits set
            if (chosenSharedCredit) {
              const uniqueCreditString = getCreditUniqueString(chosenSharedCredit.type, chosenSharedCredit.id);
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
          const uniqueCreditString = getCreditUniqueString(credit.type, credit.id);
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
  const isInvalidGenre: boolean = credit.genre_ids.some(id => INVALID_MOVIE_GENRE_IDS.includes(id));

  const INVALID_MOVIE_IDS: number[] = [
    10788, // Kambakkht Ishq
  ]
  const isInvalidMovie: boolean = INVALID_MOVIE_IDS.includes(credit.id);

  return !isInvalidGenre && !isInvalidMovie;
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

  const INVALID_TV_GENRE_IDS: number[] = [
    10763, // News
    10767, // Talk shows
  ];
  const isInvalidGenre: boolean = credit.genre_ids.some(id => INVALID_TV_GENRE_IDS.includes(id));

  const INVALID_TV_SHOW_IDS: number[] = [
    456, // The Simpsons
    1667, // Saturday Night Live
    2224, // The Daily Show
    3739, // E! True Hollywood Story
    13667, // MTV Movie & TV Awards
    23521, // Kids' Choice Awards
    27023, // The Oscars
    30048, // Tony Awards
    43117, // Teen Choice Awards
    89293, // Bambi Awards
    1111889, // Carol Burnett: 90 Years of Laughter + Love
  ]
  const isInvalidShow: boolean = INVALID_TV_SHOW_IDS.includes(credit.id);

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
function getGridFromGraphAndActors(graph: Graph, across: ActorNode[], down: ActorNode[]): Grid {
  const actors = across.concat(down).map(actorNode => { return { id: actorNode.id, name: actorNode.name } });
  const credits: CreditExport[] = [];
  const answers: { [key: number]: { type: "movie" | "tv", id: number }[] } = {};

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
          if (!credits.map(credit => credit.id).includes(creditIdNum)) {
            credits.push({ type: graph.credits[creditUniqueString].type, id: creditIdNum, name: graph.credits[creditUniqueString].name });
          }

          const answer = { type: graph.credits[creditUniqueString].type, id: creditIdNum }
          answers[actor.id].push(answer);
          answers[otherActor.id].push(answer);
        }
      }
    }
  }

  return {
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
function convertGridToJSON(grid: Grid): string {
  return JSON.stringify(grid);
}

main();
