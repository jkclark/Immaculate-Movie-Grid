# Immaculate-Movie-Grid

Based on https://www.immaculategrid.com/

A diagram describing the architecture can be found [here](https://lucid.app/lucidchart/9244bdd4-6d02-4d62-a731-c3401797f4bf/edit?viewport_loc=-260%2C-98%2C2304%2C1141%2C0_0&invitationId=inv_80f93059-d2f0-4a7a-b150-2c8c06fe559d).

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
