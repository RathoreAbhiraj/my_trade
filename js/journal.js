// Daily Trading Journal Module
const Journal = {
    filterSymbol: "ALL",
    filterResult: "ALL",
    filterDate: "",

    init() {
        if (!AppState.data.journalTrades) {
            AppState.data.journalTrades = DEFAULT_DATA.journalTrades;
        }
        this.render();
    },

    setFilter(key, val) {
        if (key === 'symbol') this.filterSymbol = val;
        if (key === 'result') this.filterResult = val;
        if (key === 'date') this.filterDate = val;
        this.render();
    },

    resetFilters() {
        this.filterSymbol = "ALL";
        this.filterResult = "ALL";
        this.filterDate = "";
        this.render();
    },

    addOrUpdateTrade(trade) {
        if (!AppState.data.journalTrades) AppState.data.journalTrades = [];

        // Auto calculate PnL if not explicitly filled
        const entry = parseFloat(trade.entryPrice);
        const exit = parseFloat(trade.exitPrice);
        const qty = parseFloat(trade.qty) || 1;

        if (isNaN(trade.pnl) || trade.pnl === "") {
            if (!isNaN(entry) && !isNaN(exit)) {
                if (trade.type === "BUY") {
                    trade.pnl = (exit - entry) * qty;
                } else {
                    trade.pnl = (entry - exit) * qty;
                }
            } else {
                trade.pnl = 0;
            }
        } else {
            trade.pnl = parseFloat(trade.pnl);
        }

        if (!trade.result) {
            trade.result = trade.pnl > 0 ? "WIN" : (trade.pnl < 0 ? "LOSS" : "BREAKEVEN");
        }

        const existingIdx = AppState.data.journalTrades.findIndex(t => t.id === trade.id);
        if (existingIdx >= 0) {
            AppState.data.journalTrades[existingIdx] = trade;
            App.showToast("Trade log updated!", "success");
        } else {
            trade.id = "trade_" + Date.now();
            AppState.data.journalTrades.unshift(trade);
            App.showToast("New trade logged to daily journal!", "success");
        }

        AppState.saveData();
        this.render();
    },

    deleteTrade(id) {
        if (confirm("Delete this journal trade entry?")) {
            AppState.data.journalTrades = AppState.data.journalTrades.filter(t => t.id !== id);
            AppState.saveData();
            this.render();
            App.showToast("Trade deleted from journal.", "info");
        }
    },

    exportCSV() {
        const trades = AppState.data.journalTrades || [];
        if (trades.length === 0) {
            App.showToast("No trades to export!", "warning");
            return;
        }

        const headers = ["Date", "Time", "Symbol", "Type", "Strategy", "Entry", "Exit", "Qty", "PnL", "Result", "RR", "Broker", "Session", "Emotion", "Notes"];
        const rows = trades.map(t => [
            t.date,
            t.time || "",
            t.symbol,
            t.type,
            `"${(t.strategy || "").replace(/"/g, '""')}"`,
            t.entryPrice,
            t.exitPrice,
            t.qty,
            t.pnl,
            t.result,
            t.rr || "",
            t.broker || "",
            t.session || "",
            t.emotion || "",
            `"${(t.notes || "").replace(/"/g, '""')}"`
        ]);

        const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `my_trade_journal_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        App.showToast("Journal exported to CSV!", "success");
    },

    render() {
        const container = document.getElementById("journal-content");
        if (!container) return;

        const allTrades = AppState.data.journalTrades || [];
        
        // Filter logic
        let filtered = allTrades;
        if (this.filterSymbol !== "ALL") {
            filtered = filtered.filter(t => t.symbol.toUpperCase().includes(this.filterSymbol.toUpperCase()));
        }
        if (this.filterResult !== "ALL") {
            filtered = filtered.filter(t => t.result === this.filterResult);
        }
        if (this.filterDate) {
            filtered = filtered.filter(t => t.date === this.filterDate);
        }

        // Metrics calculations
        const totalTrades = allTrades.length;
        const totalWins = allTrades.filter(t => Number(t.pnl) > 0).length;
        const totalLosses = allTrades.filter(t => Number(t.pnl) < 0).length;
        const winRate = totalTrades > 0 ? ((totalWins / totalTrades) * 100).toFixed(1) : 0;
        const netPnL = allTrades.reduce((acc, t) => acc + (Number(t.pnl) || 0), 0);
        
        // Today's stats
        const todayStr = new Date().toISOString().split('T')[0];
        const todayTrades = allTrades.filter(t => t.date === todayStr);
        const todayPnL = todayTrades.reduce((acc, t) => acc + (Number(t.pnl) || 0), 0);

        const uniqueSymbols = ["ALL", ...new Set(allTrades.map(t => t.symbol).filter(Boolean))];

        let html = `
            <!-- Top Summary Cards -->
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <!-- Today's PnL -->
                <div class="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
                    <span class="text-xs font-semibold text-gray-400 uppercase tracking-wider block">Today's Realized P&L</span>
                    <div class="text-2xl font-black mt-1 ${todayPnL >= 0 ? 'text-emerald-500' : 'text-rose-500'}">
                        ${todayPnL >= 0 ? '+' : ''}${todayPnL >= 0 ? '$' : '-$'}${Math.abs(todayPnL).toLocaleString()}
                    </div>
                    <span class="text-[11px] text-gray-400 mt-1 block">${todayTrades.length} trades executed today</span>
                </div>

                <!-- Total All-Time PnL -->
                <div class="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
                    <span class="text-xs font-semibold text-gray-400 uppercase tracking-wider block">Cumulative Net P&L</span>
                    <div class="text-2xl font-black mt-1 ${netPnL >= 0 ? 'text-emerald-500' : 'text-rose-500'}">
                        ${netPnL >= 0 ? '+' : ''}${netPnL >= 0 ? '$' : '-$'}${Math.abs(netPnL).toLocaleString()}
                    </div>
                    <span class="text-[11px] text-gray-400 mt-1 block">Account equity growth</span>
                </div>

                <!-- Win Rate -->
                <div class="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
                    <span class="text-xs font-semibold text-gray-400 uppercase tracking-wider block">Execution Win Rate</span>
                    <div class="text-2xl font-black text-indigo-500 mt-1">${winRate}%</div>
                    <span class="text-[11px] text-gray-400 mt-1 block">${totalWins} Won / ${totalLosses} Lost</span>
                </div>

                <!-- Action / Add Trade CTA -->
                <div class="bg-gradient-to-br from-emerald-600 to-teal-700 text-white p-5 rounded-2xl shadow-sm flex flex-col justify-between">
                    <div class="flex items-center justify-between">
                        <span class="text-xs font-bold uppercase tracking-wider opacity-90">Daily Log Entry</span>
                        <i class="fas fa-pen-nib text-xl opacity-80"></i>
                    </div>
                    <div class="mt-2">
                        <button onclick="Journal.openModal()" class="w-full py-2 bg-white text-emerald-800 hover:bg-emerald-50 font-bold text-xs rounded-xl shadow transition">
                            <i class="fas fa-plus mr-1"></i> Log Trade Event
                        </button>
                    </div>
                </div>
            </div>

            <!-- Filter & Action Bar -->
            <div class="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm mb-6 flex flex-wrap items-center justify-between gap-4">
                <div class="flex flex-wrap items-center gap-3">
                    <!-- Symbol Filter -->
                    <div class="flex items-center gap-1.5">
                        <span class="text-xs text-gray-400">Asset:</span>
                        <select onchange="Journal.setFilter('symbol', this.value)" class="px-3 py-1.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-xs font-semibold text-gray-700 dark:text-gray-200 outline-none">
                            ${uniqueSymbols.map(sym => `<option value="${sym}" ${this.filterSymbol === sym ? 'selected' : ''}>${sym}</option>`).join('')}
                        </select>
                    </div>

                    <!-- Outcome Filter -->
                    <div class="flex items-center gap-1.5">
                        <span class="text-xs text-gray-400">Outcome:</span>
                        <select onchange="Journal.setFilter('result', this.value)" class="px-3 py-1.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-xs font-semibold text-gray-700 dark:text-gray-200 outline-none">
                            <option value="ALL" ${this.filterResult === 'ALL' ? 'selected' : ''}>All Outcomes</option>
                            <option value="WIN" ${this.filterResult === 'WIN' ? 'selected' : ''}>Wins</option>
                            <option value="LOSS" ${this.filterResult === 'LOSS' ? 'selected' : ''}>Losses</option>
                            <option value="BREAKEVEN" ${this.filterResult === 'BREAKEVEN' ? 'selected' : ''}>Break-even</option>
                        </select>
                    </div>

                    <!-- Date Filter -->
                    <div class="flex items-center gap-1.5">
                        <span class="text-xs text-gray-400">Date:</span>
                        <input type="date" value="${this.filterDate}" onchange="Journal.setFilter('date', this.value)" class="px-3 py-1 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-xs font-semibold text-gray-700 dark:text-gray-200 outline-none">
                    </div>

                    ${(this.filterSymbol !== 'ALL' || this.filterResult !== 'ALL' || this.filterDate) ? `
                        <button onclick="Journal.resetFilters()" class="text-xs text-rose-500 hover:underline">
                            Clear Filters
                        </button>
                    ` : ''}
                </div>

                <div class="flex items-center gap-2">
                    <button onclick="Journal.exportCSV()" class="px-3.5 py-1.5 text-xs font-semibold bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-xl transition flex items-center gap-1.5">
                        <i class="fas fa-file-csv text-emerald-500"></i> Export CSV
                    </button>
                </div>
            </div>

            <!-- Trades Journal Feed -->
            <div class="space-y-4">
                ${filtered.length > 0 ? filtered.map(t => {
                    const isWin = Number(t.pnl) > 0;
                    const isBE = Number(t.pnl) === 0;
                    return `
                        <div class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm card-hover">
                            <div class="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                                <div class="space-y-3 flex-1">
                                    <!-- Top Row: Date, Symbol, Type, Strategy, Emotion -->
                                    <div class="flex flex-wrap items-center gap-2.5">
                                        <span class="px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider ${
                                            t.type === 'BUY' 
                                            ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400' 
                                            : 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400'
                                        }">
                                            <i class="fas ${t.type === 'BUY' ? 'fa-arrow-trend-up' : 'fa-arrow-trend-down'}"></i> ${t.type}
                                        </span>

                                        <span class="font-extrabold text-base text-gray-900 dark:text-white">
                                            ${t.symbol}
                                        </span>

                                        <span class="text-xs text-gray-500 dark:text-gray-400">
                                            <i class="far fa-calendar"></i> ${t.date} ${t.time ? `@ ${t.time}` : ''}
                                        </span>

                                        ${t.session ? `
                                            <span class="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                                                ${t.session}
                                            </span>
                                        ` : ''}

                                        ${t.emotion ? `
                                            <span class="px-2 py-0.5 rounded-md text-[11px] font-semibold ${
                                                ['Disciplined', 'Calm', 'Patient'].includes(t.emotion) 
                                                ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300' 
                                                : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300'
                                            }">
                                                🧠 ${t.emotion}
                                            </span>
                                        ` : ''}
                                    </div>

                                    <!-- Middle Row: Strategy, Broker & Execution Stats -->
                                    <div class="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-gray-600 dark:text-gray-300">
                                        <div>Strategy: <b class="text-gray-900 dark:text-white">${t.strategy || 'Discretionary'}</b></div>
                                        <div>Entry: <b class="font-mono text-gray-900 dark:text-white">${t.entryPrice}</b></div>
                                        <div>Exit: <b class="font-mono text-gray-900 dark:text-white">${t.exitPrice}</b></div>
                                        <div>Qty: <b class="font-mono">${t.qty}</b></div>
                                        ${t.rr ? `<div>R:R Achieved: <b class="text-emerald-500">${t.rr}</b></div>` : ''}
                                        ${t.broker ? `<div>Broker: <b class="text-indigo-500">${t.broker}</b></div>` : ''}
                                    </div>

                                    <!-- Notes & Journal thoughts -->
                                    ${t.notes ? `
                                        <div class="p-3 bg-gray-50 dark:bg-gray-900/60 rounded-xl text-xs text-gray-700 dark:text-gray-300 leading-relaxed border border-gray-100 dark:border-gray-700/60">
                                            <b class="text-gray-900 dark:text-white block mb-0.5">Trade Reflection & Execution Notes:</b>
                                            ${t.notes}
                                        </div>
                                    ` : ''}
                                </div>

                                <!-- Right Column: P&L Display & Screenshot / Actions -->
                                <div class="flex flex-col items-end justify-between self-stretch min-w-[140px]">
                                    <div class="text-right">
                                        <div class="text-2xl font-black ${
                                            isWin ? 'text-emerald-500' : (isBE ? 'text-gray-400' : 'text-rose-500')
                                        }">
                                            ${isWin ? '+' : ''}${isWin ? '$' : (isBE ? '$' : '-$')}${Math.abs(t.pnl).toLocaleString()}
                                        </div>
                                        <span class="px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                                            isWin ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400' :
                                            isBE ? 'bg-gray-100 dark:bg-gray-700 text-gray-500' :
                                            'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400'
                                        }">
                                            ${t.result}
                                        </span>
                                    </div>

                                    ${t.screenshot ? `
                                        <div class="mt-2">
                                            <a href="${t.screenshot}" target="_blank" class="inline-flex items-center gap-1.5 text-xs text-indigo-500 hover:underline font-semibold">
                                                <i class="far fa-image"></i> View Chart
                                            </a>
                                        </div>
                                    ` : ''}

                                    <div class="flex items-center gap-2 mt-3">
                                        <button onclick="Journal.openModal('${t.id}')" class="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition" title="Edit Trade">
                                            <i class="far fa-edit"></i>
                                        </button>
                                        <button onclick="Journal.deleteTrade('${t.id}')" class="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition" title="Delete Trade">
                                            <i class="far fa-trash-can"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `;
                }).join('') : `
                    <div class="bg-white dark:bg-gray-800 rounded-2xl p-12 text-center text-gray-400 border border-gray-200 dark:border-gray-700">
                        <i class="fas fa-book-open text-4xl mb-3 text-gray-300 dark:text-gray-600 block"></i>
                        No trading entries found matching your criteria. Click "Log Trade Event" to record a trade.
                    </div>
                `}
            </div>
        `;

        container.innerHTML = html;
    },

    openModal(id = null) {
        const modal = document.getElementById("modal-trade");
        if (!modal) return;
        const form = document.getElementById("trade-form");
        form.reset();

        // Populate strategy dropdown options dynamically from Strategy state
        const stratSelect = document.getElementById("trade-form-strategy");
        if (stratSelect && AppState.data.strategies) {
            stratSelect.innerHTML = `<option value="">Select Strategy</option>` + 
                AppState.data.strategies.map(s => `<option value="${s.name}">${s.name}</option>`).join('');
        }

        // Populate broker dropdown options dynamically from Broker state
        const brokerSelect = document.getElementById("trade-form-broker");
        if (brokerSelect && AppState.data.brokerVault && AppState.data.brokerVault.accounts) {
            brokerSelect.innerHTML = `<option value="">Select Broker</option>` + 
                AppState.data.brokerVault.accounts.map(b => `<option value="${b.brokerName}">${b.brokerName}</option>`).join('');
        }

        if (id) {
            const trade = AppState.data.journalTrades.find(t => t.id === id);
            if (trade) {
                document.getElementById("trade-form-id").value = trade.id;
                document.getElementById("trade-form-date").value = trade.date;
                document.getElementById("trade-form-time").value = trade.time || "";
                document.getElementById("trade-form-symbol").value = trade.symbol;
                document.getElementById("trade-form-type").value = trade.type;
                document.getElementById("trade-form-strategy").value = trade.strategy || "";
                document.getElementById("trade-form-entry").value = trade.entryPrice;
                document.getElementById("trade-form-exit").value = trade.exitPrice;
                document.getElementById("trade-form-qty").value = trade.qty;
                document.getElementById("trade-form-pnl").value = trade.pnl;
                document.getElementById("trade-form-rr").value = trade.rr || "";
                document.getElementById("trade-form-broker").value = trade.broker || "";
                document.getElementById("trade-form-session").value = trade.session || "";
                document.getElementById("trade-form-emotion").value = trade.emotion || "";
                document.getElementById("trade-form-notes").value = trade.notes || "";
                document.getElementById("trade-form-screenshot").value = trade.screenshot || "";
                document.getElementById("trade-modal-title").innerText = "Edit Journal Entry";
            }
        } else {
            document.getElementById("trade-form-id").value = "";
            document.getElementById("trade-form-date").value = new Date().toISOString().split('T')[0];
            document.getElementById("trade-modal-title").innerText = "Log New Trade Event";
        }

        modal.classList.remove("hidden");
    }
};
