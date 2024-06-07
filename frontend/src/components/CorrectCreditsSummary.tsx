import React from "react";
import { CreditExport } from "../../../common/src/interfaces";
import CreditDetails from "./CreditDetails";
import { useOverlayStack } from "./Overlay";

interface CorrectCreditsSummaryProps {
  credits: CreditExport[];
}

const CorrectCreditsSummary: React.FC<CorrectCreditsSummaryProps> = ({ credits }) => {
  const { popOverlayContents } = useOverlayStack();

  const movies = credits.filter((credit) => credit.type === "movie");
  const tvShows = credits.filter((credit) => credit.type === "tv");

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className="flex flex-col md:flex-row bg-white dark:bg-gray-800 w-4/5 md:w-2/3 max-w-[800px] h-1/2 rounded-lg shadow-lg p-2 md:p-6 relative"
    >
      <CreditList title="Movies" credits={movies} />
      <CreditList title="TV Shows" credits={tvShows} />
      <svg
        onClick={() => popOverlayContents()}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        className="h-6 w-6 absolute top-2 right-2 cursor-pointer hover:text-blue-500"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    </div>
  );
};

interface CreditListProps {
  title: string;
  credits: CreditExport[];
}

const CreditList: React.FC<CreditListProps> = ({ title, credits }) => {
  const { addContentsToOverlay } = useOverlayStack();

  return (
    <div className="flex flex-col w-full md:w-1/2 mx-3 text-center overflow-auto max-h-[desiredHeight]">
      <h2 className="text-xl font-bold mb-4">{title}</h2>
      <ul className="mb-8 flex flex-col">
        {credits.map((credit) => (
          <li
            key={credit.id}
            onClick={() => addContentsToOverlay(<CreditDetails credit={credit} />)}
            className="text-gray-700 dark:text-gray-300 flex items-center justify-between cursor-pointer mb-2"
          >
            <div className="flex-1 overflow-hidden">
              <p className="truncate whitespace-nowrap">{credit.name}</p>
            </div>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-6 w-6 ml-2 hover:text-blue-500"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12" y2="8" />
            </svg>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default CorrectCreditsSummary;
