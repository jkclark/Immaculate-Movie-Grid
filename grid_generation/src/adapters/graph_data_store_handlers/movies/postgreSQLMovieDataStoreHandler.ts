import { ensureInitialized, initializeDataSource } from "common/src/db/connect";
import { batchReadFromDB, batchWriteToDB } from "common/src/db/crud";
import { ActorOrCategory } from "common/src/db/models/ActorOrCategory";
import { ActorOrCategoryCreditJoin } from "common/src/db/models/ActorsCategoriesCreditsJoin";
import { Credit } from "common/src/db/models/Credit";
import { CreditGenreJoin } from "common/src/db/models/CreditsGenresJoin";
import { Genre } from "common/src/db/models/Genre";
import {
  ActorOrCategoryData,
  CreditData,
  CreditRating,
  getTypeAndIdFromCreditUniqueId,
  isCreditRating,
  MovieGraphData,
  MovieGraphDataWithGenres,
} from "src/adapters/graph/movies";
import { CreditType } from "src/interfaces";
import { EntityType, LinkData } from "src/ports/graph";
import GraphDataStoreHandler from "src/ports/graphDataStoreHandler";
import { DataSource, LessThan, MoreThanOrEqual } from "typeorm";

interface AllDBEntities {
  actorsAndCategories: ActorOrCategory[];
  credits: Credit[];
  genres: Genre[];
  actorCreditRelationships: ActorOrCategoryCreditJoin[];
  creditGenreRelationships: CreditGenreJoin[];
}

export default class PostgreSQLMovieDataStoreHandler implements GraphDataStoreHandler {
  private WRITE_BATCH_SIZE = 500;
  private READ_BATCH_SIZE = 500;

  // Needs to be public for @ensureInitialized to work
  public dataSource: DataSource;

  // Can't put this in the constructor because constructors can't be async
  async init() {
    this.dataSource = await initializeDataSource();
  }

  @ensureInitialized
  async getExistingNonCategoryAxisEntities(): Promise<{ [key: string]: ActorOrCategoryData }> {
    const existingActors: { [key: string]: ActorOrCategoryData } = {};
    for (const actor of await this.getAllActors()) {
      existingActors[actor.id.toString()] = {
        id: actor.id.toString(),
        name: actor.name,
        entityType: EntityType.NON_CATEGORY,
      };
    }

    return existingActors;
  }

  /**
   * Convert the data from the database into a format that can be used to generate a movie grid.
   *
   * @returns The data for for the graph for movie-grid generation.
   */
  @ensureInitialized
  async getGraphData(): Promise<MovieGraphData> {
    const allDBEntities = await this.getAllDBEntities();

    // Create actor/category axis entity data
    const axisEntities: { [key: string]: ActorOrCategoryData } = {};
    for (const actorOrCategory of allDBEntities.actorsAndCategories) {
      const actorOrCategoryAxisEntityDatum: ActorOrCategoryData = {
        id: actorOrCategory.id.toString(),
        name: actorOrCategory.name,
        entityType: actorOrCategory.id < 0 ? EntityType.CATEGORY : EntityType.NON_CATEGORY,
      };

      axisEntities[actorOrCategoryAxisEntityDatum.id] = actorOrCategoryAxisEntityDatum;
    }

    // Create credit connection data
    const connections: { [key: string]: CreditData } = {};
    for (const credit of allDBEntities.credits) {
      if (credit.rating && !isCreditRating(credit.rating)) {
        throw new Error(`Invalid credit rating: ${credit.rating}`);
      }

      // Outgoing credits only have an ID field, so we have to merge them into one.
      const { type, ...creditWithoutType } = credit;
      const creditConnectionDatum: CreditData = {
        ...creditWithoutType,
        id: this.getCreditUniqueId(credit.type, credit.id.toString()),
        name: credit.name,
        entityType: EntityType.CONNECTION,
        genre_ids: [], // To be populated later in this method

        // Because release_date and last_air_date are dates in the database
        release_date: credit.release_date?.toISOString().split("T")[0],
        last_air_date: credit.last_air_date?.toISOString().split("T")[0],

        // Because rating is a string (not explicitly "G", "PG", etc.) in the database
        rating: (credit.rating as CreditRating) || null,
      };

      connections[creditConnectionDatum.id] = creditConnectionDatum;
    }

    // Add (actor/category)-credit links
    const links: LinkData[] = [];
    for (const actorCreditRelationship of allDBEntities.actorCreditRelationships) {
      const actorOrCategoryId = actorCreditRelationship.actorOrCategory.id.toString();
      // Remember to use the unique ID
      const creditId = this.getCreditUniqueId(
        actorCreditRelationship.credit_type,
        actorCreditRelationship.credit.id.toString()
      );
      links.push({ axisEntityId: actorOrCategoryId, connectionId: creditId });
    }

    // Add genres to credits
    for (const creditGenreRelationship of allDBEntities.creditGenreRelationships) {
      // Outgoing credits only have an ID field, so we have to merge them into one.
      const creditId = this.getCreditUniqueId(
        creditGenreRelationship.credit_type,
        creditGenreRelationship.credit.id.toString()
      );
      const genreId = creditGenreRelationship.genre.id;
      connections[creditId].genre_ids.push(genreId);
    }

    return {
      axisEntities: axisEntities,
      connections: connections,
      links: links,
    };
  }

