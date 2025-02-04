import { useAtomValue } from "jotai";
import debounce from "lodash.debounce";
import { useCallback, useEffect, useRef, useState } from "react";
import { PiFilmSlate } from "react-icons/pi";

import { SearchResult as SearchResultData } from "common/src/interfaces";
import { hitAPIGet } from "../api";
import { usedAnswersAtom } from "../state";
import SearchResult from "./SearchResult";

const SearchBar: React.FC = () => {
  const [inputText, setInputText] = useState("");
  const [previousInputText, setPreviousInputText] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResultData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const usedAnswers = useAtomValue(usedAnswersAtom);

  const fetchResults = useCallback(
    debounce((query) => {
      if (query.length > 0) {
        setIsLoading(true);
        hitAPIGet(`search?query=${encodeURIComponent(query)}`)
          .then((data) => {
            setSearchResults(data.searchResults);
            setPreviousInputText(query);
            setIsLoading(false);
          })
          .catch((error) => {
            console.error(error);
            setIsLoading(false);
          });
      } else {
        setSearchResults([]);
      }
    }, 500),
    []
  ); // dependencies array is empty because fetchResults doesn't depend on any props or state

  useEffect(() => {
    fetchResults(inputText);
  }, [inputText, fetchResults]); // add fetchResults to the dependencies array

  const handleClick = (event: React.MouseEvent) => {
    event.stopPropagation();
  };

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <form
      onClick={handleClick}
      onSubmit={(e) => e.preventDefault()}
      className="w-full max-w-screen-lg px-10 z-30 absolute top-2vh left-1/2 transform -translate-x-1/2"
    >
      <label htmlFor="default-search" className="mb-2 text-sm font-medium sr-only theme-text">
        Search
      </label>
      <div className="relative">
        <div className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none">
          <svg
            className="w-4 h-4 theme-text"
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 20 20"
          >
            <path
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"
            />
          </svg>
        </div>
        <div className="relative">
          <input
            ref={inputRef}
            type="search"
            id="default-search"
            className={`block w-full p-4 ps-10 text-base theme-text border border-theme-light-other-1 rounded bg-theme-primary focus:ring-theme-light-accent focus:border-theme-light-accent dark:border-theme-dark-other-1 placeholder-theme-light-text dark:placeholder-theme-dark-text dark:focus:ring-theme-dark-accent dark:focus:border-theme-dark-accent`}
            placeholder="Search any movie or TV show"
            required
            onChange={(e) => setInputText(e.target.value)}
            autoComplete="off"
          />
          {isLoading && (
            <div className="absolute right-0 top-0 bottom-0 flex items-center justify-end pr-3">
              <PiFilmSlate className="w-6 h-6 animate-spin theme-text" />
            </div>
          )}
          {!isLoading && inputText && inputText === previousInputText && (
            <div className="absolute right-0 top-0 bottom-0 flex items-center justify-end pr-3 text-sm theme-text">
              <p>{searchResults.length} results </p>
            </div>
          )}
          <div className="absolute w-full max-h-72 overflow-auto rounded-b-sm">
            {inputText &&
              inputText === previousInputText &&
              searchResults &&
              searchResults.map((result, index) => {
                // Do not show results that have already been used
                if (
                  Object.values(usedAnswers).some(
                    (usedAnswer) => usedAnswer.type === result.media_type && usedAnswer.id === result.id
                  )
                ) {
                  return null;
                }

                if (result.media_type === "movie") {
                  return (
                    <SearchResult key={index} {...result} release_year={result.release_date?.split("-")[0]} />
                  );
                }

                return (
                  <SearchResult
                    key={index}
                    {...result}
                    first_air_year={result.first_air_date?.split("-")[0]}
                    last_air_year={result.last_air_date?.split("-")[0]}
                  />
                );
              })}
          </div>
        </div>
      </div>
    </form>
  );
};

export default SearchBar;
