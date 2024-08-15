import { Credit } from "./interfaces";

/**
 * In order not to conflict with actors, categories are given negative IDs.
 */
export interface Category {
  id: number;
  name: string;
  creditFilter: (credit: Credit) => boolean;
  incompatibleWith?: number[];
}

const ratedRCategory: Category = {
  id: -1,
  name: "Rated R or TV-MA",
  creditFilter: (credit) => credit.rating === "R" || credit.rating === "TV-MA",
};

const releasedIn21stCenturyCategory: Category = {
  id: -2,
  name: "Released in the 21st century",

  // Technically, we could just parseInt the whole of credit.release_date, but this is more readable.
  creditFilter: (credit) => parseInt(credit.release_date.split("-")[0]) >= 2000,

  // We would refer to releasedBefore21stCenturyCategory.id, but it's not defined yet
  incompatibleWith: [-3],
};

const releasedBefore21stCenturyCategory: Category = {
  id: -3,
  name: "Released before the 21st century",
  // Technically, we could just parseInt the whole of credit.release_date, but this is more readable.
  creditFilter: (credit) => parseInt(credit.release_date.split("-")[0]) < 2000,

  incompatibleWith: [releasedIn21stCenturyCategory.id],
};

const comedyCategory: Category = {
  id: -4,
  name: "Comedy",
  creditFilter: (credit) => credit.genre_ids.includes(35),
};

export const allCategories: { [key: number]: Category } = {
  [ratedRCategory.id]: ratedRCategory,
  [releasedIn21stCenturyCategory.id]: releasedIn21stCenturyCategory,
  [releasedBefore21stCenturyCategory.id]: releasedBefore21stCenturyCategory,
  [comedyCategory.id]: comedyCategory,
};
