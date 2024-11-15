import { getFromTMDBAPI, getFromTMDBAPIJson } from "common/src/api";
import { Readable } from "node:stream";
import { ignoredTVShowIds } from "./ignoredTVShows";
import { Actor, Credit, CreditRating } from "./interfaces";

const BASE_URL = "https://api.themoviedb.org/3";
const TMDB_404_STATUS_CODE = 34;

export async function getPopularActors(): Promise<Actor[]> {
  const actors: Actor[] = [];
  const MIN_PERSON_POPULARITY = 50;
  const MIN_CREDIT_POPULARITY = 40;
  const VALID_ORIGINAL_LANGUAGE = "en";

  let page = 1;
  while (page <= 500) {
    const url = `${BASE_URL}/person/popular?page=${page}`;
    const responseJson = await getFromTMDBAPIJson(url);

    for (const responseActor of responseJson.results) {
      if (responseActor.popularity >= MIN_PERSON_POPULARITY) {
        for (const responseCredit of responseActor.known_for) {
          if (
            responseCredit.popularity >= MIN_CREDIT_POPULARITY &&
            responseCredit.original_language === VALID_ORIGINAL_LANGUAGE
          ) {
            const actor: Actor = {
              id: responseActor.id.toString(),
              name: responseActor.name,
              credits: new Set(),
            };
            actors.push(actor);

            console.log(`Found qualifying actor ${actor.name}`);

            break;
          }
        }
      }

      // Once we've gone below the minimum popularity threshold, we can break out of the loop
      // because the results are sorted by popularity
      else {
        return actors;
      }
    }

    page++;
  }

  return actors;
}

/**
 * Get actor and credit information for a list of actor IDs.
 *
 * This function is parallelized to get info for multiple actors at once.
 *
 * @param actorIds the list of actor IDs to get information for
 * @returns A promise that resolves to a list of actors with their credits
 */
export async function getAllActorInformation(actorIds: number[]): Promise<Actor[]> {
  const BATCH_SIZE = 10;
  const actorsWithCredits: Actor[] = [];

  for (let i = 0; i < actorIds.length; i += BATCH_SIZE) {
    const batch = actorIds.slice(i, i + BATCH_SIZE);
    const batchPromises = batch.map(async (inputActor) => {
      const outputActor = await getActorWithCreditsById(inputActor);
      console.log(`Got actor ${outputActor.name} with ${outputActor.credits.size} credits`);
      return outputActor;
    });

    const batchResults = await Promise.all(batchPromises);
    actorsWithCredits.push(...batchResults);
  }

  console.log(`Got info for ${actorsWithCredits.length} actors`);

  return actorsWithCredits;
}

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

  for (const responseCredit of responseJson["cast"]) {
    const credit: Credit = {
      type: responseCredit.media_type,
      id: responseCredit.id.toString(),
      name: responseCredit.title || responseCredit.name,
      genre_ids: responseCredit.genre_ids || [],
      popularity: responseCredit.popularity || 0,
      release_date: responseCredit.release_date || responseCredit.first_air_date || null,
    };

    if (isCreditLegit(credit)) {
      credits.add(credit);
    }
  }

  return credits;
}

/**
 * Determine if a credit is worth including in our system.
 *
 * The idea is that some credits, like talk shows, aren't worth anything in our system,
 * both in grid generation but also as answers in the actual game. Since they have no value
 * to us, we shouldn't even store their information in the first place.
 *
 * @param credit The credit to check
 * @returns true if the credit passes all checks, false otherwise
 */
function isCreditLegit(credit: Credit): boolean {
  const isMovieOrTV = credit.type === "movie" || credit.type === "tv";
  const isNotTalkShow = credit.type !== "tv" || !credit.genre_ids.includes(10767);
  const isNotNewsShow = credit.type !== "tv" || !credit.genre_ids.includes(10763);

  const isNotIgnoredTVShow = credit.type !== "tv" || !ignoredTVShowIds.has(parseInt(credit.id));

  return isMovieOrTV && isNotTalkShow && isNotNewsShow && isNotIgnoredTVShow;
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

interface TVDetails {
  last_air_date: string;
}

export async function getTVDetails(id: string): Promise<TVDetails> {
  const url = `${BASE_URL}/tv/${id}`;
  const responseJson = await getFromTMDBAPIJson(url);
  return { last_air_date: responseJson.last_air_date || "" };
}

/**
 * Get a list of all genres from the TMDB API.
 *
 * TMDB provides two lists for genres: one for movies and one for TV.
 * As far as I can tell, genres which exist in both lists have the same ID.
 * This function prioritizes the movie list, overwriting any genre with the same ID
 * in the TV list.
 *
 * @returns a map of genre IDs to genre names
 */
export async function getAllGenres(): Promise<{ [key: number]: string }> {
  const genres: { [id: number]: string } = {};

  // TV
  const tvGenresListURL = `${BASE_URL}/genre/tv/list`;
  const tvGenresResponseJSON = await getFromTMDBAPIJson(tvGenresListURL);

  for (const genre of tvGenresResponseJSON.genres) {
    genres[genre.id] = genre.name;
  }

  // Movies
  const movieGenresListURL = `${BASE_URL}/genre/movie/list`;
  const movieGenresResponseJSON = await getFromTMDBAPIJson(movieGenresListURL);

  for (const genre of movieGenresResponseJSON.genres) {
    genres[genre.id] = genre.name;
  }

  return genres;
}
