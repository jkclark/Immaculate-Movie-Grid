import { AppDataSource, initializeDataSource } from "./db/connect";
import { batchReadFromDB } from "./db/crud";
import { Score } from "./db/models/Score";

interface Stats {
  numGames: number;
}

async function getStatsForGrid(gridDate: string): Promise<Stats> {
  // Establish a connection to the database
  await initializeDataSource();

  // Get all of the scores for the given date
  const scores = await getAllScores(gridDate);

  const stats = {
    numGames: scores.length,
  };

  console.log(stats);

  return stats;
}

async function getAllScores(gridDate: string): Promise<Score[]> {
  const scores: Score[] = await batchReadFromDB(AppDataSource.getRepository(Score), 1000, ["id"], [], {
    grid: { date: gridDate },
  });
  return scores;
}

if (require.main === module) {
  console.log("Getting stats");
  getStatsForGrid("2024-10-07");
}
