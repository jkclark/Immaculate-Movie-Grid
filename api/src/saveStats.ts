import { APIGatewayProxyEvent, Context, Handler } from "aws-lambda";

import { initializeDataSource } from "common/src/db/connect";
import { ActorOrCategory } from "common/src/db/models/ActorOrCategory";

export const handler: Handler = async (event: APIGatewayProxyEvent, context: Context) => {
  console.log("EVENT: \n" + JSON.stringify(event, null, 2));

  const dataSource = await initializeDataSource();

  const actor = new ActorOrCategory();
  actor.id = 500;
  actor.name = "Tom Cruise";

  const actorsAndCategoriesRepository = dataSource.getRepository(ActorOrCategory);

  await actorsAndCategoriesRepository.save(actor);
  console.log("Actor saved");

  return {
    statusCode: 200,
    body: JSON.stringify("Stats saved"),
  };
};
