import * as dotenv from "dotenv";
import fs from 'fs';
import "node-fetch";

import { CreditExport, Grid } from "../../common/src/interfaces";
import { famousActorIds } from "./famousActorIds";
import { ActorNode, Graph, actorsShareCredit, generateGraph, readGraphFromFile, writeGraphToFile } from "./graph";
import { getAndSaveAllImagesForGrid } from "./images";
import { Actor } from "./interfaces";
import { writeTextToS3 } from "./s3";
import { getActorWithCreditsById } from "./tmdbAPI";

dotenv.config();

async function main(): Promise<void> {
  const graph = await getGraph();

  // Get valid across and down groups of actors
  const startingActor: ActorNode = graph.actors[60158]; // Benedict Cumberbatch
  console.log(`Starting actor: ${startingActor.name}`)
  const [across, down] = getValidAcrossAndDown(graph, startingActor);
  if (across.length === 0 || down.length === 0) {
    console.log("No valid actor groups found");
    return;
  }

  console.log(`Across: ${across.map((actor) => actor.name).join(", ")}`);
  console.log(`Down: ${down.map((actor) => actor.name).join(", ")}`);

  // Get grid from across and down actors
  const grid = getGrid(graph, across, down);

  // Get images for actors and credits and save them to S3
  await getAndSaveAllImagesForGrid(grid);

  // Convert to JSON
  const jsonGrid = convertGridToJSON(grid);

  // Write grid to S3
  await writeTextToS3(jsonGrid, "immaculate-movie-grid-daily-grids", "test-grid-graph.json");
}

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

async function getAllActorInformation(actorIds: number[]): Promise<Actor[]> {
  const actorsWithCredits: Actor[] = [];
  for (const id of famousActorIds) {
    const actor = await getActorWithCreditsById(id);
    actorsWithCredits.push(actor);
    console.log(`Got actor ${actor.name} with ${actor.credits.size} credits`);
  }

  return actorsWithCredits;
}

function getValidAcrossAndDown(graph: Graph, startingActor: ActorNode): [ActorNode[], ActorNode[]] {
  console.log(`Graph: ${Object.keys(graph.actors).length} actors, ${Object.keys(graph.credits).length} credits`)

  const acrossActors: ActorNode[] = [startingActor];
  const downActors: ActorNode[] = [];
  function getAcrossAndDownRecursive(current: ActorNode): boolean {
    // Base case: if we have a valid grid, return
    if (acrossActors.length === 3 && downActors.length === 3) {
      console.log("Found valid grid!");
      console.log(`Across actors: ${acrossActors.map((actor) => actor.name).join(", ")}`);
      console.log(`Down actors: ${downActors.map((actor) => actor.name).join(", ")}`);
      return true;
    }

    // If there are more across actors than down actors, we need to add a down actor
    const direction = acrossActors.length > downActors.length ? "down" : "across";
    const compareActors = direction === "down" ? acrossActors : downActors;

    // Iterate over all credits of the current actor
    for (const creditId of Object.keys(current.edges)) {
      const credit = graph.credits[creditId];
      // Iterate over this credit's actors
      for (const actorId of Object.keys(credit.edges)) {
        const actor = graph.actors[actorId];

        // Skip the current actor, who is inevitably in this credit's actors map
        // NOTE: In theory, the condition below this one should always be true
        //       if this one is, but I think it's clearer to leave this one in.
        if (actor.id === current.id) {
          continue;
        }

        // Skip actors that are already in the across or down lists
        if (acrossActors.map((actor) => actor.id).includes(parseInt(actorId)) || downActors.map((actor) => actor.id).includes(parseInt(actorId))) {
          continue;
        }

        // Check if this actor has a connection to all actors in compareActors
        // except the last one, which is the current actor
        let valid = true;
        for (let i = 0; i < compareActors.length - 1; i++) {
          if (!actorsShareCredit(actor, compareActors[i])) {
            valid = false;
            break;
          }
        }

        // If the actor is valid, add it to the appropriate list and recurse
        if (valid) {
          // Add this actor to the appropriate list
          if (direction === "across") {
            acrossActors.push(actor);
          } else {
            downActors.push(actor);
          }

          // Try to recurse
          const success = getAcrossAndDownRecursive(actor);
          if (success) {
            return true;
          } else {
            // If the recursion fails, remove the actor from the list and continue
            if (direction === "across") {
              acrossActors.pop();
            } else {
              downActors.pop();
            }
          }
        }
      }

      // If we reach this point, we've iterated over all actors in this credit
      // and none of them are valid. Return false to backtrack.
      return false;
    }

    // If we reach this point, we've iterated over all credits for this actor
    return false;
  }

  if (getAcrossAndDownRecursive(startingActor)) {
    return [acrossActors, downActors];
  }

  return [[], []];
}

function getGrid(graph: Graph, across: ActorNode[], down: ActorNode[]): Grid {
  const actors = across.concat(down).map(actorNode => { return { id: actorNode.id, name: actorNode.name } });
  const credits: CreditExport[] = [];
  const answers: { [key: number]: number[] } = {};

  // Create empty answers lists for each actor
  for (const actor of actors) {
    answers[actor.id] = [];
  }

  // Get all credits that the across and down actors share
  for (const actor of across) {
    for (const otherActor of down) {
      for (const creditId of Object.keys(actor.edges)) {
        if (otherActor.edges[creditId]) {
          const creditIdNum = parseInt(creditId);
          // Create the credit if it doesn't already exist
          if (!credits.map(credit => credit.id).includes(creditIdNum)) {
            credits.push({ type: graph.credits[creditId].type, id: creditIdNum, name: graph.credits[creditId].name });
          }

          answers[actor.id].push(creditIdNum);
          answers[otherActor.id].push(creditIdNum);
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

function convertGridToJSON(grid: Grid): string {
  return JSON.stringify(grid);
}

main();
