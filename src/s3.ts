import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

const client = new S3Client({});

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
