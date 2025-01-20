/**
 * This file contains functions for getting and writing statistics about the games played.
 */
import { DataSource, In } from "typeorm";
import { batchReadFromDB } from "./crud";
import { Guess } from "./models/Guess";
import { Score } from "./models/Score";

interface BasicStat {
  value: number;
  displayName: string;
}

/* Right now these all have to be optional because
 * we want to define the Stats state atom on the frontend as {}
 * when it's initialized.
 */
export interface Stats {
  numGames?: BasicStat;
  avgScore?: BasicStat;
  basicStats?: { [key: string]: BasicStat };
  squarePercentages?: { [key: string]: number };
  allAnswers?: { [key: string]: AllGivenAnswersForSquare };
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

interface AllGivenAnswersForSquare {
  [key: string]: number;
}

export async function getStatsForGrid(dataSource: DataSource, gridDate: string): Promise<Stats> {
  // Get all of the scores for the given date
  const scores = await getAllScores(dataSource, gridDate);
  const squarePercentages = await getSquarePercentages(dataSource, gridDate);
  const allGivenAnswers = await getAllGivenAnswers(dataSource, gridDate);

  const stats = {
    basicStats: {
      numGames: {
        value: scores.length,
        displayName: "Games played",
      },
      avgScore: {
        value: scores.reduce((acc, score) => acc + score.score, 0) / scores.length || 0,
        displayName: "Average score",
      },
    },
    squarePercentages: squarePercentages,
    allAnswers: allGivenAnswers,
  };

  return stats;
}

/**
 * Get all scores for a given grid date. Only scores for games that have ended are returned.
 *
 * @param dataSource the database connection
 * @param gridDate the date of the grid to get scores for
 * @returns a list of all scores for the given grid date
 */
async function getAllScores(dataSource: DataSource, gridDate: string): Promise<Score[]> {
  const scores: Score[] = await batchReadFromDB(dataSource.getRepository(Score), 1000, { id: "ASC" }, [], {
    grid: { date: new Date(gridDate) },
    game_over: true,
  });
  return scores;
}

/**
 * For each square in the grid, get the percentage of players who have answered correctly.
 *
 * @param dataSource the database connection
 * @param gridDate the date of the grid to get square percentages for
 * @returns an object mapping (square coordinates) to (the percentage of players who have answered correctly)
 */
async function getSquarePercentages(
  dataSource: DataSource,
  gridDate: string
): Promise<{ [key: string]: number }> {
  const guessRepository = dataSource.getRepository(Guess);
  const scoreRepository = dataSource.getRepository(Score);

  // Get all scores with game_over = true for the given grid date
  const scores = await scoreRepository.find({
    where: {
      grid: { date: new Date(gridDate) },
      game_over: true,
    },
  });

  // Extract score IDs
  const scoreIds = scores.map((score) => score.id);

  // TODO: Use batch read instead of this
  // Get all correct guesses with the corresponding score IDs
  const correctGuesses = await guessRepository.find({
    where: {
      score: { id: In(scoreIds) },
      correct: true,
    },
  });

  // Count up the number of correct guesses for each square
  const squareCorrectCounts: { [key: string]: number } = {};
  for (const guess of correctGuesses) {
    const square = `${guess.across_index}-${guess.down_index}`;
    squareCorrectCounts[square] = (squareCorrectCounts[square] || 0) + 1;
  }

  // Calculate the percentage of correct guesses for each square
  // (Dividing by the total number of complete games)
  const squarePercentages: { [key: string]: number } = {};
  for (const square in squareCorrectCounts) {
    squarePercentages[square] = 100 * ((squareCorrectCounts[square] || 0) / scoreIds.length);
  }

  return squarePercentages;
}

async function getAllGivenAnswers(
  dataSource: DataSource,
  gridDate: string
): Promise<{ [key: string]: AllGivenAnswersForSquare }> {
  const guessRepository = dataSource.getRepository(Guess);

  // TODO: Use batch read instead of this
  const allCorrectGuesses = await guessRepository.find({
    where: {
      score: {
        grid: {
          date: new Date(gridDate),
        },
      },
      correct: true,
    },
  });

  const allGivenAnswers: { [key: string]: AllGivenAnswersForSquare } = {};

  for (const guess of allCorrectGuesses) {
    const square = `${guess.across_index}-${guess.down_index}`;
    if (!allGivenAnswers[square]) {
      const allGivenAnswersForSquare: AllGivenAnswersForSquare = {};
      allGivenAnswers[square] = allGivenAnswersForSquare;
    }

    const creditUniqueString = `${guess.credit_type}-${guess.credit_id}`;
    if (!allGivenAnswers[square][creditUniqueString]) {
      allGivenAnswers[square][creditUniqueString] = 0;
    }

    allGivenAnswers[square][creditUniqueString] += 1;
  }

  return allGivenAnswers;
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

export async function markGameAsOver(dataSource: DataSource, scoreId: number): Promise<void> {
  const scoreRepo = dataSource.getRepository(Score);
  const score = await scoreRepo.findOneOrFail({ where: { id: scoreId } });
  score.game_over = true;
  await scoreRepo.save(score);
}
