# Use AWS Lambda Node.js 20 base image
FROM public.ecr.aws/lambda/nodejs:20

# Copy package files
COPY package*.json ./

# Install production dependencies
RUN npm install --production

# Copy built application code
COPY dist/ ./

# Set the Lambda function handler
CMD ["lambda.handler"]
