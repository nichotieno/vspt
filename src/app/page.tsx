"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { BarChart2, Briefcase, DollarSign, Edit, Eye, Newspaper, Search, TrendingDown, TrendingUp, X } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { getCompanyProfile, getQuote, getStockNews } from '@/lib/finnhub';
import { usePortfolio } from '@/hooks/use-portfolio';
import type { CompanyProfile, PortfolioItem, StockNews, StockQuote } from '@/types';
import StockSearch from '@/components/stock-sim/StockSearch';
import StockChart from '@/components/stock-sim/StockChart';
import AIGeneratedNote from '@/components/stock-sim/AIGeneratedNote';
import { TradeDialog } from '@/components/stock-sim/TradeDialog';
import { ThemeToggle } from '@/components/stock-sim/ThemeToggle';
import { useToast } from "@/hooks/use-toast";

export default function Home() {
  const [selectedStock, setSelectedStock] = useState<string>('AAPL');
  const [quote, setQuote] = useState<StockQuote | null>(null);
  const [profile, setProfile] = useState<CompanyProfile | null>(null);
  const [news, setNews] = useState<StockNews[]>([]);
  const [loading, setLoading] = useState(true);

  const { portfolio, watchlist, toggleWatchlist, cash, getPortfolioValue, getTodaysGainLoss } = usePortfolio();
  const { toast } = useToast();

  const portfolioValue = useMemo(() => getPortfolioValue(portfolio), [portfolio, getPortfolioValue]);
  const todaysGainLoss = useMemo(() => getTodaysGainLoss(portfolio), [portfolio, getTodaysGainLoss]);

  useEffect(() => {
    if (selectedStock) {
      const fetchData = async () => {
        try {
          setLoading(true);
          const [quoteData, profileData, newsData] = await Promise.all([
            getQuote(selectedStock),
            getCompanyProfile(selectedStock),
            getStockNews(selectedStock)
          ]);
          setQuote(quoteData);
          setProfile(profileData);
          setNews(newsData.slice(0, 5));
        } catch (error) {
          console.error('Error fetching stock data:', error);
          toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to fetch stock data. Please try again.",
          });
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    }
  }, [selectedStock, toast]);
  
  const isStockInWatchlist = watchlist.includes(selectedStock);

  const handleSelectStock = (symbol: string) => {
    setSelectedStock(symbol);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
  };

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 py-2">
        <div className="flex items-center gap-2">
          <BarChart2 className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-bold">StockSim</h1>
        </div>
        <div className="relative ml-auto flex-1 md:grow-0">
          <StockSearch onSelect={handleSelectStock} />
        </div>
        <ThemeToggle />
      </header>
      <main className="flex flex-1 flex-col gap-4 p-4 sm:px-6 sm:py-0 md:flex-row">
        <div className="flex w-full flex-col gap-4 md:w-1/3 lg:w-1/4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Portfolio</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">{formatCurrency(portfolioValue + cash)}</div>
              <div className={`flex items-center text-sm ${todaysGainLoss.value >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {todaysGainLoss.value >= 0 ? <TrendingUp className="mr-1 h-4 w-4" /> : <TrendingDown className="mr-1 h-4 w-4" />}
                <span>{formatCurrency(todaysGainLoss.value)} ({todaysGainLoss.percent.toFixed(2)}%) Today</span>
              </div>
              <div className="mt-2 text-sm text-muted-foreground">
                <p>Available Cash: {formatCurrency(cash)}</p>
              </div>
            </CardContent>
          </Card>
          <Tabs defaultValue="portfolio" className="flex-grow">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="portfolio"><Briefcase className="mr-2 h-4 w-4" />Holdings</TabsTrigger>
              <TabsTrigger value="watchlist"><Eye className="mr-2 h-4 w-4" />Watchlist</TabsTrigger>
            </TabsList>
            <TabsContent value="portfolio">
              <Card className="h-[450px]">
                <CardContent className="p-2">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Asset</TableHead>
                        <TableHead className="text-right">Value</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {portfolio.map((item: PortfolioItem) => (
                        <TableRow key={item.ticker} onClick={() => handleSelectStock(item.ticker)} className="cursor-pointer">
                          <TableCell>
                            <div className="font-medium">{item.ticker}</div>
                            <div className="text-xs text-muted-foreground">{item.quantity} shares</div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div>{formatCurrency(item.quantity * (item.currentPrice || 0))}</div>
                            <div className={`text-xs ${item.changePercent && item.changePercent >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                              {item.changePercent?.toFixed(2) ?? '0.00'}%
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="watchlist">
             <Card className="h-[450px]">
                <CardContent className="p-2">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Symbol</TableHead>
                        <TableHead className="text-right">Price</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {watchlist.map((symbol: string) => (
                        <TableRow key={symbol} onClick={() => handleSelectStock(symbol)} className="cursor-pointer">
                          <TableCell>
                            <div className="font-medium">{symbol}</div>
                          </TableCell>
                          <TableCell className="text-right">-</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
        <div className="flex w-full flex-col gap-4 md:w-2/3 lg:w-3/4">
          {loading ? (
             <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                 <Skeleton className="h-8 w-1/2" />
                 <Skeleton className="h-8 w-1/4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-1/3 mb-2" />
                <Skeleton className="h-4 w-1/4" />
                <div className="mt-4">
                  <Skeleton className="h-64 w-full" />
                </div>
              </CardContent>
            </Card>
          ) : profile && quote ? (
            <>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={profile.logo} alt={profile.name} />
                      <AvatarFallback>{profile.ticker}</AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle>{profile.name} ({profile.ticker})</CardTitle>
                      <p className="text-sm text-muted-foreground">{profile.finnhubIndustry}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">{formatCurrency(quote.c)}</div>
                    <div className={`flex items-center justify-end text-sm ${quote.d >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {quote.d >= 0 ? <TrendingUp className="mr-1 h-4 w-4" /> : <TrendingDown className="mr-1 h-4 w-4" />}
                      {formatCurrency(quote.d)} ({quote.dp.toFixed(2)}%)
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <TradeDialog
                      stock={{ ticker: profile.ticker, name: profile.name, price: quote.c }}
                      type="BUY"
                    />
                     <TradeDialog
                      stock={{ ticker: profile.ticker, name: profile.name, price: quote.c }}
                      type="SELL"
                    />
                    <Button variant="outline" onClick={() => toggleWatchlist(selectedStock)}>
                      {isStockInWatchlist ? <X className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />}
                      {isStockInWatchlist ? 'Remove from Watchlist' : 'Add to Watchlist'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
              <Tabs defaultValue="chart">
                <TabsList>
                  <TabsTrigger value="chart"><BarChart2 className="mr-2 h-4 w-4" />Chart</TabsTrigger>
                  <TabsTrigger value="news"><Newspaper className="mr-2 h-4 w-4" />News</TabsTrigger>
                  <TabsTrigger value="note"><Edit className="mr-2 h-4 w-4" />AI Note</TabsTrigger>
                </TabsList>
                <TabsContent value="chart">
                  <Card>
                    <CardContent className="p-2 pt-4">
                      <StockChart symbol={selectedStock} />
                    </CardContent>
                  </Card>
                </TabsContent>
                <TabsContent value="news">
                  <Card>
                    <CardContent className="p-4">
                      <div className="space-y-4">
                        {news.map(item => (
                          <a href={item.url} target="_blank" rel="noopener noreferrer" key={item.id} className="block hover:bg-muted/50 p-2 rounded-lg">
                            <h3 className="font-semibold">{item.headline}</h3>
                            <p className="text-xs text-muted-foreground">{item.source} - {new Date(item.datetime * 1000).toLocaleDateString()}</p>
                            <p className="text-sm mt-1">{item.summary}</p>
                          </a>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                <TabsContent value="note">
                  <AIGeneratedNote stock={{ ticker: profile.ticker, name: profile.name, price: quote.c, changePercent: quote.dp, news: news.map(n => n.headline).join('. ') }} />
                </TabsContent>
              </Tabs>
            </>
          ) : (
            <Card>
              <CardContent className="p-6">
                <p>No data available for the selected stock.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
