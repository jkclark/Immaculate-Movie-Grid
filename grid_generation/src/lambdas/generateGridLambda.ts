import { APIGatewayProxyEvent, Context, Handler } from "aws-lambda";

import { GameType, InvalidGameTypeError, isValidGameType } from "common/src/gameTypes";
import PostgreSQLMovieDataStoreHandler from "src/adapters/data_store_handlers/movies/postgreSQLMovieDataStoreHandler";
import { isCreditValidForGridGen } from "src/adapters/graph/movies";
import { generateGrid, GridGenArgs } from "../generateGrid";

interface EventGridGenArgs {
  gameType: GameType;
  gridSize: number;
  gridDate: string;
  autoYes: boolean;
  autoRetry: boolean;
  overwriteImages: boolean;
}

interface EventWithGridGenArgs extends APIGatewayProxyEvent, EventGridGenArgs {}

export const generateGridHandler: Handler = async (event: EventWithGridGenArgs, context: Context) => {
  const gridGenArgs: GridGenArgs = processEventArgs(event);

  await generateGrid(gridGenArgs);

  return {
    statusCode: 200,
  };
};

function processEventArgs(event: EventWithGridGenArgs): GridGenArgs {
  /* Make sure gameType is valid */
  if (!isValidGameType(event.gameType)) {
    throw new InvalidGameTypeError(event.gameType);
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
  let connectionFilter;
  if (event.gameType === GameType.MOVIES) {
    dataStoreHandler = new PostgreSQLMovieDataStoreHandler();
    connectionFilter = isCreditValidForGridGen;
  }

  return {
    dataStoreHandler,
    connectionFilter,
    gridSize: event.gridSize,
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
  autoYes: boolean;
  autoRetry: boolean;
  overwriteImages: boolean;
}

function processCLIArgs(): ParsedCLIArgs {
  const args = process.argv.slice(2);
  let gameType: GameType = null;
  let gridSize: number = null;
  let gridDate = null;
  let autoYes: boolean = false;
  let autoRetry: boolean = false;
  let overwriteImages = false;

  const usageMessage =
    "\n**************************************************\n" +
    "Usage: npm run generate-grid -- <game-type> <grid-size> <grid-date> [--auto-yes] [--auto-retry] [--overwrite-images]\n\n" +
    `game-type          must be one of: [${Object.values(GameType).join(", ")}]\n` +
    "grid-size          the length of one side of the grid (e.g., 3 for a 3x3 grid)\n" +
    "grid-date          in the format YYYY-MM-DD\n" +
    "--auto-yes         accept generated grids automatically\n" +
    "--auto-retry       try again in the event of a failure to generate a grid\n" +
    "--overwrite-images ignore existing images in S3\n" +
    "\n" +
    "**************************************************\n";

  /* gameType, gridSize and gridDate are required, everything else is not */
  if (args.length < 3) {
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
    }
  }

  if (!gameType || !gridSize || !gridDate) {
    throw new Error(`Either gameType or gridSize or gridDate is missing/invalid\n${usageMessage}`);
  }

  return {
    gameType,
    gridSize,
    gridDate,
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
  customEvent.autoYes = cliArgs.autoYes;
  customEvent.autoRetry = cliArgs.autoRetry;
  customEvent.overwriteImages = cliArgs.overwriteImages;

  generateGridHandler(customEvent, null, null);
}
