// Application State & Main Controller
const AppState = {
    data: {},

    loadData() {
        const saved = localStorage.getItem('mytrade_data_v1');
        if (saved) {
            try {
                this.data = JSON.parse(saved);
            } catch (e) {
                console.error("Error loading saved data, using default data:", e);
                this.data = JSON.parse(JSON.stringify(DEFAULT_DATA));
            }
        } else {
            this.data = JSON.parse(JSON.stringify(DEFAULT_DATA));
            this.saveData();
        }
    },

    saveData() {
        try {
            localStorage.setItem('mytrade_data_v1', JSON.stringify(this.data));
        } catch (e) {
            console.error("Error saving to localStorage:", e);
        }
    },

    resetAllData() {
        if (confirm("Reset ALL data to initial sample data? This will overwrite changes.")) {
            this.data = JSON.parse(JSON.stringify(DEFAULT_DATA));
            this.saveData();
            location.reload();
        }
    }
};

const App = {
    currentTab: 'dashboard',

    init() {
        AppState.loadData();
        this.initTheme();
        this.initAuth();
        this.setupNavigation();
        this.setupModals();

        // Start listening for Firebase auth state changes
        if (typeof FirebaseAuth !== 'undefined') {
            FirebaseAuth.listenAuthState();
        }

        // Render initial view
        this.switchTab('dashboard');
    },

    // Theme Switcher (Dark / Light)
    initTheme() {
        const savedTheme = localStorage.getItem('mytrade_theme');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        
        if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
            document.documentElement.classList.add('dark');
            this.updateThemeButton(true);
        } else {
            document.documentElement.classList.remove('dark');
            this.updateThemeButton(false);
        }
    },

    toggleTheme() {
        const isDark = document.documentElement.classList.toggle('dark');
        localStorage.setItem('mytrade_theme', isDark ? 'dark' : 'light');
        this.updateThemeButton(isDark);
        this.showToast(`Switched to ${isDark ? 'Dark' : 'Light'} Mode`, "info");
        
        // Re-render chart if on backtests or dashboard
        if (this.currentTab === 'backtests' && Backtests.chartInstance) {
            Backtests.render();
        }
    },

    updateThemeButton(isDark) {
        const btn = document.getElementById('theme-toggle-btn');
        if (!btn) return;
        btn.innerHTML = isDark 
            ? `<i class="fas fa-sun text-amber-400 text-lg"></i>` 
            : `<i class="fas fa-moon text-slate-700 text-lg"></i>`;
        btn.setAttribute('title', isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode');
    },

    // Google Sign-In & Authentication
    initAuth() {
        if (!AppState.data.user) {
            AppState.data.user = DEFAULT_DATA.user;
        }
        this.renderUserUI();
    },

    renderUserUI() {
        const user = AppState.data.user;
        const profileContainer = document.getElementById('user-profile-widget');
        if (!profileContainer) return;

        if (user && user.isLoggedIn) {
            profileContainer.innerHTML = `
                <div class="flex items-center gap-3 bg-gray-50 dark:bg-gray-800/80 px-3 py-1.5 rounded-2xl border border-gray-200/80 dark:border-gray-700">
                    <img src="${user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'}" alt="${user.name}" class="w-8 h-8 rounded-full object-cover ring-2 ring-emerald-500/50">
                    <div class="hidden md:block text-left">
                        <div class="text-xs font-bold text-gray-900 dark:text-white flex items-center gap-1.5 leading-tight">
                            <span>${user.name}</span>
                            <span class="inline-flex items-center text-[10px] text-emerald-500" title="Google Verified">
                                <i class="fab fa-google text-[10px]"></i>
                            </span>
                        </div>
                        <span class="text-[10px] text-gray-500 dark:text-gray-400 block">${user.email}</span>
                    </div>
                    <button onclick="App.signOutGoogle()" class="p-1.5 text-gray-400 hover:text-rose-500 dark:hover:text-rose-400 transition ml-1" title="Sign Out">
                        <i class="fas fa-right-from-bracket"></i>
                    </button>
                </div>
            `;
        } else {
            profileContainer.innerHTML = `
                <button onclick="App.openGoogleSignInModal()" class="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 text-xs font-semibold shadow-sm transition">
                    <svg class="w-4 h-4" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                    </svg>
                    <span>Sign in with Google</span>
                </button>
            `;
        }
    },

    openGoogleSignInModal() {
        // Directly trigger Firebase Google Sign-In popup
        if (typeof FirebaseAuth !== 'undefined') {
            window._freshGoogleLogin = true;
            FirebaseAuth.signInWithGoogle();
        } else {
            App.showToast('Firebase not loaded yet. Please wait...', 'warning');
        }
    },

    signOutGoogle() {
        if (typeof FirebaseAuth !== 'undefined') {
            FirebaseAuth.signOut().then(() => {
                AppState.data.user = { isLoggedIn: false };
                AppState.saveData();
                this.renderUserUI();
                this.showToast('Signed out of Google account.', 'info');
            });
        } else {
            AppState.data.user.isLoggedIn = false;
            AppState.saveData();
            this.renderUserUI();
            this.showToast('Signed out.', 'info');
        }
    },

    // Navigation Tab Switching
    setupNavigation() {
        const navButtons = document.querySelectorAll('.nav-tab');
        navButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tab = btn.getAttribute('data-tab');
                this.switchTab(tab);
            });
        });
    },

    switchTab(tabName) {
        this.currentTab = tabName;

        // Update nav buttons
        document.querySelectorAll('.nav-tab').forEach(btn => {
            if (btn.getAttribute('data-tab') === tabName) {
                btn.classList.add('active', 'text-emerald-600', 'dark:text-emerald-400');
                btn.classList.remove('text-gray-500', 'dark:text-gray-400');
            } else {
                btn.classList.remove('active', 'text-emerald-600', 'dark:text-emerald-400');
                btn.classList.add('text-gray-500', 'dark:text-gray-400');
            }
        });

        // Hide all views
        document.querySelectorAll('.tab-view').forEach(view => {
            view.classList.add('hidden');
        });

        // Show target view
        const targetView = document.getElementById(`view-${tabName}`);
        if (targetView) {
            targetView.classList.remove('hidden');
        }

        // Module-specific render hooks
        if (tabName === 'dashboard') {
            this.renderDashboard();
        } else if (tabName === 'journal') {
            Journal.init();
        } else if (tabName === 'strategies') {
            Strategies.init();
        } else if (tabName === 'backtests') {
            Backtests.init();
        } else if (tabName === 'code') {
            CodeVault.init();
        } else if (tabName === 'vps') {
            VPSManager.init();
        } else if (tabName === 'broker') {
            BrokerVault.init();
        }

        window.scrollTo({ top: 0, behavior: 'smooth' });
    },

    // Dashboard Overview Rendering
    renderDashboard() {
        const container = document.getElementById('dashboard-content');
        if (!container) return;

        const trades = AppState.data.journalTrades || [];
        const strategies = AppState.data.strategies || [];
        const vpsServers = AppState.data.vpsServers || [];
        const backtests = AppState.data.backtests || [];
        const folders = (AppState.data.codeVault && AppState.data.codeVault.folders) || [];
        const totalScripts = folders.reduce((acc, f) => acc + (f.files ? f.files.length : 0), 0);
        const brokerAccounts = (AppState.data.brokerVault && AppState.data.brokerVault.accounts) || [];

        const totalNetProfit = trades.reduce((acc, t) => acc + (Number(t.pnl) || 0), 0);
        const winTrades = trades.filter(t => Number(t.pnl) > 0).length;
        const overallWinRate = trades.length > 0 ? ((winTrades / trades.length) * 100).toFixed(1) : 0;

        let html = `
            <!-- Top Hero Banner -->
            <div class="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-800 p-8 text-white shadow-lg mb-8">
                <div class="relative z-10 max-w-2xl">
                    <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/20 backdrop-blur-md mb-3">
                        <span class="w-2 h-2 rounded-full bg-emerald-300 animate-pulse"></span>
                        MY TRADE Pro Operating System
                    </span>
                    <h2 class="text-3xl sm:text-4xl font-extrabold tracking-tight">
                        Welcome back, ${AppState.data.user.name || 'Trader'}!
                    </h2>
                    <p class="mt-2 text-sm text-emerald-100 opacity-90 leading-relaxed">
                        Track live trading journals, test algorithmic backtests, monitor high-frequency VPS servers, store strategy codebases, and manage encrypted broker credentials in one unified workspace.
                    </p>
                    <div class="mt-5 flex flex-wrap items-center gap-3">
                        <button onclick="Journal.openModal()" class="px-4 py-2 bg-white text-emerald-900 hover:bg-emerald-50 text-xs font-bold rounded-xl shadow transition flex items-center gap-1.5">
                            <i class="fas fa-plus"></i> Quick Log Trade
                        </button>
                        <button onclick="App.switchTab('journal')" class="px-4 py-2 bg-black/20 hover:bg-black/30 text-white text-xs font-bold rounded-xl backdrop-blur-sm transition flex items-center gap-1.5">
                            <i class="fas fa-book-open"></i> Open Journal
                        </button>
                        <button onclick="App.switchTab('broker')" class="px-4 py-2 bg-black/20 hover:bg-black/30 text-white text-xs font-bold rounded-xl backdrop-blur-sm transition flex items-center gap-1.5">
                            <i class="fas fa-vault"></i> Broker Vault
                        </button>
                    </div>
                </div>
                <!-- Background decorative shapes -->
                <div class="absolute -right-10 -bottom-10 w-72 h-72 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
                <div class="absolute right-20 top-0 w-56 h-56 bg-emerald-400/20 rounded-full blur-3xl pointer-events-none"></div>
            </div>

            <!-- Stats Metric Cards -->
            <div class="grid grid-cols-2 md:grid-cols-4 gap-5 mb-8">
                <!-- Cumulative P&L -->
                <div class="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm card-hover">
                    <div class="flex items-center justify-between mb-2">
                        <span class="text-xs font-bold uppercase tracking-wider text-gray-400">Total P&L</span>
                        <div class="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
                            <i class="fas fa-wallet text-sm"></i>
                        </div>
                    </div>
                    <div class="text-2xl font-black ${totalNetProfit >= 0 ? 'text-emerald-500' : 'text-rose-500'}">
                        ${totalNetProfit >= 0 ? '+' : ''}${totalNetProfit >= 0 ? '$' : '-$'}${Math.abs(totalNetProfit).toLocaleString()}
                    </div>
                    <span class="text-[11px] text-gray-400 mt-1 block">Live journaled returns</span>
                </div>

                <!-- Win Rate -->
                <div class="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm card-hover">
                    <div class="flex items-center justify-between mb-2">
                        <span class="text-xs font-bold uppercase tracking-wider text-gray-400">Journal Win Rate</span>
                        <div class="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 flex items-center justify-center">
                            <i class="fas fa-bullseye text-sm"></i>
                        </div>
                    </div>
                    <div class="text-2xl font-black text-indigo-500">${overallWinRate}%</div>
                    <span class="text-[11px] text-gray-400 mt-1 block">${trades.length} logged trades</span>
                </div>

                <!-- Active VPS Nodes -->
                <div class="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm card-hover">
                    <div class="flex items-center justify-between mb-2">
                        <span class="text-xs font-bold uppercase tracking-wider text-gray-400">VPS Nodes Online</span>
                        <div class="w-8 h-8 rounded-lg bg-teal-100 dark:bg-teal-950/60 text-teal-600 flex items-center justify-center">
                            <i class="fas fa-server text-sm"></i>
                        </div>
                    </div>
                    <div class="text-2xl font-black text-teal-500">${vpsServers.filter(v => v.status === 'Online').length} / ${vpsServers.length}</div>
                    <span class="text-[11px] text-gray-400 mt-1 block">Infrastructure healthy</span>
                </div>

                <!-- Stored Strategies & Scripts -->
                <div class="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm card-hover">
                    <div class="flex items-center justify-between mb-2">
                        <span class="text-xs font-bold uppercase tracking-wider text-gray-400">Scripts & Strategies</span>
                        <div class="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center">
                            <i class="fas fa-code text-sm"></i>
                        </div>
                    </div>
                    <div class="text-2xl font-black text-amber-500">${strategies.length} Strats • ${totalScripts} Files</div>
                    <span class="text-[11px] text-gray-400 mt-1 block">${brokerAccounts.length} broker accounts vaulted</span>
                </div>
            </div>

            <!-- Dashboard 2-Column Section -->
            <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <!-- Left: Recent Trades & Active Strategies -->
                <div class="lg:col-span-8 space-y-6">
                    <!-- Recent Trades Card -->
                    <div class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
                        <div class="flex items-center justify-between mb-4 pb-3 border-b border-gray-100 dark:border-gray-700">
                            <div>
                                <h3 class="text-base font-bold text-gray-900 dark:text-white">Recent Daily Trades</h3>
                                <span class="text-xs text-gray-500">Latest executed setups and results</span>
                            </div>
                            <button onclick="App.switchTab('journal')" class="text-xs text-emerald-600 dark:text-emerald-400 font-semibold hover:underline flex items-center gap-1">
                                View Full Journal <i class="fas fa-arrow-right text-[10px]"></i>
                            </button>
                        </div>

                        <div class="space-y-3">
                            ${trades.slice(0, 4).map(t => `
                                <div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/60 rounded-xl border border-gray-100 dark:border-gray-700/50">
                                    <div class="flex items-center gap-3">
                                        <span class="px-2 py-0.5 rounded text-[11px] font-bold ${
                                            t.type === 'BUY' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300' : 'bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300'
                                        }">${t.type}</span>
                                        <div>
                                            <span class="font-bold text-xs text-gray-900 dark:text-white">${t.symbol}</span>
                                            <span class="text-[11px] text-gray-400 block">${t.strategy || 'Discretionary'} • ${t.date}</span>
                                        </div>
                                    </div>
                                    <div class="text-right">
                                        <span class="font-bold text-sm ${Number(t.pnl) >= 0 ? 'text-emerald-500' : 'text-rose-500'}">
                                            ${Number(t.pnl) >= 0 ? '+' : ''}$${Math.abs(t.pnl).toLocaleString()}
                                        </span>
                                        <span class="text-[10px] uppercase font-bold text-gray-400 block">${t.result}</span>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>

                    <!-- Highlighted Strategies -->
                    <div class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
                        <div class="flex items-center justify-between mb-4 pb-3 border-b border-gray-100 dark:border-gray-700">
                            <div>
                                <h3 class="text-base font-bold text-gray-900 dark:text-white">Top Quant Strategies</h3>
                                <span class="text-xs text-gray-500">Verified algorithmic playbooks</span>
                            </div>
                            <button onclick="App.switchTab('strategies')" class="text-xs text-emerald-600 dark:text-emerald-400 font-semibold hover:underline flex items-center gap-1">
                                All Strategies <i class="fas fa-arrow-right text-[10px]"></i>
                            </button>
                        </div>

                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            ${strategies.slice(0, 2).map(s => `
                                <div class="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-100 dark:border-gray-700/50">
                                    <div class="flex items-center justify-between mb-1">
                                        <span class="text-xs font-bold text-gray-900 dark:text-white">${s.name}</span>
                                        <span class="text-xs font-black text-emerald-500">${s.winRate}%</span>
                                    </div>
                                    <span class="text-[11px] text-gray-400 block mb-2">${s.category} • R:R ${s.rrRatio}</span>
                                    <div class="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                                        ✓ ${s.advantages ? s.advantages[0] : 'High expectancy'}
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>

                <!-- Right: VPS Telemetry & Quick Links -->
                <div class="lg:col-span-4 space-y-6">
                    <!-- VPS Status Card -->
                    <div class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
                        <div class="flex items-center justify-between mb-4 pb-3 border-b border-gray-100 dark:border-gray-700">
                            <h3 class="text-base font-bold text-gray-900 dark:text-white">VPS Node Health</h3>
                            <button onclick="App.switchTab('vps')" class="text-xs text-emerald-600 dark:text-emerald-400 font-semibold hover:underline">Manage</button>
                        </div>

                        <div class="space-y-3">
                            ${vpsServers.map(v => `
                                <div class="p-3 bg-gray-50 dark:bg-gray-900/60 rounded-xl border border-gray-100 dark:border-gray-700/50">
                                    <div class="flex items-center justify-between mb-1">
                                        <div class="flex items-center gap-2">
                                            <span class="w-2 h-2 rounded-full ${v.status === 'Online' ? 'bg-emerald-500' : 'bg-amber-500'}"></span>
                                            <span class="font-bold text-xs text-gray-800 dark:text-gray-200 truncate">${v.name}</span>
                                        </div>
                                        <span class="font-mono text-[10px] text-emerald-500">${v.latency}</span>
                                    </div>
                                    <div class="flex items-center justify-between text-[11px] text-gray-400 mt-2">
                                        <span>CPU: <b>${v.cpuUsage}%</b></span>
                                        <span>RAM: <b>${v.ramUsage}%</b></span>
                                        <span>IP: <code class="font-mono">${v.ipAddress}</code></span>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>

                    <!-- Broker Protection Status -->
                    <div class="bg-gradient-to-br from-gray-900 to-slate-800 text-white rounded-2xl p-6 shadow-sm">
                        <div class="flex items-center gap-3 mb-3">
                            <div class="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-lg">
                                <i class="fas fa-shield-halved"></i>
                            </div>
                            <div>
                                <h4 class="font-bold text-sm">Broker Credentials Vault</h4>
                                <span class="text-[11px] text-gray-300">Protected with Master Password</span>
                            </div>
                        </div>
                        <p class="text-xs text-gray-300 leading-relaxed mb-4">
                            Store multi-broker logins, API keys, TOTP seeds, and trading ports safely. Currently ${brokerAccounts.length} accounts configured.
                        </p>
                        <button onclick="App.switchTab('broker')" class="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow transition">
                            Open Protected Vault
                        </button>
                    </div>
                </div>
            </div>
        `;

        container.innerHTML = html;
    },

    // Modal Manager
    setupModals() {
        // Close modal when clicking backdrop or close buttons
        document.querySelectorAll('.modal-backdrop').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.add('hidden');
                }
            });
        });

        // Trade Form Submission
        const tradeForm = document.getElementById('trade-form');
        if (tradeForm) {
            tradeForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const tradeData = {
                    id: document.getElementById('trade-form-id').value,
                    date: document.getElementById('trade-form-date').value,
                    time: document.getElementById('trade-form-time').value,
                    symbol: document.getElementById('trade-form-symbol').value.toUpperCase(),
                    type: document.getElementById('trade-form-type').value,
                    strategy: document.getElementById('trade-form-strategy').value,
                    entryPrice: parseFloat(document.getElementById('trade-form-entry').value),
                    exitPrice: parseFloat(document.getElementById('trade-form-exit').value),
                    qty: parseFloat(document.getElementById('trade-form-qty').value),
                    pnl: document.getElementById('trade-form-pnl').value ? parseFloat(document.getElementById('trade-form-pnl').value) : "",
                    rr: document.getElementById('trade-form-rr').value,
                    broker: document.getElementById('trade-form-broker').value,
                    session: document.getElementById('trade-form-session').value,
                    emotion: document.getElementById('trade-form-emotion').value,
                    notes: document.getElementById('trade-form-notes').value,
                    screenshot: document.getElementById('trade-form-screenshot').value
                };
                Journal.addOrUpdateTrade(tradeData);
                this.closeModal('modal-trade');
            });
        }

        // Strategy Form Submission
        const stratForm = document.getElementById('strategy-form');
        if (stratForm) {
            stratForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const stratData = {
                    id: document.getElementById('strat-form-id').value,
                    name: document.getElementById('strat-form-name').value,
                    category: document.getElementById('strat-form-cat').value,
                    winRate: parseFloat(document.getElementById('strat-form-winrate').value),
                    rrRatio: document.getElementById('strat-form-rr').value,
                    timeframe: document.getElementById('strat-form-tf').value,
                    instruments: document.getElementById('strat-form-instruments').value.split(',').map(s => s.trim()).filter(Boolean),
                    profitFactor: parseFloat(document.getElementById('strat-form-pf').value) || 1.8,
                    rules: document.getElementById('strat-form-rules').value,
                    advantages: document.getElementById('strat-form-adv').value.split('\n').map(s => s.trim()).filter(Boolean),
                    disadvantages: document.getElementById('strat-form-dis').value.split('\n').map(s => s.trim()).filter(Boolean)
                };
                Strategies.addOrUpdateStrategy(stratData);
                this.closeModal('modal-strategy');
            });
        }

        // Backtest Form Submission
        const btForm = document.getElementById('backtest-form');
        if (btForm) {
            btForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const btData = {
                    strategyName: document.getElementById('bt-form-strat').value,
                    instrument: document.getElementById('bt-form-asset').value,
                    period: document.getElementById('bt-form-period').value,
                    startingCapital: parseFloat(document.getElementById('bt-form-start-cap').value),
                    endingCapital: parseFloat(document.getElementById('bt-form-end-cap').value),
                    winRate: parseFloat(document.getElementById('bt-form-winrate').value),
                    profitFactor: parseFloat(document.getElementById('bt-form-pf').value),
                    maxDrawdown: parseFloat(document.getElementById('bt-form-dd').value),
                    totalTrades: parseInt(document.getElementById('bt-form-trades').value),
                    sharpeRatio: parseFloat(document.getElementById('bt-form-sharpe').value) || 2.0,
                    notes: document.getElementById('bt-form-notes').value
                };
                Backtests.addBacktest(btData);
                this.closeModal('modal-backtest');
            });
        }

        // VPS Form Submission
        const vpsForm = document.getElementById('vps-form');
        if (vpsForm) {
            vpsForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const vpsData = {
                    id: document.getElementById('vps-form-id').value,
                    name: document.getElementById('vps-form-name').value,
                    provider: document.getElementById('vps-form-provider').value,
                    location: document.getElementById('vps-form-location').value,
                    ipAddress: document.getElementById('vps-form-ip').value,
                    os: document.getElementById('vps-form-os').value,
                    specs: document.getElementById('vps-form-specs').value,
                    latency: document.getElementById('vps-form-latency').value,
                    notes: document.getElementById('vps-form-notes').value
                };
                VPSManager.addOrUpdateVPS(vpsData);
                this.closeModal('modal-vps');
            });
        }

        // Code File Form Submission
        const codeForm = document.getElementById('code-file-form');
        if (codeForm) {
            codeForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const fileData = {
                    id: document.getElementById('code-form-id').value,
                    folderId: document.getElementById('code-form-folder').value,
                    name: document.getElementById('code-form-name').value,
                    language: document.getElementById('code-form-lang').value,
                    description: document.getElementById('code-form-desc').value,
                    code: document.getElementById('code-form-content').value
                };
                CodeVault.addOrUpdateFile(fileData);
                this.closeModal('modal-code-file');
            });
        }

        // Folder Form Submission
        const folderForm = document.getElementById('folder-form');
        if (folderForm) {
            folderForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const name = document.getElementById('folder-name-input').value;
                const icon = document.getElementById('folder-icon-select').value;
                CodeVault.addFolder(name, icon);
                this.closeModal('modal-add-folder');
            });
        }

        // Broker Account Form Submission
        const brokerForm = document.getElementById('broker-account-form');
        if (brokerForm) {
            brokerForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const accData = {
                    id: document.getElementById('broker-form-id').value,
                    brokerName: document.getElementById('broker-form-name').value,
                    market: document.getElementById('broker-form-market').value,
                    accountType: document.getElementById('broker-form-type').value,
                    userId: document.getElementById('broker-form-userid').value,
                    passwordEncrypted: document.getElementById('broker-form-password').value,
                    pinOr2fa: document.getElementById('broker-form-pin').value,
                    apiKey: document.getElementById('broker-form-apikey').value,
                    serverUrl: document.getElementById('broker-form-url').value,
                    notes: document.getElementById('broker-form-notes').value
                };
                BrokerVault.addOrUpdateAccount(accData);
                this.closeModal('modal-broker-account');
            });
        }

        // Change Master PIN Form Submission
        const changePinForm = document.getElementById('form-change-pin');
        if (changePinForm) {
            changePinForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const cur = document.getElementById('pin-current').value;
                const p1 = document.getElementById('pin-new').value;
                const p2 = document.getElementById('pin-confirm').value;

                if (p1 !== p2) {
                    this.showToast("New PINs do not match!", "error");
                    return;
                }
                if (BrokerVault.changePin(cur, p1)) {
                    this.closeModal('modal-change-pin');
                }
            });
        }
    },

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) modal.classList.add('hidden');
    },

    // Copy to clipboard helper
    copyText(text, label = "Item") {
        if (!navigator.clipboard) {
            const ta = document.createElement("textarea");
            ta.value = text;
            document.body.appendChild(ta);
            ta.select();
            document.execCommand("copy");
            document.body.removeChild(ta);
        } else {
            navigator.clipboard.writeText(text);
        }
        this.showToast(`${label} copied to clipboard!`, "success");
    },

    // Toast Notification System
    showToast(message, type = "info") {
        const container = document.getElementById('toast-container');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl text-xs font-semibold text-white pointer-events-auto ${
            type === 'success' ? 'bg-emerald-600' :
            type === 'error' ? 'bg-rose-600' :
            type === 'warning' ? 'bg-amber-600' : 'bg-slate-800'
        }`;

        const icon = type === 'success' ? 'fa-circle-check' :
                     type === 'error' ? 'fa-circle-xmark' :
                     type === 'warning' ? 'fa-triangle-exclamation' : 'fa-circle-info';

        toast.innerHTML = `
            <i class="fas ${icon} text-base"></i>
            <span>${message}</span>
        `;

        container.appendChild(toast);
        setTimeout(() => toast.classList.add('show'), 10);

        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3200);
    }
};

// Global startup when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
