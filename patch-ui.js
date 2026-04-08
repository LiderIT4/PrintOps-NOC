const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, 'public', 'index.html');
let content = fs.readFileSync(targetFile, 'utf8');

const newInventoryDetailsPage = `
        const InventoryDetailsPage = () => {
            const [printers, setPrinters] = useState([]);
            const [loading, setLoading] = useState(true);

            useEffect(() => {
                fetch('/api/printers')
                    .then(res => res.json())
                    .then(data => {
                        setPrinters(data.printers || []);
                        setLoading(false);
                    });

                const es = new EventSource('/api/printers/status-stream');
                es.onmessage = e => {
                    if (e.data === 'Escaneo completado' || !e.data.includes('{')) return;
                    try {
                        const obj = JSON.parse(e.data);
                        if (obj.printer) {
                            setPrinters(prev => prev.map(p => 
                                p.name === obj.printer.name ? { ...p, cached: obj.printer } : p
                            ));
                        }
                    } catch (_) {}
                };
                return () => es.close();
            }, []);

            const renderInkLevels = (levels) => {
                if (!levels || !levels.length) return <span className="text-xs text-gray-500 italic">Cargando...</span>;
                return (
                    <div className="flex gap-2 items-center h-full">
                        {levels.map((t, i) => {
                            const m = t.match(/([\\wÁÉÍÓÚáéíóúñÑ]+).*?(\\d+)%/i);
                            if (!m) return null;
                            const color = m[1].toLowerCase();
                            const pct = parseInt(m[2]);
                            const cssColor =
                                (/black/.test(color)) ? 'bg-slate-300' :
                                (/cyan/.test(color)) ? 'bg-cyan-400' :
                                (/magenta/.test(color)) ? 'bg-pink-500' :
                                (/yellow/.test(color)) ? 'bg-yellow-400' : 'bg-green-400';
                            return (
                                <div key={i} className="h-8 w-2 bg-gray-700 rounded-sm relative overflow-hidden" title={\`\${color}: \${pct}%\`}>
                                    <div className={\`absolute bottom-0 w-full \${cssColor}\`} style={{height: \`\${pct}%\`}}></div>
                                </div>
                            );
                        })}
                    </div>
                );
            };

            const retryPrinter = (ip) => {
                fetch(\`/api/printers/retry?ip=\${ip}\`)
                    .then(r => r.json())
                    .then(data => {
                        if (data && data.name) {
                            setPrinters(prev => prev.map(p => 
                                p.name === data.name ? { ...p, cached: data } : p
                            ));
                        }
                    });
            };

            const activeUnits = printers.filter(p => p.cached?.status === 'online').length;
            const totalUnits = printers.length;
            const utilization = totalUnits > 0 ? Math.round((activeUnits / totalUnits) * 100) : 0;

            return (
                <div className="bg-background-light dark:bg-background-dark font-display text-gray-900 dark:text-white overflow-x-hidden min-h-screen flex flex-col">
                    {/* Top Navigation */}
                    <div className="w-full bg-[#111418] border-b border-[#282f39]">
                        <div className="px-6 lg:px-10 py-3 flex items-center justify-between">
                            <div className="flex items-center gap-8">
                                <div className="flex items-center gap-4 text-white">
                                    <div className="size-8 flex items-center justify-center bg-primary/20 rounded-lg text-primary">
                                        <span className="material-symbols-outlined">print</span>
                                    </div>
                                    <h2 className="text-white text-lg font-bold leading-tight tracking-[-0.015em]">Enterprise Print Manager</h2>
                                </div>
                                <div className="hidden md:flex items-center gap-6">
                                    <Link className="text-white text-sm font-medium border-b-2 border-primary pb-4 -mb-4 transition-colors" to="/">Dashboard</Link>
                                    <Link className="text-gray-400 hover:text-white text-sm font-medium transition-colors" to="/inventory">Inventory</Link>
                                </div>
                            </div>
                        </div>
                    </div>
                    {/* Main Content */}
                    <div className="flex-1 flex flex-col max-w-[1440px] mx-auto w-full px-4 md:px-6 lg:px-8 py-6">
                        {/* Header Area */}
                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
                            <div className="flex flex-col gap-2">
                                <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">Printers Inventory</h1>
                                <p className="text-[#9da8b9] text-sm md:text-base">Real-time status of all configured printers</p>
                            </div>
                            <button className="flex items-center gap-2 bg-[#282f39] hover:bg-[#323b47] text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors w-fit border border-transparent hover:border-gray-600" onClick={() => window.location.reload()}>
                                <span className="material-symbols-outlined" style={{fontSize: '18px'}}>refresh</span>
                                <span>Reload App</span>
                            </button>
                        </div>
                        {/* Metric Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                            <div className="bg-surface-dark border border-border-dark rounded-xl p-6 relative overflow-hidden group">
                                <div className="absolute right-0 top-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <span className="material-symbols-outlined text-white" style={{fontSize: '64px'}}>devices</span>
                                </div>
                                <p className="text-[#9da8b9] text-sm font-medium uppercase tracking-wider mb-2">Active Units</p>
                                <div className="flex items-baseline gap-3">
                                    <span className="text-4xl font-bold text-white">{activeUnits}</span>
                                    <span className="text-gray-400 text-sm">/ {totalUnits}</span>
                                </div>
                                <div className="mt-4 h-1 w-full bg-[#282f39] rounded-full overflow-hidden">
                                    <div className="h-full bg-primary transition-all duration-500" style={{width: \`\${utilization}%\`}}></div>
                                </div>
                                <p className="text-xs text-[#9da8b9] mt-2">{utilization}% Online utilization</p>
                            </div>
                        </div>
                        {/* Table */}
                        <div className="bg-surface-dark border border-border-dark rounded-xl flex flex-col shadow-xl">
                            <div className="overflow-x-auto custom-scrollbar rounded-xl">
                                <table className="w-full text-left border-collapse min-w-full">
                                    <thead>
                                        <tr className="bg-[#101822] border-b border-border-dark text-[#9da8b9] text-xs uppercase tracking-wider font-semibold">
                                            <th className="p-4">Device Name</th>
                                            <th className="p-4">IP Address</th>
                                            <th className="p-4">Model</th>
                                            <th className="p-4">Status</th>
                                            <th className="p-4">Ink Levels</th>
                                            <th className="p-4 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border-dark">
                                        {printers.map((printer) => {
                                            const ip = printer.url.split('://')[1].split('/')[0];
                                            const isOnline = printer.cached?.status === 'online';
                                            return (
                                                <tr key={printer.name} className="group hover:bg-[#20252e] transition-colors border-l-2 border-l-transparent hover:border-l-primary">
                                                    <td className="p-4">
                                                        <div className="text-white font-semibold text-sm">{printer.name}</div>
                                                    </td>
                                                    <td className="p-4"><span className="font-mono text-gray-300 text-sm bg-[#101822] px-2 py-1 rounded border border-border-dark">{ip}</span></td>
                                                    <td className="p-4 text-gray-400 text-sm">{printer.model}</td>
                                                    <td className="p-4">
                                                        {isOnline ? (
                                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-[#0bda5e]/10 text-[#0bda5e]">
                                                                <span className="size-1.5 rounded-full bg-[#0bda5e]"></span> Online
                                                            </span>
                                                        ) : printer.cached ? (
                                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-500/10 text-red-500">
                                                                <span className="size-1.5 rounded-full bg-red-500"></span> Offline
                                                            </span>
                                                        ) : (
                                                            <span className="text-gray-500 text-xs italic">Pending...</span>
                                                        )}
                                                    </td>
                                                    <td className="p-4">{renderInkLevels(printer.cached?.inkLevels)}</td>
                                                    <td className="p-4 text-right">
                                                        <button 
                                                            onClick={() => retryPrinter(ip)}
                                                            className="px-3 py-1.5 bg-[#101822] border border-border-dark hover:bg-[#20252e] rounded text-xs font-medium text-gray-300 transition-colors">
                                                            Retry
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                        {printers.length === 0 && !loading && (
                                            <tr><td colSpan="6" className="p-6 text-center text-gray-400">No printers found.</td></tr>
                                        )}
                                        {loading && (
                                            <tr><td colSpan="6" className="p-6 text-center text-gray-400">Loading printers data...</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            );
        };
`;

const regex = /const InventoryDetailsPage = \(\) => \{[\s\S]*?^\s*};\s*$/m;
// Let's replace App to route / directly to InventoryDetailsPage to make it the default view
const appRegex = /const App = \(\) => \{[\s\S]*?^\s*};\s*$/m;
const newApp = `
        const App = () => {
            return (
                <MemoryRouter>
                    <Routes>
                        <Route path="/" element={<InventoryDetailsPage />} />
                    </Routes>
                </MemoryRouter>
            );
        };
`;

content = content.replace(regex, newInventoryDetailsPage);
content = content.replace(appRegex, newApp);

fs.writeFileSync(targetFile, content);
console.log('UI Patched successfully');
