import GraphHandler from "../../ports/graphHandler";
import MovieDataScraper from "../data_scrapers/movies/movieDataScraper";
import MovieDataStoreHandler from "../data_store_handlers/movies/movieDataStoreHandler";
import { ActorCreditGraph } from "../interfaces/movies/graph";

export default class MovieGraphHandler extends GraphHandler {
  protected dataStoreHandler: MovieDataStoreHandler;
  protected dataScraper: MovieDataScraper;

  constructor(dataStoreHandler: MovieDataStoreHandler, dataScraper: MovieDataScraper) {
    super(dataStoreHandler, dataScraper);
  }

  async init(): Promise<void> {
    await this.dataStoreHandler.init();
  }

  async populateDataStore(): Promise<void> {
    return;
  }

  async loadGraph(): Promise<ActorCreditGraph> {
    return this.dataStoreHandler.loadGraph();
  }

  // TODO: This class should contain stuff about categories, merging extra credit info, etc.
  // Because that stuff should not exist at the level above (generic graphHandler)
}
