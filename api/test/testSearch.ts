import { handler as searchHandler } from '../src/search';

async function main() {
  const searchResults = await searchHandler({
    queryStringParameters: {
      query: "The Office"
    }
  }, null, null);

  console.log(searchResults);
}

main();
