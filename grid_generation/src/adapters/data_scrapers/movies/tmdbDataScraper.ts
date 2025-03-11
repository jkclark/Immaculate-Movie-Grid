import { MovieGraphData } from "src/adapters/graph/movies";
import MovieDataScraper from "./movieDataScraper";

export default class TMDBDataScraper extends MovieDataScraper {
  // TODO: Make sure to use the "movie-123" format for credit IDs.

  // TODO: The TMDB API data can return duplicate genre IDs for a credit, so we need to
  // deduplicate them.

  async scrapeData(): Promise<MovieGraphData> {
    return {
      axisEntities: {},
      connections: {},
      links: [],
    };
  }
}
