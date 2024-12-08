import { Stats } from "common/src/db/stats";
import { hitAPIGet } from "./api";

const STATS_API_PATH = "stats";

export async function getStatsForGrid(gridDate: string): Promise<Stats> {
  return hitAPIGet(`${STATS_API_PATH}/${gridDate}`);
}
