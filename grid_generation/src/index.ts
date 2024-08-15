import * as dotenv from "dotenv";
import "node-fetch";
import * as readline from "readline";

import { ActorExport, CategoryExport, CreditExport, GridExport } from "common/src/interfaces";
import { allCategories, Category } from "./categories";
import { loadGraphFromDB } from "./dbGraph";
import { loadGraphFromFile } from "./fileGraph";
import {
  Connection,
  getGridFromGraph,
  Graph,
  GraphEntity,
  Grid,
  UsedConnectionsWithAxisEntities,
} from "./getGridFromGraph";
import { getAndSaveAllImagesForGrid } from "./images";
import {
  ActorCreditGraph,
  ActorNode,
  CreditNode,
  deepCopyActorCreditGraph,
  getCreditUniqueString,
} from "./interfaces";
import { writeTextToS3 } from "./s3";

dotenv.config();

async function main(): Promise<void> {
  // Read arguments
  const [gridDate, graphMode, refreshData, overwriteImages] = processArgs();
  if (!gridDate || !graphMode) {
    console.error(
      "Usage: npm run generate-grid -- <grid-date> <graph-mode> [--refresh-data] [--overwrite-images]\n" +
        "\ngrid-date should be supplied in the format YYYY-MM-DD\n" +
        "graph-mode should be either 'file' or 'db'\n" +
        "--refresh-data will force a refresh of the graph data\n" +
        "--overwrite-images will ignore existing images in S3\n"
    );
    return;
  }

  let graph: ActorCreditGraph = null;
  if (graphMode === "file") {
    graph = await loadGraphFromFile(refreshData);
  } else if (graphMode === "db") {
    graph = await loadGraphFromDB();
  }

  // Filter the graph to exclude connections that don't pass a given "credit filter"
  const filteredGraph: ActorCreditGraph = prefilterGraph(graph, isLegitMovie);

  // Get a generic graph from the actor credit graph
  const genericGraph: Graph = getGenericGraphFromActorCreditGraph(filteredGraph);

  // Get filtered categories
  // Here we pass the filteredGraph, and not the genericGraph, because the filteredGraph
  // contains Credits, whereas the genericGraph contains Connections. We need the Credits
  // to be able to filter the categories.
  const filteredCategories: { [key: number]: GraphEntity } = getCategoryGraphEntities(
    allCategories,
    filteredGraph
  );

  // Add categories to generic graph
  addCategoriesToGenericGraph(filteredCategories, genericGraph);

  // Set up readline interface
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  // Generate across/down until the user approves
  let grid: Grid;
  do {
    // Get a valid grid from the generic graph
    grid = getGridFromGraph(genericGraph, 3, { actor: 0.5, category: 0.5 }, true);

    // If no valid grid was found, exit
    if (grid.across.length === 0 || grid.down.length === 0) {
      console.log("No valid actor groups found");
      rl.close();
      return;
    }

    printGrid(grid, filteredGraph, filteredCategories);

    // Ask the user if they want to continue
    const answer = await new Promise<string>((resolve) => rl.question("Continue? (y/n) ", resolve));
    if (answer.toLowerCase() === "y") {
      rl.close();
      break;
    }
  } while (true);

  // Get categories with all credits
  const categories: { [key: number]: GraphEntity } = getCategoryGraphEntities(allCategories, graph);

  // Get GridExport from grid, graph, and categories
  const gridExport = getGridExportFromGridGraphAndCategories(grid, graph, categories, gridDate);

  // Get images for actors and credits and save them to S3
  await getAndSaveAllImagesForGrid(gridExport, overwriteImages);

  // Convert to JSON
  const jsonGrid = convertGridToJSON(gridExport);
  console.log(jsonGrid);

  // Write grid to S3
  await writeTextToS3(jsonGrid, "immaculate-movie-grid-daily-grids", `${gridDate}.json`);
}

