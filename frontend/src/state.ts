import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";

import { Stats } from "common/src/db/stats";
import { GridExport } from "common/src/interfaces";
import { YOUR_ANSWERS_TAB_TEXT } from "./constants";
import { AnyGridDisplayData } from "./gridDisplayData";

function getAtomWithStorageInit<T>(key: string, initialValue: T) {
  return atomWithStorage(key, initialValue, undefined, { getOnInit: true });
}

export const gridIdAtom = getAtomWithStorageInit("gridId", "");
export const gridDataAtom = getAtomWithStorageInit<GridExport>("gridData", {} as GridExport);
export const guessesRemainingAtom = getAtomWithStorageInit("guessesRemaining", 9);
export const gameOverAtom = getAtomWithStorageInit("gameOver", false);
export const activeTabAtom = atom(YOUR_ANSWERS_TAB_TEXT);
export const selectedRowAtom = atom(-1);
export const selectedColAtom = atom(-1);
export const finalGameGridDisplayDataAtom = getAtomWithStorageInit<AnyGridDisplayData[][]>(
  "finalGameGridDisplayData",
  [[]]
);
export const gridStatsAtom = atom<Stats>({});

export const usedAnswersAtom = getAtomWithStorageInit<
  Record<string, { type: "movie" | "tv"; id: number; name: string }>
>("usedAnswers", {});

export function getRowColKey(row: number, col: number) {
  return `row:${row},col:${col}`;
}
