import { handler as saveStatsHandler } from "../src/saveStats";

async function main() {
  const image = await saveStatsHandler({}, null, null);
  console.log(image);
}

main();
