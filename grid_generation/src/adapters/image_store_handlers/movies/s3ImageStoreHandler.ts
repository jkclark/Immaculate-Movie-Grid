import { ListObjectsV2Command, S3Client } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import { Readable } from "stream";

import { EntityType, GraphEntity } from "src/ports/graph";
import { ImageInfo } from "src/ports/imageScraper";
import ImageStoreHandler, { ExistingImageInfo } from "src/ports/imageStoreHandler";

import dotenv from "dotenv";
dotenv.config();

export default class S3ImageStoreHandler implements ImageStoreHandler {
  private client = new S3Client({ region: process.env.AWS_REGION });
  private imageBucket: string;
  private AXIS_ENTITY_PREFIX = "axis-entities";
  private CONNECTION_PREFIX = "connections";

  constructor(imageBucket: string) {
    this.imageBucket = imageBucket;
  }

  async getGraphEntityIdsWithExistingImages(): Promise<ExistingImageInfo> {
    const prefixes = [this.AXIS_ENTITY_PREFIX, this.CONNECTION_PREFIX];
    const [axisEntityIdsWithImages, connectionIdsWithImages]: Set<string>[] = await Promise.all(
      prefixes.map(async (prefix) => {
        const objects = await this.listS3ObjectsWithPrefix(this.imageBucket, prefix);
        const graphEntityIds = new Set(
          objects
            // Get the last part of the key, which is the ID
            .map((object) => {
              const keyParts = object.Key.split("/");
              return keyParts[keyParts.length - 1].split(".")[0];
            })
            // Filter out falsy last parts of keys (e.g., empty strings)
            // S3 will return the folder as an object, which will have keyParts that looks like
            // ["axis-entities/", ""] or ["connections/", ""]
            .filter((graphEntityId) => graphEntityId)
        );
        return graphEntityIds;
      })
    );
    return {
      axisEntities: axisEntityIdsWithImages,
      connections: connectionIdsWithImages,
    };
  }

  async saveImageForGraphEntity(imageInfo: ImageInfo, graphEntity: GraphEntity): Promise<void> {
    /* Determine the prefix for the S3 key based on the entity type */
    let prefix: string;
    if (
      graphEntity.entityType === EntityType.CATEGORY ||
      graphEntity.entityType === EntityType.NON_CATEGORY
    ) {
      prefix = this.AXIS_ENTITY_PREFIX;
    } else if (graphEntity.entityType === EntityType.CONNECTION) {
      prefix = this.CONNECTION_PREFIX;
    } else {
      console.error(
        `Cannot save image for graph entity ${graphEntity.name} with entity type ${graphEntity.entityType}`
      );
      return;
    }

    /* Save the image to S3 */
    await this.writeStreamToS3(
      imageInfo.stream,
      this.imageBucket,
      `${prefix}/${graphEntity.id}.${imageInfo.format}`
    );
  }

  /**
   * Get all objects in an S3 bucket with the given prefix.
   *
   * @param bucket the bucket to search
   * @param prefix the prefix to search for
   * @returns a list of objects in the bucket with the given prefix
   */
  async listS3ObjectsWithPrefix(bucket: string, prefix: string) {
    let allObjects = [];
    const command: { Bucket: string; Prefix: string; ContinuationToken?: string } = {
      Bucket: bucket,
      Prefix: prefix,
    };

    while (true) {
      const response = await this.client.send(new ListObjectsV2Command(command));
      allObjects = allObjects.concat(response.Contents);
      if (!response.IsTruncated) {
        break;
      }
      command.ContinuationToken = response.NextContinuationToken;
    }
    return allObjects;
  }

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
