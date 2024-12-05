import { handler as writeGameHandler } from "../src/writeGame";

async function main() {
  const gridDate = new Date("9999-01-01:12:00:00Z").toISOString();
  const response = await writeGameHandler(
    {
      pathParameters: {
        gridDate: gridDate,
      },
      body: JSON.stringify({
        guessIds: [9, 10, 11],
      }),
    },
    null,
    null
  );

  console.log(response);
}

main();
