import { SearchResult as SearchResultData } from "../../../common/src/interfaces";

interface SearchResultProps extends SearchResultData {
  isLast: boolean;
}

const SearchResult: React.FC<SearchResultProps> = ({ media_type, title, isLast }) => {
  return (
    <div className={`bg-gray-800 text-white p-4 shadow-lg border border-gray-600 text-sm hover:bg-gray-700 flex justify-between items-center ${isLast ? 'rounded-b-md' : ''}`}>
      <span>{`${media_type}: ${title}`}</span>
      <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
        Select
      </button>
    </div>
  );
}

export default SearchResult;
