const API_KEY = process.env.NEXT_PUBLIC_FINNHUB_API_KEY;
const BASE_URL = 'https://finnhub.io/api/v1';

if (!API_KEY) {
    console.error("Finnhub API key is not set. Please set NEXT_PUBLIC_FINNHUB_API_KEY in your .env.local file.");
}

async function fetcher(url: string) {
    if (!API_KEY) {
        throw new Error("API key is missing.");
    }
    const res = await fetch(url);
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: 'An unknown error occurred' }));
        throw new Error(errorData.message || 'An error occurred while fetching the data.');
    }
    return res.json();
}

export async function getQuote(symbol: string) {
    return fetcher(`${BASE_URL}/quote?symbol=${symbol}&token=${API_KEY}`);
}

export async function getCompanyProfile(symbol: string) {
    return fetcher(`${BASE_URL}/stock/profile2?symbol=${symbol}&token=${API_KEY}`);
}

export async function searchSymbols(query: string) {
    return fetcher(`${BASE_URL}/search?q=${query}&token=${API_KEY}`);
}

export async function getStockNews(symbol: string) {
    const today = new Date();
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(today.getDate() - 7);
    const from = oneWeekAgo.toISOString().split('T')[0];
    const to = today.toISOString().split('T')[0];
    return fetcher(`${BASE_URL}/company-news?symbol=${symbol}&from=${from}&to=${to}&token=${API_KEY}`);
}

export async function getStockCandles(symbol: string, resolution: string, from: number, to: number) {
  return fetcher(`${BASE_URL}/stock/candle?symbol=${symbol}&resolution=${resolution}&from=${from}&to=${to}&token=${API_KEY}`);
}
