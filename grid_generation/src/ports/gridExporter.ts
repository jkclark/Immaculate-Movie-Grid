import { Grid } from "common/src/grid";

export default interface GridExporter {
  exportGrid(grid: Grid): Promise<void>;
}
