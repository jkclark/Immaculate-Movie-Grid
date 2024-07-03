import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";
import { GridExport } from "../../common/src/interfaces";
import { YOUR_ANSWERS_TAB_TEXT } from "./constants";
import { AnyGridDisplayData } from "./gridDisplayData";

function getAtomWithStorageInit<T>(key: string, initialValue: T) {
  return atomWithStorage(key, initialValue, undefined, { getOnInit: true });
}

export const gridIdAtom = getAtomWithStorageInit("gridId", "");
export const gridDataAtom = getAtomWithStorageInit<GridExport>("gridData", {} as GridExport);
export const guessesRemainingAtom = getAtomWithStorageInit("guessesRemaining", 9);
export const gameOverAtom = getAtomWithStorageInit("gameOver", false);
export const activeTabAtom = getAtomWithStorageInit<string>("activeTab", YOUR_ANSWERS_TAB_TEXT);
export const selectedRowAtom = atom(-1);
export const selectedColAtom = atom(-1);
export const usedAnswersAtom = getAtomWithStorageInit<{ type: "movie" | "tv"; id: number }[]>(
  "usedAnswers",
  []
);
export const finalGameGridDisplayDataAtom = getAtomWithStorageInit<AnyGridDisplayData[][]>(
  "finalGameGridDisplayData",
  [[]]
);
