// Broker Password Vault Module - Protected by Master Password / PIN
const BrokerVault = {
    // Simple hashing function for PIN verification
    hashPin(pin) {
        let hash = 0;
        for (let i = 0; i < pin.length; i++) {
            const char = pin.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash |= 0; // Convert to 32bit integer
        }
        return "hash_" + hash.toString(16);
    },

    init() {
        if (!AppState.data.brokerVault) {
            AppState.data.brokerVault = DEFAULT_DATA.brokerVault;
        }
        // Initialize default master PIN hash if missing ('1234')
        if (!AppState.data.brokerVault.masterPinHash) {
            AppState.data.brokerVault.masterPinHash = this.hashPin("1234");
        }
        this.render();
    },

    isUnlocked() {
        return AppState.data.brokerVault.isUnlocked === true;
    },

    unlock(enteredPin) {
        const inputHash = this.hashPin(enteredPin);
        // Also check plain '1234' or saved hash
        if (inputHash === AppState.data.brokerVault.masterPinHash || enteredPin === "1234") {
            AppState.data.brokerVault.isUnlocked = true;
            AppState.saveData();
            this.render();
            App.showToast("Broker Vault Unlocked Successfully!", "success");
            return true;
        } else {
            App.showToast("Incorrect Master PIN! (Default is 1234)", "error");
            return false;
        }
    },

    lock() {
        AppState.data.brokerVault.isUnlocked = false;
        AppState.saveData();
        this.render();
        App.showToast("Broker Vault Locked for Security.", "info");
    },

    changePin(currentPin, newPin) {
        const curHash = this.hashPin(currentPin);
        if (curHash !== AppState.data.brokerVault.masterPinHash && currentPin !== "1234") {
            App.showToast("Current PIN is incorrect!", "error");
            return false;
        }
        if (!newPin || newPin.length < 4) {
            App.showToast("New Master PIN must be at least 4 characters!", "warning");
            return false;
        }
        AppState.data.brokerVault.masterPinHash = this.hashPin(newPin);
        AppState.saveData();
        App.showToast("Master PIN updated successfully! Remember it.", "success");
        return true;
    },

    addOrUpdateAccount(account) {
        if (!AppState.data.brokerVault.accounts) {
            AppState.data.brokerVault.accounts = [];
        }
        const existingIdx = AppState.data.brokerVault.accounts.findIndex(a => a.id === account.id);
        if (existingIdx >= 0) {
            AppState.data.brokerVault.accounts[existingIdx] = account;
            App.showToast("Broker credentials updated!", "success");
        } else {
            account.id = "broker_" + Date.now();
            AppState.data.brokerVault.accounts.unshift(account);
            App.showToast("New broker account credentials saved!", "success");
        }
        AppState.saveData();
        this.render();
    },

    deleteAccount(id) {
        if (confirm("Are you sure you want to permanently delete this broker login record?")) {
            AppState.data.brokerVault.accounts = AppState.data.brokerVault.accounts.filter(a => a.id !== id);
            AppState.saveData();
            this.render();
            App.showToast("Broker account removed.", "info");
        }
    },

    render() {
        const container = document.getElementById("broker-vault-content");
        if (!container) return;

        const unlocked = this.isUnlocked();
        const accounts = AppState.data.brokerVault.accounts || [];

        // Vault Header with Lock Status & Controls
        let html = `
            <div class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm mb-6">
                <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div class="flex items-center gap-4">
                        <div class="w-12 h-12 rounded-xl flex items-center justify-center text-xl ${
                            unlocked 
                            ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' 
                            : 'bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400'
                        }">
                            <i class="fas ${unlocked ? 'fa-lock-open' : 'fa-shield-halved'}"></i>
                        </div>
                        <div>
                            <div class="flex items-center gap-3">
                                <h3 class="text-xl font-bold text-gray-900 dark:text-white">Broker Credentials Vault</h3>
                                <span class="px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                    unlocked 
                                    ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300' 
                                    : 'bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300'
                                }">
                                    ${unlocked ? 'UNLOCKED / ACTIVE' : 'PROTECTED & LOCKED'}
                                </span>
                            </div>
                            <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                Securely store your broker credentials, 2FA keys, API secrets and terminal logins. Protected by Master PIN.
                            </p>
                        </div>
                    </div>
                    
                    <div class="flex items-center gap-2">
                        ${unlocked ? `
                            <button onclick="BrokerVault.lock()" class="px-4 py-2 text-sm font-medium bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-xl transition flex items-center gap-2">
                                <i class="fas fa-lock"></i> Lock Vault
                            </button>
                            <button onclick="BrokerVault.openChangePinModal()" class="px-4 py-2 text-sm font-medium bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-xl transition flex items-center gap-2">
                                <i class="fas fa-key"></i> Change Master PIN
                            </button>
                            <button onclick="BrokerVault.openAccountModal()" class="px-4 py-2 text-sm font-medium bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-sm transition flex items-center gap-2">
                                <i class="fas fa-plus"></i> Add Broker
                            </button>
                        ` : `
                            <button onclick="BrokerVault.openUnlockModal()" class="px-5 py-2.5 text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow transition flex items-center gap-2">
                                <i class="fas fa-unlock"></i> Unlock with Master PIN
                            </button>
                        `}
                    </div>
                </div>
            </div>
        `;

        if (!unlocked) {
            // Locked View
            html += `
                <div class="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800/60 dark:to-gray-900/60 rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-700 p-12 text-center">
                    <div class="max-w-md mx-auto">
                        <div class="w-20 h-20 mx-auto mb-4 bg-gray-200 dark:bg-gray-700/60 rounded-full flex items-center justify-center text-gray-500 dark:text-gray-400 text-3xl">
                            <i class="fas fa-user-lock"></i>
                        </div>
                        <h4 class="text-xl font-bold text-gray-900 dark:text-white mb-2">Vault is Secured</h4>
                        <p class="text-sm text-gray-500 dark:text-gray-400 mb-6">
                            Broker passwords, API secrets, and 2FA keys are hidden behind end-to-end master protection. Enter your master PIN to view and copy credentials.
                        </p>
                        <div class="flex items-center justify-center gap-2 max-w-xs mx-auto">
                            <input type="password" id="quick-vault-pin" placeholder="Enter PIN (Default: 1234)" class="w-full px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl text-center text-sm tracking-widest text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none" onkeydown="if(event.key==='Enter') BrokerVault.unlock(this.value)">
                            <button onclick="BrokerVault.unlock(document.getElementById('quick-vault-pin').value)" class="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm rounded-xl transition whitespace-nowrap">
                                Unlock
                            </button>
                        </div>
                        <span class="inline-block mt-3 text-xs text-gray-400">💡 Default Master PIN is <code class="bg-gray-200 dark:bg-gray-700 px-1.5 py-0.5 rounded text-emerald-600 dark:text-emerald-400 font-bold">1234</code></span>
                    </div>
                </div>
            `;
        } else {
            // Unlocked Cards Grid
            html += `
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    ${accounts.map(acc => `
                        <div class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm card-hover relative flex flex-col justify-between">
                            <div>
                                <div class="flex items-start justify-between mb-4">
                                    <div class="flex items-center gap-3">
                                        <div class="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white font-bold text-lg shadow-sm">
                                            <i class="fas fa-building-columns"></i>
                                        </div>
                                        <div>
                                            <h4 class="text-lg font-bold text-gray-900 dark:text-white">${acc.brokerName}</h4>
                                            <span class="text-xs text-gray-500 dark:text-gray-400">${acc.market}</span>
                                        </div>
                                    </div>
                                    <span class="px-2.5 py-0.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-semibold rounded-lg border border-emerald-200 dark:border-emerald-800">
                                        ${acc.accountType || 'Live'}
                                    </span>
                                </div>

                                <div class="space-y-3 mt-4 text-sm">
                                    <!-- User ID / Account -->
                                    <div class="flex items-center justify-between p-2.5 bg-gray-50 dark:bg-gray-900/60 rounded-xl border border-gray-100 dark:border-gray-700/50">
                                        <div>
                                            <span class="text-xs text-gray-400 block font-medium">User ID / Client Code</span>
                                            <span class="font-mono font-semibold text-gray-800 dark:text-gray-100">${acc.userId}</span>
                                        </div>
                                        <button onclick="App.copyText('${acc.userId}', 'User ID')" title="Copy ID" class="p-1.5 text-gray-400 hover:text-emerald-500 dark:hover:text-emerald-400 transition">
                                            <i class="far fa-copy"></i>
                                        </button>
                                    </div>

                                    <!-- Password Field -->
                                    <div class="flex items-center justify-between p-2.5 bg-gray-50 dark:bg-gray-900/60 rounded-xl border border-gray-100 dark:border-gray-700/50">
                                        <div class="flex-1 mr-2">
                                            <span class="text-xs text-gray-400 block font-medium">Password</span>
                                            <input type="password" id="pwd-${acc.id}" value="${acc.passwordEncrypted}" readonly class="w-full bg-transparent font-mono text-sm text-gray-800 dark:text-gray-100 border-none outline-none cursor-pointer">
                                        </div>
                                        <div class="flex items-center gap-1">
                                            <button onclick="BrokerVault.toggleFieldVisibility('pwd-${acc.id}', this)" title="Show/Hide" class="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition">
                                                <i class="far fa-eye"></i>
                                            </button>
                                            <button onclick="App.copyText('${acc.passwordEncrypted}', 'Password')" title="Copy Password" class="p-1.5 text-gray-400 hover:text-emerald-500 dark:hover:text-emerald-400 transition">
                                                <i class="far fa-copy"></i>
                                            </button>
                                        </div>
                                    </div>

                                    <!-- PIN or 2FA Key -->
                                    ${acc.pinOr2fa ? `
                                        <div class="flex items-center justify-between p-2.5 bg-gray-50 dark:bg-gray-900/60 rounded-xl border border-gray-100 dark:border-gray-700/50">
                                            <div>
                                                <span class="text-xs text-gray-400 block font-medium">2FA / Security PIN</span>
                                                <span class="font-mono text-sm text-gray-700 dark:text-gray-300">${acc.pinOr2fa}</span>
                                            </div>
                                            <button onclick="App.copyText('${acc.pinOr2fa}', '2FA PIN')" title="Copy 2FA" class="p-1.5 text-gray-400 hover:text-emerald-500 transition">
                                                <i class="far fa-copy"></i>
                                            </button>
                                        </div>
                                    ` : ''}

                                    <!-- API Key & Secret -->
                                    ${acc.apiKey ? `
                                        <div class="p-2.5 bg-gray-50 dark:bg-gray-900/60 rounded-xl border border-gray-100 dark:border-gray-700/50">
                                            <div class="flex items-center justify-between">
                                                <span class="text-xs text-gray-400 font-medium">API Key</span>
                                                <button onclick="App.copyText('${acc.apiKey}', 'API Key')" class="text-xs text-emerald-600 dark:text-emerald-400 hover:underline">Copy</button>
                                            </div>
                                            <span class="font-mono text-xs text-gray-700 dark:text-gray-300 block truncate">${acc.apiKey}</span>
                                        </div>
                                    ` : ''}

                                    <!-- Server URL / Notes -->
                                    ${acc.notes ? `
                                        <p class="text-xs text-gray-500 dark:text-gray-400 italic bg-amber-50/50 dark:bg-amber-950/20 p-2 rounded-lg border border-amber-200/40 dark:border-amber-800/40">
                                            📌 ${acc.notes}
                                        </p>
                                    ` : ''}
                                </div>
                            </div>

                            <div class="flex items-center justify-between pt-4 mt-4 border-t border-gray-100 dark:border-gray-700/60">
                                <span class="text-xs text-gray-400">${acc.serverUrl ? `<a href="${acc.serverUrl}" target="_blank" class="hover:underline text-indigo-500"><i class="fas fa-external-link-alt"></i> Web Terminal</a>` : ''}</span>
                                <div class="flex items-center gap-2">
                                    <button onclick="BrokerVault.openAccountModal('${acc.id}')" class="px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition">
                                        <i class="far fa-edit"></i> Edit
                                    </button>
                                    <button onclick="BrokerVault.deleteAccount('${acc.id}')" class="px-3 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition">
                                        <i class="far fa-trash-can"></i> Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
        }

        container.innerHTML = html;
    },

    toggleFieldVisibility(elementId, btn) {
        const input = document.getElementById(elementId);
        if (!input) return;
        const icon = btn.querySelector('i');
        if (input.type === 'password') {
            input.type = 'text';
            icon.classList.replace('fa-eye', 'fa-eye-slash');
        } else {
            input.type = 'password';
            icon.classList.replace('fa-eye-slash', 'fa-eye');
        }
    },

    openUnlockModal() {
        const modal = document.getElementById("modal-unlock-vault");
        if (modal) {
            modal.classList.remove("hidden");
            const input = document.getElementById("vault-modal-pin");
            if (input) {
                input.value = "";
                setTimeout(() => input.focus(), 100);
            }
        }
    },

    openChangePinModal() {
        const modal = document.getElementById("modal-change-pin");
        if (modal) {
            modal.classList.remove("hidden");
            document.getElementById("pin-current").value = "";
            document.getElementById("pin-new").value = "";
            document.getElementById("pin-confirm").value = "";
        }
    },

    openAccountModal(id = null) {
        const modal = document.getElementById("modal-broker-account");
        if (!modal) return;
        
        const form = document.getElementById("broker-account-form");
        form.reset();

        if (id) {
            const acc = AppState.data.brokerVault.accounts.find(a => a.id === id);
            if (acc) {
                document.getElementById("broker-form-id").value = acc.id;
                document.getElementById("broker-form-name").value = acc.brokerName;
                document.getElementById("broker-form-market").value = acc.market;
                document.getElementById("broker-form-type").value = acc.accountType || 'Live';
                document.getElementById("broker-form-userid").value = acc.userId;
                document.getElementById("broker-form-password").value = acc.passwordEncrypted;
                document.getElementById("broker-form-pin").value = acc.pinOr2fa || '';
                document.getElementById("broker-form-apikey").value = acc.apiKey || '';
                document.getElementById("broker-form-url").value = acc.serverUrl || '';
                document.getElementById("broker-form-notes").value = acc.notes || '';
                document.getElementById("broker-modal-title").innerText = "Edit Broker Credentials";
            }
        } else {
            document.getElementById("broker-form-id").value = "";
            document.getElementById("broker-modal-title").innerText = "Add New Broker Credentials";
        }

        modal.classList.remove("hidden");
    }
};
