import { SearchResult as SearchResultData } from "../../../common/src/interfaces";

interface SearchResultProps extends SearchResultData {
  isLast: boolean;
}

const SearchResult: React.FC<SearchResultProps> = ({ media_type, title, isLast }) => {
  return (
    <div className={`bg-gray-800 text-white p-4 shadow-lg border border-gray-600 text-sm hover:bg-gray-700 ${isLast ? 'rounded-b-md' : ''}`}>
      {`${media_type}: ${title}`}
    </div>
  );
}

export default SearchResult;