function processArgs(): [string, "file" | "db" | null, boolean, boolean] {
  const args = process.argv.slice(2);
  let gridDate = null;
  let graphMode: "file" | "db" | null = null;
  let refreshData = false;
  let overwriteImages = false;

  if (args.length < 2) {
    return [gridDate, graphMode, refreshData, overwriteImages];
  }

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--overwrite-images") {
      overwriteImages = true;
    } else if (args[i] === "--refresh-data") {
      refreshData = true;
    } else if (!gridDate) {
      gridDate = args[i];
    } else if (!graphMode) {
      if (args[i] === "file" || args[i] === "db") {
        graphMode = args[i] as "file" | "db";
      } else {
        return [null, null, null, null];
      }
    }
  }

  return [gridDate, graphMode, refreshData, overwriteImages];
}

function prefilterGraph(
  graph: ActorCreditGraph,
  creditFilter: (credit: Connection) => boolean
): ActorCreditGraph {
  console.log("--- Start prefiltering graph ---");

  const numStartingCredits = Object.keys(graph.credits).length;
  const numStartingActors = Object.keys(graph.actors).length;
  console.log(`Starting with ${numStartingActors} actors`);
  console.log(`Starting with ${numStartingCredits} credits`);

  // Remove any credits that don't pass the credit filter
  const filteredGraphNoInvalidCredits = removeInvalidCredits(graph, creditFilter);

  // Remove actors who now have fewer than 3 connections
  const filteredGraphNoInvalidCreditsNoSparseActors = removeActorsWithoutEnoughCredits(
    filteredGraphNoInvalidCredits,
    3
  );

  console.log(
    `Filtered out ${numStartingActors - Object.keys(filteredGraphNoInvalidCreditsNoSparseActors.actors).length} actors`
  );
  console.log(
    `Filtered out ${numStartingCredits - Object.keys(filteredGraphNoInvalidCreditsNoSparseActors.credits).length} credits`
  );
  console.log(`Ending with ${Object.keys(filteredGraphNoInvalidCreditsNoSparseActors.actors).length} actors`);
  console.log(
    `Ending with ${Object.keys(filteredGraphNoInvalidCreditsNoSparseActors.credits).length} credits`
  );
  console.log("--- End prefiltering graph ---");

  return filteredGraphNoInvalidCreditsNoSparseActors;
}

function removeInvalidCredits(
  graph: ActorCreditGraph,
  creditFilter: (credit: Connection) => boolean
): ActorCreditGraph {
  // Copy input graph
  const graphCopy: ActorCreditGraph = deepCopyActorCreditGraph(graph);

  const creditIdsToDeleteByActor: { [actorId: string]: string[] } = {};
  const creditsToDelete: string[] = [];

  // Collect the actor IDs and credit IDs to be deleted
  for (const [creditUniqueString, credit] of Object.entries(graphCopy.credits)) {
    if (!creditFilter(credit)) {
      for (const actorId of Object.keys(credit.connections)) {
        if (!creditIdsToDeleteByActor[actorId]) {
          creditIdsToDeleteByActor[actorId] = [];
        }
        creditIdsToDeleteByActor[actorId].push(creditUniqueString);
      }
      creditsToDelete.push(creditUniqueString);
    }
  }

  // Delete the connections from all actors
  for (const [actorId, creditUniqueStrings] of Object.entries(creditIdsToDeleteByActor)) {
    if (graphCopy.actors[actorId] && graphCopy.actors[actorId].connections) {
      for (const creditUniqueString of creditUniqueStrings) {
        delete graphCopy.actors[actorId].connections[creditUniqueString];
      }
    }
  }

  // Delete the credits from the filtered graph
  for (const creditUniqueString of creditsToDelete) {
    if (graphCopy.credits[creditUniqueString]) {
      delete graphCopy.credits[creditUniqueString];
    }
  }

  return graphCopy;
}

