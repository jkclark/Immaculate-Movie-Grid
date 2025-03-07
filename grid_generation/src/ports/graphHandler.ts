import DataScraper from "./dataScraper";
import DataStoreHandler from "./dataStoreHandler";
import { Graph } from "./interfaces/graph";

export default abstract class GraphHandler {
  protected dataStoreHandler: DataStoreHandler;
  protected dataScraper: DataScraper;

  constructor(dataStoreHandler: DataStoreHandler, dataScraper: DataScraper) {
    this.dataStoreHandler = dataStoreHandler;
    this.dataScraper = dataScraper;
  }

  abstract init(): Promise<void>;

  // Requires data store handler and data scraper
  abstract populateDataStore(): Promise<void>;

  // Requires only data store handler
  async loadGraph(): Promise<Graph> {
    return this.dataStoreHandler.loadGraph();
  }

  // TODO: Add "addAxisEntityToGraph", "addConnectionToGraph", "addLinkToGraph",
  // methods
}

class DBGraphHandler extends GraphHandler {
  async init(): Promise<void> {
    // Initialize the database connection
  }

  async populateDataStore(): Promise<void> {
    // Populate the database with actors and credits
  }
}
