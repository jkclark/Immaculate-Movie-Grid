import fs from "fs";
import { Actor, Credit } from "./interfaces";

export interface ActorNode {
  id: number;
  name: string;
  edges: { [key: string]: CreditNode };
}

export interface CreditNode {
  type: "movie" | "tv";
  id: number;
  name: string;
  genre_ids: number[];
  popularity: number;
  edges: { [key: number]: ActorNode };
}

export interface Graph {
  actors: { [key: number]: ActorNode };
  credits: { [key: string]: CreditNode };
}

export function addActorToGraph(graph: Graph, id: number, name: string): void {
  if (graph.actors[id]) {
    throw new Error(`Actor with id ${id} already exists: ${graph.actors[id].name}`);
  }

  graph.actors[id] = { id, name, edges: {} };
}

export function addCreditToGraph(credit: Credit, graph: Graph): void {
  const creditUniqueString = getCreditUniqueString(credit);
  if (graph.credits[creditUniqueString]) {
    throw new RepeatError(
      `Credit with id ${creditUniqueString} already exists: ${graph.credits[creditUniqueString].name}`
    );
  }
  graph.credits[creditUniqueString] = {
    ...credit,
    edges: {},
  };
}

export function addConnectionToGraph(graph: Graph, actorId: number, credit: Credit): void {
  const creditUniqueString = getCreditUniqueString(credit);
  const actor: ActorNode = graph.actors[actorId];
  const creditNode: CreditNode = graph.credits[creditUniqueString];
  actor.edges[creditUniqueString] = creditNode;
  creditNode.edges[actorId] = actor;
}

export function generateGraph(actorsWithCredits: Actor[]): Graph {
  const graph: Graph = { actors: {}, credits: {} };

  for (const actor of actorsWithCredits) {
    addActorToGraph(graph, actor.id, actor.name);
    for (const credit of actor.credits) {
      try {
        addCreditToGraph(credit, graph);
      } catch (e) {
        if (e instanceof RepeatError) {
          console.error(e.message);
        } else {
          throw e;
        }
      }
      addConnectionToGraph(graph, actor.id, credit);
    }
  }

  return graph;
}

interface actorNodeExport {
  id: number;
  name: string;
  edges: { type: "movie" | "tv"; id: number }[];
}

interface creditNodeExport {
  type: "movie" | "tv";
  id: number;
  name: string;
  genre_ids: number[];
  popularity: number;
  edges: number[];
}

function convertGraphToJSON(graph: Graph): string {
  // Convert actorNodes to actorNodeExports (remove the references to edges, just keep the IDs)
  const actorExports: actorNodeExport[] = [];
  for (const actorId in graph.actors) {
    const actor = graph.actors[actorId];
    const edges = Object.values(actor.edges).map((credit) => {
      return { type: credit.type, id: credit.id };
    });
    actorExports.push({ ...actor, edges });
  }

  // Convert creditNodes to creditNodeExports (remove the references to edges, just keep the IDs)
  const creditExports: creditNodeExport[] = [];
  for (const creditId in graph.credits) {
    const credit = graph.credits[creditId];
    const edges = Object.keys(credit.edges).map((actorId) => parseInt(actorId));
    creditExports.push({
      ...credit,
      edges,
    });
  }

  return JSON.stringify({ actors: actorExports, credits: creditExports });
}

export function writeGraphToFile(graph: Graph, path: string): void {
  const json = convertGraphToJSON(graph);
  fs.writeFileSync(path, json);
}

export function readGraphFromFile(path: string): Graph {
  const json = fs.readFileSync(path, "utf8");
  const data = JSON.parse(json);

  const graph: Graph = { actors: {}, credits: {} };

  for (const actor of data.actors) {
    addActorToGraph(graph, actor.id, actor.name);
  }

  for (const credit of data.credits) {
    addCreditToGraph(credit, graph);
  }

  for (const actor of data.actors) {
    for (const credit of actor.edges) {
      addConnectionToGraph(graph, actor.id, credit);
    }
  }

  return graph;
}

export function getSharedCreditsForActors(
  actor1: ActorNode,
  actor2: ActorNode,
  excludeCredits: Set<string>,
  type: "movie" | "tv" = null
): CreditNode[] {
  const sharedCredits: CreditNode[] = [];
  for (const credit1 of Object.values(actor1.edges)) {
    // If this credit is to be excluded, go to the next one
    if (excludeCredits.has(getCreditUniqueString(credit1))) {
      continue;
    }

    // If a type is specified and this credit is not of that type, ignore this one
    if (type && credit1.type !== type) {
      continue;
    }

    if (actor2.edges[getCreditUniqueString(credit1)]) {
      sharedCredits.push(credit1);
    }
  }

  return sharedCredits;
}

export function getCreditUniqueString(credit: Credit): string {
  return `${credit.type}-${credit.id}`;
}

function getCreditTypeAndIdFromUniqueString(uniqueString: string): { type: string; id: number } {
  const [type, id] = uniqueString.split("-");
  return { type: type as "movie" | "tv", id: parseInt(id) };
}

class RepeatError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RepeatError";
  }
}
