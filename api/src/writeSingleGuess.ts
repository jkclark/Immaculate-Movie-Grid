import { APIGatewayProxyEvent, Context, Handler } from "aws-lambda";

import { initializeDataSource } from "common/src/db/connect";
import { writeSingleGuess } from "common/src/db/stats";

export const handler: Handler = async (event: APIGatewayProxyEvent, context: Context) => {
  const dataSource = await initializeDataSource();

  const gridDate = new Date(event.pathParameters.gridDate);
  const guess = JSON.parse(event.body);

  const guessId = await writeSingleGuess(dataSource, gridDate, guess);

  console.log(guessId);

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
    body: JSON.stringify({ guessId: guessId }),
  };
};
