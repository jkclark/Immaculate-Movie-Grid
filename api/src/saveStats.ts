import { APIGatewayProxyEvent, Context, Handler } from "aws-lambda";

import { initializeDataSource } from "common/src/db/connect";
import { SingleGameAnswers, writeGameStats } from "common/src/db/stats";

export const handler: Handler = async (event: APIGatewayProxyEvent, context: Context) => {
  console.log("EVENT: \n" + JSON.stringify(event, null, 2));

  const dataSource = await initializeDataSource();

  const body = JSON.parse(event.body);

  const answers: SingleGameAnswers = {
    gridDate: new Date(body.gridDate),
    answers: body.answers,
  };

  await writeGameStats(dataSource, answers);

  return {
    statusCode: 200,
    body: JSON.stringify("Stats saved"),
  };
};
