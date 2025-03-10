import { MovieGraphData } from "src/adapters/graph/movies/graph";
import DataScraper from "src/ports/dataScraper";

export default abstract class MovieDataScraper extends DataScraper {
  abstract scrapeData(): Promise<MovieGraphData>;
}
