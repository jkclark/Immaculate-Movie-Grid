import { Graph } from "./interfaces/graph";

export default abstract class DataStoreHandler {
  abstract init(): Promise<void>;

  abstract loadGraph(): Promise<Graph>;
}
