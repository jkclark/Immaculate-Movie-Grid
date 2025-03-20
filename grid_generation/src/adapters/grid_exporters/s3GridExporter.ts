import { Grid } from "common/src/grid";
import GridExporter from "src/ports/gridExporter";

export default class S3GridExporter implements GridExporter {
    async exportGrid(grid: Grid): Promise<void> {
}
