import { APIGatewayProxyEvent, Context, Handler } from 'aws-lambda';
import { getFromTMDBAPIJson } from '../../common/src/api';
import { SearchResult } from '../../common/src/interfaces';

export const handler: Handler = async (event: APIGatewayProxyEvent, context: Context) => {
  const query = event.queryStringParameters?.query;
  if (!query) {
    return {
      statusCode: 400,
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message: "No query provided"
      })
    };
  }

  const response = await getFromTMDBAPIJson(`https://api.themoviedb.org/3/search/multi?query=${query}`);
  // Sort results by popularity
  const results = response.results.sort((a: any, b: any) => b.popularity - a.popularity);
  const resultsToReturn: SearchResult[] = [];
  for (const result of results) {
    // Only consider movies and TV shows
    if (result.media_type !== "movie" && result.media_type !== "tv") {
      continue;
    }
    console.log(`${result.media_type}: ${result.title || result.name}`);
    resultsToReturn.push({
      media_type: result.media_type,
      id: result.id,
      title: result.title || result.name
    });
  }

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
      // These headers are necessary when I want to hit this endpoint from localhost while I'm developing.
      // I'm not sure if there's a better way to do this, but for now it's fine.
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Origin": "*",
      "Acess-Control-Allow-Methods": "GET"
    },
    body: JSON.stringify({
      message: "Search complete!",
      searchResults: resultsToReturn
    })
  };
}
