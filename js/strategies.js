// Trading Strategies Module
const Strategies = {
    selectedCategory: "All",

    init() {
        if (!AppState.data.strategies) {
            AppState.data.strategies = DEFAULT_DATA.strategies;
        }
        this.render();
    },

    setFilter(cat) {
        this.selectedCategory = cat;
        this.render();
    },

    addOrUpdateStrategy(strat) {
        if (!AppState.data.strategies) {
            AppState.data.strategies = [];
        }
        const existingIdx = AppState.data.strategies.findIndex(s => s.id === strat.id);
        if (existingIdx >= 0) {
            AppState.data.strategies[existingIdx] = strat;
            App.showToast(`Strategy "${strat.name}" updated!`, "success");
        } else {
            strat.id = "strat_" + Date.now();
            AppState.data.strategies.unshift(strat);
            App.showToast(`New Strategy "${strat.name}" created!`, "success");
        }
        AppState.saveData();
        this.render();
    },

    deleteStrategy(id) {
        if (confirm("Are you sure you want to delete this trading strategy?")) {
            AppState.data.strategies = AppState.data.strategies.filter(s => s.id !== id);
            AppState.saveData();
            this.render();
            App.showToast("Strategy removed.", "info");
        }
    },

    render() {
        const container = document.getElementById("strategies-content");
        if (!container) return;

        const strategies = AppState.data.strategies || [];
        const categories = ["All", ...new Set(strategies.map(s => s.category).filter(Boolean))];
        const filtered = this.selectedCategory === "All" 
            ? strategies 
            : strategies.filter(s => s.category === this.selectedCategory);

        let html = `
            <!-- Top Controls & Category Filters -->
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div class="flex flex-wrap items-center gap-2">
                    ${categories.map(cat => `
                        <button onclick="Strategies.setFilter('${cat}')" class="px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
                            this.selectedCategory === cat 
                            ? 'bg-emerald-600 text-white shadow-sm' 
                            : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                        }">
                            ${cat}
                        </button>
                    `).join('')}
                </div>

                <button onclick="Strategies.openModal()" class="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-sm transition flex items-center gap-2 self-start sm:self-auto">
                    <i class="fas fa-plus"></i> Add Strategy
                </button>
            </div>

            <!-- Strategy Cards Grid -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                ${filtered.map(strat => {
                    const winRate = Number(strat.winRate) || 0;
                    return `
                        <div class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm card-hover flex flex-col justify-between">
                            <div>
                                <!-- Header -->
                                <div class="flex items-start justify-between gap-3 mb-4">
                                    <div>
                                        <span class="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                                            ${strat.category || 'Trading Strategy'}
                                        </span>
                                        <h3 class="text-xl font-bold text-gray-900 dark:text-white mt-0.5">${strat.name}</h3>
                                        <div class="flex flex-wrap items-center gap-2 mt-2">
                                            ${strat.timeframe ? `<span class="px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs font-medium"><i class="far fa-clock"></i> ${strat.timeframe}</span>` : ''}
                                            ${strat.rrRatio ? `<span class="px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 text-xs font-medium"><i class="fas fa-scale-balanced"></i> R:R ${strat.rrRatio}</span>` : ''}
                                            ${strat.profitFactor ? `<span class="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-medium">PF: ${strat.profitFactor}</span>` : ''}
                                        </div>
                                    </div>

                                    <!-- Win Rate Badge with Radial visual -->
                                    <div class="text-center bg-gray-50 dark:bg-gray-900/80 p-3 rounded-2xl border border-gray-100 dark:border-gray-700/60 min-w-[85px]">
                                        <div class="text-xl font-black ${winRate >= 60 ? 'text-emerald-500' : 'text-amber-500'}">
                                            ${winRate}%
                                        </div>
                                        <span class="text-[10px] uppercase font-bold text-gray-400 block tracking-tight">Win Rate</span>
                                    </div>
                                </div>

                                <!-- Win Rate Progress Bar -->
                                <div class="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2 mb-5 overflow-hidden">
                                    <div class="h-2 rounded-full ${winRate >= 60 ? 'bg-gradient-to-r from-emerald-500 to-teal-400' : 'bg-gradient-to-r from-amber-500 to-yellow-400'}" style="width: ${winRate}%"></div>
                                </div>

                                <!-- Rules summary -->
                                ${strat.rules ? `
                                    <div class="mb-4 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-100 dark:border-gray-700/50 text-xs">
                                        <span class="font-bold text-gray-700 dark:text-gray-300 block mb-1">Execution Rule:</span>
                                        <p class="text-gray-600 dark:text-gray-400 leading-relaxed">${strat.rules}</p>
                                    </div>
                                ` : ''}

                                <!-- Advantages & Disadvantages Side by Side -->
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                    <!-- Advantages -->
                                    <div class="bg-emerald-50/50 dark:bg-emerald-950/20 rounded-xl p-3.5 border border-emerald-100 dark:border-emerald-900/30">
                                        <div class="flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400 mb-2">
                                            <i class="fas fa-circle-check"></i> Advantages
                                        </div>
                                        <ul class="space-y-1.5 text-xs text-emerald-950 dark:text-emerald-200">
                                            ${(strat.advantages || []).map(adv => `
                                                <li class="flex items-start gap-1.5">
                                                    <span class="text-emerald-500 mt-0.5">•</span>
                                                    <span>${adv}</span>
                                                </li>
                                            `).join('')}
                                        </ul>
                                    </div>

                                    <!-- Disadvantages -->
                                    <div class="bg-rose-50/50 dark:bg-rose-950/20 rounded-xl p-3.5 border border-rose-100 dark:border-rose-900/30">
                                        <div class="flex items-center gap-1.5 text-xs font-bold text-rose-700 dark:text-rose-400 mb-2">
                                            <i class="fas fa-triangle-exclamation"></i> Limitations & Risks
                                        </div>
                                        <ul class="space-y-1.5 text-xs text-rose-950 dark:text-rose-200">
                                            ${(strat.disadvantages || []).map(dis => `
                                                <li class="flex items-start gap-1.5">
                                                    <span class="text-rose-500 mt-0.5">•</span>
                                                    <span>${dis}</span>
                                                </li>
                                            `).join('')}
                                        </ul>
                                    </div>
                                </div>
                            </div>

                            <!-- Card Footer -->
                            <div class="flex items-center justify-between pt-4 mt-2 border-t border-gray-100 dark:border-gray-700/60">
                                <span class="text-xs text-gray-400">
                                    Traded on: <b class="text-gray-600 dark:text-gray-300">${(strat.instruments || []).join(', ') || 'Multi-asset'}</b>
                                </span>
                                <div class="flex items-center gap-2">
                                    <button onclick="Strategies.openModal('${strat.id}')" class="px-3 py-1 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition">
                                        <i class="far fa-edit"></i> Edit
                                    </button>
                                    <button onclick="Strategies.deleteStrategy('${strat.id}')" class="px-3 py-1 text-xs font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition">
                                        <i class="far fa-trash-can"></i> Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;

        container.innerHTML = html;
    },

    openModal(id = null) {
        const modal = document.getElementById("modal-strategy");
        if (!modal) return;
        const form = document.getElementById("strategy-form");
        form.reset();

        if (id) {
            const strat = AppState.data.strategies.find(s => s.id === id);
            if (strat) {
                document.getElementById("strat-form-id").value = strat.id;
                document.getElementById("strat-form-name").value = strat.name;
                document.getElementById("strat-form-cat").value = strat.category;
                document.getElementById("strat-form-winrate").value = strat.winRate;
                document.getElementById("strat-form-rr").value = strat.rrRatio || "";
                document.getElementById("strat-form-tf").value = strat.timeframe || "";
                document.getElementById("strat-form-instruments").value = (strat.instruments || []).join(', ');
                document.getElementById("strat-form-pf").value = strat.profitFactor || "";
                document.getElementById("strat-form-rules").value = strat.rules || "";
                document.getElementById("strat-form-adv").value = (strat.advantages || []).join('\n');
                document.getElementById("strat-form-dis").value = (strat.disadvantages || []).join('\n');
                document.getElementById("strat-modal-title").innerText = "Edit Strategy";
            }
        } else {
            document.getElementById("strat-form-id").value = "";
            document.getElementById("strat-modal-title").innerText = "Add New Strategy";
        }

        modal.classList.remove("hidden");
    }
};
