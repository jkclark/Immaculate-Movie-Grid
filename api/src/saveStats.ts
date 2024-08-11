import { APIGatewayProxyEvent, Context, Handler } from "aws-lambda";

import { AppDataSource, initializeDataSource } from "../../common/src/db/connect";
import { ActorOrCategory } from "../../common/src/db/models/ActorOrCategory";

let initializationPromise: Promise<void> | null = null;

const initializeDatabase = async () => {
  if (!initializationPromise) {
    initializationPromise = initializeDataSource();
  }
  await initializationPromise;
};

// Initialize the database connection outside the handler
initializeDatabase().catch((error) => {
  console.error("Error initializing database: ", error);
});

export const handler: Handler = async (event: APIGatewayProxyEvent, context: Context) => {
  console.log("EVENT: \n" + JSON.stringify(event, null, 2));

  await initializeDatabase();

  const actor = new ActorOrCategory();
  actor.id = 500;
  actor.name = "Tom Cruise";

  const actorsAndCategoriesRepository = AppDataSource.getRepository(ActorOrCategory);

  await actorsAndCategoriesRepository.save(actor);
  console.log("Actor saved");

  return {
    statusCode: 200,
    body: JSON.stringify("Stats saved"),
  };
};
