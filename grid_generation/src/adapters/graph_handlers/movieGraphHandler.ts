import { Category } from "src/categories";
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

  /**
   * Add categories to a graph.
   *
   * NOTE: This method modifies the graph in place.
   *
   * @param categories the categories to add to the graph
   * @param graph the graph to which the categories will be added
   */
  addCategoriesToGraph(categories: { [key: number]: Category }, graph: ActorCreditGraph): void {
    // iterate over (id, category) key value pairs in allCategories
    for (const [id, category] of Object.entries(categories)) {
      // Add the category to the graph
      const categoryAxisEntity = super.addAxisEntityToGraph(graph, {
        ...category,
        id: id.toString(), // Categories have numeric IDs
        entityType: "category",
      });

      // Iterate over all credits in the graph
      for (const credit of Object.values(graph.connections)) {
        if (category.creditFilter(credit)) {
          // Add the category as a connection to the credit
          super.linkAxisEntityAndConnection(categoryAxisEntity, credit);
        }
      }
    }
  }
}
