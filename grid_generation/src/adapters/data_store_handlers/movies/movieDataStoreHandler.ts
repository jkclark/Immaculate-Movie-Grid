import DataStoreHandler from "src/ports/dataStoreHandler";
import { GraphData } from "src/ports/interfaces/graph";

export default abstract class MovieDataStoreHandler extends DataStoreHandler {
  abstract getGraphData(): Promise<GraphData>;
}
