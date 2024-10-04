import { AppDataSource, initializeDataSource } from "common/src/db/connect";
import { ActorOrCategory } from "common/src/db/models/ActorOrCategory";
import { ActorOrCategoryCreditJoin } from "common/src/db/models/ActorsCategoriesCreditsJoin";
import { Credit } from "common/src/db/models/Credit";
import { CreditGenreJoin } from "common/src/db/models/CreditsGenresJoin";
import { Genre } from "common/src/db/models/Genre";
import { getAllCreditExtraInfo } from "../creditExtraInfo";
import { ActorCreditGraph, getCreditUniqueString } from "../interfaces";
import { getAllActorInformation, getAllGenres } from "../tmdbAPI";
import GraphHandler, { RepeatError } from "./graphHandler";

interface AllDBEntities {
  actors: ActorOrCategory[];
  credits: Credit[];
  genres: Genre[];
  actorCreditRelationships: ActorOrCategoryCreditJoin[];
  creditGenreRelationships: CreditGenreJoin[];
}

export default class DBGraphHandler extends GraphHandler {
  private WRITE_BATCH_SIZE = 500;
  private READ_BATCH_SIZE = 500;

  async init(): Promise<void> {
    await initializeDataSource();
  }

  /**
   * Fetch all data from TMDB and save it to the database.
   */
  async populateDataStore(): Promise<void> {
    // Get all data from TMDB in graph form
    const graph = await this.fetchData();

    // Save data to DB
    await this.saveData(graph);
  }

  async loadGraph(): Promise<ActorCreditGraph> {
    // Get all entities from the DB
    const allDBEntities = await this.getAllDBEntities();

    // Build the graph
    return this.buildGraphFromDBEntities(allDBEntities);
  }

  /**
   * Get all the data from TMDB, generate a graph, and return it.
   *
   * @returns a graph containing all actors and credits, including extra info
   */
  async fetchData(): Promise<ActorCreditGraph> {
    // Fetch all actors and credits from TMDB
    const actorsWithCredits = await getAllActorInformation();

    // Generate a graph object from the actors and credits
    const graph = super.generateActorCreditGraphFromTMDBData(actorsWithCredits);

    // Fetch all extra information about credits from TMDB
    const allCreditExtraInfo = await getAllCreditExtraInfo(graph.credits);

    // Merge the extra information into the graph
    super.mergeGraphAndExtraInfo(graph, allCreditExtraInfo);

    return graph;
  }

  async saveData(graph: ActorCreditGraph): Promise<void> {
    // Write actors to the database
    await this.writeActorsToDB(graph);

    // Write credits to the database
    await this.writeCreditsToDB(graph);

    // Write genres to the database
    // NOTE: It turns out that credits can have genres that are not in the TMDB API's list of genres.
    // Thus, we have to iterate over all credits to get all unique genres. Otherwise, there can exist genres
    // on credits that are not in the genres table.
    await this.writeGenresToDB(graph);

    // Get genres from TMDBI API and write them to the database
    await this.fetchAndWriteGenresToDB();

    // Write actor-credit relationships to the database
    await this.writeActorCreditRelationshipsToDB(graph);

    // Write credit-genre relationships to the database
    await this.writeCreditGenreRelationshipsToDB(graph);
  }

  async getAllDBEntities(): Promise<AllDBEntities> {
    return {
      actors: await this.getAllActors(),
      credits: await this.getAllCredits(),
      genres: await this.getAllGenres(),
      actorCreditRelationships: await this.getAllActorCreditRelationships(),
      creditGenreRelationships: await this.getAllCreditGenreRelationships(),
    };
  }

