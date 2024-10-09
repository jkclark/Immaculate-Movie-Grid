import { AppDataSource, initializeDataSource } from "./db/connect";
import { batchReadFromDB, batchWriteToDB } from "./db/crud";
import { Answer } from "./db/models/Answer";
import { Score } from "./db/models/Score";

interface Stats {
  numGames: number;
}

interface SingleGameAnswers {
  gridDate: string;
  answers: Answer[];
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

async function writeGameStats(answers: SingleGameAnswers): Promise<void> {
  // Establish a connection to the database
  await initializeDataSource();

  // Calculate this game's score
  let points = 0;
  for (const answer of answers.answers) {
    if (answer.correct) {
      points++;
    }
  }

  // Write answers to the database
  const answerRepo = AppDataSource.getRepository(Answer);
  await batchWriteToDB(answers.answers, answerRepo, 1000, []);

  // Write score to the database
  const scoreRepo = AppDataSource.getRepository(Score);
  const score = new Score();
  score.grid = answers.answers[0].grid;
  score.score = points;
  await scoreRepo.save(score);
}

if (require.main === module) {
  console.log("Getting stats");
  getStatsForGrid("2024-10-07");
}
