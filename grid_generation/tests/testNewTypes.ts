import MovieGraphHandler from "src/adapters/movies/movieGraphHandler";
import TMDBDataScraper from "src/adapters/movies/tmdbDataScraper";
import PostgreSQLHandler from "src/adapters/postgreSQLHandler";

if (require.main === module) {
  const dataScraper = new TMDBDataScraper();
  const dataStoreHandler = new PostgreSQLHandler();

  const graphHandler = new MovieGraphHandler(dataStoreHandler, dataScraper);
}
