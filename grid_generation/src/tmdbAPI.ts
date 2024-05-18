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
        if (!isCreditValid(credit)) {
            continue;
        }

        // Movies have a "title", TV shows have a "name"
        credits.add({ type: credit.media_type, id: credit.id, name: credit.title || credit.name });
    }

    return credits;
}

/**
 * Determine if a credit is "valid". A credit is valid if it is:
 * - Not a TV show in an "invalid" genre
 * - Not an "invalid" TV show
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
        3739, // E! True Hollywood Story
        27023, // The Oscars
        30048, // Tony Awards
        1111889, // Carol Burnett: 90 Years of Laughter + Love
    ]
    const isInvalidShow: boolean = credit.media_type === "tv" && INVALID_TV_SHOW_IDS.includes(credit.id);
    return !isInvalidGenre && !isInvalidShow;
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
    const path = `${BASE_URL}${basePath}/${id}/images`;
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
