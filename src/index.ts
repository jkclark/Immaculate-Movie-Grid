import { S3 } from "@aws-sdk/client-s3";
import * as dotenv from "dotenv";
import "node-fetch";

import generateGrid from "./generateGrid";
import { writeTextToS3 } from "./s3";
import { Grid } from "./interfaces";

dotenv.config();

async function main(): Promise<void> {
  const manualActorIds = [287, 819, 85, 4495, 58225, 23659];
  const validGrid = await getValidGrid(manualActorIds);
  console.log("Valid grid found!");
  console.log(validGrid);
}

async function getValidGrid(manualActorIds: number[]): Promise<Grid> {
  let grid: Grid = await generateGrid(manualActorIds);

  let attempt = 1;
  while (!grid.connections) {
    if (attempt % 5 === 0) {
      console.log("Miss #", attempt);
    }
    grid = await generateGrid(manualActorIds);

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
