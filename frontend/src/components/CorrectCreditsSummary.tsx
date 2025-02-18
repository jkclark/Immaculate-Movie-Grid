import React, { useEffect, useRef, useState } from "react";

import { CreditExport } from "common/src/interfaces";
import CreditDetails from "./CreditDetails";
import { useOverlayStack } from "./Overlay";

interface CorrectCreditsSummaryProps {
  credits: CreditExport[];
}

const ITEMS_PER_LOAD = 50;

const CorrectCreditsSummary: React.FC<CorrectCreditsSummaryProps> = ({ credits }) => {
  const { popOverlayContents } = useOverlayStack();

  const { movies, tvShows } = getCreditsSplit(credits);

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className="flex flex-col md:flex-row bg-theme-primary w-4/5 md:w-2/3 max-w-[800px] h-1/2 rounded-lg shadow-lg p-3 md:p-6 relative"
    >
      <CreditList title="Movies" credits={movies} />
      <CreditList title="TV Shows" credits={tvShows} />
      <svg
        onClick={() => popOverlayContents()}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        className="h-6 w-6 absolute top-2 right-2 cursor-pointer theme-text hover:text-theme-light-other-1 hover:dark:text-theme-dark-other-1"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    </div>
  );
};

function getCreditsSplit(credits: CreditExport[]): { movies: CreditExport[]; tvShows: CreditExport[] } {
  const movies: CreditExport[] = [];
  const tvShows: CreditExport[] = [];

  for (const credit of credits) {
    if (credit.type === "movie") {
      movies.push(credit);
    } else if (credit.type === "tv") {
      tvShows.push(credit);
    }
  }

  return { movies, tvShows };
}

interface CreditListProps {
  title: string;
  credits: CreditExport[];
}

const CreditList: React.FC<CreditListProps> = ({ title, credits }) => {
  const { addContentsToOverlay } = useOverlayStack();
  const [visibleCredits, setVisibleCredits] = useState<CreditExport[]>([]);
  const [loadMore, setLoadMore] = useState(true);
  const visibleCreditsLengthRef = useRef(0);

  useEffect(() => {
    if (loadMore) {
      const nextCredits = credits.slice(
        visibleCreditsLengthRef.current,
        visibleCreditsLengthRef.current + ITEMS_PER_LOAD
      );
      setVisibleCredits((prevCredits) => [...prevCredits, ...nextCredits]);
      visibleCreditsLengthRef.current += nextCredits.length;
      setLoadMore(false);
    }
  }, [loadMore, credits]);

  const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = event.currentTarget;
    if (scrollTop + clientHeight >= scrollHeight - 10) {
      setLoadMore(true);
    }
  };

  return (
    <div
      className="flex flex-col w-full md:w-1/2 text-center overflow-auto max-h-[desiredHeight]"
      onScroll={handleScroll}
    >
      <h2 className="text-xl font-bold mb-4 theme-text">{title}</h2>
      <ul className="mb-8 flex flex-col">
        {visibleCredits.map((credit, index) => (
          <li
            key={`${credit.type}-${credit.id}-${index}`}
            onClick={() => addContentsToOverlay(<CreditDetails credit={credit} />)}
            className="flex items-center justify-between cursor-pointer mb-2 theme-text hover:text-theme-light-other-1 hover:dark:text-theme-dark-other-1"
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
              className="h-6 w-6 ml-2 hover:text-theme-light-other-1 hover:dark:text-theme-dark-other-1"
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
