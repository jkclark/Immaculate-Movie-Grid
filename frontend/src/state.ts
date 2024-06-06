import { atom } from "jotai";
import { Grid as GridData } from "../../common/src/interfaces";
import { AnyGridDisplayData } from "./gridDisplayData";

export const gridDataAtom = atom<GridData>({} as GridData);
export const guessesRemainingAtom = atom(9);
export const gameOverAtom = atom(false);
export const selectedRowAtom = atom(-1);
export const selectedColAtom = atom(-1);
export const usedAnswersAtom = atom<{ type: "movie" | "tv"; id: number }[]>([]);
export const finalGameGridDisplayDataAtom = atom<AnyGridDisplayData[][]>([[]]);
