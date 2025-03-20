import { AxisEntityData, GraphData } from "./graph";

export default interface GraphDataStoreHandler {
  /**
   * Get existing, non-category axis entities from the data store.
   *
   * This should *not* include categories because we're
   * doing this in order to pass this info to the DataScraper
   * to update connections.
   */
  getExistingNonCategoryAxisEntities(): Promise<{ [key: string]: AxisEntityData }>;

  getGraphData(): Promise<GraphData>;

  storeGraphData(graphData: GraphData): Promise<void>;
}
