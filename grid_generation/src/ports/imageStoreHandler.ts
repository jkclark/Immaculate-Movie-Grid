import { Grid } from "common/src/grid";
import { GraphEntity } from "./graph";
import { ImageInfo } from "./imageScraper";

/**
 * Each set contains the IDs of graph entities that already have images stored.
 */
export interface ExistingImageInfo {
  axisEntities: Set<string>;
  connections: Set<string>;
}

export default interface ImageStoreHandler {
  /**
   * Determine which entities in the graph already have images stored.
   *
   * @param graph the graph against which to check for existing images
   * @returns a promise that resolves to an object containing sets of IDs for each entity type that already have images
   */
  getGraphEntityIdsWithExistingImages(grid: Grid): Promise<ExistingImageInfo>;

  /**
   * Save image information corresponding to a specific graph entity.
   *
   * @param imageInfo the image information to save
   * @param graphEntity the graph entity to which the image information corresponds
   */
  saveImageForGraphEntity(imageInfo: ImageInfo, graphEntity: GraphEntity): Promise<void>;
}
