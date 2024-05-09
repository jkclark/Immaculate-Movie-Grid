import { S3 } from "@aws-sdk/client-s3";
import * as dotenv from "dotenv";
import "node-fetch";

import generateGrid from "./generateGrid";
import { writeTextToS3 } from "./s3";
import { Grid } from "./interfaces";

dotenv.config();

async function main(): Promise<void> {
  const validGrid = await getValidGrid();
  console.log("Valid grid found!");
  console.log(validGrid);
}

async function getValidGrid(): Promise<Grid> {
  let grid: Grid = await generateGrid();

  let attempt = 1;
  while (!grid.connections) {
    if (attempt % 5 === 0) {
      console.log("Miss #", attempt);
    }
    grid = await generateGrid();

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
