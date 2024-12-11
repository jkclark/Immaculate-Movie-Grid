import { APIGatewayProxyEvent, Context, Handler } from "aws-lambda";

import { initializeDataSource } from "common/src/db/connect";
import {
  countGuessesForScore,
  createNewScore,
  endGame,
  getSingleScore,
  writeSingleGuess,
  writeSingleGuessForNewGame,
} from "common/src/db/stats";
import { EntityNotFoundError } from "typeorm";

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
  const gaveUp = body.give_up;

  /* 1. User gives up without ever having guessed */
  // Create a score for them and mark it as game over
  if (gaveUp && !scoreId) {
    const newScore = await createNewScore(dataSource, gridDate);
    await endGame(dataSource, newScore.id);
    console.log(`Created new score with ID ${newScore.id} and marked it as game over immediately`);
    return {
      statusCode: 200,
      headers: responseHeaders,
      body: JSON.stringify({ score_id: newScore.id }),
    };
  }

  /* 2. User gives up after having guessed at least once */
  if (gaveUp) {
    try {
      await endGame(dataSource, scoreId);
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
    console.log(`Created new score with ID ${scoreId}`);

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
  console.log(`Added guess to score with ID ${scoreId}`);

  /* 4a. User guesses for the last (9th) time */
  // If this was the last guess, mark the game as over
  const MAX_GUESSES = 9;
  const outOfGuesses = previousGuessCount >= MAX_GUESSES - 1;
  if (outOfGuesses) {
    await endGame(dataSource, scoreId);
    console.log(`Ended game with score ID ${scoreId}`);
  }

  return {
    statusCode: 200,
    headers: responseHeaders,
    body: JSON.stringify({ score_id: scoreId }),
  };
};
