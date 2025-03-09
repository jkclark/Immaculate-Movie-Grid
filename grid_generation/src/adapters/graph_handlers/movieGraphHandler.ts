import GraphHandler from "../../ports/graphHandler";
import MovieDataScraper from "../data_scrapers/movies/movieDataScraper";
import MovieDataStoreHandler from "../data_store_handlers/movies/movieDataStoreHandler";

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
}
