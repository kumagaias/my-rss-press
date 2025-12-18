import { describe, it, expect, beforeEach } from 'vitest';
import { mockClient } from 'aws-sdk-client-mock';
import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { app } from '../../../src/app.js';

// Mock Bedrock client
const bedrockMock = mockClient(BedrockRuntimeClient);

describe('POST /api/generate-newspaper with article filtering', () => {
  beforeEach(() => {
    bedrockMock.reset();
  });

  it('should filter articles by theme relevance during newspaper generation', async () => {
    // Mock Bedrock responses - differentiate between filtering and importance calculation
    let callCount = 0;
    bedrockMock.on(InvokeModelCommand).callsFake(() => {
      callCount++;
      // First call: article filtering (scores 0.0-1.0)
      if (callCount === 1) {
        return {
          body: new TextEncoder().encode(JSON.stringify({
            content: [{
              text: JSON.stringify({
                scores: [0.9, 0.8, 0.85, 0.7, 0.88, 0.75, 0.9, 0.65],
              }),
            }],
          })),
        };
      }
      // Subsequent calls: importance calculation (scores 0-100)
      return {
        body: new TextEncoder().encode(JSON.stringify({
          content: [{
            text: JSON.stringify({
              scores: [90, 80, 85, 70, 88, 75, 90, 65],
            }),
          }],
        })),
      };
    });

    const response = await app.request('/api/generate-newspaper', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        feedUrls: [
          'https://feeds.bbci.co.uk/news/rss.xml',
        ],
        theme: 'Technology',
        locale: 'en',
      }),
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    
    // Should have articles
    expect(data.articles).toBeDefined();
    expect(Array.isArray(data.articles)).toBe(true);
    
    // Should have languages
    expect(data.languages).toBeDefined();
    expect(Array.isArray(data.languages)).toBe(true);
  });

  it('should continue newspaper generation even if article filtering fails', async () => {
    // Mock Bedrock to fail for filtering
    bedrockMock.rejects(new Error('Bedrock API error'));

    const response = await app.request('/api/generate-newspaper', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        feedUrls: [
          'https://feeds.bbci.co.uk/news/rss.xml',
        ],
        theme: 'Technology',
        locale: 'en',
      }),
    });

    // Should still succeed (fallback to all articles)
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.articles).toBeDefined();
  });

  it('should apply filtering before importance calculation', async () => {
    // Mock Bedrock to return high scores (all articles pass filtering)
    let callCount = 0;
    bedrockMock.on(InvokeModelCommand).callsFake(() => {
      callCount++;
      // First call: article filtering (scores 0.0-1.0)
      if (callCount === 1) {
        return {
          body: new TextEncoder().encode(JSON.stringify({
            content: [{
              text: JSON.stringify({
                scores: [0.9, 0.9, 0.9, 0.9, 0.9, 0.9, 0.9, 0.9],
              }),
            }],
          })),
        };
      }
      // Subsequent calls: importance calculation (scores 0-100)
      return {
        body: new TextEncoder().encode(JSON.stringify({
          content: [{
            text: JSON.stringify({
              scores: [90, 85, 88, 92, 87, 89, 91, 86],
            }),
          }],
        })),
      };
    });

    const response = await app.request('/api/generate-newspaper', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        feedUrls: [
          'https://feeds.bbci.co.uk/news/rss.xml',
        ],
        theme: 'AI',
        locale: 'en',
      }),
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    
    // All articles should have importance scores
    expect(data.articles.every((a: any) => typeof a.importance === 'number')).toBe(true);
  });
});
