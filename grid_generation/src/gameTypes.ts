/* Specifies the type of game we're getting data for or the type of grid we're generating. */
export enum GameType {
  MOVIES = "movies",
}

/**
 * Determine if the given string is a valid game type.
 *
 * @param gameType the game type to check
 * @returns true if the game type is valid, false otherwise
 */
export function isValidGameType(gameType: string): boolean {
  return Object.values(GameType).includes(gameType as GameType);
}

export class InvalidGameTypeError extends Error {
  constructor(gameType: string) {
    super(`Invalid game type: ${gameType}`);
  }
}
