import DBGraphHandler from "./graph_handlers/dbGraphHandler";
import GraphHandler from "./graph_handlers/graphHandler";

interface fetchDataArgs {
  graphMode: "db";
}

async function main(args: fetchDataArgs) {
  const graphHandler = getGraphHandler(args);

  await graphHandler.init();

  await graphHandler.populateDataStore();
}

function getGraphHandler(args: fetchDataArgs): GraphHandler {
  if (args.graphMode === "db") {
    return new DBGraphHandler();
  }
}

function processCLIArgs(): fetchDataArgs {
  const args = process.argv.slice(2);
  if (args.length < 1) {
    throw new Error("Usage: npx ts-node populateDataStore.ts <graphMode>");
  }

  if (args[0] !== "db") {
    throw new Error("graphMode must be 'db'");
  }

  const graphMode = args[0];

  return {
    graphMode,
  };
}

if (require.main === module) {
  main(processCLIArgs());
}
