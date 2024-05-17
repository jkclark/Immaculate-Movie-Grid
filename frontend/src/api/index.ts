import { APIGatewayProxyEvent, Context, Handler } from 'aws-lambda';

export const handler: Handler = async (event: APIGatewayProxyEvent, context: Context) => {
    console.log('EVENT: \n' + JSON.stringify(event, null, 2));
    return context.logStreamName;
};
