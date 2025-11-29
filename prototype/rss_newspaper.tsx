import React, { useState } from 'react';
import { Newspaper, Rss, Sparkles, TrendingUp, AlertCircle, ExternalLink, Download } from 'lucide-react';

const AIRSSNewspaper = () => {
  const [feeds, setFeeds] = useState([
    'https://news.ycombinator.com/rss',
    'https://techcrunch.com/feed/'
  ]);
  const [newFeed, setNewFeed] = useState('');
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newspaper, setNewspaper] = useState(null);
  const [debugInfo, setDebugInfo] = useState('');
  const [interests, setInterests] = useState('');
  const [suggestedFeeds, setSuggestedFeeds] = useState([]);

  const loadDemoNewspaper = () => {
    const demoData = {
      date: new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
      topStories: [
        {
          title: "OpenAI Announces GPT-5 with Revolutionary Reasoning Capabilities",
          summary: "OpenAI has unveiled GPT-5, featuring unprecedented reasoning abilities and multimodal understanding. The model demonstrates breakthrough performance in complex problem-solving tasks and shows significant improvements in factual accuracy. Early testing reveals the system can now handle intricate logical puzzles and mathematical proofs with near-human level competency.",
          importance: 9,
          isClickbait: false,
          topics: ["AI", "Technology", "Machine Learning"],
          link: "https://example.com/gpt5-announcement"
        },
        {
          title: "You Won't Believe What This Startup Did to Raise $100M! (Investors Hate This One Trick)",
          summary: "A controversial new funding strategy has emerged in Silicon Valley, involving unconventional pitch tactics. However, closer examination reveals standard Series B fundraising with minor PR innovations. The headline vastly overstates the novelty of their approach.",
          importance: 3,
          isClickbait: true,
          topics: ["Startups", "Funding", "Silicon Valley"],
          link: "https://example.com/clickbait-funding"
        },
        {
          title: "Major Breakthrough in Quantum Computing: IBM Achieves 1000-Qubit Milestone",
          summary: "IBM researchers have successfully demonstrated a 1000-qubit quantum processor, marking a significant step toward practical quantum advantage. The new system shows improved error correction and coherence times. This development could accelerate applications in drug discovery, cryptography, and optimization problems.",
          importance: 8,
          isClickbait: false,
          topics: ["Quantum Computing", "IBM", "Science"],
          link: "https://example.com/quantum-breakthrough"
        },
        {
          title: "Remote Work Trends Show Unexpected Shift in 2025",
          summary: "New data reveals that hybrid work models have stabilized at 60% of knowledge workers, contrary to predictions of full return-to-office. Companies adopting flexible policies report 23% higher employee satisfaction and 15% improved productivity. The shift is reshaping commercial real estate markets globally.",
          importance: 7,
          isClickbait: false,
          topics: ["Work Culture", "Business", "Trends"],
          link: "https://example.com/remote-work-2025"
        },
        {
          title: "Cybersecurity Alert: New Zero-Day Vulnerability Affects Millions",
          summary: "Security researchers have identified a critical vulnerability in widely-used network infrastructure software. The flaw could allow unauthorized access to sensitive systems. Patches are being rushed out by vendors, and organizations are urged to update immediately.",
          importance: 8,
          isClickbait: false,
          topics: ["Cybersecurity", "Technology", "Security"],
          link: "https://example.com/security-alert"
        }
      ],
      sections: {
        "Technology": [
          {
            title: "Apple Vision Pro 2 Rumors Suggest Major Hardware Upgrades",
            summary: "Reports indicate the next-generation spatial computer will feature improved displays, lighter design, and enhanced battery life. Industry insiders suggest a potential price reduction to increase market adoption.",
            importance: 6,
            link: "https://example.com/vision-pro-2"
          },
          {
            title: "GitHub Copilot X Introduces Multi-File Editing Capabilities",
            summary: "The AI coding assistant now supports simultaneous editing across multiple files with contextual awareness. Developers report 40% faster completion of complex refactoring tasks.",
            importance: 7,
            link: "https://example.com/copilot-x"
          },
          {
            title: "Tesla Bot (Optimus) Begins Limited Production",
            summary: "Tesla has started manufacturing its humanoid robot for internal factory use. Early demonstrations show improved dexterity and autonomous navigation capabilities compared to prototypes.",
            importance: 7,
            link: "https://example.com/tesla-bot"
          },
          {
            title: "Mozilla Launches Privacy-Focused AI Search Engine",
            summary: "The new search engine promises zero tracking and encrypted queries while delivering competitive results. It represents Mozilla's latest effort to provide privacy-respecting alternatives to major tech platforms.",
            importance: 6,
            link: "https://example.com/mozilla-search"
          }
        ],
        "Business": [
          {
            title: "Stripe Valuation Soars to $95B Following Strong Q4 Performance",
            summary: "The payment processing giant reports 35% year-over-year growth, driven by expanding enterprise adoption and international markets. The company hints at potential IPO plans for late 2025.",
            importance: 7,
            link: "https://example.com/stripe-valuation"
          },
          {
            title: "Amazon Announces Major Investment in Sustainable Packaging",
            summary: "The e-commerce leader commits $2B to eliminate single-use plastics by 2027. New biodegradable materials are being tested across fulfillment centers globally.",
            importance: 6,
            link: "https://example.com/amazon-packaging"
          },
          {
            title: "Semiconductor Shortage Finally Eases as New Fabs Come Online",
            summary: "Industry analysts report chip supply returning to normal levels as TSMC and Intel complete new manufacturing facilities. Prices are expected to stabilize throughout 2025.",
            importance: 7,
            link: "https://example.com/chip-shortage"
          }
        ],
        "Science": [
          {
            title: "CRISPR Gene Therapy Shows Promise in Alzheimer's Treatment",
            summary: "Clinical trials demonstrate significant cognitive improvement in early-stage patients. The treatment targets specific genes associated with plaque formation in the brain.",
            importance: 9,
            link: "https://example.com/crispr-alzheimers"
          },
          {
            title: "James Webb Telescope Discovers Potential Biosignatures on Exoplanet",
            summary: "Atmospheric analysis of K2-18b reveals molecules that could indicate biological processes. Scientists emphasize the need for additional observations to confirm findings.",
            importance: 8,
            link: "https://example.com/webb-exoplanet"
          },
          {
            title: "New Battery Technology Promises 10x Energy Density",
            summary: "Researchers develop solid-state lithium-metal batteries with unprecedented capacity. Commercial applications could revolutionize electric vehicles and renewable energy storage within 3-5 years.",
            importance: 8,
            link: "https://example.com/battery-breakthrough"
          }
        ]
      }
    };
    
    setNewspaper(demoData);
    setDebugInfo('Demo mode: Using sample data');
  };

  const addFeed = () => {
    if (newFeed && !feeds.includes(newFeed)) {
      setFeeds([...feeds, newFeed]);
      setNewFeed('');
    }
  };

  const removeFeed = (feed) => {
    setFeeds(feeds.filter(f => f !== feed));
  };

  const suggestFeeds = async () => {
    if (!interests.trim()) return;
    
    setLoading(true);
    try {
      // Call AI to suggest feeds based on interests
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          messages: [{
            role: 'user',
            content: `Based on these interests/keywords: "${interests}"
            
Suggest 5-8 relevant RSS feed URLs. Include a mix of:
- Major news sources
- Tech blogs
- Industry-specific feeds
- Niche publications

Return ONLY a JSON array with this structure (no markdown):
[
  {
    "url": "https://example.com/feed",
    "name": "Example Blog",
    "description": "Brief description"
  }
]`
          }]
        })
      });

      const data = await response.json();
      let content = data.content[0].text.trim();
      
      // Clean up response
      if (content.startsWith('```json')) {
        content = content.replace(/```json\n?/, '').replace(/```\n?$/, '');
      } else if (content.startsWith('```')) {
        content = content.replace(/```\n?/, '').replace(/```\n?$/, '');
      }
      
      const suggested = JSON.parse(content);
      setSuggestedFeeds(suggested);
    } catch (error) {
      console.error('Error suggesting feeds:', error);
      // Fallback to dummy feeds for demo
      const dummyFeeds = generateDummyFeeds(interests);
      setSuggestedFeeds(dummyFeeds);
    }
    setLoading(false);
  };

  const generateDummyFeeds = (keyword) => {
    const k = keyword.toLowerCase();
    const feedDatabase = {
      'ai': [
        { url: 'https://openai.com/blog/rss', name: 'OpenAI Blog', description: 'Latest AI research and updates' },
        { url: 'https://www.anthropic.com/news/rss', name: 'Anthropic News', description: 'AI safety and research' },
        { url: 'https://deepmind.google/blog/rss', name: 'DeepMind Blog', description: 'AI breakthroughs' },
      ],
      'tech': [
        { url: 'https://techcrunch.com/feed/', name: 'TechCrunch', description: 'Tech startup news' },
        { url: 'https://www.theverge.com/rss/index.xml', name: 'The Verge', description: 'Technology news and reviews' },
        { url: 'https://arstechnica.com/feed/', name: 'Ars Technica', description: 'Technology journalism' },
      ],
      'startup': [
        { url: 'https://techcrunch.com/startups/feed/', name: 'TechCrunch Startups', description: 'Startup ecosystem news' },
        { url: 'https://news.ycombinator.com/rss', name: 'Hacker News', description: 'Tech community discussions' },
        { url: 'https://www.producthunt.com/feed', name: 'Product Hunt', description: 'New product launches' },
      ],
      'crypto': [
        { url: 'https://cointelegraph.com/rss', name: 'Cointelegraph', description: 'Cryptocurrency news' },
        { url: 'https://cryptoslate.com/feed/', name: 'CryptoSlate', description: 'Blockchain analysis' },
      ],
      'design': [
        { url: 'https://www.smashingmagazine.com/feed/', name: 'Smashing Magazine', description: 'Web design resources' },
        { url: 'https://www.designernews.co/?format=rss', name: 'Designer News', description: 'Design community' },
      ],
      'science': [
        { url: 'https://www.nature.com/nature.rss', name: 'Nature', description: 'Scientific research' },
        { url: 'https://www.sciencedaily.com/rss/all.xml', name: 'ScienceDaily', description: 'Science news' },
      ]
    };

    // Find matching category
    for (const [category, feedList] of Object.entries(feedDatabase)) {
      if (k.includes(category)) {
        return feedList;
      }
    }

    // Default tech feeds
    return [
      { url: 'https://news.ycombinator.com/rss', name: 'Hacker News', description: 'Tech news aggregator' },
      { url: 'https://techcrunch.com/feed/', name: 'TechCrunch', description: 'Technology news' },
      { url: 'https://www.theverge.com/rss/index.xml', name: 'The Verge', description: 'Tech culture and reviews' },
    ];
  };

  const addSuggestedFeed = (feedUrl) => {
    if (!feeds.includes(feedUrl)) {
      setFeeds([...feeds, feedUrl]);
    }
  };

  const generateNewspaper = async () => {
    setLoading(true);
    try {
      // Fetch RSS feeds
      const feedPromises = feeds.map(async (feedUrl) => {
        try {
          const response = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feedUrl)}`);
          const data = await response.json();
          return data.items || [];
        } catch (error) {
          console.error(`Error fetching ${feedUrl}:`, error);
          return [];
        }
      });

      const allArticles = (await Promise.all(feedPromises)).flat();
      setArticles(allArticles);

      // Call Claude API to analyze and generate newspaper
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 4000,
          messages: [{
            role: 'user',
            content: `Analyze these RSS articles and create a personalized morning newspaper. For each article:
1. Summarize in 2-3 sentences
2. Rate importance (1-10)
3. Detect if it's clickbait (yes/no)
4. Extract key topics

Articles:
${JSON.stringify(allArticles.slice(0, 20).map(a => ({
  title: a.title,
  description: a.description,
  link: a.link,
  pubDate: a.pubDate
})))}

Return ONLY a JSON object with this structure (no markdown, no preamble):
{
  "date": "current date",
  "topStories": [
    {
      "title": "original title",
      "summary": "your summary",
      "importance": 8,
      "isClickbait": false,
      "topics": ["tech", "AI"],
      "link": "original link"
    }
  ],
  "sections": {
    "Technology": [...articles],
    "Business": [...articles],
    "Science": [...articles]
  }
}`
          }]
        })
      });

      const data = await response.json();
      const content = data.content[0].text;
      
      // Debug: show raw response
      console.log('Raw AI response:', content);
      setDebugInfo(content);
      
      // Clean up the response - remove markdown code blocks if present
      let cleanContent = content.trim();
      if (cleanContent.startsWith('```json')) {
        cleanContent = cleanContent.replace(/```json\n?/, '').replace(/```\n?$/, '');
      } else if (cleanContent.startsWith('```')) {
        cleanContent = cleanContent.replace(/```\n?/, '').replace(/```\n?$/, '');
      }
      
      console.log('Cleaned content:', cleanContent);
      
      const newspaperData = JSON.parse(cleanContent);
      console.log('Parsed data:', newspaperData);
      setNewspaper(newspaperData);
    } catch (error) {
      console.error('Error generating newspaper:', error);
      alert('Error generating newspaper. Please try again.');
    }
    setLoading(false);
  };

  const downloadPDF = () => {
    if (!newspaper) return;
    
    // Check if there's content
    const hasContent = (newspaper.topStories && newspaper.topStories.length > 0) || 
                       (newspaper.sections && Object.values(newspaper.sections).some(arr => arr.length > 0));
    
    if (!hasContent) {
      alert('No content to download. Please generate a new newspaper with valid RSS feeds.');
      return;
    }
    
    // Create a printable version
    const printWindow = window.open('', '_blank');
    const date = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>The Daily AI - ${date}</title>
        <style>
          @page { margin: 2cm; }
          body {
            font-family: 'Georgia', serif;
            line-height: 1.6;
            color: #2d3748;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            text-align: center;
            border-bottom: 4px double #d97706;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          h1 {
            font-size: 48px;
            margin: 0;
            color: #78350f;
            font-weight: bold;
          }
          .subtitle {
            font-style: italic;
            color: #92400e;
            margin-top: 5px;
          }
          .date {
            font-size: 14px;
            color: #92400e;
            margin-top: 10px;
          }
          h2 {
            font-size: 28px;
            color: #78350f;
            border-bottom: 2px solid #fbbf24;
            padding-bottom: 10px;
            margin-top: 40px;
            margin-bottom: 20px;
          }
          .article {
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 1px solid #fcd34d;
          }
          .article:last-child {
            border-bottom: none;
          }
          .article-header {
            display: flex;
            justify-content: space-between;
            align-items: start;
            margin-bottom: 10px;
          }
          h3 {
            font-size: 20px;
            margin: 0 0 10px 0;
            color: #1f2937;
          }
          .badges {
            display: flex;
            gap: 8px;
            flex-shrink: 0;
            margin-left: 15px;
          }
          .badge {
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: bold;
            white-space: nowrap;
          }
          .importance {
            background: #fef3c7;
            color: #92400e;
          }
          .clickbait {
            background: #fee2e2;
            color: #991b1b;
          }
          .summary {
            color: #374151;
            margin-bottom: 10px;
          }
          .topics {
            display: flex;
            gap: 6px;
            flex-wrap: wrap;
            margin-top: 8px;
          }
          .topic {
            background: #fef3c7;
            color: #92400e;
            padding: 2px 8px;
            border-radius: 4px;
            font-size: 11px;
          }
          .link {
            color: #d97706;
            font-size: 12px;
            word-break: break-all;
          }
          .section-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-top: 20px;
          }
          .section-article {
            background: #fffbeb;
            padding: 15px;
            border-radius: 8px;
            page-break-inside: avoid;
          }
          .section-article h4 {
            font-size: 16px;
            margin: 0 0 8px 0;
            color: #1f2937;
          }
          .section-article .summary {
            font-size: 14px;
            margin-bottom: 8px;
          }
          .section-article .meta {
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 12px;
          }
          @media print {
            .article {
              page-break-inside: avoid;
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>📰 The Daily AI</h1>
          <div class="subtitle">Your Personalized Morning Digest, Curated by AI</div>
          <div class="date">${date}</div>
        </div>

        <h2>📈 Top Stories</h2>
        ${newspaper.topStories?.slice(0, 5).map(article => `
          <div class="article">
            <div class="article-header">
              <h3>${article.title}</h3>
              <div class="badges">
                <span class="badge importance">${article.importance}/10</span>
                ${article.isClickbait ? '<span class="badge clickbait">⚠️ Clickbait</span>' : ''}
              </div>
            </div>
            <p class="summary">${article.summary}</p>
            <div class="topics">
              ${article.topics?.map(topic => `<span class="topic">${topic}</span>`).join('') || ''}
            </div>
            <div class="link">🔗 ${article.link}</div>
          </div>
        `).join('') || ''}

        ${Object.entries(newspaper.sections || {}).map(([section, sectionArticles]) => 
          sectionArticles.length > 0 ? `
            <h2>${section}</h2>
            <div class="section-grid">
              ${sectionArticles.map(article => `
                <div class="section-article">
                  <h4>${article.title}</h4>
                  <p class="summary">${article.summary}</p>
                  <div class="meta">
                    <span><strong>${article.importance}/10</strong></span>
                    <span style="color: #d97706;">Read more →</span>
                  </div>
                </div>
              `).join('')}
            </div>
          ` : ''
        ).join('')}

        <script>
          window.onload = () => {
            setTimeout(() => {
              window.print();
            }, 500);
          };
        </script>
      </body>
      </html>
    `;
    
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6 pb-6 border-b-4 border-double border-gray-800">
          <div className="flex items-center justify-center gap-3 mb-2">
            <Newspaper className="w-10 h-10 text-gray-800" />
            <h1 className="text-6xl font-serif font-black text-gray-900" style={{letterSpacing: '-0.02em'}}>The Daily AI</h1>
          </div>
          <p className="text-gray-600 italic text-sm">Your Personalized Morning Digest, Curated by AI</p>
          <div className="flex items-center justify-center gap-4 mt-3">
            <div className="h-px bg-gray-400 w-20"></div>
            <p className="text-xs text-gray-700 font-bold uppercase tracking-wide">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
            <div className="h-px bg-gray-400 w-20"></div>
          </div>
          {!newspaper && (
            <button
              onClick={loadDemoNewspaper}
              className="mt-4 px-6 py-2 bg-gray-800 text-white rounded font-bold hover:bg-gray-900 transition shadow-lg"
            >
              🎭 View Demo Newspaper
            </button>
          )}
        </div>

        {/* Feed Management */}
        {!newspaper && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-2xl font-serif font-bold text-amber-900 mb-4 flex items-center gap-2">
              <Sparkles className="w-6 h-6" />
              Tell Us Your Interests
            </h2>
            
            {/* Interest Input */}
            <div className="mb-6">
              <p className="text-gray-700 mb-3">
                What topics are you interested in? (e.g., "AI and startups", "crypto", "design")
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={interests}
                  onChange={(e) => setInterests(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && suggestFeeds()}
                  placeholder="Enter your interests..."
                  className="flex-1 px-4 py-3 border border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-lg"
                />
                <button
                  onClick={suggestFeeds}
                  disabled={loading || !interests.trim()}
                  className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-bold hover:from-purple-700 hover:to-pink-700 transition disabled:opacity-50"
                >
                  {loading ? 'Finding...' : 'Find Feeds'}
                </button>
              </div>
            </div>

            {/* Suggested Feeds */}
            {suggestedFeeds.length > 0 && (
              <div className="mb-6 p-4 bg-purple-50 rounded-lg">
                <h3 className="font-bold text-purple-900 mb-3 flex items-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  Suggested Feeds for You
                </h3>
                <div className="space-y-2">
                  {suggestedFeeds.map((feed, idx) => (
                    <div key={idx} className="flex items-start justify-between bg-white p-3 rounded-lg shadow-sm">
                      <div className="flex-1">
                        <div className="font-bold text-gray-900">{feed.name}</div>
                        <div className="text-sm text-gray-600">{feed.description}</div>
                        <div className="text-xs text-gray-400 mt-1 truncate">{feed.url}</div>
                      </div>
                      <button
                        onClick={() => addSuggestedFeed(feed.url)}
                        disabled={feeds.includes(feed.url)}
                        className="ml-3 px-4 py-2 bg-amber-600 text-white rounded hover:bg-amber-700 transition disabled:bg-gray-300 disabled:cursor-not-allowed text-sm font-bold whitespace-nowrap"
                      >
                        {feeds.includes(feed.url) ? '✓ Added' : '+ Add'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="border-t border-amber-200 pt-4 mt-4">
              <h3 className="font-bold text-amber-900 mb-3 flex items-center gap-2">
                <Rss className="w-5 h-5" />
                Your RSS Feeds
              </h3>
              
              {/* Manual Add Feed */}
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={newFeed}
                  onChange={(e) => setNewFeed(e.target.value)}
                  placeholder="Or paste RSS feed URL manually..."
                  className="flex-1 px-4 py-2 border border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <button
                  onClick={addFeed}
                  className="px-6 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition"
                >
                  Add Feed
                </button>
              </div>

              {/* Feed List */}
              <div className="space-y-2 mb-4">
                {feeds.map((feed, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-amber-50 p-3 rounded">
                    <span className="text-sm text-amber-800 truncate flex-1">{feed}</span>
                    <button
                      onClick={() => removeFeed(feed)}
                      className="ml-2 px-3 py-1 text-red-600 hover:bg-red-50 rounded"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                {feeds.length === 0 && (
                  <div className="text-center py-4 text-gray-500 text-sm">
                    No feeds added yet. Enter your interests above to get started!
                  </div>
                )}
              </div>
            </div>

            {/* Generate Button */}
            <button
              onClick={generateNewspaper}
              disabled={loading || feeds.length === 0}
              className="w-full py-4 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-lg font-bold text-lg hover:from-amber-700 hover:to-orange-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Generating Your Newspaper...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Generate Morning Newspaper
                </>
              )}
            </button>
          </div>
        )}

        {/* Newspaper View */}
        {newspaper && (
          <div className="space-y-6">
            {/* Debug Info */}
            {debugInfo && (
              <details className="bg-gray-200 rounded p-4 text-xs">
                <summary className="cursor-pointer font-bold mb-2">Debug Info (Click to expand)</summary>
                <pre className="overflow-auto max-h-60 bg-white p-2 rounded">{debugInfo}</pre>
              </details>
            )}

            {/* Main Newspaper Layout */}
            <div className="bg-white shadow-2xl p-8">
              {/* Lead Story - Full Width */}
              {newspaper.topStories?.[0] && (
                <div className="border-b-2 border-gray-900 pb-6 mb-6">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <h2 className="text-4xl font-serif font-black text-gray-900 leading-tight flex-1" style={{lineHeight: '1.1'}}>
                      {newspaper.topStories[0].title}
                    </h2>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="px-3 py-1 bg-gray-900 text-white text-xs font-bold">
                        {newspaper.topStories[0].importance}/10
                      </span>
                      {newspaper.topStories[0].isClickbait && (
                        <span className="px-3 py-1 bg-red-600 text-white text-xs font-bold flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          CLICKBAIT
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="text-lg text-gray-700 leading-relaxed mb-3 font-serif">
                    {newspaper.topStories[0].summary}
                  </p>
                  <div className="flex items-center justify-between border-t border-gray-300 pt-3">
                    <div className="flex gap-2">
                      {newspaper.topStories[0].topics?.map((topic, i) => (
                        <span key={i} className="px-2 py-1 bg-gray-900 text-white text-xs uppercase tracking-wide font-bold">
                          {topic}
                        </span>
                      ))}
                    </div>
                    <a
                      href={newspaper.topStories[0].link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-900 hover:text-gray-600 flex items-center gap-1 text-sm font-bold uppercase"
                    >
                      Read Full Story <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              )}

              {/* Three Column Layout */}
              <div className="grid grid-cols-3 gap-6 border-b border-gray-400 pb-6 mb-6">
                {newspaper.topStories?.slice(1, 4).map((article, idx) => (
                  <div key={idx} className="border-r border-gray-300 pr-4 last:border-r-0 last:pr-0">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-xl font-serif font-bold text-gray-900 leading-tight">
                        {article.title}
                      </h3>
                      {article.isClickbait && (
                        <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 ml-2" />
                      )}
                    </div>
                    <p className="text-sm text-gray-700 mb-3 font-serif leading-relaxed">
                      {article.summary}
                    </p>
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-gray-900">{article.importance}/10</span>
                      <a
                        href={article.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-900 hover:underline uppercase font-bold"
                      >
                        More →
                      </a>
                    </div>
                  </div>
                ))}
              </div>

              {/* Section Headlines - Two Column */}
              {Object.entries(newspaper.sections || {}).map(([section, sectionArticles], sectionIdx) => (
                sectionArticles.length > 0 && (
                  <div key={section} className={`${sectionIdx > 0 ? 'border-t border-gray-400 pt-6 mt-6' : ''}`}>
                    <h2 className="text-3xl font-serif font-black text-gray-900 mb-4 pb-2 border-b-2 border-gray-900 uppercase">
                      {section}
                    </h2>
                    
                    <div className="grid grid-cols-2 gap-6">
                      {sectionArticles.map((article, idx) => (
                        <div key={idx} className={`${idx % 2 === 0 ? 'border-r border-gray-300 pr-6' : 'pl-0'}`}>
                          <h4 className="text-lg font-serif font-bold text-gray-900 mb-2 leading-tight">
                            {article.title}
                          </h4>
                          <p className="text-sm text-gray-700 mb-2 font-serif">
                            {article.summary}
                          </p>
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-gray-900">Priority: {article.importance}/10</span>
                            <a
                              href={article.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-gray-900 hover:underline uppercase font-bold"
                            >
                              Read More →
                            </a>
                          </div>
                          {idx < sectionArticles.length - 1 && (
                            <div className="border-b border-gray-200 my-4"></div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )
              ))}

              {/* Newspaper Footer */}
              <div className="border-t-2 border-gray-900 mt-8 pt-4 text-center">
                <p className="text-xs text-gray-600 uppercase tracking-wide">
                  Curated by Artificial Intelligence • All stories analyzed and summarized automatically
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <button
                onClick={downloadPDF}
                className="flex-1 py-3 bg-gray-900 text-white rounded font-bold hover:bg-gray-800 transition flex items-center justify-center gap-2"
              >
                <Download className="w-5 h-5" />
                Download as PDF
              </button>
              <button
                onClick={() => {
                  setNewspaper(null);
                  setArticles([]);
                }}
                className="flex-1 py-3 bg-gray-200 text-gray-900 rounded font-bold hover:bg-gray-300 transition"
              >
                Generate New Newspaper
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIRSSNewspaper;