#!/bin/bash
apt-get update

### Clone the GitHub repository
git clone https://github.com/jkclark/Immaculate-Movie-Grid.git

### Set up environment variables
# Install jq to parse JSON
apt-get install -y jq

# Get the TMDB API key from Secrets Manager
export TMDB_API_KEY=$(aws secretsmanager get-secret-value --secret-id "dev/tmdb-api-key" --query "SecretString" --output text | jq -r '.')

# Get the RDS information from Secrets Manager
RDS_INFO=$(aws secretsmanager get-secret-value --secret-id "dev/rds/postgres")

# Store the RDS information in environment variables
export POSTGRES_HOST=$(echo $RDS_INFO | jq -r '.host')
export POSTGRES_PORT=$(echo $RDS_INFO | jq -r '.port')
export POSTGRES_USER=$(echo $RDS_INFO | jq -r '.username')
export POSTGRES_PASSWORD=$(echo $RDS_INFO | jq -r '.password')
export POSTGRES_DB=movie_grid

### Run the script
# Move to the project directory
cd Immaculate-Movie-Grid/grid_generation

# Install the required packages
npm install

# Run the script
npx ts-node ./src/fetchAndSaveAllData.ts

### Shutdown the instance
aws ec2 terminate-instances --instance-ids $(curl -s http://169.254.169.254/latest/meta-data/instance-id)
