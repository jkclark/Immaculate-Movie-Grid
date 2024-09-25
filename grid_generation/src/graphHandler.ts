import { ActorCreditGraph } from "./interfaces";

export default abstract class GraphHandler {
  abstract loadOrFetchGraph(refreshData: boolean): Promise<ActorCreditGraph>;

  abstract saveGraph(graph: ActorCreditGraph, name: string): void;
}
