import { APIGatewayProxyEvent, Context, Handler } from "aws-lambda";

import { GameType, InvalidGameTypeError, isValidGameType } from "common/src/gameTypes";
import { isCreditValidForGridGen, MOVIES_AXIS_ENTITY_TYPE_WEIGHT_INFO } from "src/adapters/graph/movies";
import PostgreSQLMovieDataStoreHandler from "src/adapters/graph_data_store_handlers/movies/postgreSQLMovieDataStoreHandler";
import PostgreSQLGridExporter from "src/adapters/grid_exporters/postgreSQLGridExporter";
import S3GridExporter from "src/adapters/grid_exporters/s3GridExporter";
import TMDBImageScraper from "src/adapters/image_scrapers/movies/tmdbImageScraper";
import S3ImageStoreHandler from "src/adapters/image_store_handlers/movies/s3ImageStoreHandler";
import { generateGrid, GridGenArgs } from "../generateGrid";

interface EventGridGenArgs {
  gameType: GameType;
  gridSize: number;
  gridDate: string;
  gridBucket: string;
  imageBucket: string;
  autoYes: boolean;
  autoRetry: boolean;
  overwriteImages: boolean;
}

interface EventWithGridGenArgs extends APIGatewayProxyEvent, EventGridGenArgs {}

export const generateGridHandler: Handler = async (event: EventWithGridGenArgs, context: Context) => {
  const gridGenArgs: GridGenArgs = await processEventArgs(event);

  await generateGrid(gridGenArgs);

  return {
    statusCode: 200,
  };
};

async function processEventArgs(event: EventWithGridGenArgs): Promise<GridGenArgs> {
  /* Make sure gameType is valid */
  if (!isValidGameType(event.gameType)) {
    throw new InvalidGameTypeError(event.gameType);
  }

  /* If gridBucket is not provided, error */
  if (!event.gridBucket) {
    throw new Error("Value for gridBucket is required but missing");
  }

  /* If gridDate is not provided, set the date to tomorrow's date */
  let gridDate = event.gridDate;
  if (!gridDate) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    gridDate = tomorrow.toISOString().split("T")[0];
    console.log(`No grid date provided, defaulting to ${gridDate}`);
  } else {
    // Validate date format
    const date = new Date(gridDate);
    if (isNaN(date.getTime())) {
      throw new Error("Invalid date");
    }
  }

  /* Get the adapters for the given game type */
  let dataStoreHandler;
  let imageScraper;
  let imageStoreHandler;
  let connectionFilter;
  let axisEntityTypeWeightInfo;
  let gridExporters;
  if (event.gameType === GameType.MOVIES) {
    // Set up the data store handler
    const postgreSQLdataStoreHandler = new PostgreSQLMovieDataStoreHandler();
    await postgreSQLdataStoreHandler.init();
    dataStoreHandler = postgreSQLdataStoreHandler;

    // Set up image scraper and image store handler
    imageScraper = new TMDBImageScraper();
    imageScraper.getAndSetImagesBaseURL();
    imageStoreHandler = new S3ImageStoreHandler(event.imageBucket);

    // Set up the grid exporters
    const postgreSQLGridExporter = new PostgreSQLGridExporter();
    await postgreSQLGridExporter.init();
    const s3GridExporter = new S3GridExporter(event.gridBucket, `${gridDate}.json`);
    gridExporters = [postgreSQLGridExporter, s3GridExporter];

    // Set up other game-type-specific args
    connectionFilter = isCreditValidForGridGen;
    axisEntityTypeWeightInfo = MOVIES_AXIS_ENTITY_TYPE_WEIGHT_INFO;
  }

  return {
    gameType: event.gameType,
    dataStoreHandler,
    imageScraper,
    imageStoreHandler,
    gridExporters,
    connectionFilter,
    gridSize: event.gridSize,
    axisEntityTypeWeightInfo,
    gridDate,
    autoYes: event.autoYes,
    autoRetry: event.autoRetry,
    overwriteImages: event.overwriteImages,
  };
}

