import { PutObjectCommand, S3Client, UploadPartCommand } from "@aws-sdk/client-s3";
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
