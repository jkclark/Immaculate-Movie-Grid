import { CognitoIdentityClient } from "@aws-sdk/client-cognito-identity";
import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { fromCognitoIdentityPool } from "@aws-sdk/credential-provider-cognito-identity";
import { Grid } from "../../common/src/interfaces";

const BASE_S3_IMAGE_URL = "https://immaculate-movie-grid-images.s3.amazonaws.com";

const client = new S3Client({
  region: "us-east-1",
  credentials: fromCognitoIdentityPool({
    client: new CognitoIdentityClient({ region: "us-east-1" }),
    identityPoolId: "us-east-1:abd39c84-4c67-4052-87eb-3e97fa8427a8",
  }),
});

export function getS3ImageURLForType(type: "movie" | "tv" | "actor", id: number): string {
  const typesToS3Prefixes = {
    actor: "actors",
    movie: "movies",
    tv: "tv-shows",
  };

  return `${BASE_S3_IMAGE_URL}/${typesToS3Prefixes[type]}/${id}.jpg`;
}

export async function preloadImageURL(imageURL: string) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = resolve;
    image.onerror = reject;
    image.src = imageURL;
  });
}

async function streamToString(stream: ReadableStream): Promise<string> {
  const reader = stream.getReader();
  const decoder = new TextDecoder("utf-8");
  let result = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      return result;
    }
    result += decoder.decode(value);
  }
}

export async function getS3Object(bucket: string, key: string): Promise<any> {
  const command = new GetObjectCommand({ Bucket: bucket, Key: key });
  const response = await client.send(command);
  const body = await streamToString(response.Body as ReadableStream);
  return JSON.parse(body);
}

export async function getGridDataFromS3(bucket: string, key: string): Promise<Grid> {
  const jsonData = await getS3Object(bucket, key);
  return jsonData as Grid;
}
