Note: `dotenv` isn't really a dependency of this project, but `common` uses it. Zipping dependencies for both `api` and `common` has proven too difficult, so I've just added `dotenv` as a dependency here.

The `build-and-zip` script is for transpiling TS to JS and subsequently zipping the JS and its dependencies. I was using this to manually upload to Lambda for testing.

### Things I've learned
- I had to enable an option called "Grant API Gateway permission to invoke your Lambda function", even though I set up this integration through the console. For what reason would I have stepped through that dialogue only to disallow API Gateway from invoking my Lambda function..?
  - See: https://repost.aws/knowledge-center/api-gateway-http-lambda-integrations
