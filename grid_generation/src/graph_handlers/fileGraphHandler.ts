import fs from "fs";

import { GridExport } from "common/src/interfaces";
import { famousActorIds } from "src/famousActorIds";
import { CreditExtraInfo, getAllCreditExtraInfo } from "../creditExtraInfo";
import { ActorCreditGraph, actorNodeExport, creditNodeExport, getCreditUniqueString } from "../interfaces";
import { getAllActorInformation } from "../tmdbAPI";
import GraphHandler from "./graphHandler";

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
  private actorsAndCreditsGraphPath: string;
  private creditExtraInfoPath: string;

  constructor(actorsAndCreditsGraphPath: string, creditExtraInfoPath: string) {
    super();
    this.actorsAndCreditsGraphPath = actorsAndCreditsGraphPath;
    this.creditExtraInfoPath = creditExtraInfoPath;
  }

  async init(): Promise<void> {}

  /**
   * Download actor data, credit data, and extra info about credits, and save them to files.
   */
  async populateDataStore(): Promise<void> {
    // Get actor and credit data and write it to file
    const graph = await this.populateActorsAndCreditsGraph();

    // Get extra credit info and write it to file
    await this.populateExtraCreditInfo(graph);
  }

  /**
   * Get a graph object containing actors, credits, and extra information from a file.
   *
   * @returns a promise that resolves to a graph object, which includes credit extra info
   */
  async loadGraph(): Promise<ActorCreditGraph> {
    // Load the graph from a file
    const graph = await this.readActorCreditGraphFromFile(this.actorsAndCreditsGraphPath);

    // Load the extra info for all credits from file
    const allCreditExtraInfo = this.readExtraCreditInfoFromFile(this.creditExtraInfoPath);

    // Merge the extra info into the graph, in place
    super.mergeGraphAndExtraInfo(graph, allCreditExtraInfo);

    return graph;
  }

  async saveGrid(grid: GridExport): Promise<void> {}

  /**
   * Download the actor and credit data, generate the graph, and write it to file.
   *
   * @returns A promise that resolves to a graph object
   */
  async populateActorsAndCreditsGraph(): Promise<ActorCreditGraph> {
    // Get all actor information
    const famousActors = [];
    for (let i = 0; i < famousActorIds.length; i++) {
      famousActors.push({ id: famousActorIds[i].toString(), name: "" });
    }
    const actorsWithCredits = await getAllActorInformation(famousActors);
    console.log(`${actorsWithCredits.length} actors with credits:`);

    // Generate graph
    const graph = super.generateActorCreditGraphFromTMDBData(actorsWithCredits);

    // Write graph to file
    // NOTE: This file cannot be called graph.json because it somehow conflicts with
    //       the graph.ts file in the same directory.
    this.writeActorCreditGraphToFile(graph, this.actorsAndCreditsGraphPath);

    return graph;
  }

  /**
   * Fetch the extra information about credits and save it to a file.
   *
   * @param graph the graph whose credits' extra information should be fetched and saved
   */
  async populateExtraCreditInfo(graph: ActorCreditGraph): Promise<void> {
    const allCreditExtraInfo = await getAllCreditExtraInfo(graph.credits);

    this.writeAllCreditExtraInfoToFile(allCreditExtraInfo, this.creditExtraInfoPath);
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
  writeActorCreditGraphToFile(graph: ActorCreditGraph, name: string): void {
    const json = this.convertGraphToJSON(graph);
    fs.writeFileSync(name, json);
  }

  /**
   * Write the extra information about credits to a file.
   *
   * @param allCreditExtraInfo the extra information about credits to write to file
   * @param path the path to write the extra information to
   */
  writeAllCreditExtraInfoToFile(allCreditExtraInfo: { [key: string]: CreditExtraInfo }, path: string): void {
    fs.writeFileSync(path, JSON.stringify(allCreditExtraInfo));
  }

  /**
   * Get a graph of actors and credits from a file.
   *
   * @param path the path to read the graph from
   * @returns a graph object read from the file
   */
  readActorCreditGraphFromFile(path: string): ActorCreditGraph {
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
   * Get the extra information about credits from a file.
   *
   * @param path the path to read the extra credit information from
   * @returns a dictionary of credit IDs to extra information about those credits
   */
  readExtraCreditInfoFromFile(path: string): { [key: string]: CreditExtraInfo } {
    const json = fs.readFileSync(path, "utf8");
    return JSON.parse(json);
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
