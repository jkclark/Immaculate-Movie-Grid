import { getFromTMDBAPIJson } from "../../common/src/api";
import { GridExport } from "../../common/src/interfaces";
import { listS3ObjectsWithPrefix, writeStreamToS3 } from "./s3";
import { getImageByIdTypeAndSize } from "./tmdbAPI";

const IMAGE_S3_BUCKET = "immaculate-movie-grid-images";
const ACTOR_S3_PREFIX = "actors";
const MOVIE_S3_PREFIX = "movies";
const TV_S3_PREFIX = "tv-shows";

/**
 * Get and save images for all actors, movies, and TV shows in the given grid.
 *
 * If `overwrite` is `true`, all images will be fetched and saved, overwriting any existing images.
 * Otherwise, only images that are not already in S3 will be fetched and saved.
 *
 * The TMDB API provides a configuration endpoint that returns the base URL for images.
 * It also provides a list of image sizes, but for now we'll just use the "original" size.
 *
 * @param grid the grid for which to get and save images
 * @param overwrite whether to overwrite images that already exist in S3
 */
export async function getAndSaveAllImagesForGrid(grid: GridExport, overwrite: boolean): Promise<void> {
  // Convert actors and credits (movies and tv shows separately) in the grid into sets of IDs
  let actorIds = new Set(grid.actors.map((actor) => actor.id));
  let movieIds = new Set(grid.credits.filter((credit) => credit.type === "movie").map((credit) => credit.id));
  let tvIds = new Set(grid.credits.filter((credit) => credit.type === "tv").map((credit) => credit.id));

  // If we're not overwriting images, we need to know which ones we already have
  if (!overwrite) {
    const [actorsInS3, moviesInS3, tvInS3] = await getImagesAlreadyInS3();

    // Remove IDs for which we already have images
    actorIds = new Set([...actorIds].filter((x) => !actorsInS3.has(x)));
    movieIds = new Set([...movieIds].filter((x) => !moviesInS3.has(x)));
    tvIds = new Set([...tvIds].filter((x) => !tvInS3.has(x)));
  }

  const tmdbAPIConfigURL = "https://api.themoviedb.org/3/configuration";
  const tmdbAPIConfig = await getFromTMDBAPIJson(tmdbAPIConfigURL);
  const imagesBaseURL = tmdbAPIConfig.images.secure_base_url;
  const imageSize = "original";

  console.log(
    `Getting and saving images for:\n\t${actorIds.size} actors\n\t${movieIds.size} movies\n\t${tvIds.size} TV shows`
  );

  for (const actorId of actorIds) {
    await getAndSaveImage(imagesBaseURL, actorId, "actor", imageSize);
  }

  for (const movieId of movieIds) {
    await getAndSaveImage(imagesBaseURL, movieId, "movie", imageSize);
  }

  for (const tvId of tvIds) {
    await getAndSaveImage(imagesBaseURL, tvId, "tv", imageSize);
  }
}

/**
 * Get the IDs of actors, movies, and TV shows that already have images in S3.
 *
 * @returns a tuple of three sets of IDs: actors, movies, and TV shows that already have images in S3
 */
export async function getImagesAlreadyInS3(): Promise<[Set<number>, Set<number>, Set<number>]> {
  const bucket = "immaculate-movie-grid-images";
  const prefixes = ["actors", "movies", "tv-shows"];
  const sets = await Promise.all(
    prefixes.map(async (prefix) => {
      const objects = await listS3ObjectsWithPrefix(bucket, prefix);
      const ids = new Set(
        objects.map((object) => {
          const keyParts = object.Key.split("/");
          // We could parseInt the whole last part of the key, because
          // parseInt will stop at the first non-numeric character, but
          // this is more explicit.
          return parseInt(keyParts[keyParts.length - 1].split(".")[0]);
        })
      );
      return ids;
    })
  );
  return [sets[0], sets[1], sets[2]];
}

/**
 * Get an image from the TMDB API and save it to S3.
 *
 * @param imagesBaseURL the base URL for images from the TMDB API
 * @param id the ID of the actor, movie, or TV show
 * @param type the type of the image (actor, movie, or tv)
 * @param imageSize the size of the image, as from the response from the TMDB API configuration endpoint
 * @returns nothing
 */
async function getAndSaveImage(
  imagesBaseURL: string,
  id: number,
  type: "actor" | "movie" | "tv",
  imageSize: string
) {
  const typesToPrefixes = {
    actor: ACTOR_S3_PREFIX,
    movie: MOVIE_S3_PREFIX,
    tv: TV_S3_PREFIX,
  };

  const [image, imageType] = await getImageByIdTypeAndSize(imagesBaseURL, id, type, imageSize);

  // Save to S3
  if (!image || !imageType) {
    console.log(`No image found for ${type} ${id}`);
    return;
  }

  await writeStreamToS3(image, IMAGE_S3_BUCKET, `${typesToPrefixes[type]}/${id}.${imageType}`);
}
