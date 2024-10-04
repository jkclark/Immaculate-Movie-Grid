import path from "path";
import DBGraphHandler from "./graph_handlers/dbGraphHandler";
import FileGraphHandler from "./graph_handlers/fileGraphHandler";
import GraphHandler from "./graph_handlers/graphHandler";

interface fetchDataArgs {
  graphMode: "file" | "db";
}

async function main(args: fetchDataArgs) {
  let graphHandler: GraphHandler = null;
  if (args.graphMode === "file") {
    graphHandler = new FileGraphHandler(
      path.join(__dirname, "complete_graph.json"),
      path.join(__dirname, "complete_credit_extra_info.json")
    );
  } else if (args.graphMode === "db") {
    graphHandler = new DBGraphHandler();
  }

  await graphHandler.init();

  await graphHandler.populateDataStore();
}

function processCLIArgs(): fetchDataArgs {
  const args = process.argv.slice(2);
  if (args.length < 1) {
    throw new Error("Usage: node fetchAndSaveAllData.js <graphMode>");
  }

  if (args[0] !== "file" && args[0] !== "db") {
    throw new Error("graphMode must be either 'file' or 'db'");
  }

  const graphMode = args[0];

  return {
    graphMode,
  };
}

if (require.main === module) {
  main(processCLIArgs());
}
