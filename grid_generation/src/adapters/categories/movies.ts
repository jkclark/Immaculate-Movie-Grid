/**
 * NOTE: The tooltip text for the categories lives in constants.ts on the frontend.
 */
import { Category } from "src/ports/categories";
import { CreditData } from "../graph/movies";

/**
 * In order not to conflict with actors, categories are given negative IDs.
 */
export interface MovieCategory extends Category {
  connectionFilter: (credit: CreditData) => boolean;
}

const ratedRCategory: MovieCategory = {
  id: -1,
  name: "Rated R or TV-MA",
  connectionFilter: (credit) => credit.rating === "R" || credit.rating === "TV-MA",
};

const releasedIn21stCenturyCategory: MovieCategory = {
  id: -2,
  name: "Released in the 21st century",

  // Technically, we could just parseInt the whole of credit.release_date, but this is more readable.
  connectionFilter: (credit) =>
    (credit.release_date && parseInt(credit.release_date.split("-")[0]) >= 2001) ||
    (credit.last_air_date && parseInt(credit.last_air_date.split("-")[0]) >= 2001),
};

const releasedBefore21stCenturyCategory: MovieCategory = {
  id: -3,
  name: "Released before the 21st century",
  // Technically, we could just parseInt the whole of credit.release_date, but this is more readable.
  connectionFilter: (credit) => credit.release_date && parseInt(credit.release_date.split("-")[0]) < 2001,
};

const comedyCategory: MovieCategory = {
  id: -4,
  name: "Comedy",
  connectionFilter: (credit) => credit.genre_ids.includes(35),
};

const animatedCategory: MovieCategory = {
  id: -5,
  name: "Animated",
  connectionFilter: (credit) => credit.genre_ids.includes(16),
};

const crimeCategory: MovieCategory = {
  id: -6,
  name: "Crime",
  connectionFilter: (credit) => credit.genre_ids.includes(80),
};

const dramaCategory: MovieCategory = {
  id: -7,
  name: "Drama",
  connectionFilter: (credit) => credit.genre_ids.includes(18),
};

const fantasyCategory: MovieCategory = {
  id: -8,
  name: "Sci-Fi/Fantasy",
  connectionFilter: (credit) => {
    // 14 is the genre ID for fantasy
    // 878 is the genre ID for science fiction
    // 10765 is the genre ID for sci-fi & fantasy
    return (
      credit.genre_ids.includes(14) || credit.genre_ids.includes(878) || credit.genre_ids.includes(10765)
    );
  },
};

const mysteryCategory: MovieCategory = {
  id: -9,
  name: "Mystery",
  connectionFilter: (credit) => credit.genre_ids.includes(9648),
};

const TitleHasAtLeast3WordsCategory: MovieCategory = {
  id: -10,
  name: "3+ words in title",
  connectionFilter: (credit) => credit.name.split(/[\s/]+/).length >= 3,
};

export const allMovieCategories: { [key: number]: MovieCategory } = {
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
