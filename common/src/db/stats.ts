/**
 * This file contains functions for getting and writing statistics about the games played.
 */
import { DataSource } from "typeorm";
import { batchReadFromDB } from "./crud";
import { Guess } from "./models/Guess";
import { Score } from "./models/Score";

interface Stat {
  value: number;
  displayName: string;
}

export interface Stats {
  numGames?: Stat;
}

export interface IncomingGuess {
  across_index: number;
  down_index: number;
  credit_id: number;
  credit_type: string;
  correct: boolean;
  score_id?: number;
}

export interface SingleGameGuesses {
  gridDate: Date;
  guessIds: number[];
}

export async function getStatsForGrid(dataSource: DataSource, gridDate: string): Promise<Stats> {
  // Get all of the scores for the given date
  const scores = await getAllScores(dataSource, gridDate);

  const stats = {
    numGames: {
      value: scores.length,
      displayName: "Games played",
    },
    avgScore: {
      value: scores.reduce((acc, score) => acc + score.score, 0) / scores.length || 0,
      displayName: "Average score",
    },
  };

  return stats;
}

async function getAllScores(dataSource: DataSource, gridDate: string): Promise<Score[]> {
  const scores: Score[] = await batchReadFromDB(dataSource.getRepository(Score), 1000, { id: "ASC" }, [], {
    grid: { date: new Date(gridDate) },
  });
  return scores;
}

export async function getSingleScore(dataSource: DataSource, scoreId: number): Promise<Score> {
  const scoreRepo = dataSource.getRepository(Score);
  return await scoreRepo.findOneOrFail({ where: { id: scoreId } });
}

export async function writeSingleGuessForNewGame(
  dataSource: DataSource,
  gridDate: Date,
  guess: IncomingGuess
): Promise<number> {
  const score = await createNewScore(dataSource, gridDate);
  await writeSingleGuess(dataSource, gridDate, guess, score.id);
  return score.id;
}

export async function createNewScore(dataSource: DataSource, gridDate: Date): Promise<Score> {
  const scoreRepo = dataSource.getRepository(Score);
  const score = new Score();
  score.grid_date = gridDate;
  score.score = 0;
  score.game_over = false;
  return await scoreRepo.save(score);
}

/**
 * Save a single guess to the database. This includes updating the score if the guess was correct.
 *
 * @param dataSource the database connection
 * @param gridDate the date of the grid the guess is for
 * @param guess the guess to write to the database
 * @param scoreId the ID of the score this guess is associated with
 * @returns the ID of the guess that was written
 */
export async function writeSingleGuess(
  dataSource: DataSource,
  gridDate: Date,
  guess: IncomingGuess,
  scoreId: number
): Promise<number> {
  const guessRepo = dataSource.getRepository(Guess);
  const guessWithGridDateAndScoreId = { ...guess, grid_date: gridDate, score_id: scoreId };
  const guessEntity = await guessRepo.save(guessWithGridDateAndScoreId);

  // Update the score if the guess was correct
  if (guess.correct) {
    const scoreRepo = dataSource.getRepository(Score);
    const score = await scoreRepo.findOneOrFail({ where: { id: scoreId } });
    score.score += 1;
    await scoreRepo.save(score);
  }

  return guessEntity.id;
}

export async function countGuessesForScore(dataSource: DataSource, scoreId: number): Promise<number> {
  const guessRepo = dataSource.getRepository(Guess);
  return await guessRepo.count({ where: { score_id: scoreId } });
}

export async function endGame(dataSource: DataSource, scoreId: number): Promise<void> {
  const scoreRepo = dataSource.getRepository(Score);
  const score = await scoreRepo.findOneOrFail({ where: { id: scoreId } });
  score.game_over = true;
  await scoreRepo.save(score);
}
