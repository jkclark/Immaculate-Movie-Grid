import { GraphData } from "./interfaces/graph";

export default abstract class DataStoreHandler {
  abstract init(): Promise<void>;

  abstract getGraphData(): Promise<GraphData>;
}
