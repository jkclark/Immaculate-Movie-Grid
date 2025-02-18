/**
 * NOTE: The tooltip text for the categories lives in constants.ts on the frontend.
 */
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

const releasedIn21stCenturyCategory: Category = {
  id: -2,
  name: "Released in the 21st century",

  // Technically, we could just parseInt the whole of credit.release_date, but this is more readable.
  creditFilter: (credit) =>
    (credit.release_date && parseInt(credit.release_date.split("-")[0]) >= 2000) ||
    (credit.last_air_date && parseInt(credit.last_air_date.split("-")[0]) >= 2000),
};

const releasedBefore21stCenturyCategory: Category = {
  id: -3,
  name: "Released before the 21st century",
  // Technically, we could just parseInt the whole of credit.release_date, but this is more readable.
  creditFilter: (credit) => credit.release_date && parseInt(credit.release_date.split("-")[0]) < 2000,
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
  name: "Sci-Fi/Fantasy",
  creditFilter: (credit) => {
    // 14 is the genre ID for fantasy
    // 878 is the genre ID for science fiction
    // 10765 is the genre ID for sci-fi & fantasy
    return (
      credit.genre_ids.includes(14) || credit.genre_ids.includes(878) || credit.genre_ids.includes(10765)
    );
  },
};

const mysteryCategory: Category = {
  id: -9,
  name: "Mystery",
  creditFilter: (credit) => credit.genre_ids.includes(9648),
};

const TitleHasAtLeast3WordsCategory: Category = {
  id: -10,
  name: "3+ words in title",
  creditFilter: (credit) => credit.name.split(/[\s/]+/).length >= 3,
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
  [TitleHasAtLeast3WordsCategory.id]: TitleHasAtLeast3WordsCategory,
};
