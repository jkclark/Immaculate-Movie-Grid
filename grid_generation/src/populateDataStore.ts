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

  // JOSH: I'm currently testing the code for populateDataStore (no categories yet)
  // and it seems that links may have a duplicate entry, which is causing an error when
  // writing the actor-credit relationships to the database.
  //
  // Next step: Try to find the duplicate to confirm that TMDB actors can have more than one
  // credit with the same type/id. If that's the case, we just have to deduplicate the links
  // before passing them to the data store handler. If that's not the case, we have to figure
  // out why we're getting this duplicate error.

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
