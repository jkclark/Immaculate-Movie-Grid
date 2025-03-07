import { initializeDataSource } from "common/src/db/connect";
import { GraphData } from "src/ports/interfaces/graph";
import { DataSource } from "typeorm";

export default class PostgreSQLMovieDataStoreHandler {
  private dataSource: DataSource;

  async init() {
    this.dataSource = await initializeDataSource();
  }

  async getGraphData(): Promise<GraphData> {
    return {
      axisEntities: {},
      connections: {},
    };
  }
}
