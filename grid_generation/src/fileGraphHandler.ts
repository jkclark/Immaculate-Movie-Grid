import fs from "fs";

import { getAllCreditExtraInfo } from "./creditExtraInfo";
import GraphHandler from "./graphHandler";
import { ActorCreditGraph, actorNodeExport, creditNodeExport, getCreditUniqueString } from "./interfaces";
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
  private graphPath: string;

  constructor(graphPath: string) {
    super();
    this.graphPath = graphPath;
  }

  async fetchData(): Promise<void> {}

  async loadGraph(): Promise<ActorCreditGraph> {
    // Load the graph, or generate it if it doesn't exist
    const graph = await this.loadOrFetchActorsAndCreditsGraph();

    // Load the extra info for all credits from file, or generate it if it doesn't exist
    const allCreditExtraInfo = await getAllCreditExtraInfo(graph.credits);

    // Merge the extra info into the graph, in place
    super.mergeGraphAndExtraInfo(graph, allCreditExtraInfo);

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
    const json = this.convertGraphToJSON(graph);
    fs.writeFileSync(name, json);
  }
  /**
   * Get a graph object from a file if it exists, otherwise scrape the data, generate the graph, and write it to file.
   *
   * @returns A promise that resolves to a Graph object
   */
  async loadOrFetchActorsAndCreditsGraph(): Promise<ActorCreditGraph> {
    // If we don't want fresh data and a graph exists, read it and return
    if (fs.existsSync(this.graphPath)) {
      console.log("Graph exists, reading from file");
      return this.readGraphFromFile(this.graphPath);
    }

    // Otherwise, scrape the data, generate the graph, and write it to file
    // Get all actor information
    const actorsWithCredits = await getAllActorInformation();
    console.log("Actors with credits:", actorsWithCredits.length);

    // Generate graph
    const graph = super.generateActorCreditGraph(actorsWithCredits);

    // Write graph to file
    // NOTE: This file cannot be called graph.json because it somehow conflicts with
    //       the graph.ts file in the same directory.
    this.saveGraph(graph, this.graphPath);

    return graph;
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

  /**
   * Convert a graph of actors and credits to JSON.
   *
   * It should be noted that this graph does NOT contain the extra information about credits.
   *
   * @param graph the ActorCreditGraph to convert to JSON
   * @returns a JSON string representing the graph
   */
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
