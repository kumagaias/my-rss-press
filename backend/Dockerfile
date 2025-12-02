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

# Copy built files to Lambda task root
RUN cp -r dist/* ${LAMBDA_TASK_ROOT}/

# Remove devDependencies and source files to reduce image size
RUN npm prune --production && rm -rf src tsconfig.json

# Set the Lambda function handler (points to dist/lambda.js)
CMD ["lambda.handler"]
