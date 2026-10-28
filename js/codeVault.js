// Code Vault Module - Organized by Folder Structure
const CodeVault = {
    activeFolderId: null,
    activeFileId: null,
    searchQuery: "",

    init() {
        if (!AppState.data.codeVault) {
            AppState.data.codeVault = DEFAULT_DATA.codeVault;
        }
        const folders = AppState.data.codeVault.folders;
        if (folders && folders.length > 0) {
            if (!this.activeFolderId) this.activeFolderId = folders[0].id;
            if (!this.activeFileId && folders[0].files.length > 0) {
                this.activeFileId = folders[0].files[0].id;
            }
        }
        this.render();
    },

    selectFolder(folderId) {
        this.activeFolderId = folderId;
        const folder = AppState.data.codeVault.folders.find(f => f.id === folderId);
        if (folder && folder.files.length > 0) {
            this.activeFileId = folder.files[0].id;
        } else {
            this.activeFileId = null;
        }
        this.render();
    },

    selectFile(fileId) {
        this.activeFileId = fileId;
        this.render();
    },

    getActiveFile() {
        for (const folder of AppState.data.codeVault.folders) {
            const file = folder.files.find(f => f.id === this.activeFileId);
            if (file) return { file, folder };
        }
        return null;
    },

    addFolder(name, icon = "fa-folder") {
        if (!name || !name.trim()) return;
        const newFolder = {
            id: "folder_" + Date.now(),
            name: name.trim(),
            icon: icon,
            files: []
        };
        AppState.data.codeVault.folders.push(newFolder);
        AppState.saveData();
        this.activeFolderId = newFolder.id;
        this.activeFileId = null;
        this.render();
        App.showToast(`Folder "${name}" created!`, "success");
    },

    addOrUpdateFile(fileData) {
        const folder = AppState.data.codeVault.folders.find(f => f.id === fileData.folderId);
        if (!folder) {
            App.showToast("Target folder not found!", "error");
            return;
        }

        const existingIdx = folder.files.findIndex(f => f.id === fileData.id);
        const today = new Date().toISOString().split('T')[0];

        if (existingIdx >= 0) {
            folder.files[existingIdx] = {
                ...folder.files[existingIdx],
                name: fileData.name,
                language: fileData.language,
                description: fileData.description,
                code: fileData.code,
                updated: today
            };
            App.showToast("Script updated successfully!", "success");
        } else {
            const newFile = {
                id: "file_" + Date.now(),
                name: fileData.name,
                language: fileData.language,
                description: fileData.description,
                code: fileData.code,
                updated: today
            };
            folder.files.push(newFile);
            this.activeFileId = newFile.id;
            App.showToast(`Code file "${fileData.name}" saved!`, "success");
        }
        AppState.saveData();
        this.render();
    },

    deleteFile(fileId) {
        if (!confirm("Are you sure you want to delete this script?")) return;
        for (const folder of AppState.data.codeVault.folders) {
            const idx = folder.files.findIndex(f => f.id === fileId);
            if (idx >= 0) {
                folder.files.splice(idx, 1);
                AppState.saveData();
                this.activeFileId = folder.files.length > 0 ? folder.files[0].id : null;
                this.render();
                App.showToast("Script deleted.", "info");
                return;
            }
        }
    },

    downloadCurrentFile() {
        const active = this.getActiveFile();
        if (!active) return;
        const blob = new Blob([active.file.code], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = active.file.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        App.showToast(`Downloaded ${active.file.name}`, "success");
    },

    render() {
        const container = document.getElementById("code-vault-content");
        if (!container) return;

        const folders = AppState.data.codeVault.folders || [];
        const active = this.getActiveFile();
        const activeFolder = folders.find(f => f.id === this.activeFolderId) || folders[0];

        let html = `
            <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <!-- Sidebar: Folders and Files list -->
                <div class="lg:col-span-4 space-y-4">
                    <!-- Folder Navigation Card -->
                    <div class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
                        <div class="flex items-center justify-between pb-3 mb-3 border-b border-gray-100 dark:border-gray-700">
                            <span class="text-xs font-bold uppercase tracking-wider text-gray-400">Folders (${folders.length})</span>
                            <button onclick="CodeVault.openAddFolderModal()" class="text-xs text-emerald-600 dark:text-emerald-400 font-semibold hover:underline flex items-center gap-1">
                                <i class="fas fa-folder-plus"></i> New Folder
                            </button>
                        </div>

                        <div class="space-y-1.5">
                            ${folders.map(f => {
                                const isSel = f.id === (activeFolder ? activeFolder.id : null);
                                return `
                                    <button onclick="CodeVault.selectFolder('${f.id}')" class="w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium transition ${
                                        isSel 
                                        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40' 
                                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/60'
                                    }">
                                        <div class="flex items-center gap-2.5 truncate">
                                            <i class="fas ${f.icon || 'fa-folder'} ${isSel ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400'}"></i>
                                            <span class="truncate">${f.name}</span>
                                        </div>
                                        <span class="text-xs font-semibold px-2 py-0.5 rounded-full ${isSel ? 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300' : 'bg-gray-100 dark:bg-gray-700 text-gray-500'}">
                                            ${f.files.length}
                                        </span>
                                    </button>
                                `;
                            }).join('')}
                        </div>
                    </div>

                    <!-- Files inside active folder -->
                    <div class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
                        <div class="flex items-center justify-between pb-3 mb-3 border-b border-gray-100 dark:border-gray-700">
                            <div>
                                <span class="text-xs font-bold uppercase tracking-wider text-gray-400 block">Scripts in Folder</span>
                                <span class="text-sm font-semibold text-gray-800 dark:text-gray-200">${activeFolder ? activeFolder.name : 'Select Folder'}</span>
                            </div>
                            <button onclick="CodeVault.openAddFileModal('${activeFolder ? activeFolder.id : ''}')" class="px-2.5 py-1 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition flex items-center gap-1 shadow-sm">
                                <i class="fas fa-plus"></i> Add Script
                            </button>
                        </div>

                        <div class="space-y-1.5 max-h-[380px] overflow-y-auto pr-1">
                            ${activeFolder && activeFolder.files.length > 0 ? activeFolder.files.map(file => {
                                const isSel = file.id === this.activeFileId;
                                return `
                                    <div onclick="CodeVault.selectFile('${file.id}')" class="cursor-pointer p-3 rounded-xl transition border ${
                                        isSel 
                                        ? 'bg-gray-50 dark:bg-gray-700/80 border-emerald-500 text-gray-900 dark:text-white ring-1 ring-emerald-500/30' 
                                        : 'bg-white dark:bg-gray-800/40 border-gray-200 dark:border-gray-700/60 hover:bg-gray-50 dark:hover:bg-gray-700/40 text-gray-700 dark:text-gray-300'
                                    }">
                                        <div class="flex items-center justify-between mb-1">
                                            <span class="font-mono text-xs font-bold truncate">${file.name}</span>
                                            <span class="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${
                                                file.language === 'python' ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300' :
                                                file.language === 'pinescript' ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300' :
                                                'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300'
                                            }">${file.language}</span>
                                        </div>
                                        <p class="text-xs text-gray-500 dark:text-gray-400 truncate">${file.description || 'No description provided'}</p>
                                    </div>
                                `;
                            }).join('') : `
                                <div class="text-center py-8 text-gray-400 text-xs">
                                    <i class="far fa-file-code text-3xl mb-2 text-gray-300 dark:text-gray-600 block"></i>
                                    No scripts in this folder yet.
                                </div>
                            `}
                        </div>
                    </div>
                </div>

                <!-- Main Area: Code Editor & Viewer -->
                <div class="lg:col-span-8">
                    ${active ? `
                        <div class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden flex flex-col h-full min-h-[580px]">
                            <!-- Code Header -->
                            <div class="bg-gray-50 dark:bg-gray-900 px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex flex-wrap items-center justify-between gap-3">
                                <div>
                                    <div class="flex items-center gap-2">
                                        <h3 class="font-mono font-bold text-base text-gray-900 dark:text-white">${active.file.name}</h3>
                                        <span class="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300">
                                            ${active.file.language}
                                        </span>
                                    </div>
                                    <span class="text-xs text-gray-500 dark:text-gray-400 mt-1 block">
                                        📁 ${active.folder.name} • Last modified: ${active.file.updated}
                                    </span>
                                </div>

                                <div class="flex items-center gap-2">
                                    <button onclick="App.copyText(CodeVault.getActiveFile().file.code, '${active.file.name}')" class="px-3 py-1.5 text-xs font-medium bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl transition flex items-center gap-1.5 shadow-sm">
                                        <i class="far fa-copy"></i> Copy Code
                                    </button>
                                    <button onclick="CodeVault.downloadCurrentFile()" class="px-3 py-1.5 text-xs font-medium bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl transition flex items-center gap-1.5 shadow-sm">
                                        <i class="fas fa-download"></i> Download
                                    </button>
                                    <button onclick="CodeVault.openEditModal('${active.file.id}')" class="px-3 py-1.5 text-xs font-medium bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition flex items-center gap-1.5 shadow-sm">
                                        <i class="far fa-edit"></i> Edit
                                    </button>
                                    <button onclick="CodeVault.deleteFile('${active.file.id}')" class="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition" title="Delete Script">
                                        <i class="far fa-trash-can"></i>
                                    </button>
                                </div>
                            </div>

                            ${active.file.description ? `
                                <div class="px-6 py-2.5 bg-indigo-50/50 dark:bg-indigo-950/20 border-b border-indigo-100/50 dark:border-indigo-900/30 text-xs text-indigo-700 dark:text-indigo-300 flex items-center gap-2">
                                    <i class="fas fa-circle-info"></i>
                                    <span>${active.file.description}</span>
                                </div>
                            ` : ''}

                            <!-- Code Body with Line Numbers -->
                            <div class="flex-1 p-6 bg-slate-900 text-slate-100 font-mono text-xs overflow-auto leading-relaxed select-text">
                                <pre class="code-container"><code>${this.renderFormattedCode(active.file.code)}</code></pre>
                            </div>
                        </div>
                    ` : `
                        <div class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-12 text-center h-full flex flex-col items-center justify-center">
                            <i class="far fa-file-code text-5xl text-gray-300 dark:text-gray-600 mb-3"></i>
                            <h4 class="text-base font-bold text-gray-800 dark:text-gray-200 mb-1">No Script Selected</h4>
                            <p class="text-xs text-gray-500 dark:text-gray-400">Select a script from the folders or add a new trading bot code.</p>
                        </div>
                    `}
                </div>
            </div>
        `;

        container.innerHTML = html;
    },

    renderFormattedCode(code) {
        if (!code) return '';
        const lines = code.split('\n');
        return lines.map(line => {
            const escaped = line
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;');
            return `<span class="code-line">${escaped || '&nbsp;'}</span>`;
        }).join('\n');
    },

    openAddFolderModal() {
        const modal = document.getElementById("modal-add-folder");
        if (modal) {
            modal.classList.remove("hidden");
            document.getElementById("folder-name-input").value = "";
        }
    },

    openAddFileModal(folderId) {
        const modal = document.getElementById("modal-code-file");
        if (!modal) return;
        document.getElementById("code-file-form").reset();
        document.getElementById("code-form-id").value = "";
        document.getElementById("code-form-folder").value = folderId || (this.activeFolderId || "");
        document.getElementById("code-modal-title").innerText = "Add New Code Script";
        modal.classList.remove("hidden");
    },

    openEditModal(fileId) {
        const active = this.getActiveFile();
        if (!active || active.file.id !== fileId) return;
        const modal = document.getElementById("modal-code-file");
        if (!modal) return;

        document.getElementById("code-form-id").value = active.file.id;
        document.getElementById("code-form-folder").value = active.folder.id;
        document.getElementById("code-form-name").value = active.file.name;
        document.getElementById("code-form-lang").value = active.file.language;
        document.getElementById("code-form-desc").value = active.file.description || "";
        document.getElementById("code-form-content").value = active.file.code;
        document.getElementById("code-modal-title").innerText = "Edit Script";
        modal.classList.remove("hidden");
    }
};
