import { GameType } from "./gameTypes";

interface Axes {
  across: string[];
  down: string[];
}

interface Answers {
  [key: string]: Set<string>;
}

export interface Grid {
  id: string;
  gameType: GameType;
  axes: Axes;
  answers: Answers;
}
