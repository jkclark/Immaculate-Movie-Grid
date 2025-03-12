import {
  ActorOrCategoryData,
  Credit,
  CreditData,
  CreditRating,
  MovieGraphEntityType,
} from "src/adapters/graph/movies";
import { LinkData } from "src/ports/graph";
import MovieDataScraper from "./movieDataScraper";

interface Actor extends ActorOrCategoryData {
  credits: Set<Credit>;
}

type TMDBCreditType = "movie" | "tv";
interface TMDBCredit extends Credit {
  type: TMDBCreditType;
}

interface CreditExtraInfo {
  rating: CreditRating;
  last_air_date?: string;
}

export default class TMDBDataScraper extends MovieDataScraper {
  protected readonly BASE_URL = "https://api.themoviedb.org/3";

  /**
   * It turns out that credits can have genres that are not in the TMDB API's list of genres.
   * Thus, we have to iterate over all credits to get all unique genres. Otherwise, there can exist genres
   * on credits that are not in the genres table.
   *
   * In order to fit this issue into the greater structure of the movie-data-scraping algorithm,
   * we have to save all the unique genres when we first get credits. These will just be IDs with "" for their names.
   * Later when we actually fetch the list of genres, we'll update the names of these genres. Any genres that still
   * don't have names will be entered into the database that way.
   */
  protected allGenres: { [key: number]: string } = {};

  async getNewActors(): Promise<{ [key: string]: ActorOrCategoryData }> {
    return await this.getPopularActors();
  }

  async getCreditsForActorsWithLinks(actors: {
    [key: string]: ActorOrCategoryData;
  }): Promise<{ connections: { [key: string]: CreditData }; links: LinkData[] }> {
    // Get all credit info from TMDB API
    const actorsWithCredits = await this.getAllActorInformation(Object.keys(actors).map(Number));

    // Create connections and links
    const connections: { [key: string]: CreditData } = {};
    const links: LinkData[] = [];
    for (const actor of Object.values(actorsWithCredits)) {
      for (const credit of actor.credits) {
        // Save the credit information
        connections[credit.id] = {
          ...credit,
          entityType: MovieGraphEntityType.CREDIT,
        };

        // Add the link between actor and credit
        links.push({
          axisEntityId: actor.id,
          connectionId: credit.id,
        });

        // Add the genre IDs to the list of all genres
        // See note above for more details
        for (const genreId of credit.genre_ids) {
          this.allGenres[genreId] = "";
        }
      }
    }

    return { connections: connections, links: links };
  }

  async getGenres(): Promise<{ [key: number]: string }> {
    return {
      ...this.allGenres,
      ...(await this.getAllGenres()),
    };
  }

  async getPopularActors(): Promise<{ [key: string]: ActorOrCategoryData }> {
    const actorData: { [key: string]: ActorOrCategoryData } = {};
    const MIN_PERSON_POPULARITY = 50;
    const MIN_CREDIT_POPULARITY = 40;
    const VALID_ORIGINAL_LANGUAGE = "en";

    let page = 1;
    while (page <= 500) {
      const url = `${this.BASE_URL}/person/popular?page=${page}`;
      const responseJson = await this.getFromTMDBAPIJson(url);

      for (const responseActor of responseJson.results) {
        if (responseActor.popularity >= MIN_PERSON_POPULARITY) {
          for (const responseCredit of responseActor.known_for) {
            if (
              responseCredit.popularity >= MIN_CREDIT_POPULARITY &&
              responseCredit.original_language === VALID_ORIGINAL_LANGUAGE
            ) {
              const actorDatum: ActorOrCategoryData = {
                id: responseActor.id.toString(),
                entityType: MovieGraphEntityType.ACTOR,
                name: responseActor.name,
              };
              actorData[actorDatum.id] = actorDatum;

              console.log(`Found qualifying actor ${actorDatum.name}`);

              break;
            }
          }
        }

        // Once we've gone below the minimum popularity threshold, we can break out of the loop
        // because the results are sorted by popularity
        else {
          return actorData;
        }
      }

      page++;
    }

    return actorData;
  }

  /**
   * Get actor and credit information for a list of actor IDs.
   *
   * This function is parallelized to get info for multiple actors at once.
   *
   * @param actorIds the list of actor IDs to get information for
   * @returns A promise that resolves to a list of actors with their credits
   */
  async getAllActorInformation(actorIds: number[]): Promise<{ [key: string]: Actor }> {
    const BATCH_SIZE = 10;
    const actorsWithCredits: { [key: string]: Actor } = {};

    for (let i = 0; i < actorIds.length; i += BATCH_SIZE) {
      const batch = actorIds.slice(i, i + BATCH_SIZE);
      const batchPromises = batch.map(async (inputActor) => {
        const outputActor = await this.getActorWithCreditsById(inputActor);
        console.log(`Got actor ${outputActor.name} with ${outputActor.credits.size} credits`);
        return outputActor;
      });

      const batchResults = await Promise.all(batchPromises);
      for (const actor of batchResults) {
        actorsWithCredits[actor.id] = actor;
      }
    }

    console.log(`Got info for ${actorsWithCredits.length} actors`);

    return actorsWithCredits;
  }

  async getActorWithCreditsById(id: number): Promise<Actor> {
    const actor = await this.getActorById(id);
    actor.credits = await this.getActorCredits(actor);
    return actor;
  }

