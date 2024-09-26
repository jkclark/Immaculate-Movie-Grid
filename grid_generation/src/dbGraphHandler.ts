import { AppDataSource, initializeDataSource } from "common/src/db/connect";
import { ActorOrCategory } from "common/src/db/models/ActorOrCategory";
import { ActorOrCategoryCreditJoin } from "common/src/db/models/ActorsCategoriesCreditsJoin";
import { Credit } from "common/src/db/models/Credit";
import { CreditGenreJoin } from "common/src/db/models/CreditsGenresJoin";
import { Genre } from "common/src/db/models/Genre";
import { getAllCreditExtraInfo } from "./creditExtraInfo";
import GraphHandler from "./graphHandler";
import { ActorCreditGraph } from "./interfaces";
import { getAllActorInformation, getAllGenres } from "./tmdbAPI";

export default class DBGraphHandler extends GraphHandler {
  private WRITE_BATCH_SIZE = 500;

  async init(): Promise<void> {
    await initializeDataSource();
  }

  /**
   * Fetch all data from TMDB and save it to the database.
   */
  async fetchAndSaveData(): Promise<void> {
    // Get all data from TMDB in graph form
    const graph = await this.fetchData();

    // Save data to DB
    await this.saveData(graph);
  }

  async loadGraph(): Promise<ActorCreditGraph> {
    return new Promise((resolve, reject) => {});
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
    const graph = super.generateActorCreditGraph(actorsWithCredits);

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

    // Get genres and write them to the database
    await this.fetchAndWriteGenresToDB();

    // Write actor-credit relationships to the database
    await this.writeActorCreditRelationshipsToDB(graph);

    // Write credit-genre relationships to the database
    await this.writeCreditGenreRelationshipsToDB(graph);
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

  async fetchAndWriteGenresToDB(): Promise<void> {
    // We could iterate over the graph to get all of the genres in the graph,
    // but there are so few of them that it's easier to just fetch all of them
    // from the TMDB API directly.
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
      for (const genreId of credit.genre_ids) {
        const creditGenreRelationship: Partial<CreditGenreJoin> = {
          credit_id: parseInt(credit.id),
          genre_id: genreId,
        };

        creditGenreRelationships.push(creditGenreRelationship);
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
}

if (require.main === module) {
  const dbGraphHandler = new DBGraphHandler();
  dbGraphHandler.init();
  dbGraphHandler.fetchAndSaveData();
}
