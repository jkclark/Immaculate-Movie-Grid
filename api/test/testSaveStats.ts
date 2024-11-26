import { handler as saveStatsHandler } from "../src/saveStats";

async function main() {
  // const gridDate = new Date("9999-01-01:00:00:00Z");
  const gridDate = new Date("9998-12-31:12:00:00Z");
  const response = await saveStatsHandler(
    {
      body: JSON.stringify({
        gridDate: gridDate,
        answers: [
          {
            grid_date: gridDate,
            across_index: 0,
            down_index: 0,
            credit_id: 2088,
            credit_type: "movie",
            correct: true,
          },
          {
            grid_date: gridDate,
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
