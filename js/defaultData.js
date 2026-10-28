// Default Mock Data for MY TRADE
const DEFAULT_DATA = {
    user: {
        isLoggedIn: true,
        name: "Rohan Trader",
        email: "rohan.trader@gmail.com",
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
        role: "Algo & Discretionary Trader"
    },
    codeVault: {
        folders: [
            {
                id: "folder_pinescript",
                name: "PineScript Indicators",
                icon: "fa-chart-line",
                files: [
                    {
                        id: "file_silver_bullet",
                        name: "ict_silver_bullet.pine",
                        language: "pinescript",
                        updated: "2026-10-25",
                        description: "Automatic FVG & Liquidity Sweep marker for Silver Bullet hours (10-11 AM & 2-3 PM NY)",
                        code: `//@version=5
indicator("MY TRADE - ICT Silver Bullet Auto-Detector", overlay=true)

// Inputs
nyHour = hour(time, "America/New_York")
nyMinute = minute(time, "America/New_York")
isSilverBulletAM = (nyHour == 10)
isSilverBulletPM = (nyHour == 14)
isSession = isSilverBulletAM or isSilverBulletPM

// Fair Value Gap Detection
bullishFVG = low > high[2] and close[1] > high[2]
bearishFVG = high < low[2] and close[1] < low[2]

bgcolor(isSession ? color.new(color.blue, 90) : na, title="Silver Bullet Window")

plotshape(isSession and bullishFVG, title="Bullish FVG", style=shape.triangleup, 
          location=location.belowbar, color=color.green, size=size.small, text="Bull FVG")
plotshape(isSession and bearishFVG, title="Bearish FVG", style=shape.triangledown, 
          location=location.abovebar, color=color.red, size=size.small, text="Bear FVG")

alertcondition(isSession and (bullishFVG or bearishFVG), title="Silver Bullet Setup Alert", message="New Silver Bullet FVG formed!")`
                    },
                    {
                        id: "file_supertrend",
                        name: "dynamic_supertrend_sl.pine",
                        language: "pinescript",
                        updated: "2026-10-20",
                        description: "Multi-timeframe SuperTrend with dynamic ATR Trailing Stop loss logic",
                        code: `//@version=5
strategy("MY TRADE - Dynamic ATR SuperTrend Trailing", overlay=true, initial_capital=10000)

factor = input.float(3.0, title="Factor", step=0.1)
atrPeriod = input.int(10, title="ATR Length")

[supertrend, direction] = ta.supertrend(factor, atrPeriod)

bodyMiddle = plot((open + close) / 2, display=display.none)
upTrend = plot(direction < 0 ? supertrend : na, "Up Trend", color=color.green, style=plot.style_linebr)
downTrend = plot(direction < 0 ? na : supertrend, "Down Trend", color=color.red, style=plot.style_linebr)

if ta.change(direction) < 0
    strategy.entry("Long", strategy.long)
if ta.change(direction) > 0
    strategy.entry("Short", strategy.short)`
                    }
                ]
            },
            {
                id: "folder_python",
                name: "Python Algo Bots",
                icon: "fa-robot",
                files: [
                    {
                        id: "file_kite_algo",
                        name: "zerodha_straddle_engine.py",
                        language: "python",
                        updated: "2026-10-27",
                        description: "Automated 9:20 AM BankNifty Short Straddle with 25% individual SL and trailing",
                        code: `import time
import logging
from datetime import datetime
from kiteconnect import KiteConnect

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")

API_KEY = "YOUR_KITE_API_KEY"
ACCESS_TOKEN = "YOUR_KITE_ACCESS_TOKEN"

kite = KiteConnect(api_key=API_KEY)
kite.set_access_token(ACCESS_TOKEN)

def get_atm_strike(symbol="BANKNIFTY"):
    ltp = kite.ltp(f"NSE:{symbol}")[f"NSE:{symbol}"]["last_price"]
    strike = round(ltp / 100) * 100
    logging.info(f"Spot LTP: {ltp} | Detected ATM Strike: {strike}")
    return strike

def execute_920_straddle():
    logging.info("Executing 09:20 AM Short Straddle Engine...")
    strike = get_atm_strike("BANKNIFTY")
    logging.info(f"Placing Sell CE & PE for strike: {strike}")
    # Order execution logic here with SL at 25%

if __name__ == "__main__":
    execute_920_straddle()`
                    },
                    {
                        id: "file_crypto_ws",
                        name: "binance_orderbook_feed.py",
                        language: "python",
                        updated: "2026-10-22",
                        description: "Ultra-low latency Binance WebSockets depth listener for real-time bid/ask imbalance",
                        code: `import json
import websocket

SOCKET = "wss://stream.binance.com:9443/ws/btcusdt@depth5@100ms"

def on_message(ws, message):
    data = json.loads(message)
    bids = sum([float(b[1]) for b in data['bids']])
    asks = sum([float(a[1]) for a in data['asks']])
    imbalance = (bids - asks) / (bids + asks) * 100
    print(f"[BTC/USDT Imbalance: {imbalance:+.2f}%] Top Bid: {data['bids'][0][0]} | Top Ask: {data['asks'][0][0]}")

def on_error(ws, error):
    print("Error:", error)

if __name__ == "__main__":
    ws = websocket.WebSocketApp(SOCKET, on_message=on_message, on_error=on_error)
    ws.run_forever()`
                    }
                ]
            },
            {
                id: "folder_mql5",
                name: "MQL5 MT5 Indicators",
                icon: "fa-terminal",
                files: [
                    {
                        id: "file_gold_scalper",
                        name: "xauusd_breakout_ea.mq5",
                        language: "mql5",
                        updated: "2026-10-18",
                        description: "London Open Breakout Expert Advisor for XAUUSD (Gold)",
                        code: `//+------------------------------------------------------------------+
//|                                     xauusd_breakout_ea.mq5       |
//|                                     Copyright 2026, MY TRADE     |
//+------------------------------------------------------------------+
#property copyright "MY TRADE Algo Desk"
#property link      "https://mytrade.internal"
#property version   "2.00"

input double LotSize = 0.05;
input int LondonOpenHour = 10;
input int TakeProfitPoints = 300;
input int StopLossPoints = 150;

int OnInit() {
   Print("MY TRADE XAUUSD Breakout EA Initialized successfully.");
   return(INIT_SUCCEEDED);
}

void OnTick() {
   // High-speed Tick Evaluation logic
}`
                    }
                ]
            },
            {
                id: "folder_vps_scripts",
                name: "Server & VPS Automation",
                icon: "fa-server",
                files: [
                    {
                        id: "file_vps_health",
                        name: "monitor_vps_services.sh",
                        language: "bash",
                        updated: "2026-10-15",
                        description: "Crontab daemon script to auto-restart MT5 terminals and Python trading bots if crashed",
                        code: `#!/bin/bash
# VPS Trading Watchdog Service
BOT_NAME="zerodha_straddle_engine.py"
LOG_FILE="/var/log/mytrade_watchdog.log"

if ! pgrep -f "$BOT_NAME" > /dev/null
then
    echo "$(date): $BOT_NAME was NOT running! Restarting now..." >> $LOG_FILE
    nohup python3 /root/trading_bots/$BOT_NAME >> /root/trading_bots/engine.log 2>&1 &
    # Send Telegram Emergency Notification
    curl -s -X POST "https://api.telegram.org/bot<TOKEN>/sendMessage" -d chat_id=<CHAT_ID> -d text="[ALERT] VPS Bot Restarted automatically!"
fi`
                    }
                ]
            }
        ]
    },
    strategies: [
        {
            id: "strat_1",
            name: "ICT Silver Bullet 15M / 5M",
            category: "Smart Money Concepts",
            winRate: 68.5,
            rrRatio: "1 : 2.8",
            timeframe: "5M / 15M",
            instruments: ["EURUSD", "GBPUSD", "NQ", "XAUUSD"],
            tradesCount: 142,
            profitFactor: 2.34,
            advantages: [
                "Strict algorithmic time windows (10-11 AM & 2-3 PM NY time)",
                "Extremely high Risk-to-Reward ratio (consistently > 1:2.5)",
                "Objective rules based on Fair Value Gaps (FVG) and liquidity sweeps",
                "Keeps trader out of choppy mid-day market churn"
            ],
            disadvantages: [
                "Requires high discipline to sit on hands outside specific hours",
                "Can produce 2-3 consecutive fakeout losses on heavy news days (CPI/NFP)",
                "Needs precise execution and tight spread broker"
            ],
            rules: "1. Wait for liquidity sweep of Asian or London session High/Low. 2. Look for Market Structure Shift (MSS) on 5m chart. 3. Enter on retest of 5m Fair Value Gap. 4. Invalidation above/below swing point."
        },
        {
            id: "strat_2",
            name: "15-Min Opening Range Breakout (ORB)",
            category: "Momentum / Breakout",
            winRate: 62.0,
            rrRatio: "1 : 2.0",
            timeframe: "15M",
            instruments: ["NIFTY 50", "BANKNIFTY", "TESLA", "SPY"],
            tradesCount: 215,
            profitFactor: 1.95,
            advantages: [
                "Captures large directional trend days early in the session",
                "Easy to code and 100% automate via broker API",
                "Clear defined entry trigger (High/Low of candle 1) and stops"
            ],
            disadvantages: [
                "Whipsaw risk in tight low-volatility consolidated market conditions",
                "Slippage on high-momentum market orders",
                "Requires trailing stop loss to prevent giving back profits"
            ],
            rules: "Mark high and low of the first 15-minute candle. Enter Long on candle close above High with volume > 20 EMA volume. Place SL at mid-point of range."
        },
        {
            id: "strat_3",
            name: "Mean Reversion Bollinger + RSI Divergence",
            category: "Mean Reversion",
            winRate: 74.2,
            rrRatio: "1 : 1.4",
            timeframe: "1H / 4H",
            instruments: ["BTCUSDT", "ETHUSDT", "EURJPY", "CRUDEOIL"],
            tradesCount: 310,
            profitFactor: 2.12,
            advantages: [
                "Highest statistical win rate across sideways & consolidating markets",
                "Multiple confirmation filters reduce bad trades",
                "Stress-free entries near extreme overbought/oversold levels"
            ],
            disadvantages: [
                "Lower Risk-to-Reward ratio (takes profit quickly at middle band)",
                "Severe vulnerability during explosive macro breakouts without hard SL",
                "Fewer setups per week"
            ],
            rules: "Price touches outside of 2.5 Std Dev Bollinger Band + RSI < 25 or > 75 with bullish/bearish divergence. Exit 50% at 20 SMA middle band, rest at opposite band."
        },
        {
            id: "strat_4",
            name: "EMA 9/21 Trend Catcher & VWAP Anchor",
            category: "Trend Following",
            winRate: 56.5,
            rrRatio: "1 : 3.5",
            timeframe: "5M",
            instruments: ["NIFTY", "FINNIFTY", "GOLD", "US30"],
            tradesCount: 188,
            profitFactor: 2.28,
            advantages: [
                "Rides multi-hour super trends for massive 1:4+ payoffs",
                "VWAP acts as institutional magnet and high-probability support/resistance",
                "Keeps you on the right side of the institutional flow"
            ],
            disadvantages: [
                "Win rate is lower (~56%), requiring calm psychology during losing streaks",
                "Multiple scratch / break-even trades on sideways days"
            ],
            rules: "EMA 9 crosses EMA 21 above Anchor VWAP. Enter on first pullback candle touching 9 EMA with bullish rejection wick."
        }
    ],
    backtests: [
        {
            id: "bt_1",
            strategyName: "ICT Silver Bullet 15M",
            instrument: "EURUSD / GBPUSD",
            period: "Jan 2025 - Oct 2026 (22 Months)",
            startingCapital: 10000,
            endingCapital: 28450,
            netProfit: 18450,
            netProfitPct: 184.5,
            totalTrades: 320,
            winRate: 67.8,
            profitFactor: 2.45,
            maxDrawdown: 6.8,
            sharpeRatio: 2.21,
            expectancy: 57.65,
            equityPoints: [10000, 10800, 10500, 11400, 12200, 11900, 13100, 14200, 13900, 15600, 16800, 16200, 18100, 19500, 21000, 20400, 22800, 24500, 26100, 28450],
            notes: "Conducted with 0.5 pip fixed spread & $3 round turn commission. Performance peaked during New York session liquidity spikes."
        },
        {
            id: "bt_2",
            strategyName: "NIFTY 15-Min ORB Breakout",
            instrument: "NIFTY Index Options",
            period: "June 2025 - Oct 2026 (16 Months)",
            startingCapital: 500000,
            endingCapital: 980000,
            netProfit: 480000,
            netProfitPct: 96.0,
            totalTrades: 240,
            winRate: 61.2,
            profitFactor: 2.08,
            maxDrawdown: 5.4,
            sharpeRatio: 1.94,
            expectancy: 2000,
            equityPoints: [500000, 520000, 515000, 545000, 570000, 560000, 610000, 640000, 630000, 690000, 725000, 715000, 780000, 830000, 875000, 860000, 910000, 940000, 980000],
            notes: "Option buying with Delta 0.5 ATM weekly contracts. SL capped strictly at 25% of premium."
        },
        {
            id: "bt_3",
            strategyName: "XAUUSD London Breakout Scalper",
            instrument: "XAUUSD (Gold Spot)",
            period: "Jan 2026 - Sep 2026 (9 Months)",
            startingCapital: 5000,
            endingCapital: 12100,
            netProfit: 7100,
            netProfitPct: 142.0,
            totalTrades: 185,
            winRate: 64.3,
            profitFactor: 2.18,
            maxDrawdown: 7.9,
            sharpeRatio: 2.05,
            expectancy: 38.37,
            equityPoints: [5000, 5300, 5100, 5650, 6100, 5900, 6600, 7200, 7000, 7900, 8400, 8100, 9050, 9800, 10500, 10200, 11100, 11600, 12100],
            notes: "Tested on IC Markets Raw Spread account. High trade accuracy during 08:00 to 11:00 UTC."
        }
    ],
    vpsServers: [
        {
            id: "vps_1",
            name: "Frankfurt Primary High-Freq VPS",
            provider: "Contabo Cloud",
            location: "Frankfurt, Germany 🇩🇪",
            ipAddress: "194.163.148.82",
            os: "Ubuntu 24.04 LTS (Optimized Realtime Kernel)",
            specs: "4 vCPU / 8 GB RAM / 200 GB NVMe",
            status: "Online",
            latency: "14 ms",
            cpuUsage: 28,
            ramUsage: 54,
            uptime: "64 days, 18 hrs",
            sshUser: "root",
            sshPort: 2222,
            activeBots: [
                { name: "MT5 Terminal 01 (Gold Scalper)", pid: 14820, status: "Active", pnlToday: "+$240.50" },
                { name: "Python Silver Bullet Engine", pid: 15201, status: "Active", pnlToday: "+$180.00" }
            ],
            notes: "Main forex & crypto bot execution server. Backed up every Sunday at 02:00 AM."
        },
        {
            id: "vps_2",
            name: "Mumbai Low-Latency NSE Algo Node",
            provider: "AWS EC2 (ap-south-1)",
            location: "Mumbai, India 🇮🇳",
            ipAddress: "13.233.91.45",
            os: "Windows Server 2022 Datacenter",
            specs: "t3.large (2 vCPU / 8 GB RAM / 100 GB SSD)",
            status: "Online",
            latency: "3 ms",
            cpuUsage: 35,
            ramUsage: 62,
            uptime: "28 days, 04 hrs",
            sshUser: "Administrator",
            sshPort: 3389,
            activeBots: [
                { name: "Zerodha Kite Auto-Straddle 9:20", pid: 4892, status: "Active", pnlToday: "+₹8,450" },
                { name: "BankNifty Breakout Watcher", pid: 6104, status: "Active", pnlToday: "+₹4,200" }
            ],
            notes: "Direct 3ms lease-line routing to NSE Exchange servers. Dedicated for Indian markets."
        },
        {
            id: "vps_3",
            name: "Helsinki Backup & Machine Learning Node",
            provider: "Hetzner Cloud",
            location: "Helsinki, Finland 🇫🇮",
            ipAddress: "95.217.84.112",
            os: "Debian 12 Bookworm",
            specs: "CPX31 (4 vCPU / 8 GB RAM / 160 GB NVMe)",
            status: "Standby",
            latency: "28 ms",
            cpuUsage: 12,
            ramUsage: 25,
            uptime: "95 days, 11 hrs",
            sshUser: "algo_dev",
            sshPort: 22,
            activeBots: [
                { name: "Historical Tick Data Scraper", pid: 8812, status: "Active", pnlToday: "0" },
                { name: "Telegram Bot Alert Dispatcher", pid: 9110, status: "Active", pnlToday: "0" }
            ],
            notes: "Runs heavy nightly backtests and synchronizes daily trading journals to remote S3."
        }
    ],
    journalTrades: [
        {
            id: "trade_1",
            date: "2026-10-28",
            time: "10:15",
            symbol: "BANKNIFTY",
            type: "BUY",
            strategy: "15-Min Opening Range Breakout (ORB)",
            entryPrice: 51240,
            exitPrice: 51580,
            qty: 60,
            pnl: 20400,
            pnlPct: 4.8,
            rr: "1:2.4",
            broker: "Zerodha Kite",
            session: "NSE Morning",
            emotion: "Disciplined",
            result: "WIN",
            notes: "Clean breakout of 15m high with strong volume expansion in banking stocks. Followed plan, scaled out 50% at 1:1.5 and trailed rest.",
            screenshot: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=600&q=80"
        },
        {
            id: "trade_2",
            date: "2026-10-28",
            time: "14:10",
            symbol: "XAUUSD",
            type: "BUY",
            strategy: "ICT Silver Bullet 15M / 5M",
            entryPrice: 2742.50,
            exitPrice: 2753.80,
            qty: 1.0,
            pnl: 1130,
            pnlPct: 3.2,
            rr: "1:2.9",
            broker: "Exness Pro MT5",
            session: "NY Session",
            emotion: "Patient",
            result: "WIN",
            notes: "London low was taken right at 13:50. Clean 5m FVG formed at 14:05. Entered on retest with 3.5 pt SL. Hit TP cleanly.",
            screenshot: "https://images.unsplash.com/photo-1642543492481-44e81e3914a7?auto=format&fit=crop&w=600&q=80"
        },
        {
            id: "trade_3",
            date: "2026-10-27",
            time: "09:35",
            symbol: "NIFTY 50",
            type: "SELL",
            strategy: "EMA 9/21 Trend Catcher & VWAP Anchor",
            entryPrice: 24380,
            exitPrice: 24425,
            qty: 75,
            pnl: -3375,
            pnlPct: -1.2,
            rr: "1:1.5",
            broker: "Zerodha Kite",
            session: "NSE Morning",
            emotion: "Hesitant",
            result: "LOSS",
            notes: "Took short setup below VWAP, but global markets were bouncing sharply. Cut trade promptly at stop loss without averaging.",
            screenshot: ""
        },
        {
            id: "trade_4",
            date: "2026-10-27",
            time: "19:45",
            symbol: "BTCUSDT",
            type: "BUY",
            strategy: "Mean Reversion Bollinger + RSI Divergence",
            entryPrice: 67200,
            exitPrice: 68650,
            qty: 0.5,
            pnl: 725,
            pnlPct: 2.15,
            rr: "1:2.0",
            broker: "Binance Futures",
            session: "Crypto 24/7",
            emotion: "Calm",
            result: "WIN",
            notes: "Strong bullish divergence on 1H RSI with price piercing lower Bollinger Band. Took TP near 20 SMA.",
            screenshot: ""
        },
        {
            id: "trade_5",
            date: "2026-10-26",
            time: "15:20",
            symbol: "EURUSD",
            type: "SELL",
            strategy: "ICT Silver Bullet 15M / 5M",
            entryPrice: 1.0825,
            exitPrice: 1.0790,
            qty: 2.0,
            pnl: 700,
            pnlPct: 1.8,
            rr: "1:3.0",
            broker: "Interactive Brokers",
            session: "NY Session",
            emotion: "Disciplined",
            result: "WIN",
            notes: "Clean rejection of London session high, textbook displacement downwards with clear imbalance.",
            screenshot: ""
        }
    ],
    brokerVault: {
        masterPinHash: "81dc9bdb52d04dc20036dbd8313ed055", // MD5 or simple hash of '1234'
        isUnlocked: false,
        accounts: [
            {
                id: "broker_1",
                brokerName: "Zerodha Kite",
                market: "India Equities & F&O (NSE/BSE)",
                accountType: "Live Trading",
                userId: "XY9821",
                passwordEncrypted: "Kite@Trade2026#Secure",
                pinOr2fa: "982144 (TOTP: JBSWY3DPEHPK3PXP)",
                apiKey: "zrd_api_991823718942",
                apiSecretEncrypted: "sec_8849201847192847",
                serverUrl: "https://kite.zerodha.com",
                notes: "Primary algorithmic trading account. API renews daily at 07:00 AM IST."
            },
            {
                id: "broker_2",
                brokerName: "Exness MT5 Raw Spread",
                market: "Forex & Gold Spot (XAUUSD)",
                accountType: "Live MetaTrader 5",
                userId: "74029155",
                passwordEncrypted: "GoldMaster#2026$$",
                pinOr2fa: "Investor: InvRead998!",
                apiKey: "MT5-ECN-DIRECT",
                apiSecretEncrypted: "Exness-Real19 Server",
                serverUrl: "Exness-Real19 (IP: 185.122.58.4)",
                notes: "Ultra-low 0.0 pip spread account on Gold. Connected to Frankfurt VPS."
            },
            {
                id: "broker_3",
                brokerName: "Interactive Brokers (IBKR)",
                market: "US Stocks, Options & Futures (CME)",
                accountType: "Pro Margin Account",
                userId: "u10928490",
                passwordEncrypted: "IbkrPro#Quant2026",
                pinOr2fa: "IB Key Digital Mobile Token",
                apiKey: "IB-GATEWAY-TWS-7496",
                apiSecretEncrypted: "ib_token_secret_9941",
                serverUrl: "https://www.interactivebrokers.com",
                notes: "Used for SPY, QQQ options and US30 micro futures."
            },
            {
                id: "broker_4",
                brokerName: "Binance Futures VIP",
                market: "Crypto Perpetual Contracts (USDT-M)",
                accountType: "Futures Sub-Account 01",
                userId: "rohan.crypto@trade.internal",
                passwordEncrypted: "BncFut#StrongAlgo2026!",
                pinOr2fa: "YubiKey 5C + Google Authenticator",
                apiKey: "bnc_prod_k992147102938471",
                apiSecretEncrypted: "bnc_sec_00192847192837418293",
                serverUrl: "https://fapi.binance.com",
                notes: "API restricted to VPS IP 194.163.148.82 only. Auto-withdrawal disabled."
            }
        ]
    }
};
