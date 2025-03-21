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

/**
 * Serialize a grid into a string.
 *
 * Since the answers field is a mapping of ID -> Set of answers, we need to
 * convert the Set to an array before serializing the entire object.
 *
 * @param grid the grid export to serialize
 * @returns a string representation of the grid export
 */
export function serializeGrid(grid: Grid): string {
  const serializableValue = {
    ...grid,
    answers: Object.fromEntries(Object.entries(grid.answers).map(([k, v]) => [k, Array.from(v)])),
  };
  return JSON.stringify(serializableValue);
}

/**
 * Deserialize a serialized grid string.
 *
 * We need to convert the answers field from an array to a Set after parsing the JSON.
 *
 * @param serializedGrid the serialized grid export to deserialize
 * @returns a GridExport object
 */
export function deserializeGrid(serializedGrid: string): Grid {
  // NOTE: typing `parsed` as GridExport is misleading because the answers field will be an array,
  // not a set. It is required to type it as GridExport to avoid TypeScript errors in the following line.
  const parsed: Grid = JSON.parse(serializedGrid);
  parsed.answers = Object.fromEntries(Object.entries(parsed.answers).map(([k, v]) => [k, new Set(v)]));
  return parsed;
}
