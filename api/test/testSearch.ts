import { handler as searchHandler } from '../src/search';

async function main() {
  const searchResults = await searchHandler({
    queryStringParameters: {
      query: ""
    }
  }, null, null);

  console.log(searchResults);
}

main();
