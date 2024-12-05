import { APIGatewayProxyEvent, Context, Handler } from "aws-lambda";

import { initializeDataSource } from "common/src/db/connect";
import { SingleGameGuesses, writeGame } from "common/src/db/stats";

export const handler: Handler = async (event: APIGatewayProxyEvent, context: Context) => {
  const dataSource = await initializeDataSource();

  const body = JSON.parse(event.body);

  const guesses: SingleGameGuesses = {
    gridDate: new Date(event.pathParameters.gridDate),
    guessIds: body.guessIds,
  };

  await writeGame(dataSource, guesses);

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
      // These headers are necessary when I want to hit this endpoint from localhost while I'm developing.
      // I'm not sure if there's a better way to do this, but for now it's fine.
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Origin": "*",
      "Acess-Control-Allow-Methods": "POST",
    },
    body: JSON.stringify("Stats saved"),
  };
};
