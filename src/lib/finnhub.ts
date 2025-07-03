const API_KEY = process.env.NEXT_PUBLIC_FINNHUB_API_KEY;
const BASE_URL = 'https://finnhub.io/api/v1';

if (!API_KEY) {
    console.error("Finnhub API key is not set. Please set NEXT_PUBLIC_FINNHUB_API_KEY in your .env.local file.");
}

async function fetcher(url: string, mockResponse?: any) {
    if (!API_KEY) {
        throw new Error("API key is missing.");
    }
    
    // If using the placeholder key, return mock data to prevent crashes and allow UI to render.
    if (API_KEY === 'changeme') {
        // Using a timeout to simulate network latency
        await new Promise(resolve => setTimeout(resolve, 300));
        console.warn(`Using placeholder Finnhub API key. Mock data is being used.`);
        return mockResponse;
    }

    try {
        const res = await fetch(url);
        if (!res.ok) {
            const errorData = await res.json().catch(() => ({ error: 'An unknown error occurred' }));
            // Finnhub API returns errors in an `error` property.
            throw new Error(errorData.error || 'An error occurred while fetching the data.');
        }
        return res.json();
    } catch (error: any) {
         if (error.message.includes("You don't have access to this resource")) {
            console.warn(`Finnhub premium feature access error for URL: ${url.split('&token=')[0]}. Returning mock data.`);
            return mockResponse;
        }
        // Re-throw other unexpected errors
        throw error;
    }
}

export async function getQuote(symbol: string) {
    const mock = { c: 0, d: 0, dp: 0, h: 0, l: 0, o: 0, pc: 0, t: 0 };
    return fetcher(`${BASE_URL}/quote?symbol=${symbol}&token=${API_KEY}`, mock);
}

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
        logo: `https://placehold.co/64x64.png`, 
        phone: '', 
        weburl: '', 
        finnhubIndustry: 'Mock Industry' 
    };
    return fetcher(`${BASE_URL}/stock/profile2?symbol=${symbol}&token=${API_KEY}`, mock);
}

export async function searchSymbols(query: string) {
    const mock = { result: [] };
    return fetcher(`${BASE_URL}/search?q=${query}&token=${API_KEY}`, mock);
}

export async function getStockNews(symbol: string) {
    const today = new Date();
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(today.getDate() - 7);
    const from = oneWeekAgo.toISOString().split('T')[0];
    const to = today.toISOString().split('T')[0];
    const mock: any[] = [];
    return fetcher(`${BASE_URL}/company-news?symbol=${symbol}&from=${from}&to=${to}&token=${API_KEY}`, mock);
}

export async function getStockCandles(symbol: string, resolution: string, from: number, to: number) {
  const mock = { s: 'no_data' };
  return fetcher(`${BASE_URL}/stock/candle?symbol=${symbol}&resolution=${resolution}&from=${from}&to=${to}&token=${API_KEY}`, mock);
}

export async function getMarketStatus(exchange: string) {
    const mock = { isOpen: true, holiday: null };
    return fetcher(`${BASE_URL}/stock/market-status?exchange=${exchange}&token=${API_KEY}`, mock);
}
