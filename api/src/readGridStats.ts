import { APIGatewayProxyEvent, Context, Handler } from "aws-lambda";

import { initializeDataSource } from "common/src/db/connect";
import { batchReadFromDB } from "common/src/db/crud";
import { Guess } from "common/src/db/models/Guess";
import { Score } from "common/src/db/models/Score";
import { AllGivenAnswersForSquare, Stats } from "common/src/db/stats";
import { DataSource, In } from "typeorm";

export const handler: Handler = async (event: APIGatewayProxyEvent, context: Context) => {
  const dataSource = await initializeDataSource();

  const stats: Stats = await getStatsForGrid(dataSource, event.pathParameters.gridDate);

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
      // These headers are necessary when I want to hit this endpoint from localhost while I'm developing.
      // I'm not sure if there's a better way to do this, but for now it's fine.
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Origin": "*",
      "Acess-Control-Allow-Methods": "GET",
    },
    body: JSON.stringify(stats),
  };
};

export async function getStatsForGrid(dataSource: DataSource, gridDate: string): Promise<Stats> {
  // Get all of the scores for the given date
  const scores = await getAllScores(dataSource, gridDate);
  const squarePercentages = await getSquarePercentages(dataSource, gridDate);
  const allGivenAnswers = await getAllGivenAnswers(dataSource, gridDate);
  const scoreCounts = await getScoreCounts(dataSource, gridDate);

  const stats = {
    basicStats: {
      avgScore: {
        value: scores.reduce((acc, score) => acc + score.score, 0) / scores.length || 0,
        displayName: "Today's average score",
        roundToDigits: 2,
      },
      numGames: {
        value: scores.length,
        displayName: "Games played today",
        roundToDigits: 0,
      },
    },
    squarePercentages: squarePercentages,
    allAnswers: allGivenAnswers,
    scoreCounts: scoreCounts,
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
  const scores = await batchReadFromDB(scoreRepository, 1000, { id: "ASC" }, [], {
    grid: { date: new Date(gridDate) },
    game_over: true,
  });

  // Extract score IDs
  const scoreIds = scores.map((score) => score.id);

  const correctGuesses = await batchReadFromDB(guessRepository, 1000, { id: "ASC" }, [], {
    score: { id: In(scoreIds) },
    correct: true,
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

  const allCorrectGuesses = await batchReadFromDB(guessRepository, 1000, { id: "ASC" }, ["credit"], {
    score: {
      grid: {
        date: new Date(gridDate),
      },
    },
    correct: true,
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
      allGivenAnswers[square][creditUniqueString] = {
        timesUsed: 0,
        name: guess.credit.name,
      };
    }

    allGivenAnswers[square][creditUniqueString].timesUsed += 1;
  }

  return allGivenAnswers;
}

async function getScoreCounts(dataSource: DataSource, gridDate: string): Promise<{ [key: number]: number }> {
  const scoreRepository = dataSource.getRepository(Score);

  const scores = await batchReadFromDB(scoreRepository, 1000, { id: "ASC" }, [], {
    grid: { date: new Date(gridDate) },
  });

  const scoreCounts: { [key: number]: number } = {};

  for (const score of scores) {
    scoreCounts[score.score] = (scoreCounts[score.score] || 0) + 1;
  }

  return scoreCounts;
}
