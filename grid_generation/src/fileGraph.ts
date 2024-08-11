import fs from "fs";

import { CreditExtraInfo, getAllCreditExtraInfo } from "./creditExtraInfo";
import { famousActorIds } from "./famousActorIds";
import { ActorCreditGraph, generateGraph, readGraphFromFile, writeGraphToFile } from "./graph";
import { Actor } from "./interfaces";
import { getActorWithCreditsById } from "./tmdbAPI";

export async function loadGraphFromFile(): Promise<ActorCreditGraph> {
  // Load the graph, or generate it if it doesn't exist
  const graph = await loadOrFetchGraph();

  // Load the extra info for all credits from file, or generate it if it doesn't exist
  const allCreditExtraInfo = await getAllCreditExtraInfo(graph.credits);

  // Merge the extra info into the graph, in place
  mergeGraphAndExtraInfo(graph, allCreditExtraInfo);

  return graph;
}

/**
 * Get a graph object from a file if it exists, otherwise scrape the data, generate the graph, and write it to file.
 *
 * @returns A promise that resolves to a Graph object
 */
async function loadOrFetchGraph(): Promise<ActorCreditGraph> {
  // If graph exists, read it and return
  const GRAPH_PATH = "./src/complete_graph.json";
  if (fs.existsSync(GRAPH_PATH)) {
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
    credit.rating = extraInfo.rating;
  }
}

/**
 * Get actor and credit information for a list of actor IDs
 * @param actorIds the list of actor IDs to get information for
 * @returns A promise that resolves to a list of actors with their credits
 */
async function getAllActorInformation(): Promise<Actor[]> {
  const actorsWithCredits: Actor[] = [];
  for (const id of famousActorIds) {
    const actor = await getActorWithCreditsById(id);
    actorsWithCredits.push(actor);
    console.log(`Got actor ${actor.name} with ${actor.credits.size} credits`);
  }

  return actorsWithCredits;
}
