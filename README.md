
# StockSim

A full-stack simulated stock trading web application built with Next.js, Tailwind CSS, Genkit, and the Finnhub.io API.

## Features

- **Real-Time Market Data**: View company profiles, real-time price quotes, and daily performance powered by the Finnhub API.
- **Simulated Trading**: Execute buy and sell orders with a virtual cash balance.
- **Portfolio Management**: Track holdings, available cash, and overall portfolio value.
- **Performance Visualization**: Analyze portfolio value over time with historical charts.
- **Watchlist**: Add and remove stocks to a personal watchlist for easy tracking.
- **AI-Powered Insights**: Generate custom, strategy-based notes for any stock using Google's Gemini model via Genkit.
- **User Authentication**: Secure user signup and login functionality.
- **Responsive Design**: A clean, modern UI that works on any device, with light and dark modes.

## Getting Started

### Prerequisites

- Node.js (v20 or later)
- npm
- Docker (for containerized deployment)

### Setup

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/nichotieno/vspt.git
    cd stocksim
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Set up environment variables:**

    Create a `.env.local` file in the root of your project and add your Finnhub API key. You can get a free key from [Finnhub.io](https://finnhub.io/register).

    ```env
    FINNHUB_API_KEY=your_finnhub_api_key_here
    ```

### Running the Development Server

To start the development server, run:

```bash
npm run dev
```

Open [http://localhost:9002](http://localhost:9002) with your browser to see the result.

## Testing

This project uses Jest and React Testing Library for testing. To run the test suite, use the following command:

```bash
npm test
```

## Docker

The application is fully containerized for consistent and easy deployment.

### Build the Docker Image

To build the production-ready Docker image, run:

```bash
docker build -t stocksim-app .
```

### Run the Docker Container

To run the application inside a Docker container, use the following command. Remember to replace the placeholder with your actual Finnhub API key.

```bash
docker run -p 9002:9002 -e FINNHUB_API_KEY="your_finnhub_api_key_here" stocksim-app
```
The application will be accessible at `http://localhost:9002`.

## Deployment

The application is configured for easy deployment on platforms like Firebase App Hosting, Vercel, or any other service that supports Docker containers.

### CI/CD

This repository includes a GitHub Actions workflow (`.github/workflows/ci.yml`) that automates the following tasks on every push or pull request to the `main` branch:
- Installs dependencies
- Runs the linter and type checker
- Executes the full test suite
- Builds the Next.js application
- Builds the Docker image to ensure it's valid

For the CI pipeline to pass, you must add your `FINNHUB_API_KEY` as a repository secret in your GitHub project settings.
