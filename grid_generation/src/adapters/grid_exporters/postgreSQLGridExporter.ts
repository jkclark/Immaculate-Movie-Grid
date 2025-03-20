import { Grid } from "common/src/grid";
import GridExporter from "src/ports/gridExporter";

export default class PostgreSQLGridExporter implements GridExporter {
  async exportGrid(grid: Grid): Promise<void> {}
}
