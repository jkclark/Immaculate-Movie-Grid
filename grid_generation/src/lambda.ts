import { APIGatewayProxyEvent, Context, Handler } from "aws-lambda";
import { main } from "./index";

interface EventWithGridGenArgs extends APIGatewayProxyEvent {
  graphMode: "file" | "db";
  autoYes: boolean;
  refreshData: boolean;
  overwriteImages: boolean;
  gridDate?: string;
}

export const generateGridHandler: Handler = async (event: EventWithGridGenArgs, context: Context) => {
  await main(...getEventArgs(event));

  return {
    statusCode: 200,
  };
};

function getEventArgs(event: EventWithGridGenArgs): [string, "file" | "db", boolean, boolean, boolean] {
  // If gridDate is not provided, set the date to tomorrow's date
  let gridDate = event.gridDate;
  if (!gridDate) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    gridDate = tomorrow.toISOString().split("T")[0];
  }

  // All other arguments are required, enforce that here
  const required_args = ["graphMode", "autoYes", "refreshData", "overwriteImages"];
  if (!required_args.every((arg) => event.hasOwnProperty(arg))) {
    throw new Error(`Missing required arguments: ${required_args.join(", ")}`);
  }

  return [gridDate, event.graphMode, event.autoYes, event.refreshData, event.overwriteImages];
}

/**
 *******************************************************
 * The code below exists for running the Lambda function locally
 *******************************************************
 */

function processCLIArgs(): [string, "file" | "db" | null, boolean, boolean, boolean] {
  const args = process.argv.slice(2);
  let gridDate = null;
  let graphMode: "file" | "db" | null = null;
  let autoYes: boolean = false;
  let refreshData = false;
  let overwriteImages = false;

  if (args.length < 2) {
    return [gridDate, graphMode, autoYes, refreshData, overwriteImages];
  }

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--overwrite-images") {
      overwriteImages = true;
    } else if (args[i] === "--refresh-data") {
      refreshData = true;
    } else if (args[i] === "--auto-yes") {
      autoYes = true;
    } else if (!gridDate) {
      gridDate = args[i];
    } else if (!graphMode) {
      if (args[i] === "file" || args[i] === "db") {
        graphMode = args[i] as "file" | "db";
      } else {
        console.error(
          "Usage: npm run generate-grid -- <grid-date> <graph-mode> [--refresh-data] [--overwrite-images]\n" +
            "\ngrid-date should be supplied in the format YYYY-MM-DD\n" +
            "graph-mode should be either 'file' or 'db'\n" +
            "--refresh-data will force a refresh of the graph data\n" +
            "--overwrite-images will ignore existing images in S3\n"
        );
        return [null, null, null, null, null];
      }
    }
  }

  return [gridDate, graphMode, autoYes, refreshData, overwriteImages];
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
  const cliArgs = processCLIArgs();
  const customEvent = event as EventWithGridGenArgs;
  customEvent.gridDate = cliArgs[0];
  customEvent.graphMode = cliArgs[1];
  customEvent.autoYes = cliArgs[2];
  customEvent.refreshData = cliArgs[3];
  customEvent.overwriteImages = cliArgs[4];

  main(...getEventArgs(customEvent));
}
