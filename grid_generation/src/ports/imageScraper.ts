import { Readable } from "stream";
import { GraphEntity } from "./graph";

export interface ImageInfo {
  stream: Readable;
  format: string;
}

export default interface ImageScraper {
  getImageForGraphEntity(graphEntity: GraphEntity): Promise<ImageInfo>;
}
