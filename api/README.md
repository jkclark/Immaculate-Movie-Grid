### Run locally

For a given Lambda function in the `src` directory, write a simple test file in the `test` directory (modeled after the others), and run `npx ts-node ./test/test_file_name.ts`

### Notes

The `build-and-zip` script is for transpiling TS to JS and subsequently zipping the JS and its dependencies. I was using this to manually upload to Lambda for testing.

### Things I've learned

- I had to enable an option called "Grant API Gateway permission to invoke your Lambda function", even though I set up this integration through the console. For what reason would I have stepped through that dialogue only to disallow API Gateway from invoking my Lambda function..?
  - See: https://repost.aws/knowledge-center/api-gateway-http-lambda-integrations
