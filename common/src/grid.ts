import { GameType } from "./gameTypes";

// Each axis is a list of axis entity IDs
export interface Axes {
  across: string[];
  down: string[];
}

interface Answers {
  // This is a map of axis entity IDs to connection IDs that are valid answers
  // somewhere in the grid
  [key: string]: Set<string>;
}

export interface Grid {
  id: string;
  gameType: GameType;
  axes: Axes;
  answers: Answers;
}
