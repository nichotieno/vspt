import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { BarChart2, ArrowRight, TrendingUp, Zap } from 'lucide-react';
import Image from 'next/image';

export default function WelcomePage() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <header className="px-4 lg:px-6 h-16 flex items-center border-b">
        <Link href="/" className="flex items-center justify-center gap-2">
          <BarChart2 className="h-6 w-6 text-primary" />
          <span className="text-xl font-bold">StockSim</span>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6">
          <Link href="/login" className="text-sm font-medium hover:underline underline-offset-4 flex items-center">
            Login
          </Link>
          <Button asChild>
            <Link href="/signup">Get Started</Link>
          </Button>
        </nav>
      </header>
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px]">
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-2">
                  <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
                    Simulate Your Way to Market Mastery
                  </h1>
                  <p className="max-w-[600px] text-muted-foreground md:text-xl">
                    Experience the thrill of the stock market without the risk. Practice your trading strategies, track your portfolio, and gain confidence with our hyper-realistic simulation platform.
                  </p>
                </div>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  <Button asChild size="lg" className="group">
                    <Link href="/signup">
                      Start Trading Now
                      <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </Button>
                </div>
              </div>
               <Image
                src="https://placehold.co/600x600.png"
                width="600"
                height="600"
                alt="Hero"
                className="mx-auto aspect-square overflow-hidden rounded-xl object-cover sm:w-full lg:order-last lg:aspect-square"
                data-ai-hint="stock market abstract"
              />
            </div>
          </div>
        </section>

        <section className="w-full py-12 md:py-24 lg:py-32 bg-muted/40">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <div className="inline-block rounded-lg bg-muted px-3 py-1 text-sm">Key Features</div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">All The Tools You Need to Succeed</h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  From real-time data to AI-powered insights, StockSim provides a comprehensive toolkit for aspiring traders.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-start gap-8 sm:grid-cols-2 md:gap-12 lg:grid-cols-3 mt-12">
              <div className="grid gap-1 p-4 rounded-lg border bg-card shadow-sm">
                <TrendingUp className="h-8 w-8 text-primary" />
                <h3 className="text-lg font-bold">Real-Time Data</h3>
                <p className="text-sm text-muted-foreground">
                  Trade with up-to-the-minute stock prices and market data for a realistic experience.
                </p>
              </div>
              <div className="grid gap-1 p-4 rounded-lg border bg-card shadow-sm">
                <BarChart2 className="h-8 w-8 text-primary" />
                <h3 className="text-lg font-bold">Advanced Charting</h3>
                <p className="text-sm text-muted-foreground">
                  Analyze performance with detailed stock and portfolio history charts.
                </p>
              </div>
              <div className="grid gap-1 p-4 rounded-lg border bg-card shadow-sm">
                 <Zap className="h-8 w-8 text-primary" />
                <h3 className="text-lg font-bold">AI-Powered Insights</h3>
                <p className="text-sm text-muted-foreground">
                  Generate custom notes and analysis for any stock with our integrated AI assistant.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
       <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
        <p className="text-xs text-muted-foreground">&copy; {new Date().getFullYear()} StockSim. All rights reserved.</p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <Link href="#" className="text-xs hover:underline underline-offset-4">
            Terms of Service
          </Link>
          <Link href="#" className="text-xs hover:underline underline-offset-4">
            Privacy
          </Link>
        </nav>
      </footer>
    </div>
  );
}
