#!/bin/bash
# This file is in the 'lambdas' directory because it is used as the user data script for the EC2 instance that
# is started by the 'populate data store' Lambda function.

### Record the starting time
START_TIME=$(date +%s)

### Move to home directory
cd ~

### Install necessary packages
sudo dnf update -y
sudo dnf install -y jq git npm amazon-cloudwatch-agent

### Configure and start CloudWatch Logs agent

# Create CloudWatch Logs configuration file
sudo bash -c 'cat <<EOL > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json
{
  "logs": {
    "logs_collected": {
      "files": {
        "collect_list": [
          {
            "file_path": "/var/log/cloud-init-output.log",
            "log_group_name": "/ec2-instance/cloud-init-output",
            "log_stream_name": "{instance_id}",
            "timestamp_format": "%Y-%m-%d %H:%M:%S"
          }
        ]
      }
    }
  }
}
EOL'

# Start the CloudWatch Logs agent
sudo /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -s -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json

### Set up environment variables
# Get the TMDB API key from Secrets Manager
export TMDB_API_KEY=$(aws secretsmanager get-secret-value --secret-id "dev/tmdb-api-key" --query "SecretString" --output text | jq -r '.TMDB_API_KEY')

# Get the RDS information from Secrets Manager
RDS_INFO=$(aws secretsmanager get-secret-value --secret-id "dev/rds/postgres" --query "SecretString" --output text)
RDS_INFO_PARSED=$(echo $RDS_INFO | jq -r '.')

# Store the RDS information in environment variables
export POSTGRES_HOST=$(echo $RDS_INFO_PARSED | jq -r '.host')
export POSTGRES_PORT=$(echo $RDS_INFO_PARSED | jq -r '.port')
export POSTGRES_USER=$(echo $RDS_INFO_PARSED | jq -r '.username')
export POSTGRES_PASSWORD=$(echo $RDS_INFO_PARSED | jq -r '.password')
export POSTGRES_DB=$(echo $RDS_INFO_PARSED | jq -r '.dbname')

### Download and run the script
# Clone the repo
git clone https://github.com/jkclark/Immaculate-Movie-Grid.git

# Move to the project directory
cd Immaculate-Movie-Grid/grid_generation

# Install the required packages
npm install

# Run the script
npx ts-node ./src/populateDataStore.ts movies

### Shutdown the instance using the metadata service V2
# Get session token
TOKEN=`curl -X PUT "http://169.254.169.254/latest/api/token" -H "X-aws-ec2-metadata-token-ttl-seconds: 21600"`

# Log the total time taken
END_TIME=$(date +%s)
ELAPSED_TIME=$((END_TIME - START_TIME))
HOURS=$((ELAPSED_TIME / 3600))
MINUTES=$(( (ELAPSED_TIME % 3600) / 60 ))
SECONDS=$((ELAPSED_TIME % 60))
ELAPSED_TIME_FORMATTED=$(printf "%02d:%02d:%02d" $HOURS $MINUTES $SECONDS)
echo "Time elapsed: $ELAPSED_TIME_FORMATTED"

# Shutdown the instance
aws ec2 terminate-instances --instance-ids $(curl -H "X-aws-ec2-metadata-token: $TOKEN" -v http://169.254.169.254/latest/meta-data/instance-id) --region us-east-1
