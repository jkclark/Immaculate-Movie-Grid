import { IncomingGuess, Stats } from "common/src/db/stats";
import { useSetAtom } from "jotai";
import { hitAPIGet, hitAPIPost } from "./api";
import { gridStatsAtom } from "./state";

const STATS_API_PATH = "stats";
const GUESS_API_PATH = "guess";

export function useStats() {
  const setGridStats = useSetAtom(gridStatsAtom);

  async function updateStatsForGrid(gridDate: string): Promise<void> {
    const stats = await getStatsForGrid(gridDate);
    setGridStats(stats);
  }

  async function getStatsForGrid(gridDate: string): Promise<Stats> {
    return hitAPIGet(`${STATS_API_PATH}/${gridDate}`);
  }

  async function recordGuessForGrid(gridDate: string, guess: IncomingGuess): Promise<any> {
    return hitAPIPost(`${GUESS_API_PATH}/${gridDate}`, guess);
  }

  async function endGameForGrid(gridDate: string, scoreId: number | undefined): Promise<any> {
    return hitAPIPost(`${GUESS_API_PATH}/${gridDate}`, { score_id: scoreId, give_up: true });
  }

  return {
    updateStatsForGrid,
    getStatsForGrid,
    recordGuessForGrid,
    endGameForGrid,
  };
}
