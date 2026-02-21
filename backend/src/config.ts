export const config = {
  // AWS Bedrock configuration
  bedrockRegion: process.env.BEDROCK_REGION || 'ap-northeast-1',
  
  /**
   * Bedrock model IDs for AI inference (service-specific)
   * 
   * Nova Lite (amazon.nova-lite-v1:0):
   * - Used for: Feed suggestions, Editorial columns
   * - Optimized for: Complex reasoning, longer context
   * - Cost: $0.06/1M input tokens, $0.24/1M output tokens
   * 
   * Nova Micro (amazon.nova-micro-v1:0):
   * - Used for: Summaries, Importance calculation, Article filtering
   * - Optimized for: Speed and cost
   * - Cost: $0.035/1M input tokens, $0.14/1M output tokens
   * 
   * Rollback: Set environment variables to Claude 3 Haiku
   * - BEDROCK_MODEL_ID_LITE=anthropic.claude-3-haiku-20240307-v1:0
   * - BEDROCK_MODEL_ID_MICRO=anthropic.claude-3-haiku-20240307-v1:0
   * 
   * @see https://docs.aws.amazon.com/bedrock/latest/userguide/model-ids.html
   */
  bedrockModelIdLite: process.env.BEDROCK_MODEL_ID_LITE || 'amazon.nova-lite-v1:0',
  bedrockModelIdMicro: process.env.BEDROCK_MODEL_ID_MICRO || 'amazon.nova-micro-v1:0',
  
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
  
  // Admin API Key (AWS Secrets Manager)
  adminApiKeySecretName: process.env.ADMIN_API_KEY_SECRET_NAME || 'myrsspress/admin-api-key',
};
