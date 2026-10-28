// VPS & Server Management Module
const VPSManager = {
    init() {
        if (!AppState.data.vpsServers) {
            AppState.data.vpsServers = DEFAULT_DATA.vpsServers;
        }
        this.render();
    },

    addOrUpdateVPS(vps) {
        if (!AppState.data.vpsServers) AppState.data.vpsServers = [];
        const existingIdx = AppState.data.vpsServers.findIndex(v => v.id === vps.id);
        if (existingIdx >= 0) {
            AppState.data.vpsServers[existingIdx] = vps;
            App.showToast(`VPS "${vps.name}" updated!`, "success");
        } else {
            vps.id = "vps_" + Date.now();
            if (!vps.cpuUsage) vps.cpuUsage = Math.floor(Math.random() * 25) + 15;
            if (!vps.ramUsage) vps.ramUsage = Math.floor(Math.random() * 30) + 40;
            if (!vps.status) vps.status = "Online";
            if (!vps.activeBots) vps.activeBots = [];
            AppState.data.vpsServers.unshift(vps);
            App.showToast(`New VPS "${vps.name}" configured!`, "success");
        }
        AppState.saveData();
        this.render();
    },

    deleteVPS(id) {
        if (confirm("Are you sure you want to delete this VPS server configuration?")) {
            AppState.data.vpsServers = AppState.data.vpsServers.filter(v => v.id !== id);
            AppState.saveData();
            this.render();
            App.showToast("VPS server removed.", "info");
        }
    },

    pingServer(name) {
        App.showToast(`Pinging ${name}... Round-trip: ${(Math.random() * 10 + 4).toFixed(1)}ms. Host alive!`, "success");
    },

    restartBot(serverName, botName) {
        App.showToast(`Restarting process "${botName}" on ${serverName}...`, "info");
        setTimeout(() => {
            App.showToast(`Process "${botName}" restarted successfully!`, "success");
        }, 1200);
    },

    render() {
        const container = document.getElementById("vps-content");
        if (!container) return;

        const servers = AppState.data.vpsServers || [];

        let html = `
            <!-- Top Controls Row -->
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                    <h3 class="text-xl font-bold text-gray-900 dark:text-white">Active Cloud Trading Nodes</h3>
                    <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Real-time telemetry, bot processes, latency stats and infrastructure health.</p>
                </div>
                <button onclick="VPSManager.openModal()" class="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-sm transition flex items-center gap-2 self-start sm:self-auto">
                    <i class="fas fa-server"></i> Add VPS Server
                </button>
            </div>

            <!-- VPS Cards Grid -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                ${servers.map(vps => {
                    const isOnline = vps.status === "Online";
                    return `
                        <div class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm card-hover flex flex-col justify-between">
                            <div>
                                <!-- Header -->
                                <div class="flex items-start justify-between gap-3 mb-4">
                                    <div class="flex items-center gap-3">
                                        <div class="w-12 h-12 rounded-2xl ${isOnline ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800' : 'bg-gray-100 dark:bg-gray-700 text-gray-400'} flex items-center justify-center text-xl">
                                            <i class="fas fa-server"></i>
                                        </div>
                                        <div>
                                            <h4 class="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                                ${vps.name}
                                                <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                                    isOnline 
                                                    ? 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300' 
                                                    : 'bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300'
                                                }">
                                                    <span class="w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}"></span>
                                                    ${vps.status}
                                                </span>
                                            </h4>
                                            <span class="text-xs text-gray-500 dark:text-gray-400 block mt-0.5">
                                                ${vps.provider} • ${vps.location}
                                            </span>
                                        </div>
                                    </div>

                                    <div class="text-right">
                                        <span class="text-xs font-mono font-bold ${Number(vps.latency) < 20 ? 'text-emerald-500' : 'text-amber-500'} block">
                                            <i class="fas fa-signal"></i> ${vps.latency}
                                        </span>
                                        <span class="text-[10px] text-gray-400 block">Round-trip Ping</span>
                                    </div>
                                </div>

                                <!-- Key Specs Box -->
                                <div class="p-3.5 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-100 dark:border-gray-700/60 mb-4 text-xs space-y-2">
                                    <div class="flex items-center justify-between">
                                        <span class="text-gray-400">IP Address:</span>
                                        <div class="flex items-center gap-2 font-mono font-bold text-gray-800 dark:text-gray-200">
                                            <span>${vps.ipAddress}</span>
                                            <button onclick="App.copyText('${vps.ipAddress}', 'VPS IP')" class="text-gray-400 hover:text-emerald-500" title="Copy IP">
                                                <i class="far fa-copy"></i>
                                            </button>
                                        </div>
                                    </div>
                                    <div class="flex items-center justify-between">
                                        <span class="text-gray-400">Specifications:</span>
                                        <span class="font-medium text-gray-800 dark:text-gray-200">${vps.specs}</span>
                                    </div>
                                    <div class="flex items-center justify-between">
                                        <span class="text-gray-400">Operating System:</span>
                                        <span class="font-medium text-gray-800 dark:text-gray-200">${vps.os}</span>
                                    </div>
                                    <div class="flex items-center justify-between">
                                        <span class="text-gray-400">Uptime:</span>
                                        <span class="font-medium text-emerald-600 dark:text-emerald-400">${vps.uptime || '99.9%'}</span>
                                    </div>
                                </div>

                                <!-- CPU & RAM Progress Bars -->
                                <div class="grid grid-cols-2 gap-4 mb-4">
                                    <div class="bg-gray-50 dark:bg-gray-900/40 p-3 rounded-xl border border-gray-100 dark:border-gray-700/50">
                                        <div class="flex items-center justify-between text-xs mb-1.5">
                                            <span class="font-semibold text-gray-500">CPU Usage</span>
                                            <span class="font-bold text-gray-800 dark:text-gray-200">${vps.cpuUsage}%</span>
                                        </div>
                                        <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                                            <div class="h-1.5 rounded-full ${vps.cpuUsage > 75 ? 'bg-rose-500' : 'bg-emerald-500'}" style="width: ${vps.cpuUsage}%"></div>
                                        </div>
                                    </div>

                                    <div class="bg-gray-50 dark:bg-gray-900/40 p-3 rounded-xl border border-gray-100 dark:border-gray-700/50">
                                        <div class="flex items-center justify-between text-xs mb-1.5">
                                            <span class="font-semibold text-gray-500">RAM Load</span>
                                            <span class="font-bold text-gray-800 dark:text-gray-200">${vps.ramUsage}%</span>
                                        </div>
                                        <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                                            <div class="h-1.5 rounded-full ${vps.ramUsage > 80 ? 'bg-rose-500' : 'bg-indigo-500'}" style="width: ${vps.ramUsage}%"></div>
                                        </div>
                                    </div>
                                </div>

                                <!-- Assigned Active Bots -->
                                <div class="mb-4">
                                    <span class="text-xs font-bold text-gray-600 dark:text-gray-300 block mb-2">
                                        Running Algos & Terminals (${(vps.activeBots || []).length}):
                                    </span>
                                    <div class="space-y-2">
                                        ${(vps.activeBots || []).map(bot => `
                                            <div class="flex items-center justify-between p-2.5 bg-gray-50 dark:bg-gray-900/70 rounded-xl border border-gray-100 dark:border-gray-700/50 text-xs">
                                                <div class="flex items-center gap-2">
                                                    <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                                    <span class="font-semibold text-gray-800 dark:text-gray-200">${bot.name}</span>
                                                    <span class="font-mono text-[10px] text-gray-400">(PID: ${bot.pid})</span>
                                                </div>
                                                <div class="flex items-center gap-2">
                                                    <span class="font-mono font-bold ${bot.pnlToday.startsWith('+') ? 'text-emerald-500' : 'text-gray-400'}">${bot.pnlToday}</span>
                                                    <button onclick="VPSManager.restartBot('${vps.name}', '${bot.name}')" title="Restart Bot" class="p-1 text-gray-400 hover:text-emerald-500 transition">
                                                        <i class="fas fa-rotate"></i>
                                                    </button>
                                                </div>
                                            </div>
                                        `).join('')}
                                    </div>
                                </div>

                                ${vps.notes ? `
                                    <p class="text-xs text-gray-500 dark:text-gray-400 italic bg-amber-50/40 dark:bg-amber-950/20 p-2.5 rounded-xl border border-amber-200/40 dark:border-amber-900/30">
                                        📝 ${vps.notes}
                                    </p>
                                ` : ''}
                            </div>

                            <!-- Footer Actions -->
                            <div class="flex items-center justify-between pt-4 mt-3 border-t border-gray-100 dark:border-gray-700/60">
                                <button onclick="VPSManager.pingServer('${vps.name}')" class="text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1">
                                    <i class="fas fa-network-wired"></i> Test Ping
                                </button>
                                <div class="flex items-center gap-2">
                                    <button onclick="App.copyText('ssh ${vps.sshUser || 'root'}@${vps.ipAddress} -p ${vps.sshPort || 22}', 'SSH Command')" class="px-3 py-1 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition" title="Copy SSH connect line">
                                        <i class="fas fa-terminal"></i> SSH
                                    </button>
                                    <button onclick="VPSManager.openModal('${vps.id}')" class="px-3 py-1 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition">
                                        <i class="far fa-edit"></i> Edit
                                    </button>
                                    <button onclick="VPSManager.deleteVPS('${vps.id}')" class="px-3 py-1 text-xs font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition">
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
        const modal = document.getElementById("modal-vps");
        if (!modal) return;
        const form = document.getElementById("vps-form");
        form.reset();

        if (id) {
            const vps = AppState.data.vpsServers.find(v => v.id === id);
            if (vps) {
                document.getElementById("vps-form-id").value = vps.id;
                document.getElementById("vps-form-name").value = vps.name;
                document.getElementById("vps-form-provider").value = vps.provider;
                document.getElementById("vps-form-location").value = vps.location;
                document.getElementById("vps-form-ip").value = vps.ipAddress;
                document.getElementById("vps-form-os").value = vps.os;
                document.getElementById("vps-form-specs").value = vps.specs;
                document.getElementById("vps-form-latency").value = vps.latency;
                document.getElementById("vps-form-notes").value = vps.notes || "";
                document.getElementById("vps-modal-title").innerText = "Edit VPS Server";
            }
        } else {
            document.getElementById("vps-form-id").value = "";
            document.getElementById("vps-modal-title").innerText = "Add New VPS Node";
        }

        modal.classList.remove("hidden");
    }
};
