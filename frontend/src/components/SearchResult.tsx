import { SearchResult as SearchResultData } from "../../../common/src/interfaces";

const SearchResult: React.FC<SearchResultData> = ({ media_type, title }) => {
  return <div>{`${media_type}: ${title}`}</div>;
}

export default SearchResult;
