import { MovieGraphData } from "src/adapters/graph/movies/graph";
import DataStoreHandler from "src/ports/dataStoreHandler";

export default abstract class MovieDataStoreHandler extends DataStoreHandler {
  abstract getGraphData(): Promise<MovieGraphData>;

  abstract storeGraphData(graphData: MovieGraphData): Promise<void>;

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
