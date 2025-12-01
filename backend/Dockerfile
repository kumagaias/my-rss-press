# Use AWS Lambda Node.js 20 base image
FROM public.ecr.aws/lambda/nodejs:20

# Copy package files
COPY package*.json ./

# Install all dependencies (including devDependencies for build)
RUN npm install

# Copy source code
COPY src/ ./src/
COPY tsconfig.json ./

# Build TypeScript code
RUN npm run build

# Remove devDependencies to reduce image size
RUN npm prune --production

# Set the Lambda function handler
CMD ["lambda.handler"]
