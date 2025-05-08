import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { Grid, serializeGrid } from "common/src/grid";
import GridExporter from "src/ports/gridExporter";

import dotenv from "dotenv";
dotenv.config();

export default class S3GridExporter implements GridExporter {
  private client = new S3Client({ region: process.env.AWS_REGION });
  private gridBucket: string;
  private gridKey: string;

  constructor(gridBucket: string, gridKey: string) {
    this.gridBucket = gridBucket;
    this.gridKey = gridKey;
  }

  /**
   * Export the given grid to S3.
   *
   * The reason that this doesn't take a bucket or key argument is that
   * we need to keep the `exportGrid` method signature consistent across all
   * grid exporters.
   *
   * @param grid the grid to export
   * @returns a promise that resolves when the grid has been exported to S3
   */
  async exportGrid(grid: Grid): Promise<void> {
    const serializedGrid = serializeGrid(grid);

    await this.writeTextToS3(serializedGrid, this.gridBucket, this.gridKey);

    console.log("Grid exported to S3 successfully.");
  }

  /**
   * Write a string to an S3 object with the given key in the given bucket.
   *
   * @param text the text contents of the object
   * @param bucket the bucket to which the object will be uploaded
   * @param key the key for the new S3 object
   */
  async writeTextToS3(text: string, bucket: string, key: string) {
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: text,
    });

    await this.client.send(command);
  }
}
