import React, { useState, useEffect } from 'react';
import {
    Wallet, Building2, Bitcoin, Plus, Trash2, RefreshCw,
    TrendingUp, DollarSign, PiggyBank, Cloud, CloudOff,
    Loader2, Globe, Landmark, Eye, EyeOff, PieChart as PieChartIcon,
    ChevronDown, ChevronRight, Euro, Coins, Settings, ArrowUpRight, ArrowDownRight, Activity, LineChart as LineChartIcon
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend, AreaChart, Area, XAxis, YAxis, CartesianGrid } from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f43f5e'];

const TIMEFRAMES = [
    { label: '1D', range: '1d', binanceInterval: '5m', binanceLimit: 288, yahooRange: '1d', yahooInterval: '5m' },
    { label: '5D', range: '5d', binanceInterval: '15m', binanceLimit: 480, yahooRange: '5d', yahooInterval: '15m' },
    { label: '1M', range: '1mo', binanceInterval: '1d', binanceLimit: 30, yahooRange: '1mo', yahooInterval: '1d' },
    { label: '6M', range: '6mo', binanceInterval: '1d', binanceLimit: 180, yahooRange: '6mo', yahooInterval: '1d' },
    { label: '1A', range: '1y', binanceInterval: '1w', binanceLimit: 52, yahooRange: '1y', yahooInterval: '1wk' },
    { label: '5A', range: '5y', binanceInterval: '1M', binanceLimit: 60, yahooRange: '5y', yahooInterval: '1mo' },
];

const fetchWithFallbacks = async (url) => {
    const proxies = [
        `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
        `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
        `https://corsproxy.io/?${encodeURIComponent(url)}`,
        `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`
    ];
    
    for (let proxy of proxies) {
        try {
            const res = await fetch(proxy);
            if (res.ok) {
                if (proxy.includes('/get?url=')) {
                    const data = await res.json();
                    if (data && data.contents) {
                        try { return JSON.parse(data.contents); }
                        catch (e) { return data.contents; }
                    }
                } else {
                    return await res.json();
                }
            }
        } catch (e) {
            // Falla silenciosa para continuar con el siguiente proxy
        }
    }
    return null;
};

const fetchHistoricalData = async (symbol, assetType, tfLabel) => {
    const tf = TIMEFRAMES.find(t => t.label === tfLabel) || TIMEFRAMES[2];
    const sym = symbol.toUpperCase();
    const dataPoints = [];

    try {
        if (['crypto', 'tokenized_stock'].includes(assetType)) {
            const url = `https://api.binance.com/api/v3/klines?symbol=${sym}USDT&interval=${tf.binanceInterval}&limit=${tf.binanceLimit}`;
            let data = null;
            try {
                const res = await fetch(url);
                if (res.ok) data = await res.json();
            } catch (e) {
                const resProxy = await fetch(`https://corsproxy.io/?${encodeURIComponent(url)}`);
                if (resProxy.ok) data = await resProxy.json();
            }

            if (data && Array.isArray(data)) {
                data.forEach(k => {
                    dataPoints.push({ ts: parseInt(k[0]), price: parseFloat(k[4]) });
                });
            }
        } else if (['stock_global', 'cedear_ar', 'accion_ar', 'bono_ar', 'on_ar', 'letra_ar'].includes(assetType)) {
            let ticker = sym;
            if (assetType !== 'stock_global' && !ticker.endsWith('.BA')) ticker = `${ticker}.BA`;
            
            const url = `https://query2.finance.yahoo.com/v8/finance/chart/${ticker}?range=${tf.yahooRange}&interval=${tf.yahooInterval}`;
            const data = await fetchWithFallbacks(url);
            
            if (data && data?.chart?.result?.[0]) {
                const result = data.chart.result[0];
                const timestamps = result.timestamp || [];
                const prices = result.indicators?.quote?.[0]?.close || [];
                
                timestamps.forEach((ts, i) => {
                    if (prices[i] !== null && prices[i] !== undefined) {
                        dataPoints.push({ ts: ts * 1000, price: prices[i] });
                    }
                });
            }
        }
    } catch (e) {
        console.error("Error al obtener datos históricos del activo", sym, e);
    }
    
    return dataPoints;
};

