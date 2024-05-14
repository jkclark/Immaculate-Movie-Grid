import { famousActorIds } from "./famousActorIds";
import { Actor, Connection, Credit, Grid } from "./interfaces";
import { getActorById, getActorCredits } from "./tmdbAPI";


export default async function generateGrid(manualActors: Actor[]): Promise<Grid> {
  const GRID_SIZE = 3;
  const TOTAL_ACTORS = GRID_SIZE * 2;

  const actors: Actor[] = [...manualActors];

  // Get TOTAL_ACTORS - manualActorIds.length random actors
  const numActorsToGet = TOTAL_ACTORS - actors.length;
  const randomActorIds: number[] = pickNRandomFromList(numActorsToGet, famousActorIds);
  for (const id of randomActorIds) {
    const actor = await getActorById(id);
    actor.credits = await getActorCredits(actor);
    actors.push(actor);
  }

  const connections = findValidActorSplit(actors);
  return { actors, connections };
}

/**
 * Get a random selection of elements from a list.
 * @param list the list from which to pick random elements
 * @param n the number of elements to pick
 * @returns a list of `n` random elements from `list`
 */
function pickNRandomFromList<T>(n: number, list: T[]): T[] {
  const shuffledList = list.sort(() => Math.random() - 0.5);
  return shuffledList.slice(0, n);
}

function findValidActorSplit(actors: Actor[]): Connection[] {
  const allTriples = getCombinations(actors, 3);
  for (const triple of allTriples) {
    // Define the two candidate groups of actors
    const otherActors = actors.filter(actor => !triple.includes(actor));

    // Check each pair (there are 3^2 = 9 pairs for two groups of 3)
    const connections: Connection[] = getConnectionsIfSplitPossible(triple, otherActors);
    if (connections) {
      return connections;
    }
  }

  return null;
}

/**
 * Get all possible combinations of a given size from a list.
 *
 * @param list the list from which to get combinations
 * @param k the number of elements in each combination
 * @returns a list of all combinations of `k` elements from `list`
 */
function getCombinations<T>(list: T[], k: number): T[][] {
  // Base case: if k is 0, return an array containing an empty array
  if (k === 0) {
    return [[]];
  }

  // If the list is shorter than k, return an empty array
  if (list.length < k) {
    return [];
  }

  // Initialize an array to store the combinations
  const combinations: T[][] = [];

  // Iterate through the list
  for (let i = 0; i <= list.length - k; i++) {
    // Take the current element from the list
    const element = list[i];

    // Recursively find combinations from the remaining list
    const remainingCombinations = getCombinations(list.slice(i + 1), k - 1);

    // Combine the current element with the combinations from the remaining list
    for (const combination of remainingCombinations) {
      combinations.push([element, ...combination]);
    }
  }

  return combinations;
}

/**
 * Get the connections between two groups of actors if a valid split exists.
 *  
 * A split is valid if each pair of actors between the two groups shares at least one credit.
 * 
 * @param groupA the first group of actors to compare
 * @param groupB the second group of actors to compare
 * @returns a list of connections between actors in the two groups, or null if no valid split exists
 */
function getConnectionsIfSplitPossible(groupA: Actor[], groupB: Actor[]): Connection[] {
  const connections: Connection[] = [];
  for (const actorA of groupA) {
    for (const actorB of groupB) {
      const credits = getActorsSharedCredits(actorA, actorB);

      if (!credits) {
        return null;
      }

      for (const credit of credits) {
        connections.push({ actor1: actorA, actor2: actorB, credit });
      }
    }
  }

  return connections;
}

/**
 * Get the credits shared by two actors.
 * @param actorA the first actor to compare
 * @param actorB the second actor to compare
 * @returns a list of credits shared by the two actors, or null if no credits are shared
 */
function getActorsSharedCredits(actorA: Actor, actorB: Actor): Credit[] {
  const sharedCredits: Credit[] = [];
  for (const creditA of actorA.credits) {
    for (const creditB of actorB.credits) {
      if (creditA.id === creditB.id) {
        sharedCredits.push(creditA);
      }
    }
  }

  return sharedCredits.length > 0 ? sharedCredits : null;
}