/**
 *******************************************************
 * The code below exists for simulating the Lambda function locally
 *******************************************************
 */

interface ParsedCLIArgs {
  gameType: GameType;
  gridSize: number;
  gridDate: string;
  gridBucket: string;
  imageBucket: string;
  autoYes: boolean;
  autoRetry: boolean;
  overwriteImages: boolean;
}

function processCLIArgs(): ParsedCLIArgs {
  const args = process.argv.slice(2);
  let gameType: GameType = null;
  let gridSize: number = null;
  let gridDate = null;
  let gridBucket = null;
  let imageBucket = null;
  let autoYes: boolean = false;
  let autoRetry: boolean = false;
  let overwriteImages = false;

  const usageMessage =
    "\n**************************************************\n" +
    "Usage: npm run generate-grid -- <game-type> <grid-size> <grid-date> <grid-bucket> [--auto-yes] [--auto-retry] [--overwrite-images]\n\n" +
    `game-type          must be one of: [${Object.values(GameType).join(", ")}]\n` +
    "grid-size          the length of one side of the grid (e.g., 3 for a 3x3 grid)\n" +
    "grid-date          in the format YYYY-MM-DD\n" +
    "grid-bucket        the S3 bucket where the grid will be stored\n" +
    "image-bucket       the S3 bucket where images will be stored\n" +
    "--auto-yes         accept generated grids automatically\n" +
    "--auto-retry       try again in the event of a failure to generate a grid\n" +
    "--overwrite-images ignore existing images in S3\n" +
    "\n" +
    "**************************************************\n";

  /* gameType, gridSize, gridDate, and gridBucket are required, everything else is not */
  if (args.length < 4) {
    throw new Error(`Not enough arguments\n${usageMessage}`);
  }

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--overwrite-images") {
      overwriteImages = true;
    } else if (args[i] === "--auto-yes") {
      autoYes = true;
    } else if (args[i] === "--auto-retry") {
      autoRetry = true;
    } else if (!gameType) {
      if (args[i] === GameType.MOVIES) {
        gameType = args[i] as GameType;
      } else {
        throw new Error(`Invalid game type: ${args[i]}\n${usageMessage}`);
      }
    } else if (!gridSize) {
      gridSize = parseInt(args[i]);
      if (isNaN(gridSize) || gridSize <= 0) {
        throw new Error(`Invalid grid size: ${args[i]}\n${usageMessage}`);
      }
    } else if (!gridDate) {
      gridDate = args[i];
    } else if (!gridBucket) {
      gridBucket = args[i];
    } else if (!imageBucket) {
      imageBucket = args[i];
    }
  }

  if (!gameType || !gridSize || !gridDate || !gridBucket || !imageBucket) {
    throw new Error(
      `At least one of [gameType, gridSize, gridDate, gridBucket, imageBucket] is missing/invalid\n${usageMessage}`
    );
  }

  return {
    gameType,
    gridSize,
    gridDate,
    gridBucket,
    imageBucket,
    autoYes,
    autoRetry,
    overwriteImages,
  };
}

