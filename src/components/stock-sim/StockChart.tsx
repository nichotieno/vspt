"use client";

import React, { useState, useEffect } from 'react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { getStockCandles } from '@/lib/finnhub';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '../ui/skeleton';

interface StockChartProps {
  symbol: string;
}

const StockChart: React.FC<StockChartProps> = ({ symbol }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchChartData = async () => {
      setLoading(true);
      try {
        const to = Math.floor(Date.now() / 1000);
        const from = to - (365 * 24 * 60 * 60); // 1 year ago
        const res = await getStockCandles(symbol, 'D', from, to);
        if (res.s === 'ok') {
          const chartData = res.t.map((timestamp: number, index: number) => ({
            date: new Date(timestamp * 1000).toLocaleDateString(),
            price: res.c[index],
          }));
          setData(chartData);
        } else {
            setData([]);
        }
      } catch (error) {
        console.error('Error fetching chart data:', error);
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    if (symbol) {
      fetchChartData();
    }
  }, [symbol]);

  if (loading) {
      return <Skeleton className="h-[350px] w-full" />
  }

  if (data.length === 0) {
      return (
          <div className="h-[350px] w-full flex items-center justify-center">
              <p>No chart data available.</p>
          </div>
      )
  }

  return (
    <div className="h-[350px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8} />
              <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
          <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} domain={['dataMin', 'dataMax']} tickFormatter={(value) => `$${value}`} />
          <Tooltip 
            contentStyle={{
                backgroundColor: 'hsl(var(--background))',
                borderColor: 'hsl(var(--border))',
                borderRadius: 'var(--radius)',
            }}
          />
          <Area type="monotone" dataKey="price" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorPrice)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default StockChart;
