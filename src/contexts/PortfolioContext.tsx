"use client";

import React, { createContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { collection, doc, getDocs, writeBatch, getDoc, setDoc, addDoc, deleteDoc, updateDoc, onSnapshot, query, Unsubscribe } from 'firebase/firestore';
import type { PortfolioItem, Transaction, PortfolioHistoryItem } from '@/types';
import { useToast } from "@/hooks/use-toast";
import { getQuote } from '@/lib/finnhub';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';

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

  useEffect(() => {
    if (!user) {
        resetState();
        setLoading(false);
        return;
    }

    setLoading(true);
    const unsubscribes: Unsubscribe[] = [];

    // User data (cash)
    const userDocRef = doc(db, 'users', user.uid);
    unsubscribes.push(onSnapshot(userDocRef, (doc) => {
        if (doc.exists()) {
            setCash(doc.data().cash || 100000);
        }
    }));
    
    // Portfolio
    const portfolioColRef = collection(db, 'users', user.uid, 'portfolio');
    unsubscribes.push(onSnapshot(query(portfolioColRef), (snapshot) => {
        const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PortfolioItem));
        setPortfolio(items);
    }));

    // Watchlist
    const watchlistColRef = collection(db, 'users', user.uid, 'watchlist');
    unsubscribes.push(onSnapshot(query(watchlistColRef), (snapshot) => {
        const items = snapshot.docs.map(doc => doc.id);
        setWatchlist(items);
    }));

    // Transactions
    const transColRef = collection(db, 'users', user.uid, 'transactions');
    unsubscribes.push(onSnapshot(query(transColRef), (snapshot) => {
        const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction));
        setTransactions(items);
    }));

    // Portfolio History
    const historyColRef = collection(db, 'users', user.uid, 'portfolioHistory');
    unsubscribes.push(onSnapshot(query(historyColRef), (snapshot) => {
        const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PortfolioHistoryItem));
        setPortfolioHistory(items.sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
    }));

    setLoading(false);

    return () => unsubscribes.forEach(unsub => unsub());

  }, [user]);
  
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
  }, [portfolio.length, user]);


  const getPortfolioValue = useCallback((portfolio: PortfolioItem[]) => {
    return portfolio.reduce((total, item) => total + (item.currentPrice || item.avgCost) * item.quantity, 0);
  }, []);

  const addPortfolioHistoryRecord = async (newPortfolioValue: number) => {
      if (!user) return;
      const historyColRef = collection(db, 'users', user.uid, 'portfolioHistory');
      await addDoc(historyColRef, {
          date: new Date().toISOString(),
          value: newPortfolioValue,
      });
  }

  const buyStock = async (ticker: string, quantity: number, price: number) => {
    if (!user) return;
    const cost = quantity * price;
    if (cost > cash) {
      toast({ variant: "destructive", title: "Transaction Failed", description: "Not enough cash." });
      return;
    }

    const batch = writeBatch(db);
    const userDocRef = doc(db, 'users', user.uid);
    const portfolioColRef = collection(db, 'users', user.uid, 'portfolio');
    const transColRef = collection(db, 'users', user.uid, 'transactions');
    
    const existingItem = portfolio.find(item => item.ticker === ticker);

    if (existingItem && existingItem.id) {
        const newQuantity = existingItem.quantity + quantity;
        const newAvgCost = ((existingItem.avgCost * existingItem.quantity) + cost) / newQuantity;
        const itemDocRef = doc(portfolioColRef, existingItem.id);
        batch.update(itemDocRef, { quantity: newQuantity, avgCost: newAvgCost });
    } else {
        addDoc(portfolioColRef, { ticker, quantity, avgCost: price });
    }

    batch.update(userDocRef, { cash: cash - cost });
    addDoc(transColRef, { ticker, quantity, price, type: 'BUY', date: new Date().toISOString() });
    
    await batch.commit();
    await addPortfolioHistoryRecord(getPortfolioValue(portfolio) - cost + (quantity * price));
    toast({ title: "Purchase Successful", description: `Bought ${quantity} shares of ${ticker}.` });
  };

  const sellStock = async (ticker: string, quantity: number, price: number) => {
    if (!user) return;
    const proceeds = quantity * price;
    const existingItem = portfolio.find(item => item.ticker === ticker);

    if (!existingItem || !existingItem.id || existingItem.quantity < quantity) {
      toast({ variant: "destructive", title: "Transaction Failed", description: "Not enough shares to sell." });
      return;
    }
    
    const batch = writeBatch(db);
    const userDocRef = doc(db, 'users', user.uid);
    const itemDocRef = doc(db, 'users', user.uid, 'portfolio', existingItem.id);
    const transColRef = collection(db, 'users', user.uid, 'transactions');

    if (existingItem.quantity === quantity) {
        batch.delete(itemDocRef);
    } else {
        batch.update(itemDocRef, { quantity: existingItem.quantity - quantity });
    }

    batch.update(userDocRef, { cash: cash + proceeds });
    addDoc(transColRef, { ticker, quantity, price, type: 'SELL', date: new Date().toISOString() });

    await batch.commit();
    await addPortfolioHistoryRecord(getPortfolioValue(portfolio) + proceeds - (quantity*price));
    toast({ title: "Sale Successful", description: `Sold ${quantity} shares of ${ticker}.` });
  };

  const toggleWatchlist = async (ticker: string) => {
    if (!user) return;
    const watchlistColRef = collection(db, 'users', user.uid, 'watchlist');
    const stockDocRef = doc(watchlistColRef, ticker);

    if (watchlist.includes(ticker)) {
        await deleteDoc(stockDocRef);
    } else {
        await setDoc(stockDocRef, {});
    }
  };

  const getTodaysGainLoss = useCallback((portfolio: PortfolioItem[]) => {
      if(portfolio.length === 0) return { value: 0, percent: 0 };
      const totalValue = getPortfolioValue(portfolio);
      const previousDayValue = portfolio.reduce((total, item) => {
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
