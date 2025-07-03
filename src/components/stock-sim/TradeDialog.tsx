"use client";

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { usePortfolio } from '@/hooks/use-portfolio';
import { TrendingDown, TrendingUp } from 'lucide-react';

interface TradeDialogProps {
  stock: {
    ticker: string;
    name: string;
    price: number;
  };
  type: 'BUY' | 'SELL';
}

export function TradeDialog({ stock, type }: TradeDialogProps) {
  const [quantity, setQuantity] = useState('');
  const [open, setOpen] = useState(false);
  const { buyStock, sellStock } = usePortfolio();

  const handleTrade = () => {
    const numQuantity = parseInt(quantity, 10);
    if (isNaN(numQuantity) || numQuantity <= 0) {
      return;
    }

    if (type === 'BUY') {
      buyStock(stock.ticker, numQuantity, stock.price);
    } else {
      sellStock(stock.ticker, numQuantity, stock.price);
    }
    setOpen(false);
    setQuantity('');
  };

  const total = stock.price * (parseInt(quantity, 10) || 0);

  const buttonVariant = type === 'SELL' ? 'destructive' : 'default';

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={buttonVariant} className="w-full">
          {type === 'BUY' ? <TrendingUp className="mr-2 h-4 w-4"/> : <TrendingDown className="mr-2 h-4 w-4" />}
          {type}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{type} {stock.ticker}</DialogTitle>
          <DialogDescription>
            Place an order for {stock.name}.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">
              Price
            </Label>
            <div className="col-span-3 font-semibold text-lg">${stock.price.toFixed(2)}</div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="quantity" className="text-right">
              Shares
            </Label>
            <Input
              id="quantity"
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="col-span-3"
              placeholder="0"
              autoFocus
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Total</Label>
            <div className="col-span-3 font-bold text-lg">${total.toFixed(2)}</div>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleTrade} variant={buttonVariant} className="w-full">
            Confirm {type}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
