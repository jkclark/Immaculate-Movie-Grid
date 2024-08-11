import { ActorCreditGraph } from "./graph";

export async function loadGraphFromDB(): Promise<ActorCreditGraph> {
  return {
    actors: {},
    credits: {},
  };
}
