import { EC2Client, RunInstancesCommand } from "@aws-sdk/client-ec2";
import { APIGatewayProxyHandler } from "aws-lambda";

const region = process.env.AWS_REGION || "us-east-1";
const ec2Client = new EC2Client({ region: region });

export const populateDataStoreHandler: APIGatewayProxyHandler = async (event) => {
  try {
    const command = new RunInstancesCommand({
      LaunchTemplate: {
        LaunchTemplateName: "FetchAndSaveAllDataTemplate",
      },
      MinCount: 1,
      MaxCount: 1,
    });

    const response = await ec2Client.send(command);

    return {
      statusCode: 200,
      body: JSON.stringify(response),
    };
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Failed to start EC2 instance", error }),
    };
  }
};
