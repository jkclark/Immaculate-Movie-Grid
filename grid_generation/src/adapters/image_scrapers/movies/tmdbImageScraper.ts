import { GraphEntity } from "src/ports/graph";
import ImageScraper, { ImageInfo } from "src/ports/imageScraper";
import { Readable } from "stream";

export default class TMDBImageScraper implements ImageScraper {
  async getImageForGraphEntity(graphEntity: GraphEntity): Promise<ImageInfo> {
    return {
      stream: new Readable(),
      format: "",
    };
  }
}
