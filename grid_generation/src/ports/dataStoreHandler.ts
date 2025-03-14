import { AxisEntityData, GraphData } from "./graph";

export default abstract class DataStoreHandler {
  // We need to have this as a separate method (and not just
  // put its contents in the constructor) because constructors
  // cannot be async.
  abstract init(): Promise<void>;

  /**
   * Get existing, non-category axis entities from the data store.
   *
   * This should *not* include categories because we're
   * doing this in order to pass this info to the DataScraper
   * to update connections.
   */
  abstract getExistingNonCategoryAxisEntities(): Promise<{ [key: string]: AxisEntityData }>;

  abstract getGraphData(): Promise<GraphData>;

  abstract storeGraphData(graphData: GraphData): Promise<void>;
}
