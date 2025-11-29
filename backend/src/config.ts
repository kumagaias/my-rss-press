export const config = {
  // AWS Bedrock設定
  bedrockRegion: process.env.BEDROCK_REGION || 'ap-northeast-1',
  
  // DynamoDB設定
  dynamodbTable: process.env.DYNAMODB_TABLE || 'newspapers-local',
  
  // 環境判定
  isLocal: process.env.NODE_ENV !== 'production',
  
  // Bedrockキャッシュ設定（ローカル開発時のコスト削減）
  enableCache: process.env.ENABLE_BEDROCK_CACHE !== 'false',
  
  // Bedrockモックモード（オフライン開発用）
  useMockBedrock: process.env.USE_BEDROCK_MOCK === 'true',
  
  // DynamoDBエンドポイント（ローカル開発用）
  dynamodbEndpoint: process.env.DYNAMODB_ENDPOINT,
};
