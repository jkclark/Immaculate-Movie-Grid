import fs from "fs";
import { GraphEntity } from "./getGridFromGraph";
import { Actor, Credit, getCreditUniqueString } from "./interfaces";

export interface ActorNode extends GraphEntity {
  name: string;
  connections: { [key: string]: CreditNode };
}

export interface CreditNode extends Credit, GraphEntity {
  connections: { [key: string]: ActorNode };
}

export interface ActorCreditGraph {
  actors: { [key: string]: ActorNode };
  credits: { [key: string]: CreditNode };
}

export function addActorToGraph(graph: ActorCreditGraph, id: string, name: string): void {
  if (graph.actors[id]) {
    throw new Error(`Actor with id ${id} already exists: ${graph.actors[id].name}`);
  }

  graph.actors[id] = { id, name, connections: {}, entityType: "actor" };
}

export function addCreditToGraph(credit: Credit, graph: ActorCreditGraph): void {
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

export function addLinkToGraph(graph: ActorCreditGraph, actorId: string, credit: Credit): void {
  const creditUniqueString = getCreditUniqueString(credit);
  const actorNode: ActorNode = graph.actors[actorId];
  const creditNode: CreditNode = graph.credits[creditUniqueString];
  actorNode.connections[creditUniqueString] = creditNode;
  creditNode.connections[actorId] = actorNode;
}

export function generateGraph(actorsWithCredits: Actor[]): ActorCreditGraph {
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

export function writeGraphToFile(graph: ActorCreditGraph, path: string): void {
  const json = convertGraphToJSON(graph);
  fs.writeFileSync(path, json);
}

export function readGraphFromFile(path: string): ActorCreditGraph {
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

class RepeatError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RepeatError";
  }
}
