import { Credit } from "./interfaces";

/**
 * In order not to conflict with actors, categories are given negative IDs.
 */
export interface Category {
  id: number;
  name: string;
  creditFilter: (credit: Credit) => boolean;
}

export const ratedRCategory: Category = {
  id: -1,
  name: "Rated R",
  creditFilter: (credit) => credit.rating === "R",
};

export const allCategories: { [key: number]: Category } = {
  [ratedRCategory.id]: ratedRCategory,
};
