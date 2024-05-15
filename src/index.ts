import { S3 } from "@aws-sdk/client-s3";
import * as dotenv from "dotenv";
import fs from 'fs';
import "node-fetch";

import { famousActorIds } from "./famousActorIds";
import generateGrid from "./generateGrid";
import { ActorNode, Graph, actorsShareCredit, generateGraph, readGraphFromFile, writeGraphToFile } from "./graph";
import { Actor, Grid } from "./interfaces";
import { writeTextToS3 } from "./s3";
import { getActorById, getActorCredits, getActorWithCreditsById } from "./tmdbAPI";

dotenv.config();

async function main(): Promise<void> {
  const manualActorIds = [];
  const validGrid = await getValidGrid(manualActorIds);
  console.log("Valid grid found!");
  for (const connection of validGrid.connections) {
    console.log(`  ${connection.actor1.name} and ${connection.actor2.name} are both in ${connection.credit.name}`);
  }

  // Convert to JSON
  // const jsonGrid = convertGridToJSON(validGrid);

  // Write to S3
  // await writeTextToS3(jsonGrid, "immaculate-movie-grid-daily-grids", "test-grid.json");
}

async function getValidGrid(manualActorIds: number[]): Promise<Grid> {
  // Get manual actor info
  const manualActors: Actor[] = [];
  for (const id of manualActorIds) {
    const actor = await getActorById(id);
    actor.credits = await getActorCredits(actor);
    manualActors.push(actor);
  }

  let grid: Grid = await generateGrid(manualActors);

  let attempt = 1;
  while (!grid.connections) {
    if (attempt % 5 === 0) {
      console.log("Miss #", attempt);
    }
    grid = await generateGrid(manualActors);

    attempt++;
  }

  for (const actor of grid.actors) {
    console.log(actor.name);
  }

  for (const connection of grid.connections) {
    console.log(`  ${connection.actor1.name} and ${connection.actor2.name} in ${connection.credit.name}`);
  }

  return grid
}

async function mainGraph(): Promise<void> {
  let graph: Graph;
  const GRAPH_PATH = "./src/complete_graph.json";

  // If graph exists at ./src/complete_graph.json, read it and return
  if (fs.existsSync(GRAPH_PATH)) {
    console.log("Graph exists, reading from file");
    graph = readGraphFromFile(GRAPH_PATH);
  }

  // Otherwise, scrape the data, generate the graph, and write it to file
  else {
    // Get all actor information
    const actorsWithCredits = await getAllActorInformation(famousActorIds);
    console.log("Actors with credits:", actorsWithCredits.length);

    // Generate graph
    graph = generateGraph(actorsWithCredits);

    // Write graph to file
    // NOTE: This file cannot be called graph.json because it somehow conflicts with
    //       the graph.ts file in the same directory.
    writeGraphToFile(graph, GRAPH_PATH);
  }

  // Get a valid grid
  const startingActor: ActorNode = graph.actors[2888];
  console.log(`Starting actor: ${startingActor.name}`)
  const grid = getValidGridGraph(graph, startingActor);
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

function getValidGridGraph(graph: Graph, startingActor: ActorNode): Grid {
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
        if (actor.id === current.id) {
          console.log(`Skipping ${actor.name} because ${current.name} (ID = ${current.id}) is ${actor.name} (ID = ${actor.id})`);
          continue;
        }

        // Skip actors that are already in the across or down lists
        if (acrossActors.map((actor) => actor.id).includes(parseInt(actorId)) || downActors.map((actor) => actor.id).includes(parseInt(actorId))) {
          console.log(`Skipping ${actor.name} because it's already in the ${direction} list`);
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
          console.log(`Current actor ${current.name} (ID = ${current.id}) shares with ${actor.name} (ID = ${actor.id})`);
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
            continue; // Unnecessary here, but it's good to be explicit
          }
        }
      }

      // If we reach this point, we've iterated over all actors in this credit
      // and none of them are valid. Return false to backtrack.
      console.log(`  Backtracking from ${current.name}'s ${credit.name} because no valid actors`);
      return false;
    }

    // If we reach this point, we've iterated over all credits for this actor
    console.log(`Exhausted all credits for ${current.name} (ID = ${current.id})`);
    return false;
  }

  getAcrossAndDownRecursive(startingActor);

  return null;
}

function convertGridToJSON(grid: Grid): string {
  const actorExports = grid.actors.map((actor) => {
    return {
      id: actor.id,
      name: actor.name,
    };
  });

  const creditExports = grid.connections.map((connection) => {
    return {
      type: connection.credit.type,
      id: connection.credit.id,
      name: connection.credit.name,
    };
  });

  const answers = {};
  for (const actor of grid.actors) {
    answers[actor.id] = [];
  }
  for (const connection of grid.connections) {
    answers[connection.actor1.id].push(connection.credit.id);
    answers[connection.actor2.id].push(connection.credit.id);
  }

  const gridExport = {
    actors: actorExports,
    credits: creditExports,
    answers,
  };

  return JSON.stringify(gridExport);
}

mainGraph();
