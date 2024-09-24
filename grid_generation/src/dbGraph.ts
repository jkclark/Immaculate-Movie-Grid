import { AppDataSource, initializeDataSource } from "common/src/db/connect";
import { ActorOrCategory } from "common/src/db/models/ActorOrCategory";
import { ActorCreditGraph } from "./interfaces";

export async function loadGraphFromDB(): Promise<ActorCreditGraph> {
  await initializeDataSource();

  const actorRepository = AppDataSource.getRepository(ActorOrCategory);
  const actor = await actorRepository.findOne({ where: { name: "josh" } });

  console.log(actor);

  return {
    actors: {},
    credits: {},
  };
}

if (require.main === module) {
  loadGraphFromDB();
}