function removeActorsWithoutEnoughCredits(graph: ActorCreditGraph, minCredits: number): ActorCreditGraph {
  // Remove any actors who now have fewer than 3 connections
  const actorsToRemove: string[] = [];
  for (const [actorId, actor] of Object.entries(graph.actors)) {
    if (Object.keys(actor.connections).length < minCredits) {
      actorsToRemove.push(actorId);
    }
  }

  for (const actorId of actorsToRemove) {
    // Remove the actor's connections
    const actor = graph.actors[actorId];
    for (const creditId of Object.keys(actor.connections)) {
      delete graph.credits[creditId].connections[actorId];
    }

    // Remove the actor from the filtered graph
    delete graph.actors[actorId];
  }

  // At this point, it's possible that some credits have no actors
  // because we've removed the last ones, so we need to remove them from the graph
  const creditsToRemove: string[] = [];
  for (const [creditId, credit] of Object.entries(graph.credits)) {
    if (Object.keys(credit.connections).length === 0) {
      creditsToRemove.push(creditId);
    }
  }

  for (const creditId of creditsToRemove) {
    delete graph.credits[creditId];
  }

  return graph;
}

/**
 * Determine if a movie credit is "legit" based on certain criteria.
 *
 * Currently, we check that:
 * - None of the movie's genres are in a list of invalid genres
 * - The movie is not in a list of invalid movies
 *
 * @param credit The credit to check
 * @returns true if the credit is "legit", false otherwise
 */
function isLegitMovie(credit: CreditNode): boolean {
  if (!(credit.type === "movie")) {
    return false;
  }

  const INVALID_MOVIE_GENRE_IDS: number[] = [
    99, // Documentary
  ];
  const isInvalidGenre: boolean = credit.genre_ids.some((id) => INVALID_MOVIE_GENRE_IDS.includes(id));

  const INVALID_MOVIE_IDS: number[] = [
    10788, // Kambakkht Ishq
  ];
  const isInvalidMovie: boolean = INVALID_MOVIE_IDS.includes(parseInt(credit.id));

  // Still need to tweak this
  const MINIMUM_POPULARITY = 40;
  const popularEnough = credit.popularity > MINIMUM_POPULARITY;

  return !isInvalidGenre && !isInvalidMovie && popularEnough;
}

function getGenericGraphFromActorCreditGraph(graph: ActorCreditGraph): Graph {
  // Copy input graph
  const graphCopy: ActorCreditGraph = deepCopyActorCreditGraph(graph);

  const genericGraph: Graph = {
    axisEntities: graphCopy.actors,
    connections: graphCopy.credits,
  };

  // For the generic algorithm, connections' IDs must be the same as their keys
  // in the connections object. This was a problem because we use keys like 'movie-123'
  // everywhere, but the IDs in the connections object are just '123'.
  for (const credit of Object.values(graphCopy.credits)) {
    const uniqueString = getCreditUniqueString(credit);
    genericGraph.connections[uniqueString].id = uniqueString;
  }

  return genericGraph;
}

function getCategoryGraphEntities(
  categories: { [key: number]: Category },
  graph: ActorCreditGraph
): { [key: number]: GraphEntity } {
  const categoryGraphEntities: { [key: number]: GraphEntity } = {};
  for (const [categoryId, category] of Object.entries(categories)) {
    // Create the base object
    const categoryGraphEntity = {
      id: categoryId.toString(), // This is already a string, because object keys are always strings
      name: category.name,
      connections: {},
      entityType: "category",
      incompatibleWith: [],
    };

    if (category.incompatibleWith) {
      categoryGraphEntity.incompatibleWith = category.incompatibleWith.map((id) => id.toString());
    }

    // Iterate over all credits, adding to the connections object if they match the category
    for (const [creditUniqueString, credit] of Object.entries(graph.credits)) {
      if (category.creditFilter(credit)) {
        categoryGraphEntity.connections[creditUniqueString] = graph.credits[creditUniqueString];
      }
    }

    // Add this category to the output object
    categoryGraphEntities[categoryId] = categoryGraphEntity;
  }

  return categoryGraphEntities;
}

