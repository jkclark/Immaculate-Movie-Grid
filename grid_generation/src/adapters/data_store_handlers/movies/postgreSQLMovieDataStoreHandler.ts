import { initializeDataSource } from "common/src/db/connect";
import { DataSource } from "typeorm";

export default class PostgreSQLMovieDataStoreHandler {
  private dataSource: DataSource;

  async init() {
    this.dataSource = await initializeDataSource();
  }

  async loadGraph() {
    return {
      axisEntities: {},
      connections: {},
    };
  }
}
