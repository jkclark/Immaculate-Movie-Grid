import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { fromCognitoIdentityPool } from "@aws-sdk/credential-provider-cognito-identity";
import { CognitoIdentityClient } from "@aws-sdk/client-cognito-identity";

const client = new S3Client({
    region: "us-east-1",
    credentials: fromCognitoIdentityPool({
        client: new CognitoIdentityClient({ region: "us-east-1" }),
        identityPoolId: "us-east-1:abd39c84-4c67-4052-87eb-3e97fa8427a8"
    })
});

async function streamToString(stream: ReadableStream): Promise<string> {
    const reader = stream.getReader();
    const decoder = new TextDecoder('utf-8');
    let result = '';
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
