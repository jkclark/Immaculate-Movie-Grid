import { S3 } from "@aws-sdk/client-s3";
import * as dotenv from "dotenv";
import "node-fetch";

import generateGrid from "./generateGrid";
import { writeTextToS3 } from "./s3";

dotenv.config();

async function main(): Promise<void> {
  let grid = await generateGrid();

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
}

main();
