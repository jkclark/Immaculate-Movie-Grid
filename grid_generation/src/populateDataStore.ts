import TMDBDataScraper from "./adapters/data_scrapers/movies/tmdbDataScraper";
import PostgreSQLMovieDataStoreHandler from "./adapters/data_store_handlers/movies/postgreSQLMovieDataStoreHandler";
import { GameType, InvalidGameTypeError, isValidGameType } from "./gameTypes";
import DataScraper from "./ports/dataScraper";
import DataStoreHandler from "./ports/dataStoreHandler";

interface PopulateDataStoreArgs {
  dataScraper: DataScraper;
  dataStoreHandler: DataStoreHandler;
}

async function main(args: PopulateDataStoreArgs) {
  const { dataScraper, dataStoreHandler } = args;

  // Initialize dataStoreHandler
  await dataStoreHandler.init();

  // Get existing actors
  const existingActors = await dataStoreHandler.getExistingNonCategoryAxisEntities();

  // Fetch data from TMDB
  const graphData = await dataScraper.scrapeData(existingActors);

  // TODO: Incorporate categories

  // Save data to DB
  await dataStoreHandler.storeGraphData(graphData);
}

function processCLIArgs(): PopulateDataStoreArgs {
  const args = process.argv.slice(2);
  if (args.length < 1) {
    const errorMessage =
      "\n**************************************************\n" +
      "Usage: npx ts-node populateDataStore.ts <gameType>\n" +
      "\n" +
      `gameType must be one of: [${Object.values(GameType).join(", ")}]\n` +
      "\n" +
      "**************************************************\n";

    throw new Error(errorMessage);
  }

  if (!isValidGameType(args[0])) {
    throw new InvalidGameTypeError(args[0]);
  }

  let dataScraper: DataScraper;
  let dataStoreHandler: DataStoreHandler;

  // Movies
  if (args[0] === GameType.MOVIES) {
    dataScraper = new TMDBDataScraper();
    dataStoreHandler = new PostgreSQLMovieDataStoreHandler();
  }

  return {
    dataScraper: dataScraper,
    dataStoreHandler: dataStoreHandler,
  };
}

if (require.main === module) {
  main(processCLIArgs());
}