  /**
   * Store the graph data in the database.
   *
   * @param graphData The data for the graph for movie-grid generation.
   */
  @ensureInitialized
  async storeGraphData(graphData: MovieGraphDataWithGenres): Promise<void> {
    // Write actors and categories to the database
    await this.writeActorsAndCategoriesToDB(Object.values(graphData.axisEntities));

    // Write credits to the database
    await this.writeCreditsToDB(Object.values(graphData.connections));

    // Write genres to the database
    await this.writeGenresToDB(graphData.genres);

    // Write (actor/category)-credit relationship to the database
    await this.writeActorCreditRelationshipsToDB(graphData.links);

    // Write credit-genre relationships to the database
    await this.writeCreditGenreRelationshipsToDB(graphData.connections);
  }

  /********** For reading from the database **********/
  async getAllDBEntities(): Promise<AllDBEntities> {
    return {
      actorsAndCategories: await this.getAllActorsAndCategories(),
      credits: await this.getAllCredits(),
      genres: await this.getAllGenres(),
      actorCreditRelationships: await this.getAllActorCreditRelationships(),
      creditGenreRelationships: await this.getAllCreditGenreRelationships(),
    };
  }

  async getAllActorsAndCategories(): Promise<ActorOrCategory[]> {
    return [...(await this.getAllActors()), ...(await this.getAllCategories())];
  }

  async getAllActors(): Promise<ActorOrCategory[]> {
    return await batchReadFromDB(
      this.dataSource.getRepository(ActorOrCategory),
      this.READ_BATCH_SIZE,
      { id: "ASC" },
      [],
      { id: MoreThanOrEqual(0) }
    );
  }

  async getAllCategories(): Promise<ActorOrCategory[]> {
    return await batchReadFromDB(
      this.dataSource.getRepository(ActorOrCategory),
      this.READ_BATCH_SIZE,
      { id: "ASC" },
      [],
      { id: LessThan(0) }
    );
  }

  async getAllCredits(): Promise<Credit[]> {
    const credits = await batchReadFromDB(
      this.dataSource.getRepository(Credit),
      this.READ_BATCH_SIZE,
      { id: "ASC", type: "ASC" },
      [],
      {}
    );

    // For whatever reason, the credits fetched here have their
    // date fields as strings instead of Date objects. Here we convert
    // them back to Date objects.
    return credits.map((credit) => ({
      ...credit,
      release_date: credit.release_date ? new Date(credit.release_date) : null,
      last_air_date: credit.last_air_date ? new Date(credit.last_air_date) : null,
    }));
  }

  async getAllGenres(): Promise<Genre[]> {
    return await batchReadFromDB(
      this.dataSource.getRepository(Genre),
      this.READ_BATCH_SIZE,
      { id: "ASC" },
      [],
      {}
    );
  }

  async getAllActorCreditRelationships(): Promise<ActorOrCategoryCreditJoin[]> {
    return await batchReadFromDB(
      this.dataSource.getRepository(ActorOrCategoryCreditJoin),
      this.READ_BATCH_SIZE,
      { actor_category_id: "ASC", credit_id: "ASC" },
      ["actorOrCategory", "credit"],
      {}
    );
  }

