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

  const jsonGrid = convertGridToJSON(validGrid);
  console.log(jsonGrid);
  // Write to S3
  await writeTextToS3(jsonGrid, "immaculate-movie-grid-daily-grids", "test-grid.json");
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

main();
