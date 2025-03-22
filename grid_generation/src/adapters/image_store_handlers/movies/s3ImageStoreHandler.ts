import { S3Client } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import { Readable } from "stream";

import { Grid } from "common/src/grid";
import { GraphEntity } from "src/ports/graph";
import { ImageInfo } from "src/ports/imageScraper";
import ImageStoreHandler, { ExistingImageInfo } from "src/ports/imageStoreHandler";

import dotenv from "dotenv";
dotenv.config();

export default class S3ImageStoreHandler implements ImageStoreHandler {
  private client = new S3Client({ region: process.env.AWS_REGION });
  private imageBucket: string;

  constructor(imageBucket: string) {
    this.imageBucket = imageBucket;
  }

  async getGraphEntityIdsWithExistingImages(grid: Grid): Promise<ExistingImageInfo> {
    return {
      axisEntities: new Set(),
      connections: new Set(),
    };
  }

  async saveImageForGraphEntity(imageInfo: ImageInfo, graphEntity: GraphEntity): Promise<void> {}

  /**
   * Write a stream to an S3 object with the given key in the given bucket.
   *
   * This is useful for uploading images to S3.
   *
   * @param stream the stream to write to S3
   * @param bucket the bucket to which the stream will be uploaded
   * @param key the key for the new S3 object
   */
  async writeStreamToS3(stream: Readable, bucket: string, key: string) {
    console.log(`Writing stream to ${bucket}/${key} S3!`);

    const response = new Upload({
      client: this.client,
      params: {
        Bucket: bucket,
        Key: key,
        Body: stream,
      },
    });

    await response.done();
  }
}
