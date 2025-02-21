/**
 * A little script to fetch the TMDB IDs for a list of actors I got from the
 * internet. The output is a file called famousActorsIdsToNames.ts that contains an
 * object mapping actor IDs to names.
 *
 * Run from the project root with `npx ts-node src/famous_actors/convertActorsToIds.ts`.
 * Will overwrite the famousActorIdsToNames.ts file in the src/famous_actors directory.
 */
import dotenv from "dotenv";
import fs from "fs";
import { Actor } from "../interfaces";

dotenv.config();

async function main() {
  const actorNames = readActorsFile();
  const actors: Actor[] = [];

  // Get the ID for each actor
  for (const actorName of actorNames) {
    console.log(`Getting ID for actor: ${actorName}`);
    let actor: Actor;
    try {
      actor = await getActorByName(actorName);
    } catch (e) {
      continue;
    }

    actors.push(actor);
  }

  // Prepare the actors string
  let actorsString = "export const famousActorIds: { [key: number]: string } = {\n";
  for (const actor of actors) {
    actorsString += `  ${actor.id}: "${actor.name}",\n`;
  }
  actorsString += "};\n";

  // Write the actors string to the actors.ts file
  fs.writeFileSync("./src/famous_actors/famousActorIdsToNames.ts", actorsString);
}

function readActorsFile(): string[] {
  const data = fs.readFileSync("./src/famous_actors/famousActors.txt", "utf-8");
  return data.split("\n");
}

/**
 * Get an actor ID from the TMDB API by name.
 * @param name the name of the actor to get
 * @returns the ID of the actor with the given name
 */
export async function getActorByName(name: string): Promise<Actor> {
  const options = {
    method: "GET",
    headers: {
      accept: "application/json",
      Authorization: `Bearer ${process.env.TMDB_API_KEY}`,
    },
  };

  const url = `https://api.themoviedb.org/3/search/person?query=${encodeURIComponent(name)}&language=en-US`;

  let actorId: number;
  let actorName: string;
  await fetch(url, options)
    .then((res) => res.json())
    .then((json) => {
      if (json.results && json.results.length > 0) {
        actorId = json.results[0].id;
        actorName = json.results[0].name;
      } else {
        throw new Error(`No results found for actor: ${name}`);
      }
    });

  return {
    id: actorId.toString(),
    name: actorName,
    credits: new Set(),
  };
}

main();
