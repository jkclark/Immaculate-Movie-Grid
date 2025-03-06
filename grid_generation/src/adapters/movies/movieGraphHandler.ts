import DataStoreHandler from "../../ports/interfaces/dataStoreHandler";
import MovieDataScraper from "../../ports/movies/movieDataScraper";
import GraphHandler from "../../ports/newGraphHandler";

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
