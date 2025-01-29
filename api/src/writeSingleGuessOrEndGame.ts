import { APIGatewayProxyEvent, Context, Handler } from "aws-lambda";

import { initializeDataSource } from "common/src/db/connect";
import { Guess } from "common/src/db/models/Guess";
import { Score } from "common/src/db/models/Score";
import { IncomingGuess } from "common/src/db/stats";
import { DataSource, EntityNotFoundError } from "typeorm";

const responseHeaders = {
  "Content-Type": "application/json",
  // These headers are necessary when I want to hit this endpoint from localhost while I'm developing.
  // I'm not sure if there's a better way to do this, but for now it's fine.
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST",
};

/**
 * This function handles the following situations, in order:
 *
 * It's important to remember that we never pass a guess (across_index, etc.)
 * and give_up in the same request. Either we're guessing, or we're intentionally
 * ending the game, not both.
 *
 * 1. User gives up without ever having guessed
 * 2. User gives up after having guessed at least once
 * 3. User guesses correctly or incorrectly for the first time
 * 4. User guesses correctly or incorrectly after having guessed at least once
 * 4a. User guesses for the last (9th) time
 */
export const handler: Handler = async (event: APIGatewayProxyEvent, context: Context) => {
  const dataSource = await initializeDataSource();
  const gridDate = new Date(event.pathParameters.gridDate);

  const body = JSON.parse(event.body);
  const guess = {
    across_index: body.across_index,
    down_index: body.down_index,
    credit_id: body.credit_id,
    credit_type: body.credit_type,
    correct: body.correct,
    score_id: body.score_id,
  };
  const scoreId = body.score_id;
  const giveUp = body.give_up;

  /* 1. User gives up without ever having guessed */
  // Create a score for them and mark it as game over
  if (giveUp && !scoreId) {
    const newScore = await createNewScore(dataSource, gridDate);
    await markGameAsOver(dataSource, newScore.id);
    console.log(`Created new score with ID ${newScore.id} and marked it as game over immediately`);
    return {
      statusCode: 200,
      headers: responseHeaders,
      body: JSON.stringify({ score_id: newScore.id }),
    };
  }

  /* 2. User gives up after having guessed at least once */
  if (giveUp) {
    try {
      await markGameAsOver(dataSource, scoreId);
    } catch (e) {
      if (e instanceof EntityNotFoundError) {
        console.log(`No score found with ID ${scoreId}`);
        return {
          statusCode: 400,
          headers: responseHeaders,
          body: JSON.stringify({ error: `No score found with ID ${scoreId}` }),
        };
      } else {
        throw e;
      }
    }

    console.log(`Ended game with score ID ${scoreId}`);
    return {
      statusCode: 200,
      headers: responseHeaders,
      body: JSON.stringify({ score_id: scoreId }),
    };
  }

  /* 3. User guesses correctly or incorrectly for the first time */
  if (!scoreId) {
    const scoreId = await writeSingleGuessForNewGame(dataSource, gridDate, guess);
    console.log(
      `Created new score with ID ${scoreId} with ${guess.correct ? "correct" : "incorrect"} guess ${guess.credit_type}-${guess.credit_id}`
    );

    return {
      statusCode: 200,
      headers: responseHeaders,
      body: JSON.stringify({ score_id: scoreId }),
    };
  }

  /*** At this point, we know this guess is part of an existing game ***/

  // Just to be safe, check if this score is already marked as game over
  // If so, return an error
  let existingScore = null;
  try {
    existingScore = await getSingleScore(dataSource, scoreId);
  } catch (e) {
    // This exception-catching code is repeated above, but I don't think it's worth refactoring
    if (e instanceof EntityNotFoundError) {
      console.log(`No score found with ID ${scoreId}`);
      return {
        statusCode: 400,
        headers: responseHeaders,
        body: JSON.stringify({ error: `No score found with ID ${scoreId}` }),
      };
    } else {
      throw e;
    }
  }

  if (existingScore.game_over) {
    console.log(`Cannot guess; game with score ID ${scoreId} is already over`);
    return {
      statusCode: 400,
      headers: responseHeaders,
      body: JSON.stringify({ error: "Cannot guess; game is already over" }),
    };
  }

  /* 4. User guesses correctly or incorrectly after having guessed at least once */
  // Determine how many guesses have already been made for this game
  const previousGuessCount = await countGuessesForScore(dataSource, scoreId);

  // Record this guess
  await writeSingleGuess(dataSource, gridDate, guess, scoreId);
  console.log(`Added guess to existing score with ID ${scoreId}`);

  /* 4a. User guesses for the last (9th) time */
  // If this was the last guess, mark the game as over
  const MAX_GUESSES = 9;
  const outOfGuesses = previousGuessCount >= MAX_GUESSES - 1;
  if (outOfGuesses) {
    await markGameAsOver(dataSource, scoreId);
    console.log(`Ended game with score ID ${scoreId} after using all guesses`);
  }

  return {
    statusCode: 200,
    headers: responseHeaders,
    body: JSON.stringify({ score_id: scoreId }),
  };
};

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
