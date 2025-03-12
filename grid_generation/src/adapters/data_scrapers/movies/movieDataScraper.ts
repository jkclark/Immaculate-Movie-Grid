import {
  ActorOrCategoryData,
  CreditData,
  MovieGraphData,
  MovieGraphDataWithGenres,
} from "src/adapters/graph/movies";
import DataScraper from "src/ports/dataScraper";
import { ConnectionData, LinkData } from "src/ports/graph";

export default abstract class MovieDataScraper extends DataScraper {
  /**
   * Scrape actor/credit data from a data source and return the graph data to populate the data store with.
   *
   * We also get genre information, since it's needed to populate the data store.
   *
   * @param existingAxisEntities the actors that already exist in the data store
   * @returns the graph data to populate the data store with
   */
  async scrapeData(existingAxisEntities: {
    [key: string]: ActorOrCategoryData;
  }): Promise<MovieGraphDataWithGenres> {
    const graphData = (await super.scrapeData(existingAxisEntities)) as MovieGraphData;
    const genres = await this.getGenres();

    return {
      ...graphData,
      genres: genres,
    };
  }

  /**
   * Get new actors from the data source.
   *
   * This is an alias for getNewAxisEntities that specifically gets new actors.
   *
   * @returns a promise that resolves to a dictionary of new actors
   */
  abstract getNewActors(): Promise<{ [key: string]: ActorOrCategoryData }>;

  /**
   * Get credit information for a list of actors.
   *
   * This is an alias for getConnectionsForAxisEntitiesWithLinks that
   * specifically gets credit information for actors.
   *
   * @param actors the actors to get credit information for
   * @returns a promise that resolves to a dictionary of connections and a list of links
   */
  abstract getCreditsForActorsWithLinks(actors: { [key: string]: ActorOrCategoryData }): Promise<{
    connections: { [key: string]: CreditData };
    links: LinkData[];
  }>;

  /**
   * Get genre information from the data source.
   *
   * @returns a promise that resolves to a dictionary of genre IDs and names
   */
  abstract getGenres(): Promise<{ [key: number]: string }>;

  async getNewAxisEntities(): Promise<{ [key: string]: ActorOrCategoryData }> {
    return await this.getNewActors();
  }

  async getConnectionsForAxisEntitiesWithLinks(axisEntities: {
    [key: string]: ActorOrCategoryData;
  }): Promise<{
    connections: { [key: string]: ConnectionData };
    links: LinkData[];
  }> {
    return await this.getCreditsForActorsWithLinks(axisEntities);
  }
}
