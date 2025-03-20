import { AxisEntityData, ConnectionData, GraphData, LinkData } from "./graph";

export default abstract class GraphDataScraper {
  /**
   * Scrape data from a data source and return the graph data to populate the data store with.
   *
   * We pass in a dictionary of existing axis entities so that their connections are updated along
   * with any new axis entities' connections.
   *
   * @param existingAxisEntities the axis entities that already exist in the data store
   * @returns the graph data to populate the data store with
   */
  async scrapeData(existingAxisEntities: { [key: string]: AxisEntityData }): Promise<GraphData> {
    /* 1. Get all axis entities */
    //  a. Get new axis entities
    const newAxisEntities = await this.getNewAxisEntities();
    //  b. Combine new and existing axis entities
    const allAxisEntities = this.mergeAndDeduplicateAxisEntities(newAxisEntities, existingAxisEntities);

    /* 2. Get all connection and link information for axis entities */
    const { connections, links } = await this.getConnectionsForAxisEntitiesWithLinks(allAxisEntities);

    return {
      axisEntities: allAxisEntities,
      connections: connections,
      links: links,
    };
  }

  /**
   * Get new axis entities from the data source.
   *
   * It's up to the implementation to determine how new axis entities are determined.
   *
   * @returns a promise that resolves to a dictionary of new axis entities
   */
  abstract getNewAxisEntities(): Promise<{ [key: string]: AxisEntityData }>;

  /**
   * Get connection information for a list of axis entities.
   *
   * @param axisEntities the axis entities to get connection information for
   * @returns a promise that resolves to a dictionary of connections and a list of links
   */
  abstract getConnectionsForAxisEntitiesWithLinks(axisEntities: { [key: string]: AxisEntityData }): Promise<{
    connections: { [key: string]: ConnectionData };
    links: LinkData[];
  }>;

  /**
   * Merge new axis entities with existing axis entities and remove duplicates.
   *
   * @param newAxisEntities the new axis entities
   * @param existingAxisEntities the existing axis entities
   * @returns a dictionary of axis entities with duplicates removed
   */
  mergeAndDeduplicateAxisEntities(
    newAxisEntities: { [key: string]: AxisEntityData },
    existingAxisEntities: { [key: string]: AxisEntityData }
  ): { [key: string]: AxisEntityData } {
    return {
      ...newAxisEntities,
      ...existingAxisEntities,
    };
  }
}
