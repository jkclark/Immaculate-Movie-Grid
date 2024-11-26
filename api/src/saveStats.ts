import { APIGatewayProxyEvent, Context, Handler } from "aws-lambda";

import { initializeDataSource } from "common/src/db/connect";
import { SingleGameAnswers, writeGameStats } from "common/src/db/stats";

export const handler: Handler = async (event: APIGatewayProxyEvent, context: Context) => {
  const dataSource = await initializeDataSource();

  const body = JSON.parse(event.body);

  const answers: SingleGameAnswers = {
    gridDate: new Date(event.pathParameters.gridDate),
    answers: body.answers,
  };

  await writeGameStats(dataSource, answers);

  return {
    statusCode: 200,
    body: JSON.stringify("Stats saved"),
  };
};
