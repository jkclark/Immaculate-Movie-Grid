/**
 * This file contains functions for getting and writing statistics about the games played.
 *
 * The structure of this code isn't ideal because the logic is tied in with the database code.
 * In a perfect world, we'd have them be separated and use dependency injection to pass in the
 * database functions. I think this is tech debt I can live with for now.
 */
import { DataSource } from "typeorm";
import { batchReadFromDB, batchWriteToDB } from "./crud";
import { Answer } from "./models/Answer";
import { Score } from "./models/Score";

export interface Stats {
  numGames?: number;
}

interface AnswerNoIdNoEntities extends Omit<Answer, "id" | "grid" | "score" | "credit"> {}

interface AnswerNoIdNoScoreNoEntities
  extends Omit<Answer, "id" | "score_id" | "grid" | "score" | "credit" | "grid_date"> {}

export interface SingleGameAnswers {
  gridDate: Date;
  answers: AnswerNoIdNoScoreNoEntities[];
}

export async function getStatsForGrid(dataSource: DataSource, gridDate: string): Promise<Stats> {
  // Get all of the scores for the given date
  const scores = await getAllScores(dataSource, gridDate);

  const stats = {
    numGames: scores.length,
  };

  console.log(stats);

  return stats;
}

async function getAllScores(dataSource: DataSource, gridDate: string): Promise<Score[]> {
  const scores: Score[] = await batchReadFromDB(dataSource.getRepository(Score), 1000, { id: "ASC" }, [], {
    grid: { date: new Date(gridDate) },
  });
  return scores;
}

export async function writeGameStats(dataSource: DataSource, answers: SingleGameAnswers): Promise<void> {
  // Calculate this game's score
  const points = answers.answers.reduce((acc, answer) => (answer.correct ? acc + 1 : acc), 0);

  /* Write score to the database */
  const scoreRepo = dataSource.getRepository(Score);
  const score = new Score();
  score.grid_date = answers.gridDate;
  score.score = points;
  const savedScore = await scoreRepo.save(score);

  /* Write answers to the database */
  const answerRepo = dataSource.getRepository(Answer);
  // Add the score's ID to each answer
  const answersWithScoreId: AnswerNoIdNoEntities[] = answers.answers.map((answer) => {
    return { ...answer, grid_date: answers.gridDate, score_id: savedScore.id };
  });
  await batchWriteToDB(answersWithScoreId, answerRepo, 1000, []);
}
