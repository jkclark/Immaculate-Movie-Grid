import { Credit } from "./interfaces";

export interface Category {
  name: string;
  creditFilter: (credit: Credit) => boolean;
}

export const ratedRCategory: Category = {
  name: "Rated R",
  creditFilter: (credit) => credit.rating === "R",
};

export const allCategories: Category[] = [ratedRCategory];
