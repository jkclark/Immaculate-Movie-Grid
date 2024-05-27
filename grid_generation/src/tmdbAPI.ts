import { Readable } from "node:stream";
import { getFromTMDBAPI, getFromTMDBAPIJson } from "../../common/src/api";
import { Actor, Credit } from "./interfaces";

const BASE_URL = "https://api.themoviedb.org/3";

export async function getActorWithCreditsById(id: number): Promise<Actor> {
  const actor = await getActorById(id);
  actor.credits = await getActorCredits(actor);
  return actor;
}

/**
 * Get an actor object from the TMDB API by ID.
 * @param id the ID of the actor to get
 * @returns an actor object with the given ID
 */
export async function getActorById(id: number): Promise<Actor> {
  const url = `${BASE_URL}/person/${id}?language=en-US`;
  const responseJson = await getFromTMDBAPIJson(url);
  const actor: Actor = { id: responseJson.id, name: responseJson.name, credits: new Set() };
  return actor;
}

/**
 * Get a set of movie and TV show credits for an actor.
 * 
 * @param actor the actor for whom to get credits
 * @returns a set of credits for the actor
 */
export async function getActorCredits(actor: Actor): Promise<Set<Credit>> {
  const url = `${BASE_URL}/person/${actor.id}/combined_credits?language=en-US`;
  const responseJson = await getFromTMDBAPIJson(url);

  const credits: Set<Credit> = new Set();
  for (const credit of responseJson["cast"]) {
    // Movies have a "title", TV shows have a "name"
    credits.add({
      type: credit.media_type,
      id: credit.id,
      name: credit.title || credit.name,
      genre_ids: credit.genre_ids
    });
  }

  return credits;
}

export async function getImageByIdTypeAndSize(imagesBaseURL: string, id: number, type: "actor" | "tv" | "movie", size: string): Promise<[Readable, string]> {
  console.log("Doing image for", id, type, size)
  let basePath: string;
  let imageTypeFieldName: string;
  if (type === "actor") {
    basePath = "/person";
    imageTypeFieldName = "profiles";
  } else if (type === "movie" || type === "tv") {
    basePath = type === "movie" ? "/movie" : "/tv";
    imageTypeFieldName = "posters";
  } else {
    console.error("Invalid type");
  }

  // Get image file path and image type
  // NOTE: Some images come back in a different language by default,
  //       so we're specifying en here for now. Not sure why it's not
  //       en-US like for some other requests.
  const path = `${BASE_URL}${basePath}/${id}/images?language=en`;
  const responseJson = await getFromTMDBAPIJson(path);

  // Some actors and credits may not have images
  if (responseJson[imageTypeFieldName].length === 0) {
    console.error(`No images found for ${type} ${id}`);
    return [null, null];
  }

  const image = responseJson[imageTypeFieldName][0];
  const imageType = image.file_path.split(".").pop();

  // Get the actual image from TMDB
  const imageUrl = `${imagesBaseURL}${size}/${image.file_path}`;
  const imageResponse = await getFromTMDBAPI(imageUrl);

  return [imageResponse.body, imageType];
}
