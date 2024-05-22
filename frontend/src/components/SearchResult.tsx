import { SearchResult as SearchResultData } from "../../../common/src/interfaces";

interface SearchResultProps extends SearchResultData {
  checkAnswerFunc: (type: "movie" | "tv", id: number) => boolean;
  setTextAndImageFunc: (type: "movie" | "tv" | "actor", id: number, text: string) => void;
}

const SearchResult: React.FC<SearchResultProps> = ({ media_type, id, title, checkAnswerFunc, setTextAndImageFunc }) => {
  function handleClick(event: React.MouseEvent) {
    event.preventDefault();  // For whatever reason the button refreshes the page without this
    if (checkAnswerFunc(media_type, id)) {
      setTextAndImageFunc(media_type, id, title);
    }
  }

  return (
    <div className={"bg-gray-800 text-white p-4 shadow-lg border border-gray-600 text-sm hover:bg-gray-700 flex justify-between items-center"}>
      <span>{`${media_type === "movie" ? "📽️" : "📺"} ${title}`}</span>
      <button onClick={handleClick} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
        Select
      </button>
    </div>
  );
}

export default SearchResult;
