import { Actor, Credit } from "./interfaces";

/**
 * Get an actor object from the TMDB API by ID.
 * @param id the ID of the actor to get
 * @returns an actor object with the given ID
 */
export async function getActorById(id: number): Promise<Actor> {
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
export async function getRandomActors(numActors: number): Promise<Actor[]> {
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
export async function getActorCredits(actor: Actor): Promise<Set<Credit>> {
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
