import React from "react";
import { CreditExport } from "../../../common/src/interfaces";

interface CorrectCreditsSummaryProps {
  credits: CreditExport[];
}

const CorrectCreditsSummary: React.FC<CorrectCreditsSummaryProps> = ({ credits }) => {
  const movies = credits.filter((credit) => credit.type === "movie");
  const tvShows = credits.filter((credit) => credit.type === "tv");

  return (
    <div className="flex flex-col md:flex-row bg-white dark:bg-gray-800 w-4/5 md:w-2/3 max-w-[800px] h-1/2 rounded-lg shadow-lg p-2 md:p-6">
      <div className="flex flex-col w-full md:w-1/2 text-center">
        <h2 className="text-xl font-bold mb-4">Movies</h2>
        <ul className="mb-8 flex flex-col">
          {movies.map((movie) => (
            <li key={movie.id} className="text-gray-700 dark:text-gray-300">
              {movie.name}
            </li>
          ))}
        </ul>
      </div>

      <div className="flex flex-col w-full md:w-1/2 text-center">
        <h2 className="text-xl font-bold mb-4">TV Shows</h2>
        <ul className="flex flex-col">
          {tvShows.map((show) => (
            <li key={show.id} className="text-gray-700 dark:text-gray-300">
              {show.name}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default CorrectCreditsSummary;
