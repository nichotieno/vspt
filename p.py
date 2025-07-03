import os
import requests
from dotenv import load_dotenv

load_dotenv()

TOKEN = os.getenv("GITHUB_TOKEN")
OWNER = os.getenv("REPO_OWNER")
REPO = os.getenv("REPO_NAME")

HEADERS = {
    "Authorization": f"token {TOKEN}",
    "Accept": "application/vnd.github+json"
}

ISSUES = [
    # 🔍 Search & Stock Info
    {"title": "Stock Search: Symbol Input Field", "body": "Implement an input field for users to enter ticker symbols (e.g., AAPL).", "labels": ["frontend", "feature"]},
    {"title": "Autocomplete for Ticker Search", "body": "Suggest matching tickers as user types using public stock APIs.", "labels": ["frontend", "enhancement"]},
    {"title": "Display Real-Time Stock Info", "body": "Show company name, current stock price, and % change.", "labels": ["frontend", "api"]},
    {"title": "Show Basic Stock Metrics", "body": "Display market cap, P/E, and 52-week high/low.", "labels": ["frontend", "api"]},
    {"title": "Render Historical Stock Chart", "body": "Line chart with range options: 1D, 1W, 1M, 1Y.", "labels": ["charting", "frontend"]},

    # 💸 Trading Simulation
    {"title": "Simulate Buy Stock Action", "body": "Allow users to simulate buying shares with a local/persistent state.", "labels": ["backend", "simulation"]},
    {"title": "Simulate Sell Stock Action", "body": "Allow users to sell owned shares from their portfolio.", "labels": ["backend", "simulation"]},
    {"title": "Track Simulated Cash Balance", "body": "Start each user with a simulated balance of $100,000.", "labels": ["backend", "simulation"]},
    {"title": "Transaction Fee Simulation", "body": "Deduct $5 from cash balance for every buy/sell.", "labels": ["backend", "simulation"]},
    {"title": "Prevent Invalid Trades", "body": "Disallow trades exceeding available cash or shares owned.", "labels": ["validation", "backend"]},

    # 📊 Portfolio Management
    {"title": "Display Portfolio Holdings", "body": "List all currently held stocks with share counts.", "labels": ["frontend", "portfolio"]},
    {"title": "Calculate Total Portfolio Value", "body": "Add cash + market value of all holdings (live).", "labels": ["backend", "calculation"]},
    {"title": "Track Gain/Loss (Realized & Unrealized)", "body": "Show both paper and actual profit/loss.", "labels": ["backend", "calculation"]},
    {"title": "Pie Chart of Portfolio Allocation", "body": "Visualize current portfolio by percentage using a donut chart.", "labels": ["frontend", "charting"]},
    {"title": "Track Average Cost Per Stock", "body": "Calculate and store average cost per share.", "labels": ["backend", "calculation"]},

    # 📋 Transaction History
    {"title": "Log Each Trade with Timestamp", "body": "Record every trade with datetime and details.", "labels": ["backend", "logging"]},
    {"title": "Separate Realized vs Unrealized Profit/Loss", "body": "Differentiate profit types clearly.", "labels": ["reporting", "calculation"]},
    {"title": "Export Transaction History to CSV", "body": "Let users download trade history.", "labels": ["frontend", "export"]},

    # 🌐 Market Context
    {"title": "Live News Feed for Each Stock", "body": "Display headlines from news API per ticker.", "labels": ["frontend", "api"]},
    {"title": "Upcoming Earnings & Dividend Dates", "body": "Pull data from financial calendar APIs.", "labels": ["api", "feature"]},
    {"title": "Volatility/Risk Score", "body": "Show simple risk score based on past price swings.", "labels": ["data", "backend"]},

    # ⭐ Watchlist
    {"title": "Add Stock to Watchlist", "body": "Add tickers without buying.", "labels": ["frontend", "user"]},
    {"title": "Quick View for Watchlist Stocks", "body": "Price and % change in compact format.", "labels": ["frontend", "user"]},

    # 🔐 User Accounts & Persistence
    {"title": "User Authentication (Login/Signup)", "body": "Use Firebase/Auth0 for secure auth.", "labels": ["auth", "backend"]},
    {"title": "Save Portfolio to Firestore", "body": "Persist user data for cloud sync.", "labels": ["backend", "persistence"]},
    {"title": "Multi-Device Sync", "body": "Ensure state consistency across devices.", "labels": ["backend", "persistence"]},

    # 🛠️ UX Enhancements
    {"title": "Dark Mode Toggle", "body": "Add a theme switcher between light/dark.", "labels": ["frontend", "ui"]},
    {"title": "Responsive Mobile Layout", "body": "Ensure layout adapts to small screens.", "labels": ["frontend", "ui"]},
    {"title": "Accessibility (ARIA/Keyboard Nav)", "body": "Improve keyboard navigation and screen reader support.", "labels": ["frontend", "a11y"]},
]

def create_issue(issue):
    url = f"https://api.github.com/repos/{OWNER}/{REPO}/issues"
    response = requests.post(url, json=issue, headers=HEADERS)
    if response.status_code == 201:
        print(f"✅ Created: {issue['title']}")
    else:
        print(f"❌ Failed: {issue['title']} - {response.status_code}")
        print(response.json())

if __name__ == "__main__":
    for issue in ISSUES:
        create_issue(issue)
