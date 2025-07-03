"use client";

import React, { createContext, useState, useEffect, useCallback } from 'react';
import type { PortfolioItem, Transaction } from '@/types';
import { useToast } from "@/hooks/use-toast";
import { getQuote } from '@/lib/finnhub';

interface PortfolioContextType {
  portfolio: PortfolioItem[];
  watchlist: string[];
  cash: number;
  transactions: Transaction[];
  buyStock: (ticker: string, quantity: number, price: number) => void;
  sellStock: (ticker: string, quantity: number, price: number) => void;
  toggleWatchlist: (ticker: string) => void;
  getPortfolioValue: (portfolio: PortfolioItem[]) => number;
  getTodaysGainLoss: (portfolio: PortfolioItem[]) => { value: number; percent: number };
}

export const PortfolioContext = createContext<PortfolioContextType | null>(null);

export const PortfolioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [cash, setCash] = useState(100000);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    try {
      const savedPortfolio = localStorage.getItem('portfolio');
      const savedWatchlist = localStorage.getItem('watchlist');
      const savedCash = localStorage.getItem('cash');
      const savedTransactions = localStorage.getItem('transactions');
      if (savedPortfolio) setPortfolio(JSON.parse(savedPortfolio));
      if (savedWatchlist) setWatchlist(JSON.parse(savedWatchlist));
      if (savedCash) setCash(JSON.parse(savedCash));
      if (savedTransactions) setTransactions(JSON.parse(savedTransactions));
    } catch (error) {
      console.error("Failed to load data from localStorage", error);
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('portfolio', JSON.stringify(portfolio));
      localStorage.setItem('watchlist', JSON.stringify(watchlist));
      localStorage.setItem('cash', JSON.stringify(cash));
      localStorage.setItem('transactions', JSON.stringify(transactions));
    }
  }, [portfolio, watchlist, cash, transactions, isLoaded]);
  
  useEffect(() => {
    const updatePortfolioPrices = async () => {
      if(portfolio.length === 0) return;

      const updatedPortfolio = await Promise.all(
        portfolio.map(async (item) => {
          try {
            const quote = await getQuote(item.ticker);
            return {
              ...item,
              currentPrice: quote.c,
              changePercent: quote.dp,
            };
          } catch (error) {
            console.error(`Failed to fetch price for ${item.ticker}`, error);
            return item;
          }
        })
      );
      setPortfolio(updatedPortfolio);
    };

    const interval = setInterval(updatePortfolioPrices, 30000); // Update every 30 seconds
    updatePortfolioPrices();
    return () => clearInterval(interval);
  }, [isLoaded]);


  const buyStock = (ticker: string, quantity: number, price: number) => {
    const cost = quantity * price;
    if (cost > cash) {
      toast({ variant: "destructive", title: "Transaction Failed", description: "Not enough cash to complete this purchase." });
      return;
    }

    setCash(cash - cost);
    setPortfolio(prev => {
      const existingItem = prev.find(item => item.ticker === ticker);
      if (existingItem) {
        const newQuantity = existingItem.quantity + quantity;
        const newAvgCost = ((existingItem.avgCost * existingItem.quantity) + cost) / newQuantity;
        return prev.map(item => item.ticker === ticker ? { ...item, quantity: newQuantity, avgCost: newAvgCost } : item);
      }
      return [...prev, { ticker, quantity, avgCost: price }];
    });
    setTransactions(prev => [...prev, { ticker, quantity, price, type: 'BUY', date: new Date().toISOString() }]);
    toast({ title: "Purchase Successful", description: `Bought ${quantity} shares of ${ticker}.` });
  };

  const sellStock = (ticker: string, quantity: number, price: number) => {
    const proceeds = quantity * price;
    const existingItem = portfolio.find(item => item.ticker === ticker);

    if (!existingItem || existingItem.quantity < quantity) {
      toast({ variant: "destructive", title: "Transaction Failed", description: "You do not own enough shares to sell." });
      return;
    }

    setCash(cash + proceeds);
    setPortfolio(prev => {
      if (existingItem.quantity === quantity) {
        return prev.filter(item => item.ticker !== ticker);
      }
      return prev.map(item => item.ticker === ticker ? { ...item, quantity: item.quantity - quantity } : item);
    });
    setTransactions(prev => [...prev, { ticker, quantity, price, type: 'SELL', date: new Date().toISOString() }]);
    toast({ title: "Sale Successful", description: `Sold ${quantity} shares of ${ticker}.` });
  };

  const toggleWatchlist = (ticker: string) => {
    setWatchlist(prev =>
      prev.includes(ticker)
        ? prev.filter(t => t !== ticker)
        : [...prev, ticker]
    );
  };

  const getPortfolioValue = useCallback((portfolio: PortfolioItem[]) => {
    return portfolio.reduce((total, item) => total + (item.currentPrice || item.avgCost) * item.quantity, 0);
  }, []);

  const getTodaysGainLoss = useCallback((portfolio: PortfolioItem[]) => {
      const totalValue = getPortfolioValue(portfolio);
      const previousDayValue = portfolio.reduce((total, item) => {
          const change = ((item.currentPrice || 0) * (item.changePercent || 0)) / 100;
          const previousPrice = (item.currentPrice || 0) - change;
          return total + previousPrice * item.quantity;
      }, 0);
      
      if(previousDayValue === 0) return { value: 0, percent: 0 };
      
      const valueChange = totalValue - previousDayValue;
      const percentChange = (valueChange / previousDayValue) * 100;

      return { value: valueChange, percent: isNaN(percentChange) ? 0 : percentChange };
  }, [getPortfolioValue]);


  return (
    <PortfolioContext.Provider value={{ portfolio, watchlist, cash, transactions, buyStock, sellStock, toggleWatchlist, getPortfolioValue, getTodaysGainLoss }}>
      {children}
    </PortfolioContext.Provider>
  );
};
