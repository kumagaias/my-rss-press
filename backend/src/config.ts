export const config = {
  // AWS Bedrock configuration
  bedrockRegion: process.env.BEDROCK_REGION || 'ap-northeast-1',
  
  // DynamoDB configuration
  dynamodbTable: process.env.DYNAMODB_TABLE || 'newspapers-local',
  
  // Environment detection
  isLocal: process.env.NODE_ENV !== 'production',
  
  // Bedrock cache configuration (cost reduction for local development)
  enableCache: process.env.ENABLE_BEDROCK_CACHE !== 'false',
  
  // Bedrock mock mode (for offline development)
  useMockBedrock: process.env.USE_BEDROCK_MOCK === 'true',
  
  // DynamoDB endpoint (for local development)
  dynamodbEndpoint: process.env.DYNAMODB_ENDPOINT,
};
