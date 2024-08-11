import { ActorCreditGraph } from "./interfaces";

export async function loadGraphFromDB(): Promise<ActorCreditGraph> {
  return {
    actors: {},
    credits: {},
  };
}
