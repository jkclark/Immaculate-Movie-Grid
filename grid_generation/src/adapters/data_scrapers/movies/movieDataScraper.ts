import { MovieGraphDataWithGenres } from "src/adapters/graph/movies";
import DataScraper from "src/ports/dataScraper";

export default abstract class MovieDataScraper extends DataScraper {
  abstract scrapeData(): Promise<MovieGraphDataWithGenres>;
}
