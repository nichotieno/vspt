
# StockSim Project Documentation

This document provides a comprehensive overview of the StockSim project, from its initial goals to its technical implementation and deployment processes.

---

## 🔹 1. **Project Overview Documentation**

- **Project Proposal / Brief**
  - **Goals**: To create a full-stack, realistic stock trading simulation application where users can practice trading strategies without financial risk. The application will provide real-time stock data, portfolio tracking, and AI-powered analytical tools.
  - **Scope**: The project includes user authentication, stock data display from the Finnhub API, simulated buying/selling, portfolio and watchlist management, transaction history, performance visualization, and AI-generated stock notes.
  - **Deliverables**: A fully functional, responsive web application with all features outlined in the scope, dockerized for easy deployment, and including a CI pipeline.
  - **Timeline**: 3 days.
  - **Budget**: Not Applicable.

- **Statement of Work (SOW)**
  - **Project Tasks**:
    1.  Setup Next.js project with TypeScript, Tailwind CSS, and ShadCN.
    2.  Implement database schema using SQLite and `better-sqlite3`.
    3.  Develop user authentication (signup, login, profile management).
    4.  Integrate Finnhub API for stock data (quotes, profiles, news).
    5.  Build core trading logic (buy/sell actions, cash management).
    6.  Develop UI for Dashboard, Stock Detail, Portfolio, and Watchlist.
    7.  Implement performance charts for portfolio history and stock prices.
    8.  Integrate Genkit for AI-powered stock note generation.
    9.  Write unit and component tests using Jest and React Testing Library.
    10. Dockerize the application for deployment.
    11. Set up a CI workflow using GitHub Actions.
  - **Responsibilities**: All development and implementation tasks are handled by the AI Prototyper.
  - **Timeline & Milestones**:
    - **Milestone 1**: Basic project setup and database schema.
    - **Milestone 2**: User authentication and core data fetching.
    - **Milestone 3**: Trading functionality and portfolio management.
    - **Milestone 4**: UI/UX implementation and visualization.
    - **Milestone 5**: AI feature integration.
    - **Milestone 6**: Testing, Dockerization, and CI setup.
  - **Deliverables**: A complete web application matching the project scope.

- **Kickoff Document**: Not applicable for this development process.

---

## 🔹 2. **Technical Documentation**

- **Architecture Document**
  - **System Design Overview**: The application is a full-stack web app built on the Next.js App Router. It leverages React Server Components for performance and server-side data fetching. Server Actions are used for data mutations (e.g., buying/selling stock) to avoid the need for separate API endpoints. A SQLite database handles data persistence, and all GenAI functionality is managed through Genkit flows.
  - **Component Interaction Diagrams**:
    - `User` -> `Login/Signup Page` -> `AuthContext` -> `Server Actions` -> `Database`
    - `User` -> `Dashboard/Stock Page` -> `PortfolioContext` -> `Server Actions` & `Finnhub API`
    - `User` -> `AI Note Feature` -> `Genkit Flow` -> `Google AI`
  - **Technology Stack**:
    - **Framework**: Next.js (with App Router)
    - **Language**: TypeScript
    - **UI**: React, ShadCN UI, Tailwind CSS
    - **AI**: Genkit, Google AI (Gemini)
    - **Database**: SQLite (via `better-sqlite3`)
    - **Charting**: Recharts
    - **Testing**: Jest, React Testing Library
    - **Containerization**: Docker
    - **CI/CD**: GitHub Actions

- **Design Specifications**
  - **UI/UX**: The design follows a clean, data-focused layout with a modern aesthetic.
    - **Primary Color**: Strong Blue (`#2962FF`)
    - **Background Color**: Light Grey (`#F5F7FA`)
    - **Accent Color**: Soft Purple (`#A663CC`)
    - **Font**: 'Inter' (sans-serif)
    - **Layout**: The UI is responsive, with clear sections for portfolio, watchlist, and stock details. It uses cards, tables, and charts to present information effectively.

- **Code Documentation**
  - **`README.md`**: The repository includes a `README.md` file with detailed instructions for installation, configuration (`.env.local`), and running the application locally.
  - **Inline Code Comments**: Key files (`/src/app/actions.ts`, `/src/lib/db.ts`, `/src/contexts/*.tsx`, etc.) contain JSDoc-style comments explaining the purpose of functions, their parameters, and return values.
  - **API Docs**: Not applicable, as the application uses Server Actions instead of a REST/GraphQL API. External API usage (Finnhub) is documented in `/src/lib/finnhub.ts`.

