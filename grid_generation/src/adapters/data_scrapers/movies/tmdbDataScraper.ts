import { ActorCreditGraphData } from "src/adapters/graph/movies/graph";
import MovieDataScraper from "./movieDataScraper";

export default class TMDBDataScraper extends MovieDataScraper {
  async scrapeData(): Promise<ActorCreditGraphData> {
    return {
      axisEntities: {},
      connections: {},
      links: [],
    };
  }
}
