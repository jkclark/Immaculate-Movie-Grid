/**
 * This file contains functions for getting and writing statistics about the games played.
 *
 * The structure of this code isn't ideal because the logic is tied in with the database code.
 * In a perfect world, we'd have them be separated and use dependency injection to pass in the
 * database functions. I think this is tech debt I can live with for now.
 */
import { DataSource, In } from "typeorm";
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

/**
 * Save a single guess to the database.
 *
 * @param dataSource the database connection
 * @param gridDate the date of the grid the guess is for
 * @param guess the guess to write to the database
 * @returns the ID of the guess that was written
 */
export async function writeSingleGuess(
  dataSource: DataSource,
  gridDate: Date,
  guess: IncomingGuess
): Promise<number> {
  const guessRepo = dataSource.getRepository(Guess);
  const guessWithGridDate = { ...guess, grid_date: gridDate };
  const dbGuess = await guessRepo.save(guessWithGridDate);
  return dbGuess.id;
}

/**
 * Save a game's score to the database and link the guesses to the score.
 *
 * @param dataSource the database connection
 * @param guesses the IDs of this game's guesses along with the grid's date
 */
export async function writeGame(dataSource: DataSource, guesses: SingleGameGuesses): Promise<void> {
  // Get all guesses from the DB
  const guessRepo = dataSource.getRepository(Guess);
  const guessesFromDB = await guessRepo.find({
    where: {
      id: In(guesses.guessIds),
    },
  });

  // Calculate the score for this game
  const points = guessesFromDB.reduce((acc, guess) => (guess.correct ? acc + 1 : acc), 0);

  // Write the score to the database
  const scoreRepo = dataSource.getRepository(Score);
  const score = new Score();
  score.grid_date = guesses.gridDate;
  score.score = points;
  const savedScoreId = (await scoreRepo.save(score)).id;

  // Add the score's ID to each guess
  const guessesWithScoreId = guessesFromDB.map((guess) => {
    guess.score_id = savedScoreId;
    return guess;
  });

  // Write the updated guesses to the database
  await guessRepo.save(guessesWithScoreId);
}
