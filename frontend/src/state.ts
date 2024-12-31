import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";

import { Stats } from "common/src/db/stats";
import { deserializeGridExport, GridExport, serializeGridExport } from "common/src/interfaces";

function getAtomWithStorageInit<T>(key: string, initialValue: T) {
  return atomWithStorage(key, initialValue, undefined, { getOnInit: true });
}

export const gridIdAtom = getAtomWithStorageInit("gridId", "");

// Since a field of this object is going to be a Set, we need to pass in
// custom serialization/deserialization functions
export const gridDataAtom = atomWithStorage("gridData", {} as GridExport, {
  // Upon fetching from storage, deserialize the grid export
  getItem: (key, initialValue: GridExport) => {
    const storedValue = localStorage.getItem(key);
    if (!storedValue) {
      return initialValue;
    }

    const deserialized = deserializeGridExport(storedValue);
    return deserialized;
  },

  // Before storing in storage, serialize the grid export
  setItem: (key, newValue) => {
    localStorage.setItem(key, serializeGridExport(newValue));
  },

  // We have to define this for some reason
  removeItem: (key) => {
    localStorage.removeItem(key);
  },
});

export const guessesRemainingAtom = getAtomWithStorageInit("guessesRemaining", 9);
export const gameOverAtom = getAtomWithStorageInit("gameOver", false);
export const selectedRowAtom = atom(-1);
export const selectedColAtom = atom(-1);

export const usedAnswersAtom = getAtomWithStorageInit<
  Record<string, { type: "movie" | "tv"; id: number; name: string }>
>("usedAnswers", {});

// Holds the ID of the score for the current game
export const scoreIdAtom = getAtomWithStorageInit("scoreId", undefined);

export const gridStatsAtom = atom<Stats>({});

export function getRowColKey(row: number, col: number) {
  return `row:${row},col:${col}`;
}
