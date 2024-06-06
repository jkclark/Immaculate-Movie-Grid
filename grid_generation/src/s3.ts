import { ListObjectsV2Command, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import { Readable } from "node:stream";

import dotenv from 'dotenv';
dotenv.config();

const client = new S3Client({ region: process.env.AWS_REGION });

/**
 * Write a string to an S3 object with the given key in the given bucket.
 * 
 * @param text the text contents of the object
 * @param bucket the bucket to which the object will be uploaded
 * @param key the key for the new S3 object
 */
export async function writeTextToS3(text: string, bucket: string, key: string) {
    console.log(`Writing text to ${bucket}/${key} S3!`);

    const command = new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: text,
    });

    try {
        const response = await client.send(command);
        console.log(response);
    } catch (err) {
        console.error(err);
    }

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
export async function writeStreamToS3(stream: Readable, bucket: string, key: string) {
    console.log(`Writing stream to ${bucket}/${key} S3!`);

    const response = new Upload({
        client,
        params: {
            Bucket: bucket,
            Key: key,
            Body: stream,
        },
    });

    await response.done();
}

/**
 * Get all objects in an S3 bucket with the given prefix.
 *
 * @param bucket the bucket to search
 * @param prefix the prefix to search for
 * @returns a list of objects in the bucket with the given prefix
 */
export async function listS3ObjectsWithPrefix(bucket: string, prefix: string) {
    let allObjects = [];
    const command: { Bucket: string; Prefix: string; ContinuationToken?: string } = {
        Bucket: bucket,
        Prefix: prefix,
    };

    try {
        while (true) {
            const response = await client.send(new ListObjectsV2Command(command));
            allObjects = allObjects.concat(response.Contents);
            if (!response.IsTruncated) {
                break;
            }
            command.ContinuationToken = response.NextContinuationToken;
        }
        return allObjects;
    } catch (err) {
        console.error(err);
    }
}
