import { getCreditUniqueString, Graph } from "./graph";
import { Credit } from "./interfaces";
import { getMovieRating, getTVRating } from "./tmdbAPI";

export interface CreditExtraInfo {
  type: "movie" | "tv";
  id: number;
  rating: "G" | "PG" | "PG-13" | "R" | "TV-Y" | "TV-Y7" | "TV-G" | "TV-PG" | "TV-14" | "TV-MA" | "NR";
}

export type CreditRating =
  | "G"
  | "PG"
  | "PG-13"
  | "R"
  | "TV-Y"
  | "TV-Y7"
  | "TV-G"
  | "TV-PG"
  | "TV-14"
  | "TV-MA"
  | "NR";

export async function getAllCreditExtraInfo(graph: Graph): Promise<{ [key: string]: CreditExtraInfo }> {
  const creditExtraInfo: { [key: string]: CreditExtraInfo } = {};

  for (const credit of Object.values(graph.credits)) {
    creditExtraInfo[getCreditUniqueString(credit)] = await getCreditExtraInfo(credit);
  }

  return creditExtraInfo;
}

export async function getCreditExtraInfo(credit: Credit): Promise<CreditExtraInfo> {
  if (credit.type === "movie") {
    return getMovieExtraInfo(credit.id);
  }

  return getTVExtraInfo(credit.id);
}

async function getMovieExtraInfo(id: number): Promise<CreditExtraInfo> {
  return {
    type: "movie",
    id: id,
    rating: await getMovieRating(id),
  };
}

async function getTVExtraInfo(id: number): Promise<CreditExtraInfo> {
  return {
    type: "tv",
    id: id,
    rating: await getTVRating(id),
  };
}
