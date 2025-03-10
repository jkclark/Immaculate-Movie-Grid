import { Credit, CreditNode, CreditRating, CreditType } from "./interfaces";
import { getMovieRating, getTVDetails, getTVRating } from "./tmdbAPI";

export interface CreditExtraInfo {
  type: CreditType;
  id: string;
  rating: CreditRating;
  last_air_date?: string;
}

export async function getAllCreditExtraInfo(credits: {
  [key: string]: CreditNode;
}): Promise<{ [key: string]: CreditExtraInfo }> {
  let creditExtraInfo: { [key: string]: CreditExtraInfo } = {};

  const numCredits = Object.keys(credits).length;
  console.log(`Getting extra info for ${numCredits} credits`);

  let currentCount = 0;
  const tenPercentIncrement = numCredits / 10;
  let nextTenPercentMilestone = tenPercentIncrement;

  const creditKeys = Object.keys(credits);
  const BATCH_SIZE = 75; // Number of requests to send simultaneously

  for (let i = 0; i < creditKeys.length; i += BATCH_SIZE) {
    const batch = creditKeys.slice(i, i + BATCH_SIZE);
    const batchPromises = batch.map(async (creditUniqueString) => {
      const info = await getCreditExtraInfo(credits[creditUniqueString]);
      creditExtraInfo[creditUniqueString] = info;

      currentCount++;
      if (currentCount >= nextTenPercentMilestone) {
        console.log(`Progress: ${((currentCount / numCredits) * 100).toFixed(2)}%`);
        nextTenPercentMilestone += tenPercentIncrement;
      }
    });

    await Promise.all(batchPromises);
  }

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
  const details = await getTVDetails(id);

  return {
    type: "tv",
    id: id,
    rating: await getTVRating(id),
    last_air_date: details.last_air_date || null,
  };
}
