import debounce from "lodash.debounce";
import { useCallback, useEffect, useRef, useState } from "react";
import { PiFilmSlate } from "react-icons/pi";

import { Grid as GridData, SearchResult as SearchResultData } from "../../../common/src/interfaces";
import SearchResult from "./SearchResult";

interface SearchBarProps {
  checkAnswerFunc: (
    type: "movie" | "tv",
    id: number,
    gridData: GridData,
  ) => boolean;
  setTextAndImageFunc: (
    type: "movie" | "tv",
    id: number,
    text: string,
  ) => void;
  gridData: GridData;
  usedAnswers: { type: "movie" | "tv", id: number }[];
}

const SearchBar: React.FC<SearchBarProps> = ({ checkAnswerFunc, setTextAndImageFunc, gridData, usedAnswers }) => {
  const [inputText, setInputText] = useState("");
  const [previousInputText, setPreviousInputText] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResultData[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchResults = useCallback(debounce((query) => {
    if (query.length > 0) {
      setIsLoading(true);
      fetch(`https://api.immaculatemoviegrid.com/dev/search?query=${encodeURIComponent(query)}`)
        .then(response => response.json())
        .then(data => {
          console.log("RESULTS:" + data.searchResults);
          setSearchResults(data.searchResults);
          setPreviousInputText(query);
          setIsLoading(false);
        })
        .catch(error => {
          console.error(error);
          setIsLoading(false);
        });
    } else {
      setSearchResults([]);
    }
  }, 500), []); // dependencies array is empty because fetchResults doesn't depend on any props or state

  useEffect(() => {
    fetchResults(inputText);
  }, [inputText, fetchResults]); // add fetchResults to the dependencies array

  const handleClick = (event: React.MouseEvent) => {
    event.stopPropagation();
  }

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <form onClick={handleClick} onSubmit={e => e.preventDefault()} className="w-full max-w-screen-lg px-10 z-30 absolute top-2vh left-1/2 transform -translate-x-1/2">
      <label htmlFor="default-search" className="mb-2 text-sm font-medium text-gray-900 sr-only dark:text-white">Search</label>
      <div className="relative">
        <div className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none">
          <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20">
            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z" />
          </svg>
        </div>
        <div className="relative">
          <input
            ref={inputRef}
            type="search"
            id="default-search"
            className={`block w-full p-4 ps-10 text-sm text-gray-900 border border-gray-300 rounded bg-gray-50 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500`}
            placeholder="Search any movie or TV show"
            required
            onChange={e => setInputText(e.target.value)}
            autoComplete="off"
          />
          {isLoading && (
            <div className="absolute right-0 top-0 bottom-0 flex items-center justify-end pr-3">
              <PiFilmSlate className="w-6 h-6 animate-spin" />
            </div>
          )}
          {!isLoading && inputText && inputText === previousInputText && (
            <div className="absolute right-0 top-0 bottom-0 flex items-center justify-end pr-3 text-sm text-gray-400">
              <p>{searchResults.length} results </p>
            </div>
          )}
          <div className="absolute w-full max-h-72 overflow-auto rounded-b-sm">
            {inputText && inputText === previousInputText && searchResults && searchResults.map((result, index) => {
              // Do not show results that have already been used
              if (usedAnswers.some(usedAnswer => usedAnswer.type === result.media_type && usedAnswer.id === result.id)) {
                return null;
              }

              if (result.media_type === "movie") {
                return (
                  <SearchResult
                    key={index}
                    {...result}
                    release_year={result.release_date?.split("-")[0]}
                    checkAnswerFunc={checkAnswerFunc}
                    setTextAndImageFunc={setTextAndImageFunc}
                    {...{ gridData }}
                  />
                );
              }

              return (
                <SearchResult
                  key={index}
                  {...result}
                  first_air_year={result.first_air_date?.split("-")[0]}
                  last_air_year={result.last_air_date?.split("-")[0]}
                  checkAnswerFunc={checkAnswerFunc}
                  setTextAndImageFunc={setTextAndImageFunc}
                  {...{ gridData }}
                />
              );
            })}
          </div>
        </div>
      </div>
    </form >
  );
}

export default SearchBar;