if (require.main === module) {
  // This is an example Lambda event object
  // We don't care about any of its values, we just add our own values to it
  // https://github.com/tschoffelen/lambda-sample-events/blob/master/events/aws/apigateway-aws-proxy.json
  const event: APIGatewayProxyEvent = {
    body: "eyJ0ZXN0IjoiYm9keSJ9",
    resource: "/{proxy+}",
    path: "/path/to/resource",
    httpMethod: "POST",
    isBase64Encoded: true,
    queryStringParameters: {
      foo: "bar",
    },
    multiValueQueryStringParameters: {
      foo: ["bar"],
    },
    pathParameters: {
      proxy: "/path/to/resource",
    },
    stageVariables: {
      baz: "qux",
    },
    headers: {
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
      "Accept-Encoding": "gzip, deflate, sdch",
      "Accept-Language": "en-US,en;q=0.8",
      "Cache-Control": "max-age=0",
      "CloudFront-Forwarded-Proto": "https",
      "CloudFront-Is-Desktop-Viewer": "true",
      "CloudFront-Is-Mobile-Viewer": "false",
      "CloudFront-Is-SmartTV-Viewer": "false",
      "CloudFront-Is-Tablet-Viewer": "false",
      "CloudFront-Viewer-Country": "US",
      Host: "1234567890.execute-api.us-east-1.amazonaws.com",
      "Upgrade-Insecure-Requests": "1",
      "User-Agent": "Custom User Agent String",
      Via: "1.1 08f323deadbeefa7af34d5feb414ce27.cloudfront.net (CloudFront)",
      "X-Amz-Cf-Id": "cDehVQoZnx43VYQb9j2-nvCh-9z396Uhbp027Y2JvkCPNLmGJHqlaA==",
      "X-Forwarded-For": "127.0.0.1, 127.0.0.2",
      "X-Forwarded-Port": "443",
      "X-Forwarded-Proto": "https",
    },
    multiValueHeaders: {
      Accept: ["text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8"],
      "Accept-Encoding": ["gzip, deflate, sdch"],
      "Accept-Language": ["en-US,en;q=0.8"],
      "Cache-Control": ["max-age=0"],
      "CloudFront-Forwarded-Proto": ["https"],
      "CloudFront-Is-Desktop-Viewer": ["true"],
      "CloudFront-Is-Mobile-Viewer": ["false"],
      "CloudFront-Is-SmartTV-Viewer": ["false"],
      "CloudFront-Is-Tablet-Viewer": ["false"],
      "CloudFront-Viewer-Country": ["US"],
      Host: ["0123456789.execute-api.us-east-1.amazonaws.com"],
      "Upgrade-Insecure-Requests": ["1"],
      "User-Agent": ["Custom User Agent String"],
      Via: ["1.1 08f323deadbeefa7af34d5feb414ce27.cloudfront.net (CloudFront)"],
      "X-Amz-Cf-Id": ["cDehVQoZnx43VYQb9j2-nvCh-9z396Uhbp027Y2JvkCPNLmGJHqlaA=="],
      "X-Forwarded-For": ["127.0.0.1, 127.0.0.2"],
      "X-Forwarded-Port": ["443"],
      "X-Forwarded-Proto": ["https"],
    },
    requestContext: {
      authorizer: {
        principalId: "user",
      },
      accountId: "123456789012",
      resourceId: "123456",
      stage: "prod",
      requestId: "c6af9ac6-7b61-11e6-9a41-93e8deadbeef",
      requestTime: "09/Apr/2015:12:34:56 +0000",
      requestTimeEpoch: 1428582896000,
      identity: {
        apiKey: null,
        apiKeyId: null,
        clientCert: null,
        principalOrgId: null,
        cognitoIdentityPoolId: null,
        accountId: null,
        cognitoIdentityId: null,
        caller: null,
        accessKey: null,
        sourceIp: "127.0.0.1",
        cognitoAuthenticationType: null,
        cognitoAuthenticationProvider: null,
        userArn: null,
        userAgent: "Custom User Agent String",
        user: null,
      },
      path: "/prod/path/to/resource",
      resourcePath: "/{proxy+}",
      httpMethod: "POST",
      apiId: "1234567890",
      protocol: "HTTP/1.1",
    },
  };

  // Add the CLI arguments to the event object
  const cliArgs: ParsedCLIArgs = processCLIArgs();
  const customEvent = event as EventWithGridGenArgs;
  customEvent.gameType = cliArgs.gameType;
  customEvent.gridSize = cliArgs.gridSize;
  customEvent.gridDate = cliArgs.gridDate;
  customEvent.gridBucket = cliArgs.gridBucket;
  customEvent.imageBucket = cliArgs.imageBucket;
  customEvent.autoYes = cliArgs.autoYes;
  customEvent.autoRetry = cliArgs.autoRetry;
  customEvent.overwriteImages = cliArgs.overwriteImages;

  generateGridHandler(customEvent, null, null);
}
