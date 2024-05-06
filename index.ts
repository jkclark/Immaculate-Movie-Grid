import { S3 } from "@aws-sdk/client-s3";
import * as dotenv from "dotenv";
import "node-fetch";

import { writeTextToS3 } from "./s3";

dotenv.config();

async function getRandomActor() {
  const options = {
    method: "GET",
    headers: {
      accept: "application/json",
      Authorization: `Bearer ${process.env.TMDB_API_KEY}`
    }
  };

  const PAGES_TO_GET = 20;
  const responses = [];
  // Pages are 1-indexed in the TMDB API
  for (let page = 1; page < PAGES_TO_GET + 1; page++) {
    const url = `https://api.themoviedb.org/3/person/popular?language=en-US&page=${page}`;

    await fetch(url, options)
      .then(res => res.json())
      .then(json => { responses.push(json); })
      .catch(err => console.error("error:" + err));
  }

  const ACTORS_TO_CHOOSE = 6;
  const ACTORS_PER_PAGE = 20;
  const chosen_actors: string[] = [];
  while (chosen_actors.length < ACTORS_TO_CHOOSE) {
    const random_page_index = Math.floor(Math.random() * PAGES_TO_GET);
    const random_page = responses[random_page_index];

    const random_actor_index = Math.floor(Math.random() * ACTORS_PER_PAGE);
    const actor = random_page["results"][random_actor_index];

    // Skip repeats and non-actors
    if (chosen_actors.includes(actor.name) || actor.known_for_department !== "Acting") {
      continue;
    }

    chosen_actors.push(actor.name);
  }

  console.log(chosen_actors);
}

getRandomActor();
// writeTextToS3("Hello, S3!", "movie-grid-daily-games", "test.txt");
