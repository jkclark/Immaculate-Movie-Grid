import { handler as readGridStatsHandler } from "../src/readGridStats";

async function main() {
  const gridDate = new Date("9998-12-31:12:00:00Z").toISOString();
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
