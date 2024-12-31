export interface ActorExport {
  id: number;
  name: string;
}

export interface CategoryExport {
  id: number;
  name: string;
}

export interface CreditExport {
  type: "movie" | "tv";
  id: number;
  name: string;
}

export interface GridExport {
  id: string; // this is typically the grid's date

  // axes will contain strings like "actor-4495" or "category-1",
  // which allow the frontend to know which actor or category to use.
  // axes contains both across and down axes' information.
  axes: string[];

  actors: ActorExport[];
  categories: CategoryExport[];
  credits: { [key: string]: CreditExport };

  // A mapping of actor/category ID -> {"movie-123", ...}
  answers: { [key: number]: Set<string> };
}

export interface SearchResult {
  media_type: "movie" | "tv";
  id: number;
  title: string;
  release_date?: string; // Only for movies
  first_air_date?: string; // Only for TV shows
  last_air_date?: string; // Only for TV shows
}

/**
 * Serialize a grid export to a string.
 *
 * Since the answers field is a mapping of ID -> Set of answers, we need to
 * convert the Set to an array before serializing the entire object.
 *
 * @param gridExport the grid export to serialize
 * @returns a string representation of the grid export
 */
export function serializeGridExport(gridExport: GridExport): string {
  const serializableValue = {
    ...gridExport,
    answers: Object.fromEntries(Object.entries(gridExport.answers).map(([k, v]) => [k, Array.from(v)])),
  };
  return JSON.stringify(serializableValue);
}

/**
 * Deserialize a serialized grid export string.
 *
 * We need to convert the answers field from an array to a Set after parsing the JSON.
 *
 * @param serializedGridExport the serialized grid export to deserialize
 * @returns a GridExport object
 */
export function deserializeGridExport(serializedGridExport: string): GridExport {
  // NOTE: typing `parsed` as GridExport is misleading because the answers field will be an array,
  // not a set. It is required to type it as GridExport to avoid TypeScript errors in the following line.
  const parsed: GridExport = JSON.parse(serializedGridExport);
  parsed.answers = Object.fromEntries(Object.entries(parsed.answers).map(([k, v]) => [k, new Set(v)]));
  return parsed;
}
