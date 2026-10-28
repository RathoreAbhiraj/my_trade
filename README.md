# MY TRADE - Trading Tracking & Algorithmic Operations System

**MY TRADE** is a full-featured, responsive trading operations suite and personal quantitative journal built for discretionary and algorithmic traders.

---

## 🌟 Feature Checklist & System Overview

### 1. 💻 Code & Script Vault (Folder Organization)
- Scripts arranged in folders: **PineScript Indicators**, **Python Algo Bots**, **MQL5 Indicators**, and **Server Automation**.
- Create custom folders and scripts with language syntax tagging (`.py`, `.pine`, `.mq5`, `.sh`, `.js`).
- Integrated code viewer with line numbers, code copy to clipboard, and instant file download (`.py`, `.pine`, etc.).

### 2. 🧠 Trading Strategies Matrix
- Details on strategies: **ICT Silver Bullet**, **15-Min ORB Breakout**, **Mean Reversion Bollinger + RSI**, **EMA 9/21 Trend Catcher**.
- **Metrics tracked**: Win Rate %, Risk-to-Reward Ratio, Profit Factor, Execution Rules, Timeframes, and Assets Traded.
- **Advantages & Disadvantages**: Clear visual side-by-side comparison for each playbook to enforce trading discipline.

### 3. 📈 Backtest Results & Analytics
- Multi-asset backtest logging with interactive **Chart.js Equity Curve visualization**.
- Statistical metrics: Net Profit ($ and %), Profit Factor, Sharpe Ratio, Win Rate %, Maximum Drawdown %, and Trade Count.
- Backtest run creator to log and test new historical algorithmic models.

### 4. 🖥️ VPS Server Telemetry & Health Manager
- Live monitoring of trading nodes across datacenters (Frankfurt Contabo, Mumbai AWS EC2, Helsinki Hetzner).
- Real-time round-trip latency to exchange servers, CPU utilization, and RAM load bars.
- Track active bot processes (PIDs, running strategy, today's P&L, service restart action).
- One-click copy SSH connect command (`ssh user@ip -p port`).

### 5. 🔐 Master Password Protected Broker Vault
- Secure vault for storing multi-broker accounts: **Zerodha Kite**, **Exness MT5**, **Interactive Brokers (IBKR)**, **Binance Futures**.
- **Master PIN Protection** (Default PIN: `1234`):
  - Passwords and API secrets are masked behind security layers until authenticated.
  - One-click password visibility toggle and instant copy to clipboard.
  - Ability to change Master PIN anytime.

### 6. 📔 Daily Trading Journal
- Comprehensive trade logging:
  - Date & Time
  - Asset / Instrument (Equities, Forex, Crypto, Indices, Commodities)
  - Direction (BUY/LONG, SELL/SHORT)
  - Linked Strategy & Linked Broker
  - Entry Price, Exit Price, Quantity / Lot Size
  - Realized P&L and R:R Achieved
  - Market Session (Asian, London, NY, NSE, Crypto 24/7)
  - **Psychological Emotion Tag**: Disciplined, Calm, Patient, Hesitant, FOMO, Greedy
  - Detailed daily trade reflection ("What happened that day on trading")
  - Chart screenshot URL preview
- Filter trades by Asset, Outcome (Win/Loss/BE), and Date.
- **Export Journal to CSV** for tax and spreadsheets.

### 7. 🌓 Light & Dark Mode Toggle
- Instant theme toggle button in header.
- Remembers user's preference in `localStorage`.
- Dynamically updates Chart.js colors, contrast grids, and tooltips.

### 8. 👤 Google Sign-In Criteria
- Google Sign-In profile bar displaying user avatar, name, and email.
- Real Google Identity Services (GIS) library support + simulated one-click Google account switcher for offline testing.

---

## 🚀 How to Run

1. Open `index.html` in any modern web browser (Google Chrome, Microsoft Edge, Brave, Firefox, Safari).
2. Or serve it via any static server, GitHub Pages, Vercel, or Netlify.
3. No build tools or Node.js required—all scripts, icons, and stylesheets are self-contained and run directly in the browser!

---

*Created for **MY TRADE** Operating System.*