- **Database Schema**
  - **Tables**:
    - `users`: Stores user information, credentials, and cash balance.
    - `portfolio`: Holds the user's current stock holdings (one row per ticker).
    - `transactions`: A log of all buy and sell transactions.
    - `watchlist`: Stores the tickers the user is watching.
    - `portfolio_history`: Records snapshots of the user's total portfolio value over time.
  - **Relationships**: All data tables (`portfolio`, `transactions`, `watchlist`, `portfolio_history`) are linked to the `users` table via a `user_id` foreign key with a `CASCADE` delete rule.

- **Infrastructure & Deployment Guide**
  - **Hosting**: The application is designed to be hosted in any environment that supports Node.js and can run a Docker container (e.g., Firebase App Hosting, Vercel, Google Cloud Run).
  - **CI/CD**: A GitHub Actions workflow is defined in `.github/workflows/ci.yml`. It triggers on pushes and pull requests to the `main` branch and executes linting, type checking, tests, and a Docker build to ensure code quality and a buildable state.
  - **Deployment**:
    1. Build the Docker image: `docker build -t stocksim-app .`
    2. Run the container, passing the API key: `docker run -p 9002:9002 -e FINNHUB_API_KEY="your_api_key" stocksim-app`

---

## 🔹 3. **Project Execution Documentation**

- **Project Plan & Timeline**: Development followed a feature-based roadmap, prioritizing core functionality first and building upon it.
  1.  **Foundation**: Setup, DB, Auth.
  2.  **Core Features**: Trading logic, Portfolio/Watchlist state.
  3.  **UI/UX**: Page layouts and component creation.
  4.  **Advanced Features**: Charting and AI integration.
  5.  **Quality Assurance**: Testing, Dockerization, CI.
- **Meeting Notes & Communication Logs**: Not applicable.
- **Change Log / Version History**: All changes are tracked via the Git version control history.
- **Risk Register / Issue Log**: Not applicable.

---

## 🔹 4. **Testing & Quality Assurance**

- **Test Plan**
  - **Testing Strategy**: A hybrid approach combines server-side unit tests for business logic and client-side component tests for UI interactions.
  - **Scope**:
    - **Unit/Integration Tests**: Server Actions (`/src/app/actions.ts`) are tested to ensure database operations and business logic are correct.
    - **Component Tests**: Key pages like Login, Signup, and Dashboard are tested to verify rendering, user interactions, and state changes.
  - **Tools**: Jest is the test runner, with React Testing Library and `@testing-library/user-event` used for component testing.

- **Test Cases & Results**:
  - Test case definitions can be found in the `*.test.ts` and `*.test.tsx` files within the `/src/app/` directory.
  - Tests are run automatically via the CI pipeline on every push.

- **Bug Report Summary**: No major bugs are currently tracked.

---

## 🔹 5. **Training & Handover Documentation**

- **User Manual**
  1.  **Sign Up**: Create a new account from the `/signup` page.
  2.  **Log In**: Access your account from the `/login` page.
  3.  **Dashboard**: View a market overview of various stocks. Search for specific stocks using the search bar.
  4.  **Stock Details**: Click on any stock to view its detailed chart, news, and AI note generator.
  5.  **Trading**: Use the "Buy" and "Sell" buttons to execute trades.
  6.  **Portfolio Management**: Track your holdings, cash, and performance from the "My Holdings" tab on the right sidebar.
  7.  **Watchlist**: Add or remove stocks from your watchlist for easy tracking.
- **Admin / Operator Guide**: Not applicable.
- **Training Materials**: Not applicable.
- **Handover Checklist**: Not applicable.

---

## 🔹 6. **Legal & Administrative Documents**

- **NDA / Contract Agreement**: Not applicable.
- **Invoice & Payment Records**: Not applicable.
- **License Information**: This project utilizes several open-source libraries. Key dependencies include:
  - Next.js, React (MIT License)
  - Tailwind CSS (MIT License)
  - ShadCN UI (MIT License)
  - Genkit (Apache-2.0 License)
  - Lucide React (ISC License)
  - `better-sqlite3` (MIT License)
  - A full list is available in `package.json`. It is recommended to add a `LICENSE` file (e.g., MIT) to the project root.
- **Support & Maintenance Agreement**: Not applicable.

---

## 🔹 7. **Final Deliverables Summary**

- **Deliverables Index**:
  1.  Complete source code for the StockSim web application.
  2.  `Dockerfile` and `.dockerignore` for containerization.
  3.  GitHub Actions workflow for CI (`.github/workflows/ci.yml`).
  4.  This `PROJECT_DOCS.md` file.
- **Client Acceptance Sign-off**: Not applicable.
