# StockSim

A full-stack simulated stock trading web application built with Next.js, Tailwind CSS, and the Finnhub.io API.

## Features

- **Stock Data Display**: View company info, real-time prices, and percentage changes.
- **Simulated Trading**: Buy and sell shares with a virtual portfolio.
- **Portfolio Tracking**: Monitor total portfolio value, gains/losses, and individual holdings.
- **Watchlist**: Keep track of stocks you're interested in.
- **Performance Visualization**: Analyze your performance with stock charts and portfolio history.
- **AI-Powered Notes**: Generate custom notes for your stocks using AI.
- **Responsive Design**: Access the app on any device.
- **Dark Mode**: Switch between light and dark themes.

## Getting Started

### Prerequisites

- Node.js (v18 or later)
- npm, yarn, or pnpm

### Setup

1.  **Clone the repository:**
    ```bash
    git clone <your-repository-url>
    cd stocksim
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Set up environment variables:**

    Create a `.env.local` file in the root of your project and add your Finnhub API key. You can get one for free from [Finnhub.io](https://finnhub.io/register).

    ```env
    FINNHUB_API_KEY=your_finnhub_api_key_here
    ```

### Running the Development Server

To start the development server, run:

```bash
npm run dev
```

Open [http://localhost:9002](http://localhost:9002) with your browser to see the result.

## Deployment

The application is configured for easy deployment on platforms like Vercel or Firebase Hosting.

### Deploy on Vercel

1.  Push your code to a Git repository (e.g., GitHub).
2.  Import the repository on [Vercel](https://vercel.com/new).
3.  Add your `FINNHUB_API_KEY` as an environment variable in the Vercel project settings.
4.  Deploy! Vercel will automatically build and deploy your Next.js application.
