import fs from 'fs';
import { Actor } from "./interfaces";

export interface ActorNode {
  id: number;
  name: string;
  edges: { [key: string]: CreditNode };
}

export interface CreditNode {
  type: "movie" | "tv";
  id: number;
  name: string;
  edges: { [key: number]: ActorNode };
}

export interface Graph {
  actors: { [key: number]: ActorNode };
  credits: { [key: number]: CreditNode };
}

export function addActorToGraph(graph: Graph, id: number, name: string): void {
  if (graph.actors[id]) {
    throw new Error(`Actor with id ${id} already exists: ${graph.actors[id].name}`);
  }

  graph.actors[id] = { id, name, edges: {} };
}

export function addCreditToGraph(graph: Graph, type: "movie" | "tv", id: number, name: string): void {
  const creditUniqueString = getCreditUniqueString(type, id);
  if (graph.credits[creditUniqueString]) {
    throw new RepeatError(`Credit with id ${creditUniqueString} already exists: ${graph.credits[creditUniqueString].name}`);
  }
  graph.credits[creditUniqueString] = { type, id, name, edges: {} };
}

export function addConnectionToGraph(graph: Graph, actorId: number, creditId: number, creditType: "movie" | "tv"): void {
  const creditUniqueString = getCreditUniqueString(creditType, creditId);
  const actor = graph.actors[actorId];
  const credit = graph.credits[creditUniqueString];
  actor.edges[creditUniqueString] = credit;
  credit.edges[actorId] = actor;
}

export function generateGraph(actorsWithCredits: Actor[]): Graph {
  const graph: Graph = { actors: {}, credits: {} };

  for (const actor of actorsWithCredits) {
    addActorToGraph(graph, actor.id, actor.name);
    for (const credit of actor.credits) {
      try {
        addCreditToGraph(graph, credit.type, credit.id, credit.name);
      } catch (e) {
        if (e instanceof RepeatError) {
          console.error(e.message);
        } else {
          throw e;
        }
      }
      addConnectionToGraph(graph, actor.id, credit.id, credit.type);
    }
  }

  return graph;
}

interface actorNodeExport {
  id: number;
  name: string;
  edges: { type: "movie" | "tv", id: number }[];
}

interface creditNodeExport {
  type: "movie" | "tv"
  id: number;
  name: string;
  edges: number[];
}

function convertGraphToJSON(graph: Graph): string {
  // Convert actorNodes to actorNodeExports (remove the references to edges, just keep the IDs)
  const actorExports: actorNodeExport[] = [];
  for (const actorId in graph.actors) {
    const actor = graph.actors[actorId];
    const edges = Object.values(actor.edges).map((credit) => { return { type: credit.type, id: credit.id } });
    actorExports.push({ id: actor.id, name: actor.name, edges });
  }

  // Convert creditNodes to creditNodeExports (remove the references to edges, just keep the IDs)
  const creditExports: creditNodeExport[] = [];
  for (const creditId in graph.credits) {
    const credit = graph.credits[creditId];
    const edges = Object.keys(credit.edges).map((actorId) => parseInt(actorId));
    creditExports.push({ type: credit.type, id: credit.id, name: credit.name, edges });
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
    addCreditToGraph(graph, credit.type, credit.id, credit.name);
  }

  for (const actor of data.actors) {
    for (const credit of actor.edges) {
      addConnectionToGraph(graph, actor.id, credit.id, credit.type);
    }
  }

  return graph;
}

export function actorsShareCredit(actor1: ActorNode, actor2: ActorNode, excludeCredits: Set<string>): CreditNode {
  for (const credit1 of Object.values(actor1.edges)) {
    // If this credit is to be excluded, go to the next one
    if (excludeCredits.has(getCreditUniqueString(credit1.type, credit1.id))) {
      continue;
    }
    for (const credit2 of Object.values(actor2.edges)) {
      // If this credit is to be excluded, go to the next one
      if (excludeCredits.has(getCreditUniqueString(credit2.type, credit2.id))) {
        continue;
      }

      // If these credits are the same, return true
      if (credit1.id === credit2.id && credit1.type === credit2.type) {
        return credit1;
      }
    }
  }

  return null;
}

export function getCreditUniqueString(type: string, id: number): string {
  return `${type}-${id}`;
}

function getCreditTypeAndIdFromUniqueString(uniqueString: string): { type: string, id: number } {
  const [type, id] = uniqueString.split("-");
  return { type: type as "movie" | "tv", id: parseInt(id) };
}

class RepeatError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RepeatError";
  }
}
