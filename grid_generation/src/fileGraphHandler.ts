import fs from "fs";
import path from "path";

import { CreditExtraInfo, getAllCreditExtraInfo } from "./creditExtraInfo";
import GraphHandler from "./graphHandler";
import {
  Actor,
  ActorCreditGraph,
  ActorNode,
  actorNodeExport,
  Credit,
  CreditNode,
  creditNodeExport,
  getCreditUniqueString,
} from "./interfaces";
import { getAllActorInformation } from "./tmdbAPI";

/**
 * A class that handles the reading and writing of graphs to and from files.
 *
 * It is important to note that the file graph handler works differently from other graph handlers.
 * The file graph handler actually uses two separate files: one file contains actors and credits,
 * and the other file contains extra information about the credits. In the database graph handler,
 * for example, the extra information is stored alongside the credits in the same table, so there is no
 * need to handle them separately.
 */
export default class FileGraphHandler extends GraphHandler {
  async loadOrFetchGraph(refreshData): Promise<ActorCreditGraph> {
    // Load the graph, or generate it if it doesn't exist
    const graph = await this.loadOrFetchActorsAndCreditsGraph(refreshData);

    // Load the extra info for all credits from file, or generate it if it doesn't exist
    const allCreditExtraInfo = await getAllCreditExtraInfo(graph.credits, refreshData);

    // Merge the extra info into the graph, in place
    this.mergeGraphAndExtraInfo(graph, allCreditExtraInfo);

    return graph;
  }

  /**
   * Write a graph to a file.
   *
   * The "graph" written to file here only contains information about actors and credits,
   * not the extra information about credits. The extra information is stored in a separate file.
   *
   * @param graph the graph to save to file
   * @param name the name of the file to save the graph to
   */
  saveGraph(graph: ActorCreditGraph, name: string): void {
    const json = super.convertGraphToJSON(graph);
    fs.writeFileSync(name, json);
  }
  /**
   * Get a graph object from a file if it exists, otherwise scrape the data, generate the graph, and write it to file.
   *
   * @returns A promise that resolves to a Graph object
   */
  async loadOrFetchActorsAndCreditsGraph(refreshData): Promise<ActorCreditGraph> {
    // If we don't want fresh data and a graph exists, read it and return
    const GRAPH_PATH = path.join(__dirname, "complete_graph.json");
    if (!refreshData && fs.existsSync(GRAPH_PATH)) {
      console.log("Graph exists, reading from file");
      return this.readGraphFromFile(GRAPH_PATH);
    }

    // Otherwise, scrape the data, generate the graph, and write it to file
    // Get all actor information
    const actorsWithCredits = await getAllActorInformation();
    console.log("Actors with credits:", actorsWithCredits.length);

    // Generate graph
    const graph = this.generateGraph(actorsWithCredits);

    // Write graph to file
    // NOTE: This file cannot be called graph.json because it somehow conflicts with
    //       the graph.ts file in the same directory.
    this.saveGraph(graph, GRAPH_PATH);

    return graph;
  }

  generateGraph(actorsWithCredits: Actor[]): ActorCreditGraph {
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

  readGraphFromFile(path: string): ActorCreditGraph {
    const json = fs.readFileSync(path, "utf8");
    const data: { actors: actorNodeExport[]; credits: creditNodeExport[] } = JSON.parse(json);

    const graph: ActorCreditGraph = { actors: {}, credits: {} };

    for (const actor of data.actors) {
      this.addActorToGraph(graph, actor.id, actor.name);
    }

    for (const credit of data.credits) {
      this.addCreditToGraph(credit, graph);
    }

    for (const actor of data.actors) {
      for (const credit of actor.connections) {
        this.addLinkToGraph(graph, actor.id, graph.credits[getCreditUniqueString(credit)]);
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
