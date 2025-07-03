
'use server';

const API_KEY = process.env.FINNHUB_API_KEY;
const BASE_URL = 'https://finnhub.io/api/v1';

/**
 * Generic fetcher function for the Finnhub API.
 * Handles API key injection, error handling, and returns mock data if the API key is missing or invalid.
 * @param url - The Finnhub API endpoint URL to fetch.
 * @param mockResponse - The mock response to return in case of an API key issue or fetch error.
 * @returns A promise that resolves to the JSON response from the API or the mock response.
 */
async function fetcher(url: string, mockResponse?: any) {
    if (!API_KEY) {
        console.error("Finnhub API key is not set. Please set FINNHUB_API_KEY. Using mock data.");
        return mockResponse;
    }
    
    // If using the placeholder key, return mock data to prevent crashes and allow UI to render.
    if (API_KEY === 'changeme') {
        await new Promise(resolve => setTimeout(resolve, 300));
        console.warn(`Using placeholder Finnhub API key. Mock data is being used for ${url.split('?')[0]}.`);
        return mockResponse;
    }

    try {
        const res = await fetch(url);
        if (!res.ok) {
            const errorData = await res.json().catch(() => ({ error: 'An unknown error occurred' }));
            const errorMessage = errorData.error || `HTTP error! status: ${res.status}`;
            throw new Error(errorMessage);
        }
        return res.json();
    } catch (error: any) {
        // This catches any error from the try block (network, parsing, etc.)
        // It logs the error and returns mock data, preventing the UI from crashing.
        console.warn(`Finnhub API request failed for URL: ${url.split('&token=')[0]}. Error: ${error.message}. Returning mock data.`);
        return mockResponse;
    }
}

/**
 * Fetches the latest quote for a given stock symbol.
 * @param symbol - The stock ticker symbol.
 * @returns A promise that resolves to the stock quote data.
 */
export async function getQuote(symbol: string) {
    const mock = { c: 0, d: 0, dp: 0, h: 0, l: 0, o: 0, pc: 0, t: 0 };
    return fetcher(`${BASE_URL}/quote?symbol=${symbol}&token=${API_KEY}`, mock);
}

/**
 * Fetches the company profile for a given stock symbol.
 * @param symbol - The stock ticker symbol.
 * @returns A promise that resolves to the company profile data.
 */
export async function getCompanyProfile(symbol: string) {
    const mock = { 
        country: 'US', 
        currency: 'USD', 
        exchange: 'NASDAQ', 
        name: `${symbol} (Mock)`, 
        ticker: symbol, 
        ipo: '', 
        marketCapitalization: 0, 
        shareOutstanding: 0, 
        logo: '', // Use empty string for better fallback
        phone: '', 
        weburl: '', 
        finnhubIndustry: 'Mock Industry' 
    };
    
    const data = await fetcher(`${BASE_URL}/stock/profile2?symbol=${symbol}&token=${API_KEY}`, mock);
    
    // Ensure the final returned object has a non-null logo string,
    // so the Avatar component can handle it gracefully (empty string means use fallback).
    return {
        ...data,
        logo: data?.logo || ''
    };
}

/**
 * Searches for stock symbols matching a given query.
 * @param query - The search query.
 * @returns A promise that resolves to a list of matching symbols.
 */
export async function searchSymbols(query: string) {
    const mock = { result: [] };
    return fetcher(`${BASE_URL}/search?q=${query}&token=${API_KEY}`, mock);
}

/**
 * Fetches recent company news for a given stock symbol.
 * @param symbol - The stock ticker symbol.
 * @returns A promise that resolves to a list of news articles.
 */
export async function getStockNews(symbol: string) {
    const today = new Date();
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(today.getDate() - 7);
    const from = oneWeekAgo.toISOString().split('T')[0];
    const to = today.toISOString().split('T')[0];
    const mock: any[] = [];
    return fetcher(`${BASE_URL}/company-news?symbol=${symbol}&from=${from}&to=${to}&token=${API_KEY}`, mock);
}

/**
 * Fetches historical candle data for a stock.
 * @param symbol - The stock ticker symbol.
 * @param resolution - The candle resolution ('D' for daily, 'W' for weekly, 'M' for monthly).
 * @param from - The start date as a UNIX timestamp.
 * @param to - The end date as a UNIX timestamp.
 * @returns A promise that resolves to the candle data.
 */
export async function getStockCandles(symbol: string, resolution: string, from: number, to: number) {
  const mock = { s: 'no_data' };
  return fetcher(`${BASE_URL}/stock/candle?symbol=${symbol}&resolution=${resolution}&from=${from}&to=${to}&token=${API_KEY}`, mock);
}

/**
 * Fetches a list of all stock symbols for a given exchange.
 * @param exchange - The stock exchange code (e.g., 'US').
 * @returns A promise that resolves to a list of stock symbols.
 */
export async function getStockSymbols(exchange: string) {
    const mock = [
        { "currency": "USD", "description": "APPLE INC", "displaySymbol": "AAPL", "figi": "BBG000B9XRY4", "mic": "XNAS", "symbol": "AAPL", "type": "Common Stock" },
        { "currency": "USD", "description": "MICROSOFT CORP", "displaySymbol": "MSFT", "figi": "BBG000BPH459", "mic": "XNAS", "symbol": "MSFT", "type": "Common Stock" },
        { "currency": "USD", "description": "AMAZON.COM INC", "displaySymbol": "AMZN", "figi": "BBG000BVPV84", "mic": "XNAS", "symbol": "AMZN", "type": "Common Stock" },
        { "currency": "USD", "description": "ALPHABET INC-CL A", "displaySymbol": "GOOGL", "figi": "BBG009S39JX6", "mic": "XNAS", "symbol": "GOOGL", "type": "Common Stock" },
        { "currency": "USD", "description": "TESLA INC", "displaySymbol": "TSLA", "figi": "BBG000N9MNX3", "mic": "XNAS", "symbol": "TSLA", "type": "Common Stock" },
        { "currency": "USD", "description": "META PLATFORMS INC", "displaySymbol": "META", "figi": "BBG000MM2P62", "mic": "XNAS", "symbol": "META", "type": "Common Stock" },
        { "currency": "USD", "description": "NVIDIA CORP", "displaySymbol": "NVDA", "figi": "BBG000BBJQV0", "mic": "XNAS", "symbol": "NVDA", "type": "Common Stock" },
    ];
    // Return only stocks that have a symbol and description
    const data = await fetcher(`${BASE_URL}/stock/symbol?exchange=${exchange}&token=${API_KEY}`, mock);
    if(Array.isArray(data)) {
        return data.filter(s => s.symbol && s.description && !s.symbol.includes('.'));
    }
    return [];
}

/**
 * Fetches the current market status for a given exchange.
 * @param exchange - The stock exchange code (e.g., 'US').
 * @returns A promise that resolves to the market status data.
 */
export async function getMarketStatus(exchange: string) {
    const mock = { isOpen: true, holiday: null };
    return fetcher(`${BASE_URL}/stock/market-status?exchange=${exchange}&token=${API_KEY}`, mock);
}
