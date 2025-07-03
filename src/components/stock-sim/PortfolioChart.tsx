"use client"

import React from 'react';
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { PortfolioHistoryItem } from '@/types';
import { Card } from '../ui/card';

interface PortfolioChartProps {
    data: PortfolioHistoryItem[];
}

const PortfolioChart: React.FC<PortfolioChartProps> = ({ data }) => {
    if (!data || data.length < 2) {
        return (
            <div className="h-[200px] w-full flex items-center justify-center text-sm text-muted-foreground">
                <p>Not enough data to display a chart. Make some trades!</p>
            </div>
        );
    }

    const chartData = data.map(item => ({
        date: new Date(item.date).toLocaleDateString(),
        value: item.value,
    }));
    
    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
    };

    return (
        <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                    <defs>
                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8} />
                            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <XAxis 
                        dataKey="date" 
                        stroke="hsl(var(--muted-foreground))" 
                        fontSize={12} 
                        tickLine={false} 
                        axisLine={false} 
                        tick={false}
                    />
                    <YAxis 
                        stroke="hsl(var(--muted-foreground))" 
                        fontSize={12} 
                        tickLine={false} 
                        axisLine={false} 
                        domain={['dataMin', 'dataMax']} 
                        hide 
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: 'hsl(var(--background))',
                            borderColor: 'hsl(var(--border))',
                            borderRadius: 'var(--radius)',
                        }}
                        formatter={(value: number) => [formatCurrency(value), "Value"]}
                    />
                    <Area type="monotone" dataKey="value" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorValue)" />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
};

export default PortfolioChart;
