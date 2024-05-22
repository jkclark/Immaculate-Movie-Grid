import { useState } from "react";
import { SearchResult as SearchResultData } from "../../../common/src/interfaces";

interface SearchResultProps extends SearchResultData {
  checkAnswerFunc: (type: "movie" | "tv", id: number) => boolean;
  setTextAndImageFunc: (type: "movie" | "tv" | "actor", id: number, text: string) => void;
  release_year?: string;
  first_air_year?: string;
  last_air_year?: string;
}

const SearchResult: React.FC<SearchResultProps> = ({
  media_type,
  id,
  title,
  release_year,
  first_air_year,
  last_air_year,
  checkAnswerFunc,
  setTextAndImageFunc,
}) => {
  const [isWrong, setIsWrong] = useState(false);

  function handleClick(event: React.MouseEvent) {
    event.preventDefault();  // For whatever reason the button refreshes the page without this
    if (checkAnswerFunc(media_type, id)) {
      setTextAndImageFunc(media_type, id, title);
    } else {
      setIsWrong(true);
    }
  }

  const emoji = media_type === "movie" ? "📽️" : "📺";
  const dateString = media_type === "movie" ? release_year : `${first_air_year} - ${last_air_year}`;

  return (
    <div className={"bg-gray-800 p-4 shadow-lg border border-gray-600 text-sm hover:bg-gray-700 flex justify-between items-center"}>
      <div className={`${isWrong ? "text-red-700" : "text-white"}`}>
        <span className="text-lg font-bold">{`${emoji} ${title}`}</span>
        <span className="text-sm text-gray-500 block">{`(${dateString})`}</span>
      </div>
      <button onClick={handleClick} className={`${isWrong ? "invisible" : ""} bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded`}>
        Select
      </button>
    </div>
  );
}

export default SearchResult;
