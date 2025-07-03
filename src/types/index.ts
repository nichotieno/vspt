export interface StockQuote {
  c: number; // current price
  d: number; // change
  dp: number; // percent change
  h: number; // high price of the day
  l: number; // low price of the day
  o: number; // open price of the day
  pc: number; // previous close price
  t: number; // timestamp
}

export interface CompanyProfile {
  country: string;
  currency: string;
  exchange: string;
  name: string;
  ticker: string;
  ipo: string;
  marketCapitalization: number;
  shareOutstanding: number;
  logo: string;
  phone: string;
  weburl: string;
  finnhubIndustry: string;
}

export interface StockNews {
  category: string;
  datetime: number;
  headline: string;
  id: number;
  image: string;
  related: string;
  source: string;
  summary: string;
  url: string;
}

export interface PortfolioItem {
  id?: string;
  ticker: string;
  quantity: number;
  avgCost: number;
  name?: string;
  logo?: string;
  currentPrice?: number;
  changePercent?: number;
}

export interface Transaction {
  id?: string;
  ticker: string;
  type: 'BUY' | 'SELL';
  quantity: number;
  price: number;
  date: string;
}

export interface Candle {
    c: number[];
    h: number[];
    l: number[];
    o: number[];
    s: string;
    t: number[];
    v: number[];
}

export interface User {
  uid: string;
  email: string | null;
}

export interface PortfolioHistoryItem {
  id?: string;
  date: string;
  value: number;
}
