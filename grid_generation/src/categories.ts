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
  creditFilter: (credit) =>
    (credit.release_date && parseInt(credit.release_date.split("-")[0]) >= 2000) ||
    (credit.last_air_date && parseInt(credit.last_air_date.split("-")[0]) >= 2000),

  // We would refer to releasedBefore21stCenturyCategory.id, but it's not defined yet
  incompatibleWith: [-3],
};

const releasedBefore21stCenturyCategory: Category = {
  id: -3,
  name: "Released before the 21st century",
  // Technically, we could just parseInt the whole of credit.release_date, but this is more readable.
  creditFilter: (credit) => credit.release_date && parseInt(credit.release_date.split("-")[0]) < 2000,

  incompatibleWith: [releasedIn21stCenturyCategory.id],
};

const comedyCategory: Category = {
  id: -4,
  name: "Comedy",
  creditFilter: (credit) => credit.genre_ids.includes(35),
};

const animatedCategory: Category = {
  id: -5,
  name: "Animated",
  creditFilter: (credit) => credit.genre_ids.includes(16),
};

const crimeCategory: Category = {
  id: -6,
  name: "Crime",
  creditFilter: (credit) => credit.genre_ids.includes(80),
};

const dramaCategory: Category = {
  id: -7,
  name: "Drama",
  creditFilter: (credit) => credit.genre_ids.includes(18),
};

const fantasyCategory: Category = {
  id: -8,
  name: "Fantasy",
  creditFilter: (credit) => credit.genre_ids.includes(14),
};

const mysteryCategory: Category = {
  id: -9,
  name: "Mystery",
  creditFilter: (credit) => credit.genre_ids.includes(9648),
};

export const allCategories: { [key: number]: Category } = {
  [ratedRCategory.id]: ratedRCategory,
  [releasedIn21stCenturyCategory.id]: releasedIn21stCenturyCategory,
  [releasedBefore21stCenturyCategory.id]: releasedBefore21stCenturyCategory,
  [comedyCategory.id]: comedyCategory,
  [animatedCategory.id]: animatedCategory,
  [crimeCategory.id]: crimeCategory,
  [dramaCategory.id]: dramaCategory,
  [fantasyCategory.id]: fantasyCategory,
  [mysteryCategory.id]: mysteryCategory,
};
