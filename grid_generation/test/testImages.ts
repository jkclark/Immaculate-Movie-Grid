import { GridExport } from "../../common/src/interfaces";
import { getAndSaveAllImagesForGrid } from "../src/images";

async function main(): Promise<void> {
  const grid: GridExport = {
    actors: [{ id: 16483, name: "Sylvester Stallone" }],
    credits: [
      { type: "movie", id: 238, name: "The Godfather" },
      { type: "tv", id: 1668, name: "Friends" },
    ],
    answers: [],
  };
  await getAndSaveAllImagesForGrid(grid, false);
}

main();
