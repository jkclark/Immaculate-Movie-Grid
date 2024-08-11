import fs from "fs";
import { Credit, CreditNode, CreditRating } from "./interfaces";
import { getMovieRating, getTVRating } from "./tmdbAPI";

export interface CreditExtraInfo {
  type: "movie" | "tv";
  id: string;
  rating: CreditRating;
}

export async function getAllCreditExtraInfo(
  credits: { [key: string]: CreditNode },
  refreshData: boolean
): Promise<{ [key: string]: CreditExtraInfo }> {
  let creditExtraInfo: { [key: string]: CreditExtraInfo } = {};

  // If we don't want fresh data and there is already a file with the credit
  // extra info, read it and use that as the starting point
  const CREDIT_EXTRA_INFO_PATH = "./src/complete_credit_extra_info.json";
  if (!refreshData && fs.existsSync(CREDIT_EXTRA_INFO_PATH)) {
    console.log("Credit extra info exists, reading from file");
    creditExtraInfo = readAllCreditExtraInfoFromFile(CREDIT_EXTRA_INFO_PATH);
  }

  // Remove any credit extra info for credits that no longer exist
  pruneCreditExtraInfo(credits, creditExtraInfo);

  // Find all of the credits that need extra information
  const creditsNeedingExtraInfo: Set<string> = new Set();

  // Determine the credits that need extra info
  for (const creditUniqueString of Object.keys(credits)) {
    if (!creditExtraInfo[creditUniqueString]) {
      creditsNeedingExtraInfo.add(creditUniqueString);
    }
  }

  if (creditsNeedingExtraInfo.size === 0) {
    console.log("No credits need extra info");
    return creditExtraInfo;
  }

  const totalCredits = creditsNeedingExtraInfo.size;
  let currentCount = 0;
  const tenPercentIncrement = totalCredits / 10;
  let nextTenPercentMilestone = tenPercentIncrement;

  for (const creditUniqueString of creditsNeedingExtraInfo) {
    currentCount++;
    creditExtraInfo[creditUniqueString] = await getCreditExtraInfo(credits[creditUniqueString]);

    if (currentCount >= nextTenPercentMilestone) {
      console.log(`Progress: ${((currentCount / totalCredits) * 100).toFixed(2)}%`);
      nextTenPercentMilestone += tenPercentIncrement;
    }
  }

  // Write the credit extra info to a file
  writeAllCreditExtraInfoToFile(creditExtraInfo, CREDIT_EXTRA_INFO_PATH);

  return creditExtraInfo;
}

export async function getCreditExtraInfo(credit: Credit): Promise<CreditExtraInfo> {
  if (credit.type === "movie") {
    return getMovieExtraInfo(credit.id);
  }

  return getTVExtraInfo(credit.id);
}

async function getMovieExtraInfo(id: string): Promise<CreditExtraInfo> {
  return {
    type: "movie",
    id: id,
    rating: await getMovieRating(id),
  };
}

async function getTVExtraInfo(id: string): Promise<CreditExtraInfo> {
  return {
    type: "tv",
    id: id,
    rating: await getTVRating(id),
  };
}

/**
 * Remove any credit extra info for a credit that isn't in the credits object
 *
 * It seems that it's possible that TMDB remove some credits from their database,
 * so we need to make sure that we don't have any extra info for credits that no longer exist
 *
 * @param credits All credits in the graph
 * @param creditExtraInfo All credit extra info
 */
function pruneCreditExtraInfo(
  credits: { [key: string]: CreditNode },
  creditExtraInfo: { [key: string]: CreditExtraInfo }
): void {
  const numCredits = Object.keys(credits).length;
  for (const creditUniqueString of Object.keys(creditExtraInfo)) {
    if (!credits[creditUniqueString]) {
      delete creditExtraInfo[creditUniqueString];
    }
  }

  console.log(`Pruned ${numCredits - Object.keys(credits).length} credits from extra info`);
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
