import { MovieGraphData } from "src/adapters/graph/movies";
import MovieDataScraper from "./movieDataScraper";

export default class TMDBDataScraper extends MovieDataScraper {
  async scrapeData(): Promise<MovieGraphData> {
    return {
      axisEntities: {},
      connections: {},
      links: [],
    };
  }
}
