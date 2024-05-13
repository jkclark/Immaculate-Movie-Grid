# Immaculate-Movie-Grid
Based on https://www.immaculategrid.com/

### Architecture notes
I'm using AWS CodePipeline to deploy changes to the repo automatically. In order to only deploy
the `frontend/dist` folder of the repository, I'm using AWS CodeBuild by adding an intermediate stage
whose output is only the files in that folder. The only reason I need to do this is that I cannot
specify an index file for my S3-hosted static website that contains a prefix (e.g., `website/`).
Maybe a future option is to run the build (`npm run build`) during deployment, so I don't have
to stage the `frontend/dist` folder at all.

### Required environment variables
- `TMDB_API_KEY`
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_REGION`
