import { APIGatewayProxyEvent, Context, Handler } from "aws-lambda";

import { initializeDataSource } from "common/src/db/connect";
import { getStatsForGrid, Stats } from "common/src/db/stats";

export const handler: Handler = async (event: APIGatewayProxyEvent, context: Context) => {
  const dataSource = await initializeDataSource();

  const stats: Stats = await getStatsForGrid(dataSource, event.pathParameters.gridDate);

  return {
    statusCode: 200,
    body: JSON.stringify(stats),
  };
};
