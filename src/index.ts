import { S3 } from "@aws-sdk/client-s3";
import * as dotenv from "dotenv";
import "node-fetch";

import generateGrid from "./generateGrid";
import { writeTextToS3 } from "./s3";

dotenv.config();

async function main(): Promise<void> {
  const grid = await generateGrid();
  console.log("Grid:\n" + grid.join("\n"));
}

main();
