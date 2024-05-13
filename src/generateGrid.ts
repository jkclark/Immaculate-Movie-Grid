import { Actor, Credit, Connection, Grid } from "./interfaces";


export default async function generateGrid(manualActorIds: number[]): Promise<Grid> {
  const GRID_SIZE = 3;
  const TOTAL_ACTORS = GRID_SIZE * 2;

  const actors: Actor[] = [];

  // TODO: Move this out of this function, because we will repeatedly get the same actors
  // if we call this function multiple times in a row.
  // Get the actors specified in the manualActorIds array
  for (const id of manualActorIds) {
    const actor = await getActorById(id);
    actor.credits = await getActorCredits(actor);
    actors.push(actor);
  }

  // Get 6 - manualActorIds.length random actors
  const numActorsToGet = TOTAL_ACTORS - manualActorIds.length;
  const randomActors: Actor[] = await getRandomActors(numActorsToGet);
  for (const actor of randomActors) {
    actor.credits = await getActorCredits(actor);
    actors.push(actor);
  }

  const connections = findValidActorSplit(actors);
  return { actors, connections };
}

async function getActorById(id: number): Promise<Actor> {
  const options = {
    method: "GET",
    headers: {
      accept: "application/json",
      Authorization: `Bearer ${process.env.TMDB_API_KEY}`
    }
  };

  const url = `https://api.themoviedb.org/3/person/${id}?language=en-US`;

  let actor: Actor;
  await fetch(url, options)
    .then(res => res.json())
    .then(json => {
      actor = { id: json.id, name: json.name, credits: new Set() };
      return json;
    })
    .catch(err => console.error("error:" + err));

  return actor;
}

/**
 * Get a list of random actors from the TMDB API "popular people" list.
 *
 * @param numActors the number of actors to get
 * @returns a list of `numActors` actors
 */
async function getRandomActors(numActors: number): Promise<Actor[]> {
  const options = {
    method: "GET",
    headers: {
      accept: "application/json",
      Authorization: `Bearer ${process.env.TMDB_API_KEY}`
    }
  };

  const PAGES_TO_GET = 30;
  const responses = [];
  // NOTE: Pages are 1-indexed in the TMDB API
  for (let page = 1; page < PAGES_TO_GET + 1; page++) {
    const url = `https://api.themoviedb.org/3/person/popular?language=en-US&page=${page}`;

    await fetch(url, options)
      .then(res => res.json())
      .then(json => { responses.push(json); })
      .catch(err => console.error("error:" + err));
  }

  const ACTORS_PER_PAGE = 20;
  const chosen_actors: Actor[] = [];
  while (chosen_actors.length < numActors) {
    const randomPageIndex = Math.floor(Math.random() * PAGES_TO_GET);
    const randomPage = responses[randomPageIndex];

    const randomActorIndex = Math.floor(Math.random() * ACTORS_PER_PAGE);
    const randomActor = randomPage["results"][randomActorIndex];

    // Skip repeats and non-actors
    if (chosen_actors.includes(randomActor) || randomActor.known_for_department !== "Acting") {
      if (chosen_actors.includes(randomActor)) {
        console.log("Repeat: " + randomActor.name);
      } else {
        console.log("Not an actor: " + randomActor.name);
      }
      continue;
    }

    chosen_actors.push({ id: randomActor.id, name: randomActor.name, credits: new Set() });
  }

  return chosen_actors;
}

/**
 * Get a set of movie and TV show credits for an actor.
 * 
 * @param actor the actor for whom to get credits
 * @returns a set of credits for the actor
 */
async function getActorCredits(actor: Actor): Promise<Set<Credit>> {
  const options = {
    method: "GET",
    headers: {
      accept: "application/json",
      Authorization: `Bearer ${process.env.TMDB_API_KEY}`
    }
  };

  const url = `https://api.themoviedb.org/3/person/${actor.id}/combined_credits?language=en-US`;
  const credits: Set<Credit> = new Set();
  await fetch(url, options)
    .then(res => res.json())
    .then(json => {
      for (const credit of json["cast"]) {
        if (!isCreditValid(credit)) {
          continue;
        }

        // Movies have a "title", TV shows have a "name"
        credits.add({ type: credit.media_type, id: credit.id, name: credit.title || credit.name });
      }
      return json;
    })
    .catch(err => console.error("error:" + err));

  return credits;
}

function findValidActorSplit(actors: Actor[]): Connection[] {
  const allTriples = getCombinations(actors, 3);
  for (const triple of allTriples) {
    // Define the two candidate groups of actors
    const otherActors = actors.filter(actor => !triple.includes(actor));

    // Check each pair (there are 3^2 = 9 pairs for two groups of 3)
    const connections: Connection[] = actorSplitIsValid(triple, otherActors);
    if (connections) {
      return connections;
    }
  }
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
 * Check if a split of actors into two groups is valid.
 *  
 * A split is valid if each pair of actors between the two groups shares at least one credit.
 * 
 * @param groupA the first group of actors to compare
 * @param groupB the second group of actors to compare
 * @returns a list of connections between actors in the two groups, or null if no valid split exists
 */
function actorSplitIsValid(groupA: Actor[], groupB: Actor[]): Connection[] {
  const connections: Connection[] = [];
  for (const actorA of groupA) {
    for (const actorB of groupB) {
      if (!getActorsSharedCredit(actorA, actorB)) {
        return null;
      }

      const credit = getActorsSharedCredit(actorA, actorB);
      connections.push({ actor1: actorA, actor2: actorB, credit });
    }
  }

  return connections;
}

/**
 * 
 * @param actorA the first actor to compare
 * @param actorB the second actor to compare
 * @returns a credit shared by both actors, or null if none exists
 */
function getActorsSharedCredit(actorA: Actor, actorB: Actor): Credit {
  for (const creditA of actorA.credits) {
    for (const creditB of actorB.credits) {
      if (creditA.id === creditB.id) {
        return creditA;
      }
    }
  }
  return null;
}

/**
 * Determine if a credit is "valid". A credit is valid if it is:
 * - Not a talk show
 * - Not Saturday Night Live
 * 
 * I'm using `any` instead of a more specific type because the TMDB API response
 * is large and complex.
 * 
 * Notes:
 * - There are some TV shows, like CSI: Crime Scene Investigation and NCIS that have
 *   had so many episodes with so many guest actors that they are starting to move away
 *   from the spirit of the game. Not sure yet what to do about that.
 * 
 * @param credit the JSON object from the TMDB API representing a credit
 * @returns true if the credit is valid, false otherwise
 */
function isCreditValid(credit: any): boolean {
  const INVALID_TV_GENRES_IDS: number[] = [
    10763, // News
    10767, // Talk shows
  ]
  const isInvalidGenre: boolean = credit.media_type === "tv" && credit.genre_ids.some(id => INVALID_TV_GENRES_IDS.includes(id));

  const INVALID_TV_SHOW_IDS: number[] = [
    1667, // Saturday Night Live
    2224, // The Daily Show
    27023, // The Oscars
  ]
  const isInvalidShow: boolean = credit.media_type === "tv" && INVALID_TV_SHOW_IDS.includes(credit.id);
  return !isInvalidGenre && !isInvalidShow;
}
