/** 
 * A little script to convert a list of actors I got from the internet to their
 * TMDB IDs. The output is a file called famousActorIds.ts that contains an array of
 * actor IDs with comments of the actors' names.
 * 
 * Run from the project root with `npx ts-node src/convertActorsToIds.ts`.
 * Will overwrite the famousActorIds.ts file in the src directory.
 */
import dotenv from "dotenv";
import fs from 'fs';

dotenv.config();

async function main() {
  const actors = readActorsFile();
  const actorIdTuples: [string, number][] = [];

  // Get the ID for each actor
  for (const actor of actors) {
    const actorId: number = await getActorIdByName(actor);
    if (actorId === undefined) {
      console.error(`No actor ID found for actor: ${actor}`);
      continue;
    }
    actorIdTuples.push([actor, actorId]);
  }

  // Prepare the actors string
  let actorsString = 'export const famousActorIds: number[] = [\n';
  for (const [actor, id] of actorIdTuples) {
    actorsString += `  ${id}, // ${actor}\n`;
  }
  actorsString += '];\n';

  // Write the actors string to the actors.ts file
  fs.writeFileSync('./src/famousActorIds.ts', actorsString);
}


function readActorsFile(): string[] {
  const data = fs.readFileSync('./src/famousActors.txt', 'utf-8');
  return data.split('\n');
}

/**
 * Get an actor ID from the TMDB API by name.
 * @param name the name of the actor to get
 * @returns the ID of the actor with the given name
 */
export async function getActorIdByName(name: string): Promise<number> {
  const options = {
    method: "GET",
    headers: {
      accept: "application/json",
      Authorization: `Bearer ${process.env.TMDB_API_KEY}`
    }
  };

  const url = `https://api.themoviedb.org/3/search/person?query=${encodeURIComponent(name)}&language=en-US`;

  let actorId: number;
  await fetch(url, options)
    .then(res => res.json())
    .then(json => {
      if (json.results && json.results.length > 0) {
        actorId = json.results[0].id;
      } else {
        throw new Error(`No results found for actor: ${name}`);
      }
    })
    .catch(err => console.error("error:" + err));

  return actorId;
}

main()
