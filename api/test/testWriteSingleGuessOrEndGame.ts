import { handler } from "../src/writeSingleGuessOrEndGame";

async function main() {
  const event = {
    pathParameters: {
      gridDate: "9999-01-01T12:00:00Z",
    },
    body: JSON.stringify({
      // across_index: 0,
      // down_index: 0,
      // credit_id: 675,
      // credit_type: "movie",
      // correct: true,
      // score_id: 8,
      give_up: true,
    }),
  };
  handler(event, null, null);
}

main();
