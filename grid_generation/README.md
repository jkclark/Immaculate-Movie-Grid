# Grid generation

Make sure to read the top-level README.md.

### Run locally

You can run `src/lambdas/generateGridLambda.ts` with `npm run generate-grid -- `, followed by arguments.

### Automatically populating data

EventBridge -> Lambda function -> EC2 instance -> fetch and save data -> EC2 instance terminates itself

### Automatically generating the grid

EventBridge -> Lambda function -> generate grid -> save to S3