const AssetDetailsModal = ({ asset, onUpdateApy, onAddTransaction, onClose }) => {
    const [tab, setTab] = useState('info');
    const [apy, setApy] = useState(asset.apy || '');
    const [apyDate, setApyDate] = useState(asset.apyStartDate || new Date().toISOString().split('T')[0]);
    
    const [txType, setTxType] = useState('buy');
    const [txAmount, setTxAmount] = useState('');
    const [txPrice, setTxPrice] = useState(asset.purchasePrice || '');
    const [txDate, setTxDate] = useState(new Date().toISOString().split('T')[0]);

    const [chartTimeframe, setChartTimeframe] = useState('1M');
    const [chartData, setChartData] = useState([]);
    const [isChartLoading, setIsChartLoading] = useState(false);

    const yieldAmount = React.useMemo(() => {
        if (!asset.apy || parseFloat(asset.apy) <= 0 || !asset.apyStartDate) return 0;
        const start = new Date(asset.apyStartDate).getTime();
        const days = (Date.now() - start) / (1000 * 60 * 60 * 24);
        if (days <= 0) return 0;
        return parseFloat(asset.amount) * (parseFloat(asset.apy) / 100) * (days / 365);
    }, [asset]);

    useEffect(() => {
        if (tab === 'chart') loadChartData();
    }, [tab, chartTimeframe]);

    const loadChartData = async () => {
        setIsChartLoading(true);
        setChartData([]);
        
        const history = await fetchHistoricalData(asset.symbol, asset.assetType, chartTimeframe);
        
        const formattedData = history.map(item => ({
            date: new Date(item.ts).toLocaleDateString('es-AR', { 
                month: 'short', day: 'numeric', 
                hour: ['1D', '5D'].includes(chartTimeframe) ? '2-digit' : undefined, 
                minute: ['1D', '5D'].includes(chartTimeframe) ? '2-digit' : undefined 
            }),
            price: item.price
        }));
        
        setChartData(formattedData);
        setIsChartLoading(false);
    };

    const isChartPositive = chartData.length > 1 && chartData[chartData.length - 1].price >= chartData[0].price;
    const chartColor = isChartPositive ? '#10b981' : '#ef4444';

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col">
                <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                    <div>
                        <h3 className="text-lg font-bold text-slate-900">Activo: {asset.symbol}</h3>
                        <p className="text-sm text-slate-500">Saldo Total: {(parseFloat(asset.amount) + yieldAmount).toFixed(4)}</p>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-700 bg-slate-200 p-2 rounded-full transition-colors">
                        Cerrar
                    </button>
                </div>
                
                <div className="flex border-b border-slate-200 overflow-x-auto scrollbar-hide">
                    <button onClick={() => setTab('info')} className={`px-4 py-3 font-bold text-sm whitespace-nowrap transition-colors ${tab === 'info' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-slate-500 hover:bg-slate-50'}`}>Resumen & APY</button>
                    <button onClick={() => setTab('history')} className={`px-4 py-3 font-bold text-sm whitespace-nowrap transition-colors ${tab === 'history' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-slate-500 hover:bg-slate-50'}`}>Historial</button>
                    {(!['manual', 'fiat', 'caucion_ar', 'fci_ar'].includes(asset.assetType) && !['USD', 'USDT', 'USDC', 'DAI', 'ARS', 'EUR', 'BRL'].includes(asset.symbol.toUpperCase())) && (
                        <button onClick={() => setTab('chart')} className={`px-4 py-3 font-bold text-sm whitespace-nowrap transition-colors flex items-center gap-1 ${tab === 'chart' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-slate-500 hover:bg-slate-50'}`}>
                            <LineChartIcon className="w-4 h-4"/> Gráfico
                        </button>
                    )}
                </div>

                <div className="p-6 overflow-y-auto">
                    {tab === 'info' && (
                        <div className="space-y-6">
                            <div className="bg-green-50 border border-green-100 p-4 rounded-xl flex justify-between items-center">
                                <div>
                                    <p className="text-sm text-green-800 font-bold mb-1">Rendimiento APY Generado</p>
                                    <p className="text-3xl font-black text-green-600">+{yieldAmount.toFixed(4)} <span className="text-lg">{asset.symbol}</span></p>
                                </div>
                                <Activity className="w-10 h-10 text-green-300" />
                            </div>
                            
                            <div className="space-y-3">
                                <h4 className="font-bold text-slate-800 flex items-center gap-2"><Settings className="w-4 h-4"/> Configuración de Staking / Earn</h4>
                                <p className="text-xs text-slate-500">Ingresa el porcentaje anual (APY) para calcular las ganancias automáticas diarias que se sumarán a tu saldo.</p>
                                <div className="flex gap-4">
                                    <div className="flex-1">
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Tasa APY (%)</label>
                                        <input type="number" step="any" min="0" value={apy} onChange={(e) => setApy(e.target.value)} className="w-full px-4 py-2 border border-slate-200 rounded-xl outline-none focus:border-blue-500" placeholder="Ej: 12" />
                                    </div>
                                    <div className="flex-1">
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Fecha de Inicio</label>
                                        <input type="date" value={apyDate} onChange={(e) => setApyDate(e.target.value)} className="w-full px-4 py-2 border border-slate-200 rounded-xl outline-none focus:border-blue-500" />
                                    </div>
                                </div>
                                <button onClick={() => onUpdateApy(apy, apyDate)} className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors shadow-sm">Guardar Configuración APY</button>
                            </div>
                        </div>
                    )}
                    
                    {tab === 'history' && (
                        <div className="space-y-6">
                            <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 space-y-3">
                                <h4 className="font-bold text-blue-900 text-sm flex items-center gap-2"><Plus className="w-4 h-4"/> Añadir Actividad</h4>
                                <div className="grid grid-cols-2 gap-3">
                                    <select value={txType} onChange={(e) => setTxType(e.target.value)} className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white outline-none">
                                        <option value="buy">Compra / Depósito</option>
                                        <option value="sell">Venta / Retiro</option>
                                    </select>
                                    <input type="date" value={txDate} onChange={(e) => setTxDate(e.target.value)} className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white outline-none" />
                                    <input type="number" step="any" min="0" placeholder="Cantidad" value={txAmount} onChange={(e) => setTxAmount(e.target.value)} className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white outline-none" />
                                    <input type="number" step="any" min="0" placeholder="Precio USD c/u (Opcional)" value={txPrice} onChange={(e) => setTxPrice(e.target.value)} className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white outline-none" />
                                </div>
                                <button onClick={(e) => { 
                                    e.preventDefault(); 
                                    if(txAmount) onAddTransaction({ type: txType, amount: txAmount, price: txPrice, date: txDate }); 
                                    setTxAmount(''); setTxPrice(''); 
                                }} className="w-full py-2 bg-blue-600 text-white rounded-lg font-bold text-sm hover:bg-blue-700 transition-colors">Registrar Transacción</button>
                            </div>

                            <div>
                                <h4 className="font-bold text-slate-800 text-sm mb-3">Historial</h4>
                                <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                                    {!asset.transactions || asset.transactions.length === 0 ? (
                                        <p className="text-xs text-slate-400 bg-slate-50 p-3 rounded-lg border border-slate-100 text-center">No hay actividad registrada.</p>
                                    ) : (
                                        asset.transactions.map((tx, idx) => (
                                            <div key={idx} className="flex justify-between items-center p-3 bg-white border border-slate-100 rounded-lg shadow-sm hover:border-slate-200 transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center bg-slate-50 border ${tx.type === 'buy' ? 'border-green-200 text-green-600' : 'border-red-200 text-red-600'}`}>
                                                        {tx.type === 'buy' ? <ArrowDownRight className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-slate-800">{tx.type === 'buy' ? 'Compra/Ingreso' : 'Venta/Retiro'}</p>
                                                        <p className="text-xs text-slate-500">{tx.date}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className={`text-sm font-bold ${tx.type === 'buy' ? 'text-green-600' : 'text-red-600'}`}>
                                                        {tx.type === 'buy' ? '+' : '-'}{parseFloat(tx.amount).toFixed(4)}
                                                    </p>
                                                    {parseFloat(tx.price) > 0 && <p className="text-xs text-slate-500">${parseFloat(tx.price).toFixed(2)} USD c/u</p>}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {tab === 'chart' && (
                        <div className="space-y-4">
                            <div className="flex gap-2 bg-slate-100 p-1 rounded-lg overflow-x-auto">
                                {TIMEFRAMES.map(tf => (
                                    <button 
                                        key={tf.label}
                                        onClick={() => setChartTimeframe(tf.label)}
                                        className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-colors ${chartTimeframe === tf.label ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:bg-slate-200'}`}
                                    >
                                        {tf.label}
                                    </button>
                                ))}
                            </div>
                            
                            <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 relative">
                                {isChartLoading && (
                                    <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-10 flex items-center justify-center rounded-xl">
                                        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                                    </div>
                                )}
                                
                                <div className="h-64">
                                    {chartData.length > 0 ? (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={chartData} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                                                <defs>
                                                    <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor={chartColor} stopOpacity={0.3}/>
                                                        <stop offset="95%" stopColor={chartColor} stopOpacity={0}/>
                                                    </linearGradient>
                                                </defs>
                                                <XAxis dataKey="date" hide />
                                                <YAxis domain={['auto', 'auto']} hide />
                                                <RechartsTooltip 
                                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
                                                    labelStyle={{ color: '#64748b', fontWeight: 'bold', fontSize: '12px' }}
                                                    itemStyle={{ color: chartColor, fontWeight: '900', fontSize: '16px' }}
                                                    formatter={(value) => [value.toFixed(2), 'Precio']}
                                                />
                                                <Area type="monotone" dataKey="price" stroke={chartColor} strokeWidth={2} fillOpacity={1} fill="url(#colorPrice)" />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        !isChartLoading && <div className="h-full flex items-center justify-center text-slate-400 text-sm">No hay datos suficientes para el periodo seleccionado.</div>
                                    )}
                                </div>
                                
                                {chartData.length > 0 && (
                                    <div className="mt-4 flex justify-between items-center px-2">
                                        <div>
                                            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Precio Actual</p>
                                            <p className={`text-xl font-black ${isChartPositive ? 'text-green-600' : 'text-red-500'}`}>
                                                {chartData[chartData.length - 1].price.toFixed(2)}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Variación</p>
                                            <p className={`text-sm font-bold flex items-center justify-end gap-1 ${isChartPositive ? 'text-green-600' : 'text-red-500'}`}>
                                                {isChartPositive ? <ArrowUpRight className="w-4 h-4"/> : <ArrowDownRight className="w-4 h-4"/>}
                                                {Math.abs(chartData[chartData.length - 1].price - chartData[0].price).toFixed(2)} 
                                                ({((chartData[chartData.length - 1].price - chartData[0].price) / chartData[0].price * 100).toFixed(2)}%)
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default function App() {
    const [portfolios, setPortfolios] = useState([]);
    const [activePortfolioId, setActivePortfolioId] = useState('all');
    
    const [marketPrices, setMarketPrices] = useState({});
    const [isLoadingPrices, setIsLoadingPrices] = useState(false);
    const [syncStatus, setSyncStatus] = useState('synced');

    const [forexRates, setForexRates] = useState({ ARS: 1000, EUR: 0.92, BRL: 5.15 });
    const [displayCurrency, setDisplayCurrency] = useState('USD');

    const [showBalances, setShowBalances] = useState(true);
    const [hiddenPortfolios, setHiddenPortfolios] = useState(new Set());
    const [hiddenAccounts, setHiddenAccounts] = useState(new Set());
    
    // UI States
    const [dashboardTab, setDashboardTab] = useState('distribution'); // 'distribution' | 'evolution'
    
    // Evolución General State
    const [globalChartTimeframe, setGlobalChartTimeframe] = useState('1M');
    const [globalChartData, setGlobalChartData] = useState([]);
    const [isGlobalChartLoading, setIsGlobalChartLoading] = useState(false);

    const [isAddingPortfolio, setIsAddingPortfolio] = useState(false);
    const [newPortfolioName, setNewPortfolioName] = useState('');
    const [isAddingAccount, setIsAddingAccount] = useState(false);
    const [isAddingAsset, setIsAddingAsset] = useState({ active: false, portfolioId: null, accountId: null });
    const [collapsedAccounts, setCollapsedAccounts] = useState(new Set());
    const [selectedAsset, setSelectedAsset] = useState(null);

    const [newAccount, setNewAccount] = useState({ name: '', type: 'crypto_exchange', portfolioId: '' });
    const [newAsset, setNewAsset] = useState({ 
        symbol: '', amount: '', assetType: 'crypto', purchaseDate: '', purchasePrice: '' 
    });
    const [isFetchingHistory, setIsFetchingHistory] = useState(false);

    useEffect(() => {
        const savedV2 = localStorage.getItem('DikyStarPortfolios_v2');
        if (savedV2) {
            try {
                setPortfolios(JSON.parse(savedV2));
                return;
            } catch (e) { console.error("Error al cargar carteras", e); }
        }
    }, []);

    useEffect(() => {
        if (portfolios.length > 0) {
            localStorage.setItem('DikyStarPortfolios_v2', JSON.stringify(portfolios));
            setSyncStatus('synced');
            updateAllPrices();
        }
    }, [portfolios]);

    // Cargar Gráfico Global de Patrimonio cuando cambia la pestaña o la temporalidad o portafolio activo
    useEffect(() => {
        if (dashboardTab === 'evolution') {
            loadGlobalChart();
        }
    }, [dashboardTab, globalChartTimeframe, activePortfolioId]);

    const loadGlobalChart = async () => {
        if (portfolios.length === 0) return;
        setIsGlobalChartLoading(true);
        
        let allAssets = [];
        portfolios.forEach(port => {
            if (activePortfolioId === 'all' || port.id === activePortfolioId) {
                port.accounts.forEach(acc => {
                    acc.assets.forEach(asset => allAssets.push(asset));
                });
            }
        });

        // Agrupar activos únicos para no repetir peticiones
        const uniqueAssetsMap = {};
        allAssets.forEach(a => {
            if (!['manual', 'caucion_ar', 'fci_ar'].includes(a.assetType) && !['USD', 'USDT', 'USDC', 'DAI', 'ARS', 'EUR', 'BRL'].includes(a.symbol.toUpperCase())) {
                uniqueAssetsMap[a.symbol.toUpperCase()] = a.assetType;
            }
        });

        const historyMap = {}; 
        for (const sym of Object.keys(uniqueAssetsMap)) {
            historyMap[sym] = await fetchHistoricalData(sym, uniqueAssetsMap[sym], globalChartTimeframe);
        }

        const allTimestampsSet = new Set();
        Object.values(historyMap).forEach(arr => {
            arr.forEach(point => allTimestampsSet.add(point.ts));
        });
        const sortedTs = Array.from(allTimestampsSet).sort((a,b) => a - b);

        const aggregatedData = [];
        const lastKnownPrices = {}; 

        sortedTs.forEach(ts => {
            Object.keys(historyMap).forEach(sym => {
                const point = historyMap[sym].find(p => p.ts === ts);
                if (point) lastKnownPrices[sym] = point.price;
            });

            let totalUSD = 0;
            allAssets.forEach(asset => {
                const sym = asset.symbol.toUpperCase();
                const amt = getAssetTotalAmount(asset);
                
                if (['USD', 'USDT', 'USDC', 'DAI'].includes(sym)) {
                    totalUSD += amt;
                } else if (sym === 'ARS') {
                    totalUSD += amt / (forexRates.ARS || 1000);
                } else if (sym === 'EUR') {
                    totalUSD += amt / (forexRates.EUR || 0.92);
                } else if (sym === 'BRL') {
                    totalUSD += amt / (forexRates.BRL || 5.15);
                } else if (['manual', 'caucion_ar'].includes(asset.assetType)) {
                    totalUSD += amt;
                } else if (lastKnownPrices[sym]) {
                    let historicalPrice = lastKnownPrices[sym];
                    if (['accion_ar', 'bono_ar', 'cedear_ar', 'on_ar', 'letra_ar'].includes(asset.assetType)) {
                        historicalPrice = historicalPrice / (forexRates.ARS || 1000);
                    }
                    totalUSD += amt * historicalPrice;
                } else if (asset.purchasePrice) {
                    totalUSD += amt * parseFloat(asset.purchasePrice);
                }
            });

            aggregatedData.push({
                date: new Date(ts).toLocaleDateString('es-AR', { 
                    month: 'short', day: 'numeric', 
                    hour: ['1D', '5D'].includes(globalChartTimeframe) ? '2-digit' : undefined, 
                    minute: ['1D', '5D'].includes(globalChartTimeframe) ? '2-digit' : undefined 
                }),
                price: totalUSD * getDisplayRate()
            });
        });

        setGlobalChartData(aggregatedData);
        setIsGlobalChartLoading(false);
    };

    const getCryptoCategory = (symbol) => {
        const s = symbol.toUpperCase();
        if (['USDT','USDC','DAI','FDUSD','TUSD'].includes(s)) return 'Stablecoins';
        if (['BTC','ETH'].includes(s)) return 'Bluechips';
        if (['FET','AGIX','RNDR','OCEAN','TAO','WLD'].includes(s)) return 'Inteligencia Artificial';
        if (['UNI','AAVE','MKR','CRV','LDO','SNX'].includes(s)) return 'DeFi';
        if (['DOGE','SHIB','PEPE','WIF','FLOKI','BONK'].includes(s)) return 'Memecoins';
        if (['AXS','SAND','MANA','GALA','ILV','YGG'].includes(s)) return 'Juegos y NFTs';
        if (['CHZ','BAR','PSG','CITY','ATM'].includes(s)) return 'Fan Tokens';
        if (['SOL','ADA','DOT','AVAX','MATIC','LINK','ATOM'].includes(s)) return 'Blockchains (L1/L2)';
        return 'Altcoins';
    };

    const getDisplayRate = () => displayCurrency === 'USD' ? 1 : (forexRates[displayCurrency] || 1);

    const formatCurrency = (valueInUSD, customCurrency = null) => {
        const targetCurrency = customCurrency || displayCurrency;
        let rate = targetCurrency === 'USD' ? 1 : (forexRates[targetCurrency] || 1);
        return new Intl.NumberFormat('en-US', {
            style: 'currency', currency: targetCurrency, minimumFractionDigits: 2, maximumFractionDigits: 2
        }).format(valueInUSD * rate);
    };

    const formatPercent = (percent) => {
        if (isNaN(percent) || !isFinite(percent)) return "0.00%";
        return `${percent >= 0 ? '+' : ''}${percent.toFixed(2)}%`;
    };

    const getAssetYieldAmount = (asset) => {
        if (!asset.apy || parseFloat(asset.apy) <= 0 || !asset.apyStartDate) return 0;
        const start = new Date(asset.apyStartDate).getTime();
        const days = (Date.now() - start) / (1000 * 60 * 60 * 24);
        if (days <= 0) return 0;
        return parseFloat(asset.amount) * (parseFloat(asset.apy) / 100) * (days / 365);
    };

    const getAssetTotalAmount = (asset) => parseFloat(asset.amount || 0) + getAssetYieldAmount(asset);

    const getAssetValueUSD = (asset) => {
        const totalAmount = getAssetTotalAmount(asset);
        if (['manual', 'caucion_ar'].includes(asset.assetType)) return totalAmount;
        
        const sym = asset.symbol.toUpperCase();
        if (['USD', 'USDT', 'USDC', 'DAI'].includes(sym)) return totalAmount;
        if (sym === 'ARS') return totalAmount / forexRates.ARS;
        if (sym === 'EUR') return totalAmount / forexRates.EUR;
        if (sym === 'BRL') return totalAmount / forexRates.BRL;
        
        const price = marketPrices[sym];
        if (price) return totalAmount * price;
        if (asset.purchasePrice) return totalAmount * parseFloat(asset.purchasePrice);
        return 0; 
    };

    const getAssetCostBasis = (asset) => {
        if (asset.transactions && asset.transactions.length > 0) {
            let totalBuyAmount = 0;
            let totalBuyCost = 0;
            asset.transactions.forEach(tx => {
                if (tx.type === 'buy') {
                    totalBuyAmount += parseFloat(tx.amount || 0);
                    totalBuyCost += parseFloat(tx.amount || 0) * parseFloat(tx.price || 0);
                }
            });
            if (totalBuyAmount > 0) return totalBuyCost / totalBuyAmount;
        }
        return parseFloat(asset.purchasePrice || 0);
    };

    const getAssetInvestedUSD = (asset) => {
        const costBasis = getAssetCostBasis(asset);
        const totalAmount = getAssetTotalAmount(asset);
        if (costBasis > 0) return totalAmount * costBasis;
        return getAssetValueUSD(asset); 
    };

    const calculatePnL = (current, invested) => {
        const pnlValue = current - invested;
        return { value: pnlValue, percent: invested > 0 ? (pnlValue / invested) * 100 : 0 };
    };

    const fetchHistoricalPrice = async (symbol, assetType, dateStr) => {
        if (!dateStr || !symbol) return;
        setIsFetchingHistory(true);
        try {
            const timestamp = new Date(dateStr).getTime();
            const sym = symbol.toUpperCase();

            if (['crypto', 'tokenized_stock'].includes(assetType)) {
                const targetUrl = `https://api.binance.com/api/v3/klines?symbol=${sym}USDT&interval=1d&startTime=${timestamp}&limit=1`;
                try {
                    const res = await fetch(targetUrl);
                    if (res.ok) {
                        const data = await res.json();
                        if (data && data.length > 0) setNewAsset(prev => ({ ...prev, purchasePrice: parseFloat(data[0][1]).toFixed(4) }));
                    }
                } catch (e) {
                    const resProxy = await fetch(`https://corsproxy.io/?${encodeURIComponent(targetUrl)}`);
                    if (resProxy.ok) {
                        const data = await resProxy.json();
                        if (data && data.length > 0) setNewAsset(prev => ({ ...prev, purchasePrice: parseFloat(data[0][1]).toFixed(4) }));
                    }
                }
            } else if (['stock_global', 'cedear_ar', 'accion_ar', 'bono_ar', 'on_ar', 'letra_ar'].includes(assetType)) {
                let ticker = sym;
                if (assetType !== 'stock_global' && !ticker.endsWith('.BA')) ticker = `${ticker}.BA`;
                const period1 = Math.floor(timestamp / 1000);
                const period2 = period1 + 86400; 
                const targetUrl = `https://query2.finance.yahoo.com/v8/finance/chart/${ticker}?period1=${period1}&period2=${period2}&interval=1d`;
                
                try {
                    const parsed = await fetchWithFallbacks(targetUrl);
                    if (parsed && parsed?.chart?.result?.[0]?.indicators?.quote?.[0]?.open?.[0]) {
                        let rawPrice = parsed.chart.result[0].indicators.quote[0].open[0];
                        if (assetType !== 'stock_global') rawPrice = rawPrice / (forexRates.ARS || 1000); 
                        setNewAsset(prev => ({ ...prev, purchasePrice: rawPrice.toFixed(2) }));
                    }
                } catch (e) {}
            }
        } catch (error) {}
        setIsFetchingHistory(false);
    };

    const updateAllPrices = async () => {
        setIsLoadingPrices(true);
        setSyncStatus('syncing');
        let newPrices = { ...marketPrices };
        let newRates = { ...forexRates };

        try {
            const blueRes = await fetch('https://dolarapi.com/v1/dolares/blue');
            if (blueRes.ok) newRates.ARS = (await blueRes.json()).venta;
        } catch (e) {}

        try {
            const forexRes = await fetch('https://open.er-api.com/v6/latest/USD');
            if (forexRes.ok) {
                const forexData = await forexRes.json();
                if (forexData?.rates) {
                    newRates.EUR = forexData.rates.EUR;
                    newRates.BRL = forexData.rates.BRL;
                }
            }
            setForexRates(newRates);
        } catch (e) {}

        let requiredSymbols = [];
        portfolios.forEach(port => {
            port.accounts.forEach(acc => {
                acc.assets.forEach(asset => {
                    if (!['manual', 'caucion_ar', 'fci_ar'].includes(asset.assetType) && !['USD', 'USDT', 'USDC', 'DAI', 'ARS', 'EUR', 'BRL'].includes(asset.symbol.toUpperCase())) {
                        requiredSymbols.push(asset);
                    }
                });
            });
        });

        for (const asset of requiredSymbols) {
            const sym = asset.symbol.toUpperCase();
            try {
                if (['crypto', 'tokenized_stock'].includes(asset.assetType)) {
                    const targetUrl = `https://api.binance.com/api/v3/ticker/price?symbol=${sym}USDT`;
                    try {
                        const res = await fetch(targetUrl);
                        if (res.ok) newPrices[sym] = parseFloat((await res.json()).price);
                    } catch (e) {
                        const resProxy = await fetch(`https://corsproxy.io/?${encodeURIComponent(targetUrl)}`);
                        if (resProxy.ok) newPrices[sym] = parseFloat((await resProxy.json()).price);
                    }
                } else if (['stock_global', 'cedear_ar', 'accion_ar', 'bono_ar', 'on_ar', 'letra_ar'].includes(asset.assetType)) {
                    let ticker = sym;
                    if (asset.assetType !== 'stock_global' && !ticker.endsWith('.BA')) ticker = `${ticker}.BA`;
                    
                    const targetUrl = `https://query2.finance.yahoo.com/v8/finance/chart/${ticker}?range=1d&interval=1d`;
                    try {
                        const parsed = await fetchWithFallbacks(targetUrl);
                        if (parsed && parsed?.chart?.result?.[0]?.meta?.regularMarketPrice) {
                            const rawPrice = parsed.chart.result[0].meta.regularMarketPrice;
                            newPrices[sym] = asset.assetType !== 'stock_global' ? rawPrice / (newRates.ARS || 1000) : rawPrice;
                        }
                    } catch (e) {}
                }
            } catch (error) {}
        }
        setMarketPrices(newPrices);
        setIsLoadingPrices(false);
        setSyncStatus('synced');
        
        if (dashboardTab === 'evolution') loadGlobalChart();
    };

    const globalStats = portfolios.reduce((acc, port) => {
        if (activePortfolioId !== 'all' && port.id !== activePortfolioId) return acc;
        port.accounts.forEach(account => {
            account.assets.forEach(asset => {
                acc.current += getAssetValueUSD(asset);
                acc.invested += getAssetInvestedUSD(asset);
            });
        });
        return acc;
    }, { current: 0, invested: 0 });

    const globalPnL = calculatePnL(globalStats.current, globalStats.invested);

    const getPieChartData = () => {
        const data = {};
        portfolios.forEach(port => {
            if (activePortfolioId !== 'all' && port.id !== activePortfolioId) return;
            port.accounts.forEach(acc => {
                acc.assets.forEach(asset => {
                    const value = getAssetValueUSD(asset) * getDisplayRate();
                    let category = 'Otros';
                    
                    if (['crypto', 'tokenized_stock'].includes(asset.assetType)) category = getCryptoCategory(asset.symbol);
                    else if (['USDT','USDC','DAI','FDUSD'].includes(asset.symbol.toUpperCase())) category = 'Stablecoins';
                    else if (['stock_global', 'cedear_ar', 'accion_ar', 'bono_ar', 'on_ar', 'letra_ar', 'fci_ar'].includes(asset.assetType)) category = 'Acciones/Bonos/Fondos';
                    else if (asset.assetType === 'fiat') category = 'Efectivo/Bancos';
                    else if (['manual', 'caucion_ar'].includes(asset.assetType)) category = 'Renta Fija / Manual';
                    
                    data[category] = (data[category] || 0) + value;
                });
            });
        });
        return Object.keys(data).map(key => ({ name: key, value: data[key] })).filter(item => item.value > 0);
    };

    const handleAddPortfolio = (e) => {
        e.preventDefault();
        if (!newPortfolioName.trim()) return;
        const newPort = { id: Date.now().toString(), name: newPortfolioName, accounts: [] };
        setPortfolios([...portfolios, newPort]);
        setNewPortfolioName('');
        setIsAddingPortfolio(false);
        setActivePortfolioId(newPort.id);
    };

    const handleAddAccount = (e) => {
        e.preventDefault();
        if (!newAccount.name.trim()) return;
        const targetPortId = newAccount.portfolioId || (portfolios[0]?.id);
        const account = { id: Date.now().toString(), name: newAccount.name, type: newAccount.type, assets: [] };
        setPortfolios(portfolios.map(p => p.id === targetPortId ? { ...p, accounts: [...p.accounts, account] } : p));
        setNewAccount({ name: '', type: 'crypto_exchange', portfolioId: '' });
        setIsAddingAccount(false);
    };

    const handleDeleteAccount = (portId, accId) => setPortfolios(portfolios.map(p => p.id === portId ? { ...p, accounts: p.accounts.filter(a => a.id !== accId) } : p));

    const handleSymbolChange = (e) => {
        const sym = e.target.value.toUpperCase();
        let newType = newAsset.assetType;
        const targetAcc = portfolios.find(p => p.id === isAddingAsset.portfolioId)?.accounts.find(a => a.id === isAddingAsset.accountId);
        if (targetAcc?.type === 'broker_ar') {
            if (['AL30','GD30','AE38','AL29'].includes(sym)) newType = 'bono_ar';
            else if (['YPFD','GGAL','PAMP','BMA','CEPU'].includes(sym)) newType = 'accion_ar';
            else if (['SPY','QQQ','AAPL','MSFT','KO','AMZN'].includes(sym)) newType = 'cedear_ar';
        } else {
            if (['BTC','ETH','USDT','SOL'].includes(sym)) newType = 'crypto';
        }
        setNewAsset({ ...newAsset, symbol: sym, assetType: newType });
    };

    const handleAddAsset = (e) => {
        e.preventDefault();
        if (!newAsset.symbol || !newAsset.amount) return;
        
        const tx = { id: Date.now().toString(), type: 'buy', amount: newAsset.amount, price: newAsset.purchasePrice || 0, date: newAsset.purchaseDate || new Date().toISOString().split('T')[0] };
        const assetObj = { ...newAsset, id: Date.now().toString(), transactions: [tx] };

        setPortfolios(portfolios.map(p => p.id === isAddingAsset.portfolioId ? {
            ...p, accounts: p.accounts.map(acc => acc.id === isAddingAsset.accountId ? {
                ...acc, assets: [...acc.assets, assetObj]
            } : acc)
        } : p));
        
        setNewAsset({ symbol: '', amount: '', assetType: 'crypto', purchaseDate: '', purchasePrice: '' });
        setIsAddingAsset({ active: false, portfolioId: null, accountId: null });
    };

    const handleDeleteAsset = (portId, accId, assetId) => {
        setPortfolios(portfolios.map(p => p.id === portId ? {
            ...p, accounts: p.accounts.map(acc => acc.id === accId ? {
                ...acc, assets: acc.assets.filter(a => a.id !== assetId)
            } : acc)
        } : p));
    };

    const updateAssetInPortfolio = (portId, accId, asId, updater) => {
        setPortfolios(prev => prev.map(p => p.id === portId ? {
            ...p, accounts: p.accounts.map(a => a.id === accId ? {
                ...a, assets: a.assets.map(as => as.id === asId ? updater(as) : as)
            } : a)
        } : p));
    };

    const handleUpdateApy = (apyVal, dateVal) => {
        updateAssetInPortfolio(selectedAsset.portfolioId, selectedAsset.accountId, selectedAsset.assetId, (as) => ({
            ...as, apy: apyVal, apyStartDate: dateVal
        }));
    };

    const handleAddTransaction = (tx) => {
        updateAssetInPortfolio(selectedAsset.portfolioId, selectedAsset.accountId, selectedAsset.assetId, (as) => {
            const txAmt = parseFloat(tx.amount);
            const newAmount = tx.type === 'buy' ? parseFloat(as.amount) + txAmt : Math.max(0, parseFloat(as.amount) - txAmt);
            const newTx = { ...tx, id: Date.now().toString() };
            return {
                ...as, amount: newAmount, transactions: [...(as.transactions || []), newTx].sort((a,b) => new Date(b.date) - new Date(a.date))
            };
        });
    };

    const toggleSet = (set, id, setter) => {
        const newSet = new Set(set);
        newSet.has(id) ? newSet.delete(id) : newSet.add(id);
        setter(newSet);
    };

    const getAccountIcon = (type) => {
        switch(type) {
            case 'crypto_exchange': return <Bitcoin className="w-5 h-5 text-orange-500" />;
            case 'broker_global': return <Globe className="w-5 h-5 text-blue-500" />;
            case 'broker_ar': return <TrendingUp className="w-5 h-5 text-indigo-500" />;
            case 'bank_us': return <Landmark className="w-5 h-5 text-emerald-500" />;
            case 'bank_ar': return <Building2 className="w-5 h-5 text-cyan-500" />;
            case 'bank_eu': return <Euro className="w-5 h-5 text-blue-600" />;
            case 'bank_br': return <Building2 className="w-5 h-5 text-yellow-500" />;
            case 'wallet': return <Wallet className="w-5 h-5 text-purple-500" />;
            default: return <Wallet className="w-5 h-5 text-gray-500" />;
        }
    };

    const PnLBadge = ({ pnlPercent }) => {
        if (!pnlPercent || pnlPercent === 0) return null;
        const isPositive = pnlPercent > 0;
        return (
            <div className={`flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-md ${isPositive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {formatPercent(pnlPercent)}
            </div>
        );
    };
    
    const isGlobalChartPositive = globalChartData.length > 1 && globalChartData[globalChartData.length - 1].price >= globalChartData[0].price;
    const globalChartColor = isGlobalChartPositive ? '#10b981' : '#ef4444'; 

    return (
        <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans text-slate-800">
            <div className="max-w-6xl mx-auto space-y-6">
                
                <header className="bg-white rounded-2xl shadow-sm p-6 border border-slate-200">
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                        <div className="flex items-center gap-4">
                            <div className="bg-slate-900 p-3 rounded-xl shadow-lg">
                                <Activity className="w-8 h-8 text-blue-400" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">DikyStar<span className="text-blue-600"> investment</span></h1>
                                <div className="flex items-center gap-2 text-sm text-slate-500 mt-1">
                                    {syncStatus === 'syncing' ? <Loader2 className="w-4 h-4 animate-spin text-blue-500" /> : <Cloud className="w-4 h-4 text-emerald-500" />}
                                    <span>{syncStatus === 'syncing' ? 'Actualizando mercados...' : 'Sincronizado'}</span>
                                    <span className="mx-2">•</span>
                                    <div className="flex items-center gap-1">
                                        <Settings className="w-4 h-4" />
                                        <select value={displayCurrency} onChange={(e) => setDisplayCurrency(e.target.value)} className="bg-transparent font-semibold cursor-pointer text-slate-700 outline-none">
                                            <option value="USD">USD</option><option value="EUR">EUR</option><option value="BRL">BRL</option><option value="ARS">ARS</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 w-full lg:w-auto">
                            <button onClick={() => setShowBalances(!showBalances)} className="bg-white p-3 rounded-full hover:bg-slate-100 transition-colors shadow-sm border border-slate-200">
                                {showBalances ? <Eye className="w-6 h-6 text-slate-600" /> : <EyeOff className="w-6 h-6 text-slate-600" />}
                            </button>
                            <div className="flex-1 lg:flex-none">
                                <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Patrimonio Total</p>
                                <div className="flex items-end gap-3">
                                    <p className="text-3xl md:text-4xl font-bold text-slate-900">
                                        {showBalances ? formatCurrency(globalStats.current) : '********'}
                                    </p>
                                    {showBalances && Math.abs(globalPnL.value) > 0 && (
                                        <div className={`mb-1 text-sm font-bold flex items-center ${globalPnL.percent >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                                            {globalPnL.percent >= 0 ? '+' : ''}{formatCurrency(globalPnL.value)} ({formatPercent(globalPnL.percent)})
                                        </div>
                                    )}
                                </div>
                            </div>
                            <button onClick={updateAllPrices} disabled={isLoadingPrices} className="bg-blue-100 text-blue-700 p-3 rounded-xl hover:bg-blue-200 transition-colors">
                                <RefreshCw className={`w-5 h-5 ${isLoadingPrices ? 'animate-spin' : ''}`} />
                            </button>
                        </div>
                    </div>
                </header>

                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    <button 
                        onClick={() => setActivePortfolioId('all')}
                        className={`px-5 py-2.5 rounded-xl font-bold whitespace-nowrap transition-colors shadow-sm ${activePortfolioId === 'all' ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'}`}
                    >
                        Todas las Carteras
                    </button>
                    {portfolios.map(p => (
                        <button 
                            key={p.id} onClick={() => setActivePortfolioId(p.id)}
                            className={`px-5 py-2.5 rounded-xl font-bold whitespace-nowrap transition-colors shadow-sm flex items-center gap-2 ${activePortfolioId === p.id ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'}`}
                        >
                            <Wallet className="w-4 h-4" /> {p.name}
                        </button>
                    ))}
                    <button 
                        onClick={() => setIsAddingPortfolio(true)}
                        className="px-4 py-2.5 rounded-xl font-bold whitespace-nowrap transition-colors bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200 flex items-center gap-1"
                    >
                        <Plus className="w-4 h-4" /> Nueva Cartera
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Panel Izquierdo: Gráficos y Añadir */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
                            {/* Pestañas del Panel */}
                            <div className="flex border-b border-slate-200 mb-4 pb-1">
                                <button 
                                    onClick={() => setDashboardTab('distribution')} 
                                    className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-bold transition-colors border-b-2 ${dashboardTab === 'distribution' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
                                >
                                    <PieChartIcon className="w-4 h-4" /> Distribución
                                </button>
                                <button 
                                    onClick={() => setDashboardTab('evolution')} 
                                    className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-bold transition-colors border-b-2 ${dashboardTab === 'evolution' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
                                >
                                    <LineChartIcon className="w-4 h-4" /> Evolución
                                </button>
                            </div>

                            {/* Contenido: Distribución */}
                            {dashboardTab === 'distribution' && (
                                globalStats.current > 0 ? (
                                    <div className={`h-64 transition-all duration-300 ${!showBalances ? 'blur-md opacity-40 select-none pointer-events-none' : ''}`}>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie data={getPieChartData()} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                                                    {getPieChartData().map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                                </Pie>
                                                <RechartsTooltip formatter={(value) => formatCurrency(value / getDisplayRate())} />
                                                <Legend verticalAlign="bottom" height={36} />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                ) : (
                                    <div className="h-64 flex items-center justify-center text-slate-400 text-center text-sm bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                        Añade activos para ver la distribución.
                                    </div>
                                )
                            )}

                            {/* Contenido: Evolución */}
                            {dashboardTab === 'evolution' && (
                                <div className="space-y-4">
                                    <div className="flex gap-1 bg-slate-100 p-1 rounded-lg overflow-x-auto scrollbar-hide">
                                        {TIMEFRAMES.map(tf => (
                                            <button 
                                                key={tf.label}
                                                onClick={() => setGlobalChartTimeframe(tf.label)}
                                                className={`flex-1 py-1 px-2 text-xs font-bold rounded-md transition-colors ${globalChartTimeframe === tf.label ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:bg-slate-200'}`}
                                            >
                                                {tf.label}
                                            </button>
                                        ))}
                                    </div>
                                    <div className={`h-56 relative ${!showBalances ? 'blur-md opacity-40 select-none pointer-events-none' : ''}`}>
                                        {isGlobalChartLoading && (
                                            <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-10 flex items-center justify-center rounded-xl">
                                                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                                            </div>
                                        )}
                                        
                                        {globalChartData.length > 0 ? (
                                            <ResponsiveContainer width="100%" height="100%">
                                                <AreaChart data={globalChartData} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                                                    <defs>
                                                        <linearGradient id="colorGlobalPrice" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="5%" stopColor={globalChartColor} stopOpacity={0.3}/>
                                                            <stop offset="95%" stopColor={globalChartColor} stopOpacity={0}/>
                                                        </linearGradient>
                                                    </defs>
                                                    <XAxis dataKey="date" hide />
                                                    <YAxis domain={['auto', 'auto']} hide />
                                                    <RechartsTooltip 
                                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
                                                        labelStyle={{ color: '#64748b', fontWeight: 'bold', fontSize: '12px' }}
                                                        itemStyle={{ color: globalChartColor, fontWeight: '900', fontSize: '16px' }}
                                                        formatter={(value) => [formatCurrency(value), 'Patrimonio']}
                                                    />
                                                    <Area type="monotone" dataKey="price" stroke={globalChartColor} strokeWidth={2} fillOpacity={1} fill="url(#colorGlobalPrice)" />
                                                </AreaChart>
                                            </ResponsiveContainer>
                                        ) : (
                                            !isGlobalChartLoading && <div className="h-full flex items-center justify-center text-slate-400 text-center text-sm bg-slate-50 rounded-xl border border-dashed border-slate-200">Datos insuficientes para generar el historial global.</div>
                                        )}
                                    </div>
                                    {globalChartData.length > 0 && showBalances && (
                                        <div className="flex justify-between items-center px-1">
                                            <div className="text-left">
                                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Inicio ({globalChartTimeframe})</p>
                                                <p className="text-xs font-bold text-slate-600">{formatCurrency(globalChartData[0].price)}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Variación</p>
                                                <p className={`text-xs font-bold flex items-center justify-end gap-1 ${isGlobalChartPositive ? 'text-green-600' : 'text-red-500'}`}>
                                                    {isGlobalChartPositive ? <ArrowUpRight className="w-3 h-3"/> : <ArrowDownRight className="w-3 h-3"/>}
                                                    {formatCurrency(Math.abs(globalChartData[globalChartData.length - 1].price - globalChartData[0].price))}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <button 
                            onClick={() => {
                                setNewAccount({ name: '', type: 'crypto_exchange', portfolioId: activePortfolioId !== 'all' ? activePortfolioId : (portfolios[0]?.id || '') });
                                setIsAddingAccount(true);
                            }}
                            className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-md"
                        >
                            <Plus className="w-5 h-5" /> Añadir Cuenta / Entidad
                        </button>
                    </div>

                    <div className="lg:col-span-2 space-y-8">
                        {portfolios.length === 0 ? (
                            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center">
                                <Coins className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                                <h3 className="text-xl font-bold text-slate-700 mb-2">Cartera vacía</h3>
                                <p className="text-slate-500">Comienza creando una Cartera y añadiendo cuentas.</p>
                            </div>
                        ) : (
                            portfolios.filter(p => activePortfolioId === 'all' || p.id === activePortfolioId).map(port => {
                                const isPortHidden = hiddenPortfolios.has(port.id);
                                return (
                                <div key={port.id} className="space-y-4">
                                    {activePortfolioId === 'all' && (
                                        <div className="flex items-center justify-between border-b border-slate-200 pb-2 mt-4">
                                            <h2 className="text-xl font-extrabold text-slate-800 flex items-center gap-2">
                                                {port.name}
                                            </h2>
                                            <button onClick={() => toggleSet(hiddenPortfolios, port.id, setHiddenPortfolios)} className="text-slate-400 hover:text-slate-700">
                                                {isPortHidden ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                            </button>
                                        </div>
                                    )}

                                    {port.accounts.length === 0 && <p className="text-sm text-slate-400 italic py-2">Sin cuentas en esta cartera.</p>}

                                    {port.accounts.map(account => {
                                        const isAccHidden = hiddenAccounts.has(account.id);
                                        const totalHidden = !showBalances || isPortHidden || isAccHidden;

                                        let accCurrentUSD = 0, accInvestedUSD = 0;
                                        account.assets.forEach(a => { accCurrentUSD += getAssetValueUSD(a); accInvestedUSD += getAssetInvestedUSD(a); });
                                        const accPnL = calculatePnL(accCurrentUSD, accInvestedUSD);
                                        const isCollapsed = collapsedAccounts.has(account.id);

                                        return (
                                            <div key={account.id} className={`bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden ${totalHidden ? 'opacity-75 grayscale-[30%]' : ''}`}>
                                                <div 
                                                    className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center cursor-pointer hover:bg-slate-100 transition-colors"
                                                    onClick={() => toggleSet(collapsedAccounts, account.id, setCollapsedAccounts)}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="text-slate-400">{isCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}</div>
                                                        <div className="bg-white p-2 rounded-lg shadow-sm border border-slate-100">{getAccountIcon(account.type)}</div>
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <h3 className="font-bold text-slate-900">{account.name}</h3>
                                                                <button onClick={(e) => { e.stopPropagation(); toggleSet(hiddenAccounts, account.id, setHiddenAccounts); }} className="text-slate-300 hover:text-slate-500">
                                                                    {isAccHidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4 opacity-0 group-hover:opacity-100" />}
                                                                </button>
                                                            </div>
                                                            <p className="text-xs text-slate-500 font-medium">{account.type.replace('_',' ')}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-4">
                                                        <div className="text-right">
                                                            <p className="font-bold text-slate-900 text-lg">{totalHidden ? '********' : formatCurrency(accCurrentUSD)}</p>
                                                            {!totalHidden && accPnL.percent !== 0 && <div className="flex justify-end mt-1"><PnLBadge pnlPercent={accPnL.percent} /></div>}
                                                        </div>
                                                        <button onClick={(e) => { e.stopPropagation(); handleDeleteAccount(port.id, account.id); }} className="text-slate-300 hover:text-red-500 transition-colors p-2"><Trash2 className="w-5 h-5" /></button>
                                                    </div>
                                                </div>
                                                
                                                {!isCollapsed && (
                                                    <div className="p-4 bg-white">
                                                        {account.assets.length === 0 ? <p className="text-sm text-slate-400 text-center py-4">Sin activos.</p> : (
                                                            <div className="space-y-2">
                                                                {account.assets.map(asset => {
                                                                    const currentUSD = getAssetValueUSD(asset);
                                                                    const investedUSD = getAssetInvestedUSD(asset);
                                                                    const assetPnL = calculatePnL(currentUSD, investedUSD);
                                                                    const totalAmt = getAssetTotalAmount(asset);
                                                                    const yieldAmt = getAssetYieldAmount(asset);
                                                                    
                                                                    const pricePerUnit = totalAmt > 0 ? (currentUSD / totalAmt) : 0;
                                                                    const isStableOrFiat = ['USD', 'USDT', 'USDC', 'DAI', 'EUR', 'BRL', 'ARS'].includes(asset.symbol.toUpperCase());

                                                                    return (
                                                                        <div key={asset.id} className="flex justify-between items-center p-3 hover:bg-slate-50 rounded-xl transition-colors border border-slate-100 group">
                                                                            <div className="flex items-center gap-3 cursor-pointer flex-1" onClick={() => setSelectedAsset({ portfolioId: port.id, accountId: account.id, assetId: asset.id })}>
                                                                                <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center font-bold text-white text-xs shadow-sm">
                                                                                    {asset.symbol.substring(0, 4)}
                                                                                </div>
                                                                                <div>
                                                                                    <div className="flex items-center gap-2">
                                                                                        <p className="font-bold text-slate-900 uppercase group-hover:text-blue-600 transition-colors">{asset.symbol}</p>
                                                                                        {asset.assetType && asset.assetType !== 'crypto' && (
                                                                                            <span className="text-[10px] px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full font-semibold">
                                                                                                {asset.assetType.replace('_',' ')}
                                                                                            </span>
                                                                                        )}
                                                                                    </div>
                                                                                    <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                                                                                        {totalHidden ? '***' : totalAmt.toFixed(4)} unidades 
                                                                                        {yieldAmt > 0 && !totalHidden && <span className="text-green-600 font-bold ml-1">(+{yieldAmt.toFixed(4)} APY)</span>}
                                                                                    </p>
                                                                                </div>
                                                                            </div>
                                                                            <div className="flex items-center gap-4">
                                                                                <div className="text-right cursor-pointer" onClick={() => setSelectedAsset({ portfolioId: port.id, accountId: account.id, assetId: asset.id })}>
                                                                                    <p className="font-bold text-slate-900">{totalHidden ? '********' : formatCurrency(currentUSD)}</p>
                                                                                    <div className="flex items-center justify-end gap-2 mt-1">
                                                                                        {!isStableOrFiat && !totalHidden && <span className="text-xs text-slate-400">{formatCurrency(pricePerUnit, 'USD')} c/u</span>}
                                                                                        {!totalHidden && Math.abs(assetPnL.percent) > 0.01 && <PnLBadge pnlPercent={assetPnL.percent} />}
                                                                                    </div>
                                                                                </div>
                                                                                <button onClick={() => handleDeleteAsset(port.id, account.id, asset.id)} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-2"><Trash2 className="w-4 h-4" /></button>
                                                                            </div>
                                                                        </div>
                                                                    )
                                                                })}
                                                            </div>
                                                        )}
                                                        <button 
                                                            onClick={() => setIsAddingAsset({ active: true, portfolioId: port.id, accountId: account.id })}
                                                            className="mt-3 w-full py-2.5 border-2 border-dashed border-slate-200 text-slate-600 rounded-xl hover:border-blue-400 hover:text-blue-600 transition-colors flex items-center justify-center gap-2 text-sm font-bold bg-slate-50/50 hover:bg-blue-50/50"
                                                        >
                                                            <Plus className="w-4 h-4" /> Añadir Activo a {account.name}
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    })}
                                </div>
                            )})
                        )}
                    </div>
                </div>

                {isAddingPortfolio && (
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden">
                            <div className="p-5 border-b border-slate-100"><h3 className="text-lg font-bold">Nueva Cartera</h3></div>
                            <form onSubmit={handleAddPortfolio} className="p-5 space-y-4">
                                <div>
                                    <label className="block text-sm font-bold mb-1">Nombre de Cartera</label>
                                    <input type="text" autoFocus required value={newPortfolioName} onChange={(e) => setNewPortfolioName(e.target.value)} className="w-full px-4 py-2 border rounded-xl outline-none" placeholder="Ej: Ahorros Largo Plazo"/>
                                </div>
                                <div className="flex gap-3 pt-2">
                                    <button type="button" onClick={() => setIsAddingPortfolio(false)} className="flex-1 px-4 py-2 bg-slate-100 rounded-xl font-bold">Cancelar</button>
                                    <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-xl font-bold">Crear</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {isAddingAccount && (
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
                            <div className="p-6 border-b border-slate-100"><h3 className="text-xl font-bold">Añadir Nueva Entidad</h3></div>
                            <form onSubmit={handleAddAccount} className="p-6 space-y-4">
                                {portfolios.length > 1 && (
                                    <div>
                                        <label className="block text-sm font-bold mb-1">Cartera Destino</label>
                                        <select value={newAccount.portfolioId} onChange={(e) => setNewAccount({...newAccount, portfolioId: e.target.value})} className="w-full px-4 py-3 border rounded-xl outline-none">
                                            {portfolios.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                        </select>
                                    </div>
                                )}
                                <div>
                                    <label className="block text-sm font-bold mb-1">Nombre (Ej: Binance, Santander)</label>
                                    <input type="text" required value={newAccount.name} onChange={(e) => setNewAccount({...newAccount, name: e.target.value})} className="w-full px-4 py-3 border rounded-xl outline-none"/>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold mb-1">Tipo de Entidad</label>
                                    <select value={newAccount.type} onChange={(e) => setNewAccount({...newAccount, type: e.target.value})} className="w-full px-4 py-3 border rounded-xl outline-none">
                                        <option value="crypto_exchange">Exchange Cripto</option>
                                        <option value="broker_global">Broker Internacional</option>
                                        <option value="broker_ar">Broker Argentino</option>
                                        <option value="bank_us">Banco EE.UU.</option>
                                        <option value="bank_eu">Banco Europeo</option>
                                        <option value="bank_br">Banco Brasileño</option>
                                        <option value="bank_ar">Banco Argentino</option>
                                        <option value="wallet">Billetera Virtual</option>
                                    </select>
                                </div>
                                <div className="flex gap-3 pt-4">
                                    <button type="button" onClick={() => setIsAddingAccount(false)} className="flex-1 px-4 py-3 bg-slate-100 rounded-xl font-bold">Cancelar</button>
                                    <button type="submit" className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl font-bold">Guardar</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {isAddingAsset.active && (() => {
                    const targetAcc = portfolios.find(p => p.id === isAddingAsset.portfolioId)?.accounts.find(a => a.id === isAddingAsset.accountId);
                    const isArBroker = targetAcc?.type === 'broker_ar';
                    
                    return (
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden max-h-[90vh] overflow-y-auto">
                            <div className="p-6 border-b border-slate-100 bg-slate-50 sticky top-0 z-10">
                                <h3 className="text-xl font-bold">Añadir Activo a {targetAcc?.name}</h3>
                            </div>
                            <form onSubmit={handleAddAsset} className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-bold mb-1">Tipo de Activo</label>
                                    <select value={newAsset.assetType} onChange={(e) => setNewAsset({...newAsset, assetType: e.target.value})} className="w-full px-4 py-3 border rounded-xl outline-none bg-white">
                                        {isArBroker ? (
                                            <>
                                                <option value="cedear_ar">CEDEAR / ETF Argentino</option>
                                                <option value="accion_ar">Acción Local (Merval)</option>
                                                <option value="bono_ar">Bono Argentino</option>
                                                <option value="on_ar">Obligación Negociable (ON)</option>
                                                <option value="letra_ar">Letra del Tesoro</option>
                                                <option value="caucion_ar">Caución (AR$)</option>
                                                <option value="fci_ar">Fondo Común de Inversión (FCI)</option>
                                                <option value="fiat">Saldos Liquidos (Fiat)</option>
                                            </>
                                        ) : (
                                            <>
                                                <option value="crypto">Criptomoneda</option>
                                                <option value="tokenized_stock">Acción Tokenizada (Crypto)</option>
                                                <option value="stock_global">Acción / ETF Global</option>
                                                <option value="fiat">Moneda Fiat</option>
                                                <option value="manual">Valor Manual en USD</option>
                                            </>
                                        )}
                                    </select>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold mb-1">Símbolo/Ticker</label>
                                        <input type="text" required value={newAsset.symbol} onChange={handleSymbolChange} placeholder="Ej: BTC, AAPL, AL30" className="w-full px-4 py-3 border rounded-xl outline-none uppercase"/>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold mb-1">Cantidad Inicial</label>
                                        <input type="number" step="any" required min="0" value={newAsset.amount} onChange={(e) => setNewAsset({...newAsset, amount: e.target.value})} placeholder="Ej: 0.5" className="w-full px-4 py-3 border rounded-xl outline-none"/>
                                    </div>
                                </div>
                                
                                <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 space-y-3">
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Fecha de Compra (Opcional)</label>
                                        <input type="date" value={newAsset.purchaseDate} onChange={(e) => { setNewAsset({...newAsset, purchaseDate: e.target.value}); fetchHistoricalPrice(newAsset.symbol, newAsset.assetType, e.target.value); }} className="w-full px-4 py-2 border rounded-lg text-sm bg-white outline-none"/>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1 flex justify-between">
                                            <span>Precio de Compra USD (Opcional)</span>{isFetchingHistory && <Loader2 className="w-4 h-4 animate-spin text-blue-500" />}
                                        </label>
                                        <input type="number" step="any" min="0" value={newAsset.purchasePrice} onChange={(e) => setNewAsset({...newAsset, purchasePrice: e.target.value})} className="w-full px-4 py-2 border rounded-lg text-sm bg-white outline-none"/>
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-2">
                                    <button type="button" onClick={() => setIsAddingAsset({ active: false })} className="flex-1 px-4 py-3 bg-slate-100 rounded-xl font-bold">Cancelar</button>
                                    <button type="submit" className="flex-1 px-4 py-3 bg-slate-900 text-white rounded-xl font-bold">Añadir Activo</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )})()}

                {selectedAsset && (() => {
                    const port = portfolios.find(p => p.id === selectedAsset.portfolioId);
                    const acc = port?.accounts.find(a => a.id === selectedAsset.accountId);
                    const asset = acc?.assets.find(a => a.id === selectedAsset.assetId);
                    if (!asset) return null;
                    return (
                        <AssetDetailsModal 
                            asset={asset}
                            onClose={() => setSelectedAsset(null)}
                            onUpdateApy={handleUpdateApy}
                            onAddTransaction={handleAddTransaction}
                        />
                    )
                })()}

            </div>
        </div>
    );
}