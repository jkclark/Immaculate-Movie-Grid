import { Grid } from "common/src/grid";
import { GraphEntity } from "src/ports/graph";
import { ImageInfo } from "src/ports/imageScraper";
import ImageStoreHandler, { ExistingImageInfo } from "src/ports/imageStoreHandler";

export default class S3ImageStoreHandler implements ImageStoreHandler {
  async getGraphEntityIdsWithExistingImages(grid: Grid): Promise<ExistingImageInfo> {
    return {
      axisEntities: new Set(),
      connections: new Set(),
    };
  }

  async saveImageForGraphEntity(imageInfo: ImageInfo, graphEntity: GraphEntity): Promise<void> {}
}
