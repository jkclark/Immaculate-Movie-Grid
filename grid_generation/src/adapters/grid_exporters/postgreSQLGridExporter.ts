import { DataSource } from "typeorm";

import { ensureInitialized, initializeDataSource } from "common/src/db/connect";
import { Grid as DBGrid } from "common/src/db/models/Grid";
import { Grid } from "common/src/grid";
import GridExporter from "src/ports/gridExporter";

export default class PostgreSQLGridExporter implements GridExporter {
  // Needs to be public for @ensureInitialized to work
  public dataSource: DataSource;

  // Can't put this in the constructor because constructors can't be async
  async init() {
    this.dataSource = await initializeDataSource();
  }

  @ensureInitialized
  async exportGrid(grid: Grid): Promise<void> {
    const dbGrid: DBGrid = {
      date: new Date(grid.id),
      across1: parseInt(grid.axes.across[0]),
      across2: parseInt(grid.axes.across[1]),
      across3: parseInt(grid.axes.across[2]),
      down1: parseInt(grid.axes.down[0]),
      down2: parseInt(grid.axes.down[1]),
      down3: parseInt(grid.axes.down[2]),
    };

    const gridRepo = this.dataSource.getRepository(DBGrid);
    await gridRepo.save(dbGrid);

    console.log("Grid exported to PostgreSQL database successfully.");
  }
}
