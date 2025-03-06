import { GridExport } from "common/src/interfaces";
import { CreditExtraInfo } from "../creditExtraInfo";
import { Actor, ActorCreditGraph, ActorNode, Credit, CreditNode, getCreditUniqueString } from "../interfaces";

export default abstract class GraphHandler {
  abstract init(): Promise<void>;

  abstract populateDataStore(): Promise<void>;

  abstract loadGraph(): Promise<ActorCreditGraph>;

  abstract saveGrid(grid: GridExport): Promise<void>;

  // TODO: This method should exist at the TMDB level, not at the movie level
  // and not at the generic level
  /**
   * Create a graph object from a list of actors with their credits.
   *
   * This method uses the structure of data that comes from the TMDB API, where
   * actors are listed with their credits.
   *
   * The graph object does NOT contain extra credit information at this point,
   * only the actors and credits themselves.
   *
   * @param actorsWithCredits a list of actors with their credits
   * @returns a graph object with actors and credits as nodes, and links between them
   */
  generateActorCreditGraphFromTMDBData(actorsWithCredits: Actor[]): ActorCreditGraph {
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
      throw new RepeatError(`Actor with id ${id} already exists: ${graph.actors[id].name}`);
    }

    graph.actors[id] = { id, name, connections: {}, entityType: "actor" };
  }

  addCategoryToGraph(graph: ActorCreditGraph, id: string, name: string): void {
    if (graph.actors[id]) {
      throw new RepeatError(`Category with id ${id} already exists: ${graph.actors[id].name}`);
    }

    graph.actors[id] = { id, name, connections: {}, entityType: "category" };
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

  /**
   * Add extra info for graph credits into the graph.
   *
   * Note: This function modifies the graph in place.
   *
   * @param graph the graph to update with extra info
   * @param allCreditExtraInfo the extra info to merge into the graph
   */
  mergeGraphAndExtraInfo(
    graph: ActorCreditGraph,
    allCreditExtraInfo: { [key: string]: CreditExtraInfo }
  ): void {
    // Iterate over extra info and add them to the graph
    for (const [creditUniqueString, extraInfo] of Object.entries(allCreditExtraInfo)) {
      const credit = graph.credits[creditUniqueString];
      // Automatically take all fields from the extra info and add them to the credit
      Object.assign(credit, extraInfo);
    }
  }
}

export class RepeatError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RepeatError";
  }
}
