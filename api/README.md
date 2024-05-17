Note: `dotenv` isn't really a dependency of this project, but `common` uses it. Zipping dependencies for both `api` and `common` has proven too difficult, so I've just added `dotenv` as a dependency here.

The `build-and-zip` script is for transpiling TS to JS and subsequently zipping the JS and its dependencies. I was using this to manually upload to Lambda for testing.
