import { Credit } from "./interfaces";

/**
 * In order not to conflict with actors, categories are given negative IDs.
 */
export interface Category {
  id: number;
  name: string;
  creditFilter: (credit: Credit) => boolean;
}

const ratedRCategory: Category = {
  id: -1,
  name: "Rated R or TV-MA",
  creditFilter: (credit) => credit.rating === "R" || credit.rating === "TV-MA",
};

const ReleasedIn21stCenturyCategory: Category = {
  id: -2,
  name: "Released in the 21st century",
  // Technically, we could just parseInt the whole of credit.release_date, but this is more readable.
  creditFilter: (credit) => parseInt(credit.release_date.split("-")[0]) >= 2000,
};

export const allCategories: { [key: number]: Category } = {
  [ratedRCategory.id]: ratedRCategory,
  [ReleasedIn21stCenturyCategory.id]: ReleasedIn21stCenturyCategory,
};
