import { Actor, ActorCreditGraph, ActorNode, Credit, CreditNode, getCreditUniqueString } from "./interfaces";

export default abstract class GraphHandler {
  abstract fetchData(): Promise<void>;

  abstract loadGraph(): Promise<ActorCreditGraph>;

  abstract saveGraph(graph: ActorCreditGraph, name: string): void;

  /**
   * Create a graph object from a list of actors with their credits.
   *
   * The graph object does NOT contain extra credit information at this point,
   * only the actors and credits themselves.
   *
   * @param actorsWithCredits a list of actors with their credits
   * @returns a graph object with actors and credits as nodes, and links between them
   */
  generateActorCreditGraph(actorsWithCredits: Actor[]): ActorCreditGraph {
    const graph: ActorCreditGraph = { actors: {}, credits: {} };

    for (const actor of actorsWithCredits) {
      this.addActorToGraph(graph, actor.id, actor.name);
      for (const credit of actor.credits) {
        try {
          this.addCreditToGraph(credit, graph);
        } catch (e) {
          if (!(e instanceof RepeatError)) {
            throw e;
          }
        }
        this.addLinkToGraph(graph, actor.id, credit);
      }
    }

    return graph;
  }

  addActorToGraph(graph: ActorCreditGraph, id: string, name: string): void {
    if (graph.actors[id]) {
      throw new Error(`Actor with id ${id} already exists: ${graph.actors[id].name}`);
    }

    graph.actors[id] = { id, name, connections: {}, entityType: "actor" };
  }

  addCreditToGraph(credit: Credit, graph: ActorCreditGraph): void {
    const creditUniqueString = getCreditUniqueString(credit);
    if (graph.credits[creditUniqueString]) {
      throw new RepeatError(
        `Credit with id ${creditUniqueString} already exists: ${graph.credits[creditUniqueString].name}`
      );
    }
    graph.credits[creditUniqueString] = {
      ...credit,
      connections: {},
      entityType: "credit",
    };
  }

  addLinkToGraph(graph: ActorCreditGraph, actorId: string, credit: Credit): void {
    const creditUniqueString = getCreditUniqueString(credit);
    const actorNode: ActorNode = graph.actors[actorId];
    const creditNode: CreditNode = graph.credits[creditUniqueString];
    actorNode.connections[creditUniqueString] = creditNode;
    creditNode.connections[actorId] = actorNode;
  }
}

class RepeatError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RepeatError";
  }
}