  buildGraphFromDBEntities(allDBEntities): ActorCreditGraph {
    // Create a graph object
    const graph: ActorCreditGraph = { actors: {}, credits: {} };

    // Add all actors to graph
    for (const actor of allDBEntities.actors) {
      super.addActorToGraph(graph, actor.id.toString(), actor.name);
    }

    // Add all credits to graph
    for (const credit of allDBEntities.credits) {
      // Add empty genres list to credit
      credit.genre_ids = [];
      try {
        super.addCreditToGraph(credit, graph);
      } catch (e) {
        if (!(e instanceof RepeatError)) {
          throw e;
        }
      }
    }

    // Add all actor-credit relationships to graph
    for (const actorCreditRelationship of allDBEntities.actorCreditRelationships) {
      const actorId = actorCreditRelationship.actor_category_id.toString();
      // const creditId = actorCreditRelationship.credit_id.toString();
      const credit = actorCreditRelationship.credit;
      super.addLinkToGraph(graph, actorId, credit);
    }

    // Add genres to credits
    for (const creditGenreRelationship of allDBEntities.creditGenreRelationships) {
      // Find the credit
      const credit = graph.credits[getCreditUniqueString(creditGenreRelationship.credit)];

      // Add the genre to the credit
      credit.genre_ids.push(creditGenreRelationship.genre_id);
    }

    return graph;
  }

  async writeActorsToDB(graph: ActorCreditGraph): Promise<void> {
    const actorsNoCredits = Object.values(graph.actors).map((actor) => {
      return {
        id: parseInt(actor.id),
        name: actor.name,
      };
    });

    await this.batchWriteToDB(
      actorsNoCredits,
      AppDataSource.getRepository(ActorOrCategory),
      this.WRITE_BATCH_SIZE
    );
  }

  async writeCreditsToDB(graph: ActorCreditGraph): Promise<void> {
    const creditsNoActorsNoGenres = Object.values(graph.credits).map((credit) => {
      const { genre_ids, connections, ...rest } = credit;
      return {
        id: parseInt(credit.id),
        ...rest,
      };
    });

    await this.batchWriteToDB(
      creditsNoActorsNoGenres,
      AppDataSource.getRepository(Credit),
      this.WRITE_BATCH_SIZE
    );
  }

  /**
   * Iterate over all credits, writing all unique genres to the database.
   *
   * @param graph the graph containing all actors and credits
   */
  async writeGenresToDB(graph: ActorCreditGraph): Promise<void> {
    // Iterate over all credits, keeping track of all unique genre IDs
    const genreIds = new Set<number>();
    for (const credit of Object.values(graph.credits)) {
      for (const genreId of credit.genre_ids) {
        genreIds.add(genreId);
      }
    }

    const genres = Array.from(genreIds).map((id) => {
      return {
        id,
      };
    });

    await this.batchWriteToDB(genres, AppDataSource.getRepository(Genre), this.WRITE_BATCH_SIZE);
  }

  /**
   * Hit the TMDB API to get all genres and write them to the database.
   */
  async fetchAndWriteGenresToDB(): Promise<void> {
    const genres: { [id: number]: string } = await getAllGenres();

    const genresList = Object.entries(genres).map(([id, name]) => {
      return {
        id: parseInt(id),
        name,
      };
    });

    await this.batchWriteToDB(genresList, AppDataSource.getRepository(Genre), this.WRITE_BATCH_SIZE);
  }

  async writeActorCreditRelationshipsToDB(graph: ActorCreditGraph): Promise<void> {
    const actorCreditJoinRepo = AppDataSource.getRepository(ActorOrCategoryCreditJoin);
    for (const actor of Object.values(graph.actors)) {
      // For each actor, create all of the actor-credit relationships
      // and save them to the database
      // NOTE: Normally, we'd also have to pass the actual entities associated with the
      // many-to-many relationships, but since we're only inserting the data and not doing
      // anything else with it, we can just pass the IDs.
      const actorCreditRelationships: Partial<ActorOrCategoryCreditJoin>[] = [];
      for (const credit of Object.values(actor.connections)) {
        const actorCreditRelationship: Partial<ActorOrCategoryCreditJoin> = {
          actor_category_id: parseInt(actor.id),
          credit_id: parseInt(credit.id),
          credit_type: credit.type,
        };

        actorCreditRelationships.push(actorCreditRelationship);
      }

      await this.batchWriteToDB(actorCreditRelationships, actorCreditJoinRepo, this.WRITE_BATCH_SIZE);
    }
  }

