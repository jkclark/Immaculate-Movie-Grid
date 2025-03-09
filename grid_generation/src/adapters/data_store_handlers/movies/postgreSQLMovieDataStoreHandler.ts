import { initializeDataSource } from "common/src/db/connect";
import { batchReadFromDB } from "common/src/db/crud";
import { ActorOrCategory } from "common/src/db/models/ActorOrCategory";
import { ActorOrCategoryCreditJoin } from "common/src/db/models/ActorsCategoriesCreditsJoin";
import { Credit } from "common/src/db/models/Credit";
import { CreditGenreJoin } from "common/src/db/models/CreditsGenresJoin";
import { Genre } from "common/src/db/models/Genre";
import { ActorOrCategoryGraphEntityData, CreditGraphEntityData } from "src/adapters/interfaces/movies/graph";
import { AxisEntityData, GraphData, LinkData } from "src/ports/interfaces/graph";
import { DataSource } from "typeorm";

interface AllDBEntities {
  actorsAndCategories: ActorOrCategory[];
  credits: Credit[];
  genres: Genre[];
  actorCreditRelationships: ActorOrCategoryCreditJoin[];
  creditGenreRelationships: CreditGenreJoin[];
}

export default class PostgreSQLMovieDataStoreHandler {
  private READ_BATCH_SIZE = 500;
  private dataSource: DataSource;

  async init() {
    this.dataSource = await initializeDataSource();
  }

  /**
   * Convert the data from the database into a format that can be used to generate a movie grid.
   *
   * @returns The data for for the graph for movie-grid generation.
   */
  async getGraphData(): Promise<GraphData> {
    const allDBEntities = await this.getAllDBEntities();

    // Create actor/category axis entity data
    const axisEntities: { [key: string]: ActorOrCategoryGraphEntityData } = {};
    for (const actorOrCategory of allDBEntities.actorsAndCategories) {
      const actorOrCategoryAxisEntityDatum: AxisEntityData = {
        id: actorOrCategory.id.toString(),
        name: actorOrCategory.name,
        entityType: actorOrCategory.id < 0 ? "category" : "actor",
      };

      axisEntities[actorOrCategoryAxisEntityDatum.id] = actorOrCategoryAxisEntityDatum;
    }

    // Create credit connection data
    const connections: { [key: string]: CreditGraphEntityData } = {};
    for (const credit of allDBEntities.credits) {
      const creditConnectionDatum: CreditGraphEntityData = {
        ...credit,
        id: credit.id.toString(),
        name: credit.name,
        entityType: "credit",
        genre_ids: [], // To be populated later
      };

      connections[creditConnectionDatum.id] = creditConnectionDatum;
    }

    // Add (actor/category)-credit links
    const links: LinkData[] = [];
    for (const actorCreditRelationship of allDBEntities.actorCreditRelationships) {
      const actorOrCategoryId = actorCreditRelationship.actorOrCategory.id.toString();
      const creditId = actorCreditRelationship.credit.id.toString();
      links.push({ axisEntityId: actorOrCategoryId, connectionId: creditId });
    }

    // Add genres to credits
    for (const creditGenreRelationship of allDBEntities.creditGenreRelationships) {
      const creditId = creditGenreRelationship.credit.id.toString();
      const genreId = creditGenreRelationship.genre.id;
      connections[creditId].genre_ids.push(genreId);
    }

    return {
      axisEntities: axisEntities,
      connections: connections,
      links: links,
    };
  }

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
    return await batchReadFromDB(
      this.dataSource.getRepository(ActorOrCategory),
      this.READ_BATCH_SIZE,
      { id: "ASC" },
      [],
      {}
    );
  }

  async getAllCredits(): Promise<Credit[]> {
    return await batchReadFromDB(
      this.dataSource.getRepository(Credit),
      this.READ_BATCH_SIZE,
      { id: "ASC", type: "ASC" },
      [],
      {}
    );
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
}
