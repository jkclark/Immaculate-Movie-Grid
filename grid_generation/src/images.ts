import { getFromTMDBAPIJson } from "../../common/src/api";
import { Grid } from "../../common/src/interfaces";
import { writeStreamToS3 } from "./s3";
import { getImageByIdTypeAndSize } from "./tmdbAPI";

// Get images for grid
export async function getAndSaveAllImagesForGrid(grid: Grid): Promise<void> {
    const tmdbAPIConfigURL = "https://api.themoviedb.org/3/configuration";
    const tmdbAPIConfig = await getFromTMDBAPIJson(tmdbAPIConfigURL);
    const imagesBaseURL = tmdbAPIConfig.images.secure_base_url;
    const imageSize = "original";

    for (const actor of grid.actors) {
        await getAndSaveImage(imagesBaseURL, imageSize, actor.id, "actor");
    }

    for (const credit of grid.credits) {
        await getAndSaveImage(imagesBaseURL, imageSize, credit.id, credit.type);
    }
}

async function getAndSaveImage(
    imagesBaseURL: string,
    imageSize: string,
    id: number,
    type: "actor" | "movie" | "tv",
) {
    const IMAGE_S3_BUCKET = "immaculate-movie-grid-images";
    const ACTOR_S3_PREFIX = "actors";
    const MOVIE_S3_PREFIX = "movies";
    const TV_S3_PREFIX = "tv-shows";

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
