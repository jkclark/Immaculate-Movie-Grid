import { IncomingGuess, Stats } from "common/src/db/stats";
import { hitAPIGet, hitAPIPost } from "./api";

const STATS_API_PATH = "stats";
const GUESS_API_PATH = "guess";

export async function getStatsForGrid(gridDate: string): Promise<Stats> {
  return hitAPIGet(`${STATS_API_PATH}/${gridDate}`);
}

export async function recordGuessForGrid(gridDate: string, guess: IncomingGuess): Promise<any> {
  return hitAPIPost(`${GUESS_API_PATH}/${gridDate}`, guess);
}

export async function endGameForGrid(gridDate: string, scoreId: number | undefined): Promise<any> {
  return hitAPIPost(`${GUESS_API_PATH}/${gridDate}`, { score_id: scoreId, end_game: true });
}
