import { ActorCreditGraph, actorNodeExport, creditNodeExport } from "./interfaces";

export default abstract class GraphHandler {
  abstract loadGraph(refreshData: boolean): Promise<ActorCreditGraph>;

  abstract saveGraph(graph: ActorCreditGraph, name: string): void;

  convertGraphToJSON(graph: ActorCreditGraph): string {
    // Convert actorNodes to actorNodeExports (remove the references to connections, just keep the IDs)
    const actorExports: actorNodeExport[] = [];
    for (const actorId in graph.actors) {
      const actor = graph.actors[actorId];
      const connections = Object.values(actor.connections).map((credit) => {
        return { type: credit.type, id: credit.id };
      });
      actorExports.push({ ...actor, connections });
    }

    // Convert creditNodes to creditNodeExports (remove the references to connections, just keep the IDs)
    const creditExports: creditNodeExport[] = [];
    for (const creditId in graph.credits) {
      const credit = graph.credits[creditId];
      const connections = Object.keys(credit.connections).map((actorId) => parseInt(actorId));
      creditExports.push({
        ...credit,
        connections,
      });
    }

    return JSON.stringify({ actors: actorExports, credits: creditExports });
  }
}
