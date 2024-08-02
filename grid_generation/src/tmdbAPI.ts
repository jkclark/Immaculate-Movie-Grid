import { Readable } from "node:stream";
import { getFromTMDBAPI, getFromTMDBAPIJson } from "../../common/src/api";
import { Actor, Credit, CreditRating } from "./interfaces";

const BASE_URL = "https://api.themoviedb.org/3";
const TMDB_404_STATUS_CODE = 34;

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
  const actor: Actor = { id: responseJson.id.toString(), name: responseJson.name, credits: new Set() };
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
  if (!responseJson["cast"]) {
    console.error(`No credits found for actor ${actor.id}`);
    return credits;
  }

  for (const credit of responseJson["cast"]) {
    // Movies have a "title", TV shows have a "name"
    credits.add({
      type: credit.media_type,
      id: credit.id.toString(),
      name: credit.title || credit.name,
      genre_ids: credit.genre_ids || [],
      popularity: credit.popularity || 0,
    });
  }

  return credits;
}

export async function getImageByIdTypeAndSize(
  imagesBaseURL: string,
  id: number,
  type: "actor" | "tv" | "movie",
  size: string
): Promise<[Readable, string]> {
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

  // Sometimes a movie with the given ID just doesn't exist, but is somehow in
  // our graph or a request may fail for any other reason. If that happens,
  // we'll just return null for the image and type.
  if (responseJson.status_code === TMDB_404_STATUS_CODE) {
    console.error(`No ${type} found for ID ${id}`);
    return [null, null];
  }

  // Some actors and credits may not have images
  if (responseJson[imageTypeFieldName].length === 0) {
    return [null, null];
  }

  const image = responseJson[imageTypeFieldName][0];
  const imageType = image.file_path.split(".").pop();

  // Get the actual image from TMDB
  const imageUrl = `${imagesBaseURL}${size}/${image.file_path}`;
  const imageResponse = await getFromTMDBAPI(imageUrl);

  return [imageResponse.body, imageType];
}

export async function getMovieRating(id: string): Promise<CreditRating> {
  /** Movie ratings are stored per release date, per country.
   *  Here we query the release_dates endpoint, find the most recent release
   *  date for the US, and return the rating for that release.
   **/
  const url = `${BASE_URL}/movie/${id}/release_dates`;
  const responseJson = await getFromTMDBAPIJson(url);

  // Sometimes there are no release dates for a movie
  if (!responseJson.results) {
    console.error(`No release dates found for movie ${id}`);
    return undefined;
  }

  let rating = undefined;
  let maxDate = undefined;
  responseJson.results.forEach((result) => {
    if (result.iso_3166_1 === "US") {
      result.release_dates.forEach((release) => {
        if (release.certification && (!maxDate || release.release_date > maxDate)) {
          maxDate = release.release_date;
          rating = release.certification;
        }
      });
    }
  });
  return rating;
}

export async function getTVRating(id: string): Promise<CreditRating> {
  // Get the rating for this TV show
  const url = `${BASE_URL}/tv/${id}/content_ratings`;
  const responseJson = await getFromTMDBAPIJson(url);

  // Sometimes there are no ratings for a TV show
  if (!responseJson.results) {
    console.error(`No ratings found for TV show ${id}`);
    return undefined;
  }

  let rating = undefined;
  responseJson.results.forEach((result) => {
    if (result.iso_3166_1 === "US") {
      if (rating && rating != "NR" && result.rating != "NR") {
        console.log(`Multiple ratings found for TV show: ${id}`);
      }

      if (!rating || rating == "NR") {
        rating = result.rating;
      }
    }
  });

  return rating;
}
