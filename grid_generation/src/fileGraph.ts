import fs from "fs";

import path from "path";
import { CreditExtraInfo, getAllCreditExtraInfo } from "./creditExtraInfo";
import { Actor, ActorCreditGraph, ActorNode, Credit, CreditNode, getCreditUniqueString } from "./interfaces";
import { getAllActorInformation } from "./tmdbAPI";

export async function loadGraphFromFile(refreshData: boolean): Promise<ActorCreditGraph> {
  // Load the graph, or generate it if it doesn't exist
  const graph = await loadOrFetchGraph(refreshData);

  // Load the extra info for all credits from file, or generate it if it doesn't exist
  const allCreditExtraInfo = await getAllCreditExtraInfo(graph.credits, refreshData);

  // Merge the extra info into the graph, in place
  mergeGraphAndExtraInfo(graph, allCreditExtraInfo);

  return graph;
}

/**
 * Get a graph object from a file if it exists, otherwise scrape the data, generate the graph, and write it to file.
 *
 * @returns A promise that resolves to a Graph object
 */
async function loadOrFetchGraph(refreshData): Promise<ActorCreditGraph> {
  // If we don't want fresh data and a graph exists, read it and return
  const GRAPH_PATH = path.join(__dirname, "complete_graph.json");
  if (!refreshData && fs.existsSync(GRAPH_PATH)) {
    console.log("Graph exists, reading from file");
    return readGraphFromFile(GRAPH_PATH);
  }

  // Otherwise, scrape the data, generate the graph, and write it to file
  // Get all actor information
  const actorsWithCredits = await getAllActorInformation();
  console.log("Actors with credits:", actorsWithCredits.length);

  // Generate graph
  const graph = generateGraph(actorsWithCredits);

  // Write graph to file
  // NOTE: This file cannot be called graph.json because it somehow conflicts with
  //       the graph.ts file in the same directory.
  writeGraphToFile(graph, GRAPH_PATH);

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
function mergeGraphAndExtraInfo(
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

interface actorNodeExport {
  id: string;
  name: string;
  connections: { type: "movie" | "tv"; id: string }[];
}

interface creditNodeExport {
  type: "movie" | "tv";
  id: string;
  name: string;
  genre_ids: number[];
  popularity: number;
  release_date: string;
  connections: number[];
}

function generateGraph(actorsWithCredits: Actor[]): ActorCreditGraph {
  const graph: ActorCreditGraph = { actors: {}, credits: {} };

  for (const actor of actorsWithCredits) {
    addActorToGraph(graph, actor.id, actor.name);
    for (const credit of actor.credits) {
      try {
        addCreditToGraph(credit, graph);
      } catch (e) {
        if (!(e instanceof RepeatError)) {
          throw e;
        }
      }
      addLinkToGraph(graph, actor.id, credit);
    }
  }

  return graph;
}

function addActorToGraph(graph: ActorCreditGraph, id: string, name: string): void {
  if (graph.actors[id]) {
    throw new Error(`Actor with id ${id} already exists: ${graph.actors[id].name}`);
  }

  graph.actors[id] = { id, name, connections: {}, entityType: "actor" };
}

function addCreditToGraph(credit: Credit, graph: ActorCreditGraph): void {
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

function addLinkToGraph(graph: ActorCreditGraph, actorId: string, credit: Credit): void {
  const creditUniqueString = getCreditUniqueString(credit);
  const actorNode: ActorNode = graph.actors[actorId];
  const creditNode: CreditNode = graph.credits[creditUniqueString];
  actorNode.connections[creditUniqueString] = creditNode;
  creditNode.connections[actorId] = actorNode;
}

function readGraphFromFile(path: string): ActorCreditGraph {
  const json = fs.readFileSync(path, "utf8");
  const data: { actors: actorNodeExport[]; credits: creditNodeExport[] } = JSON.parse(json);

  const graph: ActorCreditGraph = { actors: {}, credits: {} };

  for (const actor of data.actors) {
    addActorToGraph(graph, actor.id, actor.name);
  }

  for (const credit of data.credits) {
    addCreditToGraph(credit, graph);
  }

  for (const actor of data.actors) {
    for (const credit of actor.connections) {
      addLinkToGraph(graph, actor.id, graph.credits[getCreditUniqueString(credit)]);
    }
  }

  return graph;
}

function writeGraphToFile(graph: ActorCreditGraph, path: string): void {
  const json = convertGraphToJSON(graph);
  fs.writeFileSync(path, json);
}

function convertGraphToJSON(graph: ActorCreditGraph): string {
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

class RepeatError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RepeatError";
  }
}
