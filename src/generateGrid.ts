import { Actor, Credit } from "./interfaces";


export default async function generateGrid(): Promise<Actor[]> {
  const actors: Actor[] = await getRandomActors(6);
  for (const actor of actors) {
    console.log(actor.name);
    const credits = await getActorCredits(actor);
    // for (const credit of credits) {
    //   console.log(`  ${credit.type}: ${credit.name}`);
    // }
    actor.credits = credits;
  }

  findValidActorSplit(actors);
  return actors;
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

  const PAGES_TO_GET = 20;
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
        // Movies have a "title", TV shows have a "name"
        credits.add({ type: credit.media_type, id: credit.id, name: credit.title || credit.name });
      }
      return json;
    })
    .catch(err => console.error("error:" + err));

  return credits;
}

function findValidActorSplit(actors: Actor[]): [Actor[], Actor[]] {
  const allTriples = getCombinations(actors, 3);
  for (const triple of allTriples) {
    // Define the two candidate groups of actors
    const otherActors = actors.filter(actor => !triple.includes(actor));

    // Check each pair (there are 3^2 = 9 pairs for two groups of 3)
    if (actorSplitIsValid(triple, otherActors)) {
      console.log("Found valid split!");
      console.log(triple.map(actor => actor.name));
      console.log(otherActors.map(actor => actor.name));
      return [triple, otherActors];
    }
  }

  console.log("No valid split found.");
}

function actorSplitIsValid(groupA: Actor[], groupB: Actor[]): boolean {
  for (const actorA of groupA) {
    for (const actorB of groupB) {
      if (!actorsDoShareCredits(actorA, actorB)) {
        return false;
      }
    }
  }
  return true;
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
 * 
 * @param actorA the first actor to compare
 * @param actorB the second actor to compare
 * @returns true if the actors share any credits, false otherwise
 */
function actorsDoShareCredits(actorA: Actor, actorB: Actor): boolean {
  for (const creditA of actorA.credits) {
    for (const creditB of actorB.credits) {
      if (creditA.id === creditB.id) {
        return true;
      }
    }
  }
  return false;
}
