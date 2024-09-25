import { ActorCreditGraph } from "./interfaces";

export default abstract class GraphHandler {
  abstract fetchData(): Promise<void>;

  abstract loadGraph(refreshData: boolean): Promise<ActorCreditGraph>;

  abstract saveGraph(graph: ActorCreditGraph, name: string): void;
}
