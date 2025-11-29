export interface FeedSuggestion {
  url: string;
  title: string;
  reasoning: string;
}

export interface Article {
  title: string;
  description: string;
  link: string;
  pubDate: Date;
  imageUrl?: string;
  importance: number;
}

export interface LayoutCell {
  article: Article;
  row: number;
  col: number;
  rowSpan: number;
  colSpan: number;
  fontSize: 'large' | 'medium' | 'small';
}