function addCategoriesToGenericGraph(categories: { [key: number]: GraphEntity }, genericGraph: Graph): void {
  for (const category of Object.values(categories)) {
    const genericGraphCategory = {
      ...category,
      connections: {},
    };

    // Add the category to the axisEntities object
    genericGraph.axisEntities[category.id] = genericGraphCategory;

    // Point category connections at the generic graph connections
    for (const creditUniqueString in category.connections) {
      genericGraphCategory.connections[creditUniqueString] = genericGraph.connections[creditUniqueString];
    }

    // Add the category to all connections that match it
    for (const creditUniqueString in category.connections) {
      genericGraph.connections[creditUniqueString].connections[category.id] = genericGraphCategory;
    }
  }
}

function printGrid(grid: Grid, graph: ActorCreditGraph, categories: { [key: number]: GraphEntity }): void {
  const [acrossIds, downIds] = [grid.across, grid.down];
  const across = getOriginalGraphEntitiesFromIds(acrossIds, graph, categories);
  const down = getOriginalGraphEntitiesFromIds(downIds, graph, categories);
  const fixedLength = 30;

  // Collect across entities into a single string
  let acrossLine = "".padEnd(fixedLength + 5);
  for (const axisEntity of across) {
    let entityString = "";
    if (axisEntity.entityType === "category") {
      entityString = categories[axisEntity.id].name;
    } else {
      entityString = graph.actors[axisEntity.id].name;
    }
    acrossLine += entityString.padEnd(fixedLength);
  }

  console.log(acrossLine);
  console.log("-".repeat((across.length + 1) * fixedLength));

  // Print down entities and their connections
  for (const axisEntity of down) {
    let lineString = "";

    // Print the axis entity's name
    let entityString = "";
    if (axisEntity.entityType === "category") {
      entityString = categories[axisEntity.id].name;
    } else {
      entityString = graph.actors[axisEntity.id].name;
    }

    lineString += entityString.padEnd(fixedLength);

    // For each of the across axis entities, find the used connection and print its name
    for (const acrossAxisEntity of across) {
      let connectionName = findConnectionName(
        axisEntity.id,
        acrossAxisEntity.id,
        grid.usedConnections,
        graph
      );

      // Truncate the connection name to fit in the fixed length
      // TODO: BUG Sometimes there is no connection... don't know if this is in findConnectionName or grid alg BUG
      // if (connectionName.length > fixedLength) {
      //   connectionName = connectionName.slice(0, fixedLength - 3) + "...";
      // }
      lineString += connectionName.padEnd(fixedLength);
    }

    console.log(lineString);
  }
}

function findConnectionName(
  axisEntityId: string,
  otherAxisEntityId: string,
  usedConnections: UsedConnectionsWithAxisEntities,
  graph: ActorCreditGraph
): string {
  // Because the keys into usedConnections are just the IDs of the connections,
  // we need to iterate over all of the values and see if the two axis entities
  // match the value
  for (const [connectionId, axisEntityIds] of Object.entries(usedConnections)) {
    const [connectionAxisEntityId1, connectionAxisEntityId2] = Array.from(axisEntityIds);
    // We need to check both possible orders of the IDs
    if (
      (connectionAxisEntityId1 === axisEntityId && connectionAxisEntityId2 === otherAxisEntityId) ||
      (connectionAxisEntityId1 === otherAxisEntityId && connectionAxisEntityId2 === axisEntityId)
    ) {
      return graph.credits[connectionId].name;
    }
  }
}

