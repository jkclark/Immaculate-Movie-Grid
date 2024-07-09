import fs from "fs";
import { Credit, CreditRating, getCreditUniqueString } from "./interfaces";
import { getMovieRating, getTVRating } from "./tmdbAPI";

export interface CreditExtraInfo {
  type: "movie" | "tv";
  id: number;
  rating: CreditRating;
}

export async function getAllCreditExtraInfo(credits: Credit[]): Promise<{ [key: string]: CreditExtraInfo }> {
  const creditExtraInfo: { [key: string]: CreditExtraInfo } = {};

  const totalCredits = Object.values(credits).length;
  let currentCount = 0;
  const tenPercentIncrement = totalCredits / 10;
  let nextTenPercentMilestone = tenPercentIncrement;

  for (const credit of Object.values(credits)) {
    currentCount++;
    creditExtraInfo[getCreditUniqueString(credit)] = await getCreditExtraInfo(credit);

    if (currentCount >= nextTenPercentMilestone) {
      console.log(`Progress: ${((currentCount / totalCredits) * 100).toFixed(2)}%`);
      nextTenPercentMilestone += tenPercentIncrement;
    }
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

export function writeAllCreditExtraInfoToFile(
  allCreditExtraInfo: { [key: string]: CreditExtraInfo },
  path: string
): void {
  fs.writeFileSync(path, JSON.stringify(allCreditExtraInfo));
}

export function readAllCreditExtraInfoFromFile(path: string): { [key: string]: CreditExtraInfo } {
  const json = fs.readFileSync(path, "utf8");
  return JSON.parse(json);
}
