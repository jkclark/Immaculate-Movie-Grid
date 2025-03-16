import { ActorOrCategoryData, MovieGraphData, MovieGraphDataWithGenres } from "src/adapters/graph/movies";
import DataStoreHandler from "src/ports/dataStoreHandler";

export default abstract class MovieDataStoreHandler extends DataStoreHandler {
  abstract getExistingNonCategoryAxisEntities(): Promise<{ [key: string]: ActorOrCategoryData }>;

  abstract getGraphData(): Promise<MovieGraphData>;

  abstract storeGraphData(graphData: MovieGraphDataWithGenres): Promise<void>;

  // TODO: Remove this function when removing 'type' from 'credit' in the database
  getCreditUniqueId(creditType: string, creditId: string): string {
    return `${creditType}-${creditId}`;
  }
}
