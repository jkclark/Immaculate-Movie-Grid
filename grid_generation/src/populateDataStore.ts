import { GameType, InvalidGameTypeError, isValidGameType } from "common/src/gameTypes";
import { allMovieCategories } from "./adapters/categories/movies";
import TMDBDataScraper from "./adapters/data_scrapers/movies/tmdbDataScraper";
import PostgreSQLMovieDataStoreHandler from "./adapters/data_store_handlers/movies/postgreSQLMovieDataStoreHandler";
import { Category } from "./ports/categories";
import DataScraper from "./ports/dataScraper";
import DataStoreHandler from "./ports/dataStoreHandler";
import { EntityType, GraphData } from "./ports/graph";

interface PopulateDataStoreArgs {
  dataScraper: DataScraper;
  dataStoreHandler: DataStoreHandler;
  categories: { [key: number]: Category };
}

async function main(args: PopulateDataStoreArgs) {
  const { dataScraper, dataStoreHandler, categories } = args;

  // Get existing actors
  const existingActors = await dataStoreHandler.getExistingNonCategoryAxisEntities();

  // Fetch data from TMDB
  const graphData = await dataScraper.scrapeData(existingActors);

  // Incorporate categories
  addCategoriesToGraphDataInPlace(categories, graphData);

  // Save data to DB
  await dataStoreHandler.storeGraphData(graphData);
}

/**
 * Add categories to the graph data.
 *
 * NOTE: This function modifies the graphData in place.
 *
 * @param categories the categories to add
 * @param graphData the graph data to add the categories to
 * @returns the updated graph data with the categories added
 */
export function addCategoriesToGraphDataInPlace(
  categories: { [key: number]: Category },
  graphData: GraphData
): void {
  for (const [id, category] of Object.entries(categories)) {
    /* Add category axis entity */
    graphData.axisEntities[id] = {
      id: id,
      name: category.name,
      entityType: EntityType.CATEGORY,
    };

    /* Add category connections */
    for (const connection of Object.values(graphData.connections)) {
      if (category.connectionFilter(connection)) {
        graphData.links.push({
          axisEntityId: id,
          connectionId: connection.id,
        });
      }
    }
  }
}

function processCLIArgs(): PopulateDataStoreArgs {
  const args = process.argv.slice(2);
  if (args.length < 1) {
    const errorMessage =
      "\n**************************************************\n" +
      "Usage: npx ts-node populateDataStore.ts <game-type>\n" +
      "\n" +
      `game-type must be one of: [${Object.values(GameType).join(", ")}]\n` +
      "\n" +
      "**************************************************\n";

    throw new Error(errorMessage);
  }

  if (!isValidGameType(args[0])) {
    throw new InvalidGameTypeError(args[0]);
  }

  let dataScraper: DataScraper;
  let dataStoreHandler: DataStoreHandler;
  let categories: { [key: number]: Category };

  // Movies
  if (args[0] === GameType.MOVIES) {
    dataScraper = new TMDBDataScraper();
    const postgreSQLDataStoreHandler = new PostgreSQLMovieDataStoreHandler();
    postgreSQLDataStoreHandler.init();
    dataStoreHandler = postgreSQLDataStoreHandler;

    categories = allMovieCategories;
  }

  return {
    dataScraper: dataScraper,
    dataStoreHandler: dataStoreHandler,
    categories: categories,
  };
}

if (require.main === module) {
  main(processCLIArgs());
}
