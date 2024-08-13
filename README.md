# Immaculate-Movie-Grid

Based on https://www.immaculategrid.com/

## Local development

Notes:

- If you want to hit the TMDB API (or really use any environment variables), you need to have a `.env` in the directory from which you are executing code.
- When installing new dependencies, they need to be added to both the top-level `package.json` and also any `package.json`'s whose workspaces will use the dependency.

### Required env vars

The following environment variables must be defined (e.g., in a `.env` file) in order to run this code locally:

- `TMDB_API_KEY`
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_REGION`
