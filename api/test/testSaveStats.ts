import { handler as saveStatsHandler } from "../src/saveStats";

async function main() {
  const gridDate = new Date("9998-12-31:12:00:00Z").toISOString();
  const response = await saveStatsHandler(
    {
      pathParameters: {
        gridDate: gridDate,
      },
      body: JSON.stringify({
        answers: [
          {
            across_index: 0,
            down_index: 0,
            credit_id: 2088,
            credit_type: "movie",
            correct: true,
          },
          {
            across_index: 0,
            down_index: 0,
            credit_id: 155,
            credit_type: "movie",
            correct: false,
          },
        ],
      }),
    },
    null,
    null
  );

  console.log(response);
}

main();