  async writeCreditGenreRelationshipsToDB(graph: ActorCreditGraph): Promise<void> {
    const creditGenreJoinRepo = AppDataSource.getRepository("CreditGenreJoin");
    for (const credit of Object.values(graph.credits)) {
      // For each credit, create all of the credit-genre relationships
      // and save them to the database
      // NOTE: Normally, we'd also have to pass the actual entities associated with the
      // many-to-many relationships, but since we're only inserting the data and not doing
      // anything else with it, we can just pass the IDs.
      const creditGenreRelationships: Partial<CreditGenreJoin>[] = [];

      // The TMDB API data can return duplicate genre IDs for a credit, so we need to
      // deduplicate them before saving them to the database.
      const addedGenres = new Set<number>();
      for (const genreId of credit.genre_ids) {
        //
        if (addedGenres.has(genreId)) {
          console.log(`Credit ${credit.id} has duplicate genre ${genreId}`);
          continue;
        }

        const creditGenreRelationship: Partial<CreditGenreJoin> = {
          credit_id: parseInt(credit.id),
          credit_type: credit.type,
          genre_id: genreId,
        };

        creditGenreRelationships.push(creditGenreRelationship);
        addedGenres.add(genreId);
      }

      await this.batchWriteToDB(creditGenreRelationships, creditGenreJoinRepo, this.WRITE_BATCH_SIZE);
    }
  }

  async batchWriteToDB<T>(items: T[], repository: any, batchSize: number): Promise<void> {
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      await repository.save(batch);
    }
  }

  async getAllActors(): Promise<ActorOrCategory[]> {
    return await this.batchLoadFromDB(
      AppDataSource.getRepository(ActorOrCategory),
      this.READ_BATCH_SIZE,
      ["id"],
      []
    );
  }

  async getAllCredits(): Promise<Credit[]> {
    return await this.batchLoadFromDB(
      AppDataSource.getRepository(Credit),
      this.READ_BATCH_SIZE,
      ["id", "type"],
      []
    );
  }

  async getAllGenres(): Promise<Genre[]> {
    return await this.batchLoadFromDB(AppDataSource.getRepository(Genre), this.READ_BATCH_SIZE, ["id"], []);
  }

  async getAllActorCreditRelationships(): Promise<ActorOrCategoryCreditJoin[]> {
    return await this.batchLoadFromDB(
      AppDataSource.getRepository(ActorOrCategoryCreditJoin),
      this.READ_BATCH_SIZE,
      ["actor_category_id", "credit_id"],
      ["actorOrCategory", "credit"]
    );
  }

  async getAllCreditGenreRelationships(): Promise<CreditGenreJoin[]> {
    return await this.batchLoadFromDB(
      AppDataSource.getRepository(CreditGenreJoin),
      this.READ_BATCH_SIZE,
      ["credit_id", "credit_type", "genre_id"],
      ["credit", "genre"]
    );
  }

  async batchLoadFromDB<T>(
    repository: any,
    batchSize: number,
    orderingFields: string[],
    relations: string[]
  ): Promise<T[]> {
    const items: T[] = [];
    const totalCount = await repository.count();
    let skip = 0;

    do {
      const result = await repository.find({
        skip,
        take: batchSize,
        relations,
        order: orderingFields.reduce((acc, field) => {
          acc[field] = "ASC";
          return acc;
        }, {}),
      });

      items.push(...result);
      skip += result.length;
    } while (items.length < totalCount);

    console.log(`total fetched items: ${items.length}`);

    return items;
  }
}

if (require.main === module) {
  const dbGraphHandler = new DBGraphHandler();
  dbGraphHandler.init();
  dbGraphHandler.populateDataStore();
}
