import { S3 } from "@aws-sdk/client-s3";
import * as dotenv from "dotenv";
import "node-fetch";

import generateGrid from "./generateGrid";
import { Actor, Grid } from "./interfaces";
import { writeTextToS3 } from "./s3";
import { getActorById, getActorCredits } from "./tmdbAPI";

dotenv.config();

async function main(): Promise<void> {
  const manualActorIds = [287, 819, 85, 4495, 58225, 23659];
  const validGrid = await getValidGrid(manualActorIds);
  console.log("Valid grid found!");
  console.log(validGrid);
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

main();
