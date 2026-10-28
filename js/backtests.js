// Backtest Results Module with Interactive Charts
const Backtests = {
    chartInstance: null,
    selectedBacktestId: null,

    init() {
        if (!AppState.data.backtests) {
            AppState.data.backtests = DEFAULT_DATA.backtests;
        }
        if (AppState.data.backtests.length > 0 && !this.selectedBacktestId) {
            this.selectedBacktestId = AppState.data.backtests[0].id;
        }
        this.render();
    },

    selectBacktest(id) {
        this.selectedBacktestId = id;
        this.render();
    },

    addBacktest(bt) {
        if (!AppState.data.backtests) AppState.data.backtests = [];
        bt.id = "bt_" + Date.now();
        bt.netProfit = Number(bt.endingCapital) - Number(bt.startingCapital);
        bt.netProfitPct = Number(((bt.netProfit / bt.startingCapital) * 100).toFixed(1));
        
        // Generate simulated equity points if not provided
        if (!bt.equityPoints || bt.equityPoints.length === 0) {
            const start = Number(bt.startingCapital);
            const end = Number(bt.endingCapital);
            const steps = 15;
            const points = [start];
            for (let i = 1; i < steps; i++) {
                const linear = start + (end - start) * (i / steps);
                const noise = (Math.random() - 0.45) * ((end - start) * 0.15);
                points.push(Math.round(linear + noise));
            }
            points.push(end);
            bt.equityPoints = points;
        }

        AppState.data.backtests.unshift(bt);
        this.selectedBacktestId = bt.id;
        AppState.saveData();
        this.render();
        App.showToast(`Backtest for "${bt.strategyName}" added!`, "success");
    },

    deleteBacktest(id) {
        if (confirm("Delete this backtest report?")) {
            AppState.data.backtests = AppState.data.backtests.filter(b => b.id !== id);
            if (this.selectedBacktestId === id) {
                this.selectedBacktestId = AppState.data.backtests.length > 0 ? AppState.data.backtests[0].id : null;
            }
            AppState.saveData();
            this.render();
            App.showToast("Backtest report deleted.", "info");
        }
    },

    render() {
        const container = document.getElementById("backtest-content");
        if (!container) return;

        const list = AppState.data.backtests || [];
        const active = list.find(b => b.id === this.selectedBacktestId) || list[0];

        // Overall stats calculation
        const totalNetProfit = list.reduce((acc, b) => acc + (Number(b.netProfit) || 0), 0);
        const avgWinRate = list.length > 0 ? (list.reduce((acc, b) => acc + (Number(b.winRate) || 0), 0) / list.length).toFixed(1) : 0;
        const totalTrades = list.reduce((acc, b) => acc + (Number(b.totalTrades) || 0), 0);

        let html = `
            <!-- High Level Summary Stats Row -->
            <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div class="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
                    <span class="text-xs font-semibold text-gray-400 uppercase tracking-wider block">Total Net Profit</span>
                    <div class="text-2xl font-black text-emerald-500 mt-1">+$${totalNetProfit.toLocaleString()}</div>
                    <span class="text-[11px] text-gray-500 mt-1 block">Across ${list.length} backtested systems</span>
                </div>
                <div class="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
                    <span class="text-xs font-semibold text-gray-400 uppercase tracking-wider block">Average Win Rate</span>
                    <div class="text-2xl font-black text-indigo-500 mt-1">${avgWinRate}%</div>
                    <span class="text-[11px] text-gray-500 mt-1 block">High statistical edge</span>
                </div>
                <div class="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
                    <span class="text-xs font-semibold text-gray-400 uppercase tracking-wider block">Total Sample Trades</span>
                    <div class="text-2xl font-black text-gray-900 dark:text-white mt-1">${totalTrades}</div>
                    <span class="text-[11px] text-gray-500 mt-1 block">Execution validation</span>
                </div>
                <div class="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-center justify-between">
                    <div>
                        <span class="text-xs font-semibold text-gray-400 uppercase tracking-wider block">Run New Test</span>
                        <div class="text-sm font-bold text-gray-900 dark:text-white mt-1">Add Backtest Record</div>
                    </div>
                    <button onclick="Backtests.openModal()" class="w-10 h-10 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center shadow transition">
                        <i class="fas fa-plus"></i>
                    </button>
                </div>
            </div>

            <!-- Active Backtest Detailed Analysis Section -->
            ${active ? `
                <div class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm mb-6">
                    <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-gray-100 dark:border-gray-700">
                        <div>
                            <div class="flex items-center gap-3">
                                <h3 class="text-2xl font-extrabold text-gray-900 dark:text-white">${active.strategyName}</h3>
                                <span class="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300">
                                    +${active.netProfitPct}% Return
                                </span>
                            </div>
                            <div class="text-xs text-gray-500 dark:text-gray-400 mt-1.5 flex flex-wrap items-center gap-3">
                                <span><i class="fas fa-coins text-amber-500"></i> Asset: <b>${active.instrument}</b></span>
                                <span>•</span>
                                <span><i class="far fa-calendar-alt text-indigo-500"></i> Period: <b>${active.period}</b></span>
                                <span>•</span>
                                <span><i class="fas fa-bolt text-emerald-500"></i> Sharpe: <b>${active.sharpeRatio || '2.10'}</b></span>
                                <span>•</span>
                                <span><i class="fas fa-arrow-down text-rose-500"></i> Max DD: <b>${active.maxDrawdown}%</b></span>
                            </div>
                        </div>

                        <!-- Selector of other backtests -->
                        <div class="flex items-center gap-2">
                            <select onchange="Backtests.selectBacktest(this.value)" class="px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-xs font-semibold text-gray-700 dark:text-gray-200 outline-none">
                                ${list.map(b => `<option value="${b.id}" ${b.id === active.id ? 'selected' : ''}>${b.strategyName} (${b.instrument})</option>`).join('')}
                            </select>
                            <button onclick="Backtests.deleteBacktest('${active.id}')" class="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition" title="Delete this Backtest">
                                <i class="far fa-trash-can"></i>
                            </button>
                        </div>
                    </div>

                    <!-- Metrics Grid -->
                    <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 my-6">
                        <div class="p-3 bg-gray-50 dark:bg-gray-900/60 rounded-xl">
                            <span class="text-[10px] uppercase font-bold text-gray-400 block">Starting Capital</span>
                            <span class="text-base font-bold text-gray-900 dark:text-white">$${Number(active.startingCapital).toLocaleString()}</span>
                        </div>
                        <div class="p-3 bg-gray-50 dark:bg-gray-900/60 rounded-xl">
                            <span class="text-[10px] uppercase font-bold text-gray-400 block">Ending Capital</span>
                            <span class="text-base font-bold text-emerald-500">$${Number(active.endingCapital).toLocaleString()}</span>
                        </div>
                        <div class="p-3 bg-gray-50 dark:bg-gray-900/60 rounded-xl">
                            <span class="text-[10px] uppercase font-bold text-gray-400 block">Profit Factor</span>
                            <span class="text-base font-bold text-indigo-500">${active.profitFactor}</span>
                        </div>
                        <div class="p-3 bg-gray-50 dark:bg-gray-900/60 rounded-xl">
                            <span class="text-[10px] uppercase font-bold text-gray-400 block">Win Rate</span>
                            <span class="text-base font-bold text-teal-500">${active.winRate}%</span>
                        </div>
                        <div class="p-3 bg-gray-50 dark:bg-gray-900/60 rounded-xl">
                            <span class="text-[10px] uppercase font-bold text-gray-400 block">Total Trades</span>
                            <span class="text-base font-bold text-gray-700 dark:text-gray-300">${active.totalTrades}</span>
                        </div>
                        <div class="p-3 bg-gray-50 dark:bg-gray-900/60 rounded-xl">
                            <span class="text-[10px] uppercase font-bold text-gray-400 block">Max Drawdown</span>
                            <span class="text-base font-bold text-rose-500">-${active.maxDrawdown}%</span>
                        </div>
                    </div>

                    <!-- Interactive Equity Curve Chart -->
                    <div class="chart-wrapper mt-4">
                        <canvas id="backtestEquityChart"></canvas>
                    </div>

                    ${active.notes ? `
                        <div class="mt-4 p-3 bg-gray-50 dark:bg-gray-900/40 rounded-xl border border-gray-100 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2">
                            <i class="fas fa-sticky-note text-amber-500"></i>
                            <span><b>Testing Notes:</b> ${active.notes}</span>
                        </div>
                    ` : ''}
                </div>
            ` : `
                <div class="bg-white dark:bg-gray-800 rounded-2xl p-12 text-center text-gray-400">
                    No backtest results logged yet. Click "Add Backtest Record" to add your first backtest.
                </div>
            `}

            <!-- Grid of all backtest summaries -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                ${list.map(bt => `
                    <div onclick="Backtests.selectBacktest('${bt.id}')" class="cursor-pointer bg-white dark:bg-gray-800 rounded-2xl border ${bt.id === (active ? active.id : null) ? 'border-emerald-500 ring-1 ring-emerald-500/20' : 'border-gray-200 dark:border-gray-700'} p-5 shadow-sm card-hover transition">
                        <div class="flex items-center justify-between mb-2">
                            <span class="font-bold text-sm text-gray-900 dark:text-white truncate">${bt.strategyName}</span>
                            <span class="text-xs font-black text-emerald-500">+${bt.netProfitPct}%</span>
                        </div>
                        <div class="text-xs text-gray-500 dark:text-gray-400 mb-3">${bt.instrument} • ${bt.period}</div>
                        <div class="flex items-center justify-between text-xs pt-3 border-t border-gray-100 dark:border-gray-700/60">
                            <span>Win Rate: <b>${bt.winRate}%</b></span>
                            <span>Max DD: <b class="text-rose-500">${bt.maxDrawdown}%</b></span>
                            <span>PF: <b>${bt.profitFactor}</b></span>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;

        container.innerHTML = html;

        // Render Chart.js
        if (active && active.equityPoints) {
            setTimeout(() => {
                this.renderEquityChart(active);
            }, 50);
        }
    },

    renderEquityChart(bt) {
        const ctx = document.getElementById("backtestEquityChart");
        if (!ctx) return;

        if (this.chartInstance) {
            this.chartInstance.destroy();
        }

        const isDark = document.documentElement.classList.contains("dark");
        const labels = bt.equityPoints.map((_, i) => `Trade ${Math.round((i / (bt.equityPoints.length - 1)) * bt.totalTrades)}`);

        this.chartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Portfolio Equity ($)',
                    data: bt.equityPoints,
                    borderColor: '#10b981',
                    backgroundColor: isDark ? 'rgba(16, 185, 129, 0.12)' : 'rgba(16, 185, 129, 0.08)',
                    borderWidth: 2.5,
                    fill: true,
                    tension: 0.35,
                    pointRadius: 3,
                    pointHoverRadius: 6,
                    pointBackgroundColor: '#10b981'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: isDark ? '#1f2937' : '#ffffff',
                        titleColor: isDark ? '#f9fafb' : '#111827',
                        bodyColor: isDark ? '#e5e7eb' : '#374151',
                        borderColor: isDark ? '#374151' : '#e5e7eb',
                        borderWidth: 1,
                        padding: 12,
                        callbacks: {
                            label: function(context) {
                                return ` Capital: $${context.parsed.y.toLocaleString()}`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: { color: isDark ? 'rgba(75, 85, 99, 0.2)' : 'rgba(229, 231, 235, 0.6)' },
                        ticks: { color: isDark ? '#9ca3af' : '#6b7280', font: { size: 10 } }
                    },
                    y: {
                        grid: { color: isDark ? 'rgba(75, 85, 99, 0.2)' : 'rgba(229, 231, 235, 0.6)' },
                        ticks: {
                            color: isDark ? '#9ca3af' : '#6b7280',
                            font: { size: 10 },
                            callback: function(val) { return '$' + val.toLocaleString(); }
                        }
                    }
                }
            }
        });
    },

    openModal() {
        const modal = document.getElementById("modal-backtest");
        if (modal) {
            modal.classList.remove("hidden");
            document.getElementById("backtest-form").reset();
        }
    }
};
