import { atom } from "jotai";
import { GridExport } from "../../common/src/interfaces";
import { AnyGridDisplayData } from "./gridDisplayData";

export const gridDataAtom = atom<GridExport>({} as GridExport);
export const guessesRemainingAtom = atom(9);
export const gameOverAtom = atom(false);
export const selectedRowAtom = atom(-1);
export const selectedColAtom = atom(-1);
export const usedAnswersAtom = atom<{ type: "movie" | "tv"; id: number }[]>([]);
export const finalGameGridDisplayDataAtom = atom<AnyGridDisplayData[][]>([[]]);