  async getAllCreditGenreRelationships(): Promise<CreditGenreJoin[]> {
    return await batchReadFromDB(
      this.dataSource.getRepository(CreditGenreJoin),
      this.READ_BATCH_SIZE,
      { credit_id: "ASC", credit_type: "ASC", genre_id: "ASC" },
      ["credit", "genre"],
      {}
    );
  }

  // TODO: Remove this function when removing 'type' from 'credit' in the database
  getCreditUniqueId(creditType: string, creditId: string): string {
    return `${creditType}-${creditId}`;
  }
  /***************************************************/

  /********** For writing to the database **********/
  async writeActorsAndCategoriesToDB(actorsAndCategories: ActorOrCategoryData[]) {
    await batchWriteToDB(
      actorsAndCategories,
      this.dataSource.getRepository(ActorOrCategory),
      this.WRITE_BATCH_SIZE,
      ["id"]
    );
  }

  async writeCreditsToDB(credits: CreditData[]) {
    // Credits in the database have separate ID and type fields,
    // so we have to split the ID field into id and type.
    const creditsWithSplitIds = credits.map((credit) => {
      const { type, id } = getTypeAndIdFromCreditUniqueId(credit.id);
      return {
        ...credit,
        id: parseInt(id),
        type: type as CreditType,
      };
    });

    await batchWriteToDB(creditsWithSplitIds, this.dataSource.getRepository(Credit), this.WRITE_BATCH_SIZE, [
      "id",
      "type",
    ]);
  }

  async writeGenresToDB(genres: { [key: number]: string }) {
    const genresList: Genre[] = [];
    for (const genreId in genres) {
      genresList.push({ id: parseInt(genreId), name: genres[parseInt(genreId)] });
    }

    await batchWriteToDB(genresList, this.dataSource.getRepository(Genre), this.WRITE_BATCH_SIZE, ["id"]);
  }

  // NOTE: This also includes category-credit relationships
  async writeActorCreditRelationshipsToDB(links: LinkData[]) {
    // NOTE: Normally, we'd also have to pass the actual entities associated with the
    // many-to-many relationships, but since we're only inserting the data and not doing
    // anything else with it, we can just pass the IDs. That's why we're using Partial.
    const actorCreditRelationships: Partial<ActorOrCategoryCreditJoin>[] = [];
    for (const link of links) {
      // Credits in the database have separate ID and type fields,
      // so we have to split the ID field into id and type.
      const { type, id } = getTypeAndIdFromCreditUniqueId(link.connectionId);

      actorCreditRelationships.push({
        actor_category_id: parseInt(link.axisEntityId),
        credit_id: parseInt(id),
        credit_type: type,
      });
    }

    await batchWriteToDB(
      actorCreditRelationships,
      this.dataSource.getRepository(ActorOrCategoryCreditJoin),
      this.WRITE_BATCH_SIZE,
      ["actor_category_id", "credit_id", "credit_type"]
    );
  }

  // NOTE: Unlike when we write the actor-credit relationships (which uses links),
  // here we directly use the genre_ids from the connections. This is a departure from the
  // pattern, but I think it's okay for now.
  async writeCreditGenreRelationshipsToDB(connections: { [key: string]: CreditData }) {
    // NOTE: Normally, we'd also have to pass the actual entities associated with the
    // many-to-many relationships, but since we're only inserting the data and not doing
    // anything else with it, we can just pass the IDs. That's why we're using Partial.
    const creditGenreRelationships: Partial<CreditGenreJoin>[] = [];
    for (const creditId in connections) {
      const { type, id } = getTypeAndIdFromCreditUniqueId(creditId);
      for (const genreId of connections[creditId].genre_ids) {
        creditGenreRelationships.push({
          credit_id: parseInt(id),
          credit_type: type,
          genre_id: genreId,
        });
      }
    }

    await batchWriteToDB(
      creditGenreRelationships,
      this.dataSource.getRepository(CreditGenreJoin),
      this.WRITE_BATCH_SIZE,
      ["credit_id", "credit_type", "genre_id"]
    );
  }
  /*************************************************/
}
