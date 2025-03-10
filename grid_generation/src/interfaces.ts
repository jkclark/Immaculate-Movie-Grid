import { GraphEntity } from "./ports/graph";

export interface Actor {
  id: string;
  name: string;
  credits: Set<Credit>;
}

export type CreditType = "movie" | "tv";

export interface Credit {
  type: CreditType;
  id: string;
  name: string;
  genre_ids: number[];
  popularity: number;
  release_date: string;

  rating?: CreditRating;
  last_air_date?: string;
}

export type CreditRating =
  | "G"
  | "PG"
  | "PG-13"
  | "R"
  | "TV-Y"
  | "TV-Y7"
  | "TV-G"
  | "TV-PG"
  | "TV-14"
  | "TV-MA"
  | "NR";

interface CreditOnlyIdAndType {
  type: CreditType;
  id: string;
}

export function getCreditUniqueString(credit: CreditOnlyIdAndType): string {
  return `${credit.type}-${credit.id}`;
}

// Graph-related interfaces
export interface ActorCreditGraph {
  actors: { [key: string]: ActorNode };
  credits: { [key: string]: CreditNode };
}

export interface ActorNode extends GraphEntity {
  name: string;
  links: { [key: string]: CreditNode };
}

export interface CreditNode extends Credit, GraphEntity {
  name: string; // Because Credit has name required and GraphEntity does not
  links: { [key: string]: ActorNode };
}

export function deepCopyActorCreditGraph(graph: ActorCreditGraph, check = true): ActorCreditGraph {
  const graphCopy: ActorCreditGraph = {
    actors: {},
    credits: {},
  };

  for (const actorId in graph.actors) {
    const actor = graph.actors[actorId];

    // Create a new actor in the copy
    graphCopy.actors[actorId] = {
      ...actor,
      links: {},
    };

    for (const creditId in actor.links) {
      // If we haven't seen this credit yet, create a new credit in the copy
      if (!graphCopy.credits[creditId]) {
        graphCopy.credits[creditId] = {
          ...graph.credits[creditId],
          links: {},
        };
      }

      // Add the connection between the actor and the credit
      graphCopy.actors[actorId].links[creditId] = graphCopy.credits[creditId];
      graphCopy.credits[creditId].links[actorId] = graphCopy.actors[actorId];
    }
  }

  return graphCopy;
}
