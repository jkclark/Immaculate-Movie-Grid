import MovieDataScraper from "../../adapters/movies/movieDataScraper";
import DataStoreHandler from "../../ports/dataStoreHandler";
import GraphHandler from "../../ports/graphHandler";

export default class MovieGraphHandler extends GraphHandler {
  protected dataScraper: MovieDataScraper;

  constructor(dataStoreHandler: DataStoreHandler, dataScraper: MovieDataScraper) {
    super(dataStoreHandler, dataScraper);
  }

  async init(): Promise<void> {
    await this.dataStoreHandler.init();
  }

  async populateDataStore(): Promise<void> {
    return;
  }

  // TODO: This class should contain stuff about categories, merging extra credit info, etc.
  // Because that stuff should not exist at the level above (generic graphHandler)
}
