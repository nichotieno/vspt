"use client";

import React, { createContext, useState, useEffect, useCallback, ReactNode } from 'react';
import type { PortfolioItem, Transaction, PortfolioHistoryItem } from '@/types';
import { useToast } from "@/hooks/use-toast";
import { getQuote } from '@/lib/finnhub';
import { useAuth } from '@/hooks/use-auth';
import { 
    getUserData, 
    buyStockAction, 
    sellStockAction, 
    toggleWatchlistAction 
} from '@/app/actions';

interface PortfolioContextType {
  portfolio: PortfolioItem[];
  watchlist: string[];
  cash: number;
  transactions: Transaction[];
  portfolioHistory: PortfolioHistoryItem[];
  loading: boolean;
  buyStock: (ticker: string, quantity: number, price: number) => Promise<void>;
  sellStock: (ticker: string, quantity: number, price: number) => Promise<void>;
  toggleWatchlist: (ticker: string) => Promise<void>;
  getPortfolioValue: (portfolio: PortfolioItem[]) => number;
  getTodaysGainLoss: (portfolio: PortfolioItem[]) => { value: number; percent: number };
}

export const PortfolioContext = createContext<PortfolioContextType | null>(null);

export const PortfolioProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [cash, setCash] = useState(100000);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [portfolioHistory, setPortfolioHistory] = useState<PortfolioHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  const resetState = () => {
      setPortfolio([]);
      setWatchlist([]);
      setCash(100000);
      setTransactions([]);
      setPortfolioHistory([]);
      setLoading(true);
  };
  
  const fetchData = useCallback(async () => {
    if (!user) {
        resetState();
        setLoading(false);
        return;
    }
    setLoading(true);
    try {
        const data = await getUserData(user.uid);
        setCash(data.cash);
        setPortfolio(data.portfolio.map((p, i) => ({ ...p, id: String(i) }))); // Add a temp id
        setWatchlist(data.watchlist);
        setTransactions(data.transactions);
        setPortfolioHistory(data.portfolioHistory);
    } catch (error) {
        console.error("Failed to fetch user data:", error);
        toast({ variant: "destructive", title: "Error", description: "Could not load your data." });
    } finally {
        setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);
  
  // Effect to update live prices for portfolio items
  useEffect(() => {
    if (!user || portfolio.length === 0) return;

    const updatePrices = async () => {
      const updatedPortfolio = await Promise.all(
        portfolio.map(async (item) => {
          try {
            const quote = await getQuote(item.ticker);
            return { ...item, currentPrice: quote.c, changePercent: quote.dp };
          } catch (error) {
            console.error(`Failed to fetch price for ${item.ticker}`, error);
            return item; // return original item on error
          }
        })
      );
      setPortfolio(updatedPortfolio);
    };

    const intervalId = setInterval(updatePrices, 30000); // Update every 30 seconds
    updatePrices();

    return () => clearInterval(intervalId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [portfolio.length, user]);


  const getPortfolioValue = useCallback((portfolioItems: PortfolioItem[]) => {
    return portfolioItems.reduce((total, item) => total + (item.currentPrice || item.avgCost) * item.quantity, 0);
  }, []);

  const buyStock = async (ticker: string, quantity: number, price: number) => {
    if (!user) return;
    const result = await buyStockAction(user.uid, ticker, quantity, price);
    if (result.success) {
        toast({ title: "Purchase Successful", description: `Bought ${quantity} shares of ${ticker}.` });
        await fetchData(); // Refetch data
    } else {
        toast({ variant: "destructive", title: "Transaction Failed", description: result.error });
    }
  };

  const sellStock = async (ticker: string, quantity: number, price: number) => {
    if (!user) return;
    const result = await sellStockAction(user.uid, ticker, quantity, price);
    if (result.success) {
        toast({ title: "Sale Successful", description: `Sold ${quantity} shares of ${ticker}.` });
        await fetchData(); // Refetch data
    } else {
        toast({ variant: "destructive", title: "Transaction Failed", description: result.error });
    }
  };

  const toggleWatchlist = async (ticker: string) => {
    if (!user) return;
    const isWatched = watchlist.includes(ticker);
    const result = await toggleWatchlistAction(user.uid, ticker, isWatched);
    if (result.success) {
        await fetchData(); // Refetch data
    } else {
        toast({ variant: "destructive", title: "Error", description: result.error });
    }
  };

  const getTodaysGainLoss = useCallback((portfolioItems: PortfolioItem[]) => {
      if(portfolioItems.length === 0) return { value: 0, percent: 0 };
      const totalValue = getPortfolioValue(portfolioItems);
      const previousDayValue = portfolioItems.reduce((total, item) => {
          const currentPrice = item.currentPrice || 0;
          const change = (currentPrice * (item.changePercent || 0)) / 100;
          const previousPrice = currentPrice - change;
          return total + previousPrice * item.quantity;
      }, 0);
      
      if(previousDayValue === 0 && totalValue > 0) return { value: 0, percent: 0 };
      if(previousDayValue === 0) return { value: 0, percent: 0 };
      
      const valueChange = totalValue - previousDayValue;
      const percentChange = (valueChange / previousDayValue) * 100;

      return { value: valueChange, percent: isNaN(percentChange) ? 0 : percentChange };
  }, [getPortfolioValue]);


  return (
    <PortfolioContext.Provider value={{ portfolio, watchlist, cash, transactions, portfolioHistory, loading, buyStock, sellStock, toggleWatchlist, getPortfolioValue, getTodaysGainLoss }}>
      {children}
    </PortfolioContext.Provider>
  );
};
