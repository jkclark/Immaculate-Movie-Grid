import { handler as readGridStatsHandler } from "../src/readGridStats";

async function main() {
  const gridDate = new Date("9999-01-01:12:00:00Z").toISOString();
  const response = await readGridStatsHandler(
    {
      pathParameters: {
        gridDate: gridDate,
      },
    },
    null,
    null
  );

  console.log(response);
}

main();
