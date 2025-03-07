import TMDBDataScraper from "src/adapters/data_scrapers/movies/tmdbDataScraper";
import PostgreSQLMovieDataStoreHandler from "src/adapters/data_store_handlers/movies/postgreSQLMovieDataStoreHandler";
import MovieGraphHandler from "src/adapters/graph_handlers/movieGraphHandler";

if (require.main === module) {
  const dataScraper = new TMDBDataScraper();
  const dataStoreHandler = new PostgreSQLMovieDataStoreHandler();

  const graphHandler = new MovieGraphHandler(dataStoreHandler, dataScraper);
}
