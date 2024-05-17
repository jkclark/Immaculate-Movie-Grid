import { APIGatewayProxyEvent, Context, Handler } from 'aws-lambda';

import { getFromTMDBAPI, getFromTMDBAPIJson } from "../../common/src/api";

export const handler: Handler = async (event: APIGatewayProxyEvent, context: Context) => {
    console.log("EVENT: \n" + JSON.stringify(event, null, 2));
    console.log("Context:", JSON.stringify(context, null, 2));

    // Get image information from TMDB API
    const actorId = event.pathParameters.actoId;
    console.log("actorId: ", actorId);
    const url = `https://api.themoviedb.org/3/person/${actorId}/images?`
    const responseJson = await getFromTMDBAPIJson(url);

    // Get image from TMDB API
    const image = responseJson.profiles[0];
    const imageType = image.file_path.split(".").pop();
    const imageUrl = `https://image.tmdb.org/t/p/w500${image.file_path}`;
    const imageResponse = await getFromTMDBAPI(imageUrl);

    return {
        statusCode: 200,
        headers: {
            'Content-Type': `image/${imageType}`
        },
        body: imageResponse.toString("base64"),
        isBase64Encoded: true,
    };
};
