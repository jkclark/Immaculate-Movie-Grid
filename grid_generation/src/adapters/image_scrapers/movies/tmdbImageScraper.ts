import { getFromTMDBAPIJson } from "common/src/api";
import { getTypeAndIdFromCreditUniqueId } from "src/adapters/graph/movies";
import { EntityType, GraphEntity } from "src/ports/graph";
import ImageScraper, { ImageInfo } from "src/ports/imageScraper";

export default class TMDBImageScraper implements ImageScraper {
  private readonly BASE_URL = "https://api.themoviedb.org/3";
  private readonly API_CONFIG_URL = `${this.BASE_URL}/configuration`;
  private readonly TMDB_404_STATUS_CODE = 34;
  private readonly DEFAULT_IMAGE_SIZE = "original";
  private imagesBaseURL: string;

  async getAndSetImagesBaseURL() {
    const tmdbAPIConfig = await getFromTMDBAPIJson(this.API_CONFIG_URL);
    this.imagesBaseURL = tmdbAPIConfig.images.secure_base_url;
  }

  async getImageForGraphEntity(graphEntity: GraphEntity): Promise<ImageInfo> {
    /* Parse graphEntity to get the ID and type */
    // We don't get images for categories, so return null here
    if (graphEntity.entityType === EntityType.CATEGORY) {
      return {
        stream: null,
        format: null,
      };
    }

    // Fully constructed image-info URLs might look like:
    // For actor with ID 123: https://api.themoviedb.org/3/person/123/images?language=en
    // For movie with ID 456: https://api.themoviedb.org/3/movie/456/images?language=en

    // E.g., person, movie, or tv
    let basePath: string;

    // Necessary because connection IDs are formatted like "movie-123" or "tv-456"
    // but TMDB expects just the ID, e.g., 123 or 456
    let graphEntityIdForTMDBRequest: string;

    // There are different types of images (e.g., posters, backdrops, profiles)
    let imageType: string;

    // Actor
    if (graphEntity.entityType === EntityType.NON_CATEGORY) {
      basePath = "person";
      graphEntityIdForTMDBRequest = graphEntity.id;
      imageType = "profiles";
    }

    // Movie or TV show
    else {
      const { type, id } = getTypeAndIdFromCreditUniqueId(graphEntity.id);
      if (type === "movie") {
        basePath = "movie";
        graphEntityIdForTMDBRequest = id;
        imageType = "posters";
      } else if (type === "tv") {
        basePath = "tv";
        graphEntityIdForTMDBRequest = id;
        imageType = "posters";
      } else {
        console.error(`Connection with ID ${graphEntity.id} is not a movie or tv show`);
        return {
          stream: null,
          format: null,
        };
      }
    }

    /* Get the image information for this ID and type */
    // NOTE: Some images come back in a different language by default,
    // so we're specifying en here for now. Not sure why it's not
    // en-US like for some other requests.
    const path = `${this.BASE_URL}/${basePath}/${graphEntityIdForTMDBRequest}/images?language=en`;
    const response = await getFromTMDBAPIJson(path);

    if (response.status_code === this.TMDB_404_STATUS_CODE) {
      console.error(`No image info found for `);
    }

    // Some actors and credits may not have images
    if (response[imageType].length === 0) {
      return {
        stream: null,
        format: null,
      };
    }

    const imageFilePath = response[imageType][0].file_path;
    const imageFormat = imageFilePath.split(".").pop();

    /* Download the actual image */
    const imageURL = `${this.imagesBaseURL}${this.DEFAULT_IMAGE_SIZE}/${imageFilePath}`;
    const imageResponse = await getFromTMDBAPIJson(imageURL);

    return {
      stream: imageResponse.body,
      format: imageFormat,
    };
  }
}