  /**
   * Get an actor object from the TMDB API by ID.
   * @param id the ID of the actor to get
   * @returns an actor object with the given ID
   */
  async getActorById(id: number): Promise<Actor> {
    const url = `${this.BASE_URL}/person/${id}?language=en-US`;
    const responseJson = await this.getFromTMDBAPIJson(url);
    const actor: Actor = {
      id: responseJson.id.toString(),
      name: responseJson.name,
      entityType: MovieGraphEntityType.ACTOR,
      credits: new Set(),
    };
    return actor;
  }

  /**
   * Get a set of movie and TV show credits for an actor.
   *
   * From the first time we see the credit, we set its ID to
   * the "movie-123" or "tv-456" format.
   *
   * @param actor the actor for whom to get credits
   * @returns a set of credits for the actor
   */
  async getActorCredits(actor: Actor): Promise<Set<Credit>> {
    const url = `${this.BASE_URL}/person/${actor.id}/combined_credits?language=en-US`;
    const responseJson = await this.getFromTMDBAPIJson(url);

    const credits: Set<Credit> = new Set();
    if (!responseJson["cast"]) {
      console.error(`No credits found for actor ${actor.id}`);
      return credits;
    }

    for (const responseCredit of responseJson["cast"]) {
      const tmdbCredit: TMDBCredit = {
        type: responseCredit.media_type,
        id: responseCredit.id.toString(),
        name: responseCredit.title || responseCredit.name,
        popularity: responseCredit.popularity || 0,
        release_date: responseCredit.release_date || responseCredit.first_air_date || null,

        // The TMDB API data can return duplicate genre IDs for a credit, so we need to
        // deduplicate them.
        genre_ids: this.deduplicateNumberList(responseCredit.genre_ids || []),
      };

      if (this.isCreditLegit(tmdbCredit)) {
        const { type, ...tmdbCreditWithoutType } = tmdbCredit;
        credits.add({
          ...tmdbCreditWithoutType,
          id: this.getCreditUniqueId(tmdbCredit.type, tmdbCredit.id),
        });
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
  isCreditLegit(credit: TMDBCredit): boolean {
    const isMovieOrTV = credit.type === "movie" || credit.type === "tv";
    const isNotTalkShow = credit.type !== "tv" || !credit.genre_ids.includes(10767);
    const isNotNewsShow = credit.type !== "tv" || !credit.genre_ids.includes(10763);

    const isNotIgnoredTVShow = credit.type !== "tv" || !ignoredTVShowIds.has(parseInt(credit.id));

    return isMovieOrTV && isNotTalkShow && isNotNewsShow && isNotIgnoredTVShow;
  }

  async getAllCreditExtraInfo(credits: {
    [key: string]: CreditExtraInfo;
  }): Promise<{ [key: string]: CreditExtraInfo }> {
    return {};
  }

  async getCreditExtraInfo(credit: Credit): Promise<CreditExtraInfo> {
    return {
      rating: undefined,
    };
  }

  /**
   * Get a list of all genres from the TMDB API.
   *
   * TMDB provides two lists for genres: one for movies and one for TV.
   * As far as I can tell, genres which exist in both lists have the same ID.
   * This function prioritizes the movie list, overwriting any genre with the same ID
   * in the TV list.
   *
   * @returns a dictionary of genre IDs and names
   */
  async getAllGenres(): Promise<{ [key: number]: string }> {
    const genres: { [id: number]: string } = {};

    // TV
    const tvGenresListURL = `${this.BASE_URL}/genre/tv/list`;
    const tvGenresResponseJSON = await this.getFromTMDBAPIJson(tvGenresListURL);

    for (const genre of tvGenresResponseJSON.genres) {
      genres[genre.id] = genre.name;
    }

    // Movies
    const movieGenresListURL = `${this.BASE_URL}/genre/movie/list`;
    const movieGenresResponseJSON = await this.getFromTMDBAPIJson(movieGenresListURL);

    for (const genre of movieGenresResponseJSON.genres) {
      genres[genre.id] = genre.name;
    }

    return genres;
  }

  async getFromTMDBAPIJson(url: string): Promise<any> {
    const response = await this.getFromTMDBAPI(url);
    return await response.json();
  }

  async getFromTMDBAPI(url: string): Promise<any> {
    const options = {
      method: "GET",
      headers: {
        accept: "application/json",
        Authorization: `Bearer ${process.env.TMDB_API_KEY}`,
      },
    };

    return await fetch(url, options);
  }

  deduplicateNumberList(nums: number[]): number[] {
    return Array.from(new Set(nums));
  }

  /**
   * Get a credit's unique ID.
   *
   * This is necessary because a movie and a TV show can have the same ID
   * A movie with ID = 123 will have a unique ID of "movie-123",
   * while a TV show with ID = 123 will have a unique ID of "tv-123".
   *
   * @param credit The credit to get the unique ID for
   * @returns A string that uniquely identifies the credit
   */
  getCreditUniqueId(creditType: string, creditId: string): string {
    return `${creditType}-${creditId}`;
  }
}

// A specific list of TV shows that we don't want to include in our system at all.
const ignoredTVShowIds = new Set([
  27023, // The Oscars
  28464, // The Emmy Awards
]);
