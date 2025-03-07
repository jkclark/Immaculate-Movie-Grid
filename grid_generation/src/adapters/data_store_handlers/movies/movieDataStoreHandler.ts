import DataStoreHandler from "src/ports/dataStoreHandler";
import { ActorCreditGraph } from "../movies/interfaces/graph";

export default abstract class MovieDataStoreHandler extends DataStoreHandler {
  abstract loadGraph(): Promise<ActorCreditGraph>;
}
