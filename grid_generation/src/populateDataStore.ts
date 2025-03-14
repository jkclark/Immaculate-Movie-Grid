import TMDBDataScraper from "./adapters/data_scrapers/movies/tmdbDataScraper";
import PostgreSQLMovieDataStoreHandler from "./adapters/data_store_handlers/movies/postgreSQLMovieDataStoreHandler";
import DBGraphHandler from "./graph_handlers/dbGraphHandler";
import GraphHandler from "./graph_handlers/graphHandler";

interface fetchDataArgs {
  graphMode: "db";
}

async function main(args: fetchDataArgs) {
  const graphHandler = getGraphHandler(args);

  await graphHandler.init();

  await graphHandler.populateDataStore();
}

async function main2() {
  // Initialize
  const dataScraper = new TMDBDataScraper();
  const dataStoreHandler = new PostgreSQLMovieDataStoreHandler();

  await dataStoreHandler.init();

  // Get existing actors
  const existingActors = await dataStoreHandler.getExistingNonCategoryAxisEntities();

  // Fetch data from TMDB
  const graphData = await dataScraper.scrapeData(existingActors);

  // Save data to DB
  await dataStoreHandler.storeGraphData(graphData);
}

function getGraphHandler(args: fetchDataArgs): GraphHandler {
  if (args.graphMode === "db") {
    return new DBGraphHandler();
  }
}

function processCLIArgs(): fetchDataArgs {
  const args = process.argv.slice(2);
  if (args.length < 1) {
    throw new Error("Usage: npx ts-node populateDataStore.ts <graphMode>");
  }

  if (args[0] !== "db") {
    throw new Error("graphMode must be 'db'");
  }

  const graphMode = args[0];

  return {
    graphMode,
  };
}

if (require.main === module) {
  // main(processCLIArgs());
  main2();
}
