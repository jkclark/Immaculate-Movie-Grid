import { Stats } from "common/src/db/stats";

const API_URL = "https://api.immaculatemoviegrid.com/dev";

export async function getStatsForGrid(gridDate: string): Promise<Stats> {
  return fetch(`${API_URL}/stats/${gridDate}`).then((response) => response.json());
}
