import { GraphData } from "./graph";

export default abstract class DataScraper {
  abstract scrapeData(): Promise<GraphData>;
}