function getGridExportFromGridGraphAndCategories(
  grid: Grid,
  graph: ActorCreditGraph,
  categories: { [key: number]: GraphEntity },
  id: string
): GridExport {
  const originalGraphAcrossEntities = getOriginalGraphEntitiesFromIds(grid.across, graph, categories);
  const originalGraphDownEntities = getOriginalGraphEntitiesFromIds(grid.down, graph, categories);
  const gridAxisEntities = originalGraphAcrossEntities.concat(originalGraphDownEntities);

  // Get the axes, actors, and categories
  const axes: string[] = [];
  const actors: ActorExport[] = [];
  const categoriesExport: CategoryExport[] = [];
  for (const axisEntity of gridAxisEntities) {
    if (axisEntity.entityType === "category") {
      const category: GraphEntity = categories[axisEntity.id];
      // Categories have negative IDs, so make it positive to
      // avoid having two dashes in the string.
      axes.push(`category-${-1 * parseInt(category.id)}`);
      categoriesExport.push({ id: parseInt(category.id), name: category.name });
    } else {
      const actor: ActorNode = graph.actors[axisEntity.id];
      axes.push(`actor-${actor.id}`);
      actors.push({ id: parseInt(actor.id), name: actor.name });
    }
  }

  // Sort each half of axes to have all categories appear after all actors
  const across = axes.slice(0, grid.across.length);
  const down = axes.slice(grid.across.length);
  const sortedAcross = sortAxisActorsFirst(across);
  const sortedDown = sortAxisActorsFirst(down);
  const axesActorsFirst = sortedAcross.concat(sortedDown);

  // Create empty answer lists for each axis entity
  const answers: { [key: number]: { type: "movie" | "tv"; id: number }[] } = {};
  for (const axisEntity of gridAxisEntities) {
    answers[axisEntity.id] = [];
  }

  // Create empty credits list
  const credits: CreditExport[] = [];

  // Add all credits that are shared by across and down pairs
  for (const acrossAxisEntity of originalGraphAcrossEntities) {
    for (const downAxisEntity of originalGraphDownEntities) {
      // Only iterate over the axis entity with fewer connections
      // This is particularly useful when a category with a lot of connections is present
      const [axisEntityWithFewerConnections, axisEntityWithMoreConnections] =
        Object.keys(acrossAxisEntity.connections).length < Object.keys(downAxisEntity.connections).length
          ? [acrossAxisEntity, downAxisEntity]
          : [downAxisEntity, acrossAxisEntity];
      for (const creditUniqueString of Object.keys(axisEntityWithFewerConnections.connections)) {
        if (axisEntityWithMoreConnections.connections[creditUniqueString]) {
          const creditIdNum = parseInt(creditUniqueString.split("-")[1]);
          const credit = graph.credits[creditUniqueString];
          // Create the credit if it doesn't already exist
          const creditExport = {
            type: credit.type,
            id: creditIdNum,
            name: credit.name,
          };
          if (
            !credits.find(
              (existingCredit) => existingCredit.id === creditIdNum && existingCredit.type === credit.type
            )
          ) {
            credits.push(creditExport);
          }

          // Add this credit to both axis entities' answers
          const answer = { type: creditExport.type, id: creditExport.id };
          answers[acrossAxisEntity.id].push(answer);
          answers[downAxisEntity.id].push(answer);
        }
      }
    }
  }

  return {
    id,
    axes: axesActorsFirst,
    actors,
    categories: categoriesExport,
    credits,
    answers,
  };
}

function sortAxisActorsFirst(axis: string[]): string[] {
  const actors = axis.filter((entity) => entity.startsWith("actor"));
  const categories = axis.filter((entity) => entity.startsWith("category"));
  return actors.concat(categories);
}

function getOriginalGraphEntitiesFromIds(
  axisEntityIds: string[],
  graph: ActorCreditGraph,
  allCategories: { [key: number]: GraphEntity }
): GraphEntity[] {
  return axisEntityIds.map((id) => {
    return getOriginalGraphEntityFromId(id, graph, allCategories);
  });
}

function getOriginalGraphEntityFromId(
  id: string,
  graph: ActorCreditGraph,
  allCategories: { [key: number]: GraphEntity }
): GraphEntity {
  const idNum = parseInt(id);
  if (idNum < 0) {
    return allCategories[idNum.toString()];
  } else {
    return graph.actors[idNum.toString()];
  }
}

/**
 * Convert a Grid object to a JSON string.
 *
 * @param grid The Grid object to convert to JSON
 * @returns The JSON string representation of the Grid object
 */
function convertGridToJSON(grid: GridExport): string {
  return JSON.stringify(grid);
}

main();
