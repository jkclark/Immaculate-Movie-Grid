/**
 * This file contains common interfaces for stats-related data.
 */

interface BasicStat {
  value: number;
  displayName: string;
  roundToDigits?: number;
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

export interface AllGivenAnswersForSquare {
  [key: string]: GivenAnswerInfo;
}

export interface GivenAnswerInfo {
  timesUsed: number;
  name: string;
}
