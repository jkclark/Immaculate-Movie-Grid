import { GraphData } from "./graph";

export default abstract class DataStoreHandler {
  abstract init(): Promise<void>;

  abstract getGraphData(): Promise<GraphData>;

  abstract storeGraphData(graphData: GraphData): Promise<void>;
}
