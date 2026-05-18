import React, { useState, useEffect } from 'react';
import {
    Wallet, Building2, Bitcoin, Plus, Trash2, RefreshCw,
    TrendingUp, DollarSign, PiggyBank, Cloud, CloudOff,
    Loader2, Globe, Landmark, Eye, EyeOff, PieChart as PieChartIcon,
    ChevronDown, ChevronRight, Euro, Coins, Settings, ArrowUpRight, ArrowDownRight, Activity, 
    LineChart as LineChartIcon, LogIn, UserPlus, LogOut, ExternalLink, ShieldAlert, Sparkles, Calendar, Newspaper, DollarSign as DollarIcon
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend, AreaChart, Area, XAxis, YAxis } from 'recharts';

// --- CONFIGURACIÓN DE BASE DE DATOS Y USUARIOS (FIREBASE) ---
import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, signInWithCustomToken } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';

// Credenciales oficiales de tu proyecto Firebase 'dikystar-investment'
const VERCEL_FIREBASE_CONFIG = {
    apiKey: "AIzaSyDJEA-eT-3vGiZwPkkk6ixn88i75qwp-vY",
    authDomain: "dikystar-investment.firebaseapp.com",
    projectId: "dikystar-investment",
    storageBucket: "dikystar-investment.firebasestorage.app",
    messagingSenderId: "273717181133",
    appId: "1:273717181133:web:e4a98b67474e1d84aec784"
};

// Aislamiento estricto de entornos para evitar el error 'auth/api-key-not-valid'
const isCanvasSandbox = typeof __initial_auth_token !== 'undefined' && __initial_auth_token;

const getFirebaseConfig = () => {
    // Si estamos en el editor de StackBlitz, usamos OBLIGATORIAMENTE la config inyectada
    if (isCanvasSandbox && typeof __firebase_config !== 'undefined' && __firebase_config) {
        try { return JSON.parse(__firebase_config); } catch (e) {}
    }
    // En Vercel / Laptop / iPhone, usamos tus credenciales reales
    return VERCEL_FIREBASE_CONFIG;
};

const config = getFirebaseConfig();
const isFirebaseConfigured = config && config.apiKey && config.apiKey !== "TU_API_KEY";
let app, auth, db, appId;

if (isFirebaseConfigured) {
    try {
        app = initializeApp(config);
        auth = getAuth(app);
        db = getFirestore(app);
        const rawAppId = typeof __app_id !== 'undefined' ? __app_id : 'dikystar-main-app';
        // Sanitizamos el appId eliminando barras diagonales para evitar errores de segmentos impares en la base de datos de Firebase
        appId = rawAppId.replace(/\//g, '_');
    } catch (e) {
        console.error("Error inicializando Firebase:", e);
    }
}

// --- DICCIONARIO DE IDIOMAS (ESPAÑOL / INGLÉS) ---
const TRANSLATIONS = {
    es: {
        title: "investment",
        slogan: "Inicia sesión para sincronizar tus carteras",
        email: "Correo Electrónico",
        password: "Contraseña",
        enter: "Entrar",
        register: "Registrarme",
        noAccount: "¿No tienes cuenta? Crea una gratis",
        haveAccount: "¿Ya tienes cuenta? Inicia sesión",
        localModeTitle: "Ejecutando en Modo Local (Esta PC)",
        localModeDesc: "Tus datos se guardan en el navegador. Para sincronizar con el celular, configura tus claves en el código.",
        savingCloud: "Guardando en la nube...",
        savingLocal: "Modo Local (Guardando en PC)",
        totalWealth: "Patrimonio Total",
        tradingView: "Mercados TradingView",
        allPortfolios: "Todas las Carteras",
        newPortfolio: "Nueva Cartera",
        distribution: "Distribución",
        evolution: "Evolución",
        addAccount: "Añadir Cuenta / Entidad",
        emptyPortfolio: "Cartera vacía",
        emptyPortfolioDesc: "Comienza creando una Cartera y añadiendo cuentas.",
        noAccounts: "Sin cuentas en esta cartera.",
        addAsset: "Añadir Activo",
        cancel: "Cancelar",
        create: "Crear",
        save: "Guardar",
        name: "Nombre",
        type: "Tipo",
        destinationPortfolio: "Cartera Destino",
        symbol: "Símbolo",
        amount: "Cantidad",
        purchaseDate: "Fecha de Compra (Opcional)",
        purchasePrice: "Precio USD (Opcional)",
        apyRate: "Tasa APY (%)",
        apyDate: "Fecha de Inicio APY",
        apyYield: "Rendimiento APY Generado",
        history: "Historial",
        addActivity: "Añadir Actividad",
        buy: "Compra / Depósito",
        sell: "Venta / Retiro",
        chart: "Gráfico",
        errorWeakPassword: "La contraseña debe tener al menos 6 caracteres.",
        errorEmailInUse: "Este correo electrónico ya está registrado.",
        errorInvalidEmail: "El correo electrónico no es válido.",
        errorCredentials: "Credenciales incorrectas o usuario no encontrado.",
        logout: "Salir",
        loading: "Cargando...",
        stablecoins: "Estables",
        bluechips: "Bluechips",
        blockchains: "Cripto Redes",
        altcoins: "Altcoins",
        other: "Otros",
        aiAdvisor: "Asesor IA",
        aiTitle: "DikyStar Inteligencia Artificial",
        aiTabAnalysis: "Análisis & Sugerencias",
        aiTabNews: "Noticias de Impacto",
        aiTabCalendar: "Calendario Semanal",
        aiTabQuotes: "Mercado en Vivo",
        aiProfileLabel: "Perfil del Inversor",
        aiProfileCons: "Conservador",
        aiProfileMod: "Moderado",
        aiProfileAgg: "Agresivo",
        aiAnalyzeBtn: "Generar Análisis con IA",
        aiLoadingText: "Analizando mercados globales...",
        aiErrorMsg: "No se pudo conectar con el servidor de IA. Inténtalo de nuevo.",
        aiSystemPrompt: "Eres un analista financiero de élite y asesor de inversiones de DikyStar Investment. Tu objetivo es dar sugerencias profesionales estructuradas, lógicas y sumamente útiles basadas en datos en tiempo real de búsqueda y el perfil del inversor. Si se solicita análisis de cartera, audita los activos proporcionados."
    },
    en: {
        title: "investment",
        slogan: "Log in to synchronize your portfolios",
        email: "Email Address",
        password: "Password",
        enter: "Sign In",
        register: "Register",
        noAccount: "Don't have an account? Sign up free",
        haveAccount: "Already have an account? Log in",
        localModeTitle: "Running in Local Mode (This PC)",
        localModeDesc: "Your data is stored in your browser. To sync with mobile, set up your keys in the code.",
        savingCloud: "Saving to cloud...",
        savingLocal: "Local Mode (Saving on PC)",
        totalWealth: "Total Wealth",
        tradingView: "TradingView Markets",
        allPortfolios: "All Portfolios",
        newPortfolio: "New Portfolio",
        distribution: "Distribution",
        evolution: "Evolution",
        addAccount: "Add Account / Entity",
        emptyPortfolio: "Empty Portfolio",
        emptyPortfolioDesc: "Start by creating a Portfolio and adding accounts.",
        noAccounts: "No accounts in this portfolio.",
        addAsset: "Add Asset",
        cancel: "Cancel",
        create: "Create",
        save: "Save",
        name: "Name",
        type: "Type",
        destinationPortfolio: "Destination Portfolio",
        symbol: "Symbol",
        amount: "Amount",
        purchaseDate: "Purchase Date (Optional)",
        purchasePrice: "USD Price (Optional)",
        apyRate: "APY Rate (%)",
        apyDate: "APY Start Date",
        apyYield: "Generated APY Yield",
        history: "Activity History",
        addActivity: "Add Activity",
        buy: "Buy / Deposit",
        sell: "Sell / Withdraw",
        chart: "Chart",
        errorWeakPassword: "Password must be at least 6 characters long.",
        errorEmailInUse: "This email is already registered.",
        errorInvalidEmail: "The email address is invalid.",
        errorCredentials: "Wrong credentials or user not found.",
        logout: "Logout",
        loading: "Loading...",
        stablecoins: "Stables",
        bluechips: "Bluechips",
        blockchains: "Blockchains (L1/L2)",
        altcoins: "Altcoins",
        other: "Others",
        aiAdvisor: "AI Advisor",
        aiTitle: "DikyStar Artificial Intelligence",
        aiTabAnalysis: "Analysis & Tips",
        aiTabNews: "High-Impact News",
        aiTabCalendar: "Weekly Calendar",
        aiTabQuotes: "Live Market",
        aiProfileLabel: "Investor Profile",
        aiProfileCons: "Conservative",
        aiProfileMod: "Moderate",
        aiProfileAgg: "Aggressive",
        aiAnalyzeBtn: "Generate AI Analysis",
        aiLoadingText: "Analyzing global financial markets...",
        aiErrorMsg: "Could not connect to the AI server. Please try again.",
        aiSystemPrompt: "You are an elite financial analyst and investment advisor for DikyStar Investment. Your goal is to provide highly structured, logical, and extremely actionable investment suggestions based on real-time search data and the user's investor profile. Audited portfolio assets if provided."
    }
};

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
        `https://corsproxy.io/?${encodeURIComponent(url)}`
    ];
    for (let proxy of proxies) {
        try {
            const res = await fetch(proxy);
            if (res.ok) {
                if (proxy.includes('/get?url=')) {
                    const data = await res.json();
                    if (data && data.contents) {
                        try { return JSON.parse(data.contents); } catch (e) { return data.contents; }
                    }
                } else return await res.json();
            }
        } catch (e) {}
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
            if (data && Array.isArray(data)) data.forEach(k => dataPoints.push({ ts: parseInt(k[0]), price: parseFloat(k[4]) }));
        } else if (['stock_global', 'stock_br', 'cedear_ar', 'accion_ar', 'bono_ar', 'on_ar', 'letra_ar'].includes(assetType)) {
            let ticker = sym;
            // Sufijos automáticos para APIs de Yahoo Finance
            if (['cedear_ar', 'accion_ar', 'bono_ar', 'on_ar', 'letra_ar'].includes(assetType) && !ticker.endsWith('.BA')) {
                ticker = `${ticker}.BA`;
            } else if (assetType === 'stock_br' && !ticker.endsWith('.SA')) {
                ticker = `${ticker}.SA`;
            }

            const url = `https://query2.finance.yahoo.com/v8/finance/chart/${ticker}?range=${tf.yahooRange}&interval=${tf.yahooInterval}`;
            const data = await fetchWithFallbacks(url);
            if (data && data?.chart?.result?.[0]) {
                const result = data.chart.result[0];
                const timestamps = result.timestamp || [];
                const prices = result.indicators?.quote?.[0]?.close || [];
                timestamps.forEach((ts, i) => { if (prices[i] !== null && prices[i] !== undefined) dataPoints.push({ ts: ts * 1000, price: prices[i] }); });
            }
        }
    } catch (e) {}
    return dataPoints;
};

const InputField = (props) => (
    <input 
        {...props} 
        className={`w-full px-4 py-3 border border-slate-200 rounded-xl outline-none shadow-sm focus:border-blue-500 text-slate-900 bg-white ${props.className || ''}`}
        style={{ backgroundColor: '#ffffff', color: '#0f172a', colorScheme: 'light', ...props.style }}
    />
);

const SelectField = (props) => (
    <select 
        {...props} 
        className={`w-full px-4 py-3 border border-slate-200 rounded-xl outline-none bg-white shadow-sm focus:border-blue-500 text-slate-900 ${props.className || ''}`}
        style={{ backgroundColor: '#ffffff', color: '#0f172a', colorScheme: 'light', ...props.style }}
    >
        {props.children}
    </select>
);


const AssetDetailsModal = ({ asset, onUpdateApy, onAddTransaction, onClose, lang }) => {
    const t = TRANSLATIONS[lang];
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

    const isFiat = asset.assetType === 'fiat';

    const yieldAmount = React.useMemo(() => {
        if (!asset.apy || parseFloat(asset.apy) <= 0 || !asset.apyStartDate) return 0;
        const start = new Date(asset.apyStartDate).getTime();
        const days = (Date.now() - start) / (1000 * 60 * 60 * 24);
        if (days <= 0) return 0;
        return parseFloat(asset.amount) * (parseFloat(asset.apy) / 100) * (days / 365);
    }, [asset]);

    useEffect(() => { if (tab === 'chart') loadChartData(); }, [tab, chartTimeframe]);

    const loadChartData = async () => {
        setIsChartLoading(true); setChartData([]);
        const history = await fetchHistoricalData(asset.symbol, asset.assetType, chartTimeframe);
        setChartData(history.map(item => ({
            date: new Date(item.ts).toLocaleDateString('es-AR', { month: 'short', day: 'numeric', hour: ['1D', '5D'].includes(chartTimeframe) ? '2-digit' : undefined, minute: ['1D', '5D'].includes(chartTimeframe) ? '2-digit' : undefined }),
            price: item.price
        })));
        setIsChartLoading(false);
    };

    const isChartPositive = chartData.length > 1 && chartData[chartData.length - 1].price >= chartData[0].price;
    const chartColor = isChartPositive ? '#10b981' : '#ef4444';

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col">
                <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                    <div>
                        <h3 className="text-lg font-bold text-slate-900">{t.addAsset}: {asset.symbol}</h3>
                        <p className="text-sm text-slate-500">{t.amount}: {(parseFloat(asset.amount) + yieldAmount).toFixed(isFiat ? 2 : 4)}</p>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-700 bg-slate-200 p-2 rounded-full transition-colors">{t.cancel}</button>
                </div>
                
                <div className="flex border-b border-slate-200 overflow-x-auto scrollbar-hide">
                    <button onClick={() => setTab('info')} className={`px-4 py-3 font-bold text-sm whitespace-nowrap transition-colors ${tab === 'info' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-slate-500 hover:bg-slate-50'}`}>Resumen & APY</button>
                    <button onClick={() => setTab('history')} className={`px-4 py-3 font-bold text-sm whitespace-nowrap transition-colors ${tab === 'history' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-slate-500 hover:bg-slate-50'}`}>{t.history}</button>
                    {(!['manual', 'fiat', 'caucion_ar', 'fci_ar'].includes(asset.assetType) && !['USD', 'USDT', 'USDC', 'DAI', 'ARS', 'EUR', 'BRL'].includes(asset.symbol.toUpperCase())) && (
                        <button onClick={() => setTab('chart')} className={`px-4 py-3 font-bold text-sm whitespace-nowrap transition-colors flex items-center gap-1 ${tab === 'chart' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-slate-500 hover:bg-slate-50'}`}><LineChartIcon className="w-4 h-4"/> {t.chart}</button>
                    )}
                </div>

                <div className="p-6 overflow-y-auto">
                    {tab === 'info' && (
                        <div className="space-y-6">
                            <div className="bg-green-50 border border-green-100 p-4 rounded-xl flex justify-between items-center">
                                <div>
                                    <p className="text-sm text-green-800 font-bold mb-1">{t.apyYield}</p>
                                    <p className="text-3xl font-black text-green-600">+{yieldAmount.toFixed(isFiat ? 2 : 4)} <span className="text-lg">{asset.symbol}</span></p>
                                </div>
                                <Activity className="w-10 h-10 text-green-300" />
                            </div>
                            
                            <div className="space-y-3">
                                <h4 className="font-bold text-slate-800 flex items-center gap-2"><Settings className="w-4 h-4"/> Configuración APY</h4>
                                <div className="flex gap-4">
                                    <div className="flex-1">
                                        <label className="block text-sm font-medium text-slate-700 mb-1">{t.apyRate}</label>
                                        <InputField type="number" step="any" min="0" value={apy} onChange={(e) => setApy(e.target.value)} placeholder="Ej: 12" />
                                    </div>
                                    <div className="flex-1">
                                        <label className="block text-sm font-medium text-slate-700 mb-1">{t.apyDate}</label>
                                        <InputField type="date" value={apyDate} onChange={(e) => setApyDate(e.target.value)} />
                                    </div>
                                </div>
                                <button onClick={() => onUpdateApy(apy, apyDate)} className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors shadow-sm">{t.save}</button>
                            </div>
                        </div>
                    )}
                    
                    {tab === 'history' && (
                        <div className="space-y-6">
                            <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 space-y-3">
                                <h4 className="font-bold text-blue-900 text-sm flex items-center gap-2"><Plus className="w-4 h-4"/> {t.addActivity}</h4>
                                <div className="grid grid-cols-2 gap-3">
                                    <SelectField value={txType} onChange={(e) => setTxType(e.target.value)} className="py-2 text-sm">
                                        <option value="buy">{t.buy}</option>
                                        <option value="sell">{t.sell}</option>
                                    </SelectField>
                                    <InputField type="date" value={txDate} onChange={(e) => setTxDate(e.target.value)} className="py-2 text-sm" />
                                    <InputField type="number" step="any" min="0" placeholder={t.amount} value={txAmount} onChange={(e) => setTxAmount(e.target.value)} className="py-2 text-sm" />
                                    <InputField type="number" step="any" min="0" placeholder={t.purchasePrice} value={txPrice} onChange={(e) => setTxPrice(e.target.value)} className="py-2 text-sm" />
                                </div>
                                <button onClick={(e) => { e.preventDefault(); if(txAmount) onAddTransaction({ type: txType, amount: txAmount, price: txPrice, date: txDate }); setTxAmount(''); setTxPrice(''); }} className="w-full py-2 bg-blue-600 text-white rounded-lg font-bold text-sm hover:bg-blue-700 transition-colors">{t.save}</button>
                            </div>

                            <div>
                                <h4 className="font-bold text-slate-800 text-sm mb-3">{t.history}</h4>
                                <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                                    {!asset.transactions || asset.transactions.length === 0 ? (
                                        <p className="text-xs text-slate-400 bg-slate-50 p-3 rounded-lg border border-slate-100 text-center">No hay actividad.</p>
                                    ) : (
                                        asset.transactions.map((tx, idx) => (
                                            <div key={idx} className="flex justify-between items-center p-3 bg-white border border-slate-100 rounded-lg shadow-sm">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center bg-slate-50 border ${tx.type === 'buy' ? 'border-green-200 text-green-600' : 'border-red-200 text-red-600'}`}>
                                                        {tx.type === 'buy' ? <ArrowDownRight className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-slate-800">{tx.type === 'buy' ? t.buy : t.sell}</p>
                                                        <p className="text-xs text-slate-500">{tx.date}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className={`text-sm font-bold ${tx.type === 'buy' ? 'text-green-600' : 'text-red-600'}`}>{tx.type === 'buy' ? '+' : '-'}{parseFloat(tx.amount).toFixed(isFiat ? 2 : 4)}</p>
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
                                    <button key={tf.label} onClick={() => setChartTimeframe(tf.label)} className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-colors ${chartTimeframe === tf.label ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:bg-slate-200'}`}>
                                        {tf.label}
                                    </button>
                                ))}
                            </div>
                            <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 relative">
                                {isChartLoading && <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-10 flex items-center justify-center rounded-xl"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>}
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
                                                <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} labelStyle={{ color: '#64748b', fontWeight: 'bold', fontSize: '12px' }} itemStyle={{ color: chartColor, fontWeight: '900', fontSize: '16px' }} formatter={(value) => [value.toFixed(2), 'Precio']} />
                                                <Area type="monotone" dataKey="price" stroke={chartColor} strokeWidth={2} fillOpacity={1} fill="url(#colorPrice)" />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    ) : (!isChartLoading && <div className="h-full flex items-center justify-center text-slate-400 text-sm">Sin datos suficientes.</div>)}
                                </div>
                                {chartData.length > 0 && (
                                    <div className="mt-4 flex justify-between items-center px-2">
                                        <div>
                                            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Precio Actual</p>
                                            <p className={`text-xl font-black ${isChartPositive ? 'text-green-600' : 'text-red-500'}`}>{chartData[chartData.length - 1].price.toFixed(2)}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Variación</p>
                                            <p className={`text-sm font-bold flex items-center justify-end gap-1 ${isChartPositive ? 'text-green-600' : 'text-red-500'}`}>
                                                {isChartPositive ? <ArrowUpRight className="w-4 h-4"/> : <ArrowDownRight className="w-4 h-4"/>}
                                                {Math.abs(chartData[chartData.length - 1].price - chartData[0].price).toFixed(2)} 
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
    // --- ESTADO DE IDIOMA ---
    const [lang, setLang] = useState('es'); 
    const t = TRANSLATIONS[lang];

    // --- ESTADOS DE AUTENTICACIÓN Y NUBE ---
    const [user, setUser] = useState(null);
    const [authLoading, setAuthLoading] = useState(true);
    const [authMode, setAuthMode] = useState('login'); 
    const [authEmail, setAuthEmail] = useState('');
    const [authPassword, setAuthPassword] = useState('');
    const [authError, setAuthError] = useState('');

    // --- ESTADOS PRINCIPALES DE CARTERA ---
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
    
    const [dashboardTab, setDashboardTab] = useState('distribution'); 
    
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
    const [newAsset, setNewAsset] = useState({ symbol: '', amount: '', assetType: 'crypto', purchaseDate: '', purchasePrice: '' });
    const [isFetchingHistory, setIsFetchingHistory] = useState(false);

    // --- ESTADOS DEL ASESOR DE IA ---
    const [isAiModalOpen, setIsAiModalOpen] = useState(false);
    const [aiTab, setAiTab] = useState('analysis'); 
    const [investorProfile, setInvestorProfile] = useState('moderate'); 
    const [aiResponse, setAiResponse] = useState('');
    const [aiLoading, setAiLoading] = useState(false);
    const [aiError, setAiError] = useState('');

    // --- CÁLCULOS AUXILIARES ---
    const getCryptoCategory = (symbol) => {
        const s = symbol.toUpperCase();
        if (['USDT','USDC','DAI','FDUSD','TUSD'].includes(s)) return t.stablecoins;
        if (['BTC','ETH'].includes(s)) return t.bluechips;
        if (['SOL','ADA','DOT','AVAX','MATIC','LINK','ATOM'].includes(s)) return t.blockchains;
        return t.altcoins;
    };

    const getDisplayRate = () => displayCurrency === 'USD' ? 1 : (forexRates[displayCurrency] || 1);
    const formatCurrency = (val, cur = null) => new Intl.NumberFormat('en-US', { style: 'currency', currency: cur || displayCurrency, minimumFractionDigits: 2 }).format(val * (cur === 'USD' ? 1 : getDisplayRate()));
    const formatPercent = (p) => isNaN(p) || !isFinite(p) ? "0.00%" : `${p >= 0 ? '+' : ''}${p.toFixed(2)}%`;
    const getAssetYieldAmount = (asset) => (!asset.apy || !asset.apyStartDate) ? 0 : Math.max(0, parseFloat(asset.amount) * (parseFloat(asset.apy) / 100) * ((Date.now() - new Date(asset.apyStartDate).getTime()) / (1000 * 60 * 60 * 24 * 365)));
    const getAssetTotalAmount = (asset) => parseFloat(asset.amount || 0) + getAssetYieldAmount(asset);
    
    const getAssetValueUSD = (asset) => {
        const tVal = getAssetTotalAmount(asset);
        if (['manual', 'caucion_ar'].includes(asset.assetType)) return tVal;
        const s = asset.symbol.toUpperCase();
        if (['USD', 'USDT', 'USDC', 'DAI'].includes(s)) return tVal;
        if (s === 'ARS') return tVal / forexRates.ARS;
        if (s === 'EUR') return tVal / forexRates.EUR;
        if (s === 'BRL') return tVal / forexRates.BRL;
        return (marketPrices[s] ? tVal * marketPrices[s] : (asset.purchasePrice ? tVal * parseFloat(asset.purchasePrice) : 0));
    };

    const getAssetInvestedUSD = (asset) => {
        let amt = 0, cost = 0;
        (asset.transactions || []).forEach(tx => { if (tx.type === 'buy') { amt += parseFloat(tx.amount || 0); cost += parseFloat(tx.amount || 0) * parseFloat(tx.price || 0); }});
        return (amt > 0 ? cost / amt : parseFloat(asset.purchasePrice || 0)) > 0 ? getAssetTotalAmount(asset) * (amt > 0 ? cost / amt : parseFloat(asset.purchasePrice || 0)) : getAssetValueUSD(asset); 
    };

    const getAccountIcon = (type) => {
        switch(type) {
            case 'crypto_exchange': return <Bitcoin className="w-5 h-5 text-orange-500" />;
            case 'broker_global': return <Globe className="w-5 h-5 text-blue-500" />;
            case 'broker_ar': return <TrendingUp className="w-5 h-5 text-indigo-500" />;
            case 'broker_br': return <TrendingUp className="w-5 h-5 text-yellow-600" />;
            case 'bank_us': return <Landmark className="w-5 h-5 text-emerald-500" />;
            case 'bank_ar': return <Building2 className="w-5 h-5 text-cyan-500" />;
            case 'bank_eu': return <Euro className="w-5 h-5 text-blue-600" />;
            case 'bank_br': return <Building2 className="w-5 h-5 text-yellow-500" />;
            case 'wallet': return <Wallet className="w-5 h-5 text-purple-500" />;
            default: return <Wallet className="w-5 h-5 text-gray-500" />;
        }
    };

    // --- CÁLCULO DE ESTADÍSTICAS GLOBALES ---
    const globalStats = portfolios.reduce((acc, port) => {
        if (activePortfolioId !== 'all' && port.id !== activePortfolioId) return acc;
        port.accounts.forEach(a => a.assets.forEach(as => { acc.current += getAssetValueUSD(as); acc.invested += getAssetInvestedUSD(as); }));
        return acc;
    }, { current: 0, invested: 0 });

    const getPieChartData = () => {
        const data = {};
        portfolios.forEach(port => {
            if (activePortfolioId !== 'all' && port.id !== activePortfolioId) return;
            port.accounts.forEach(acc => acc.assets.forEach(asset => {
                const value = getAssetValueUSD(asset) * getDisplayRate();
                let cat = t.other;
                if (['crypto', 'tokenized_stock'].includes(asset.assetType)) cat = getCryptoCategory(asset.symbol);
                else if (['USDT','USDC','DAI','FDUSD'].includes(asset.symbol.toUpperCase())) cat = t.stablecoins;
                else if (['stock_global', 'stock_br', 'cedear_ar', 'accion_ar', 'bono_ar', 'on_ar', 'letra_ar', 'fci_ar'].includes(asset.assetType)) cat = 'Acciones/Bonos/Fondos';
                else if (asset.assetType === 'fiat') cat = 'Efectivo/Bancos';
                else if (['manual', 'caucion_ar'].includes(asset.assetType)) cat = 'Renta Fija / Manual';
                data[cat] = (data[cat] || 0) + value;
            }));
        });
        return Object.keys(data).map(key => ({ name: key, value: data[key] })).filter(i => i.value > 0);
    };

    const updateAllPrices = async () => {
        setIsLoadingPrices(true);
        let nP = { ...marketPrices }, nR = { ...forexRates };
        try { const r = await fetch('https://dolarapi.com/v1/dolares/blue'); if(r.ok) nR.ARS = (await r.json()).venta; } catch(e){}
        try { const r = await fetch('https://open.er-api.com/v6/latest/USD'); if(r.ok) { const d = await r.json(); if(d?.rates){ nR.EUR = d.rates.EUR; nR.BRL = d.rates.BRL; } } } catch(e){}
        setForexRates(nR);
        let req = []; portfolios.forEach(p => p.accounts.forEach(a => a.assets.forEach(as => { if (!['manual', 'caucion_ar', 'fci_ar'].includes(as.assetType) && !['USD', 'USDT', 'USDC', 'DAI', 'ARS', 'EUR', 'BRL'].includes(as.symbol.toUpperCase())) req.push(as); })));
        
        for (const asset of req) {
            const sym = asset.symbol.toUpperCase();
            try {
                if (['crypto', 'tokenized_stock'].includes(asset.assetType)) {
                    let r = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${sym}USDT`);
                    if(!r.ok) r = await fetch(`https://corsproxy.io/?${encodeURIComponent(`https://api.binance.com/api/v3/ticker/price?symbol=${sym}USDT`)}`);
                    if(r.ok) nP[sym] = parseFloat((await r.json()).price);
                } else if (['stock_global', 'stock_br', 'cedear_ar', 'accion_ar', 'bono_ar', 'on_ar', 'letra_ar'].includes(asset.assetType)) {
                    let ticker = sym; 
                    if (['cedear_ar', 'accion_ar', 'bono_ar', 'on_ar', 'letra_ar'].includes(asset.assetType) && !ticker.endsWith('.BA')) {
                        ticker = `${ticker}.BA`;
                    } else if (asset.assetType === 'stock_br' && !ticker.endsWith('.SA')) {
                        ticker = `${ticker}.SA`;
                    }
                    const d = await fetchWithFallbacks(`https://query2.finance.yahoo.com/v8/finance/chart/${ticker}?range=1d&interval=1d`);
                    if(d?.chart?.result?.[0]?.meta?.regularMarketPrice) {
                        let rawPrice = d.chart.result[0].meta.regularMarketPrice;
                        if (['cedear_ar', 'accion_ar', 'bono_ar', 'on_ar', 'letra_ar'].includes(asset.assetType)) rawPrice = rawPrice / (nR.ARS || 1000);
                        if (asset.assetType === 'stock_br') rawPrice = rawPrice / (nR.BRL || 5.15);
                        nP[sym] = rawPrice;
                    }
                }
            } catch (e) {}
        }
        setMarketPrices(nP); setIsLoadingPrices(false);
        if (dashboardTab === 'evolution') loadGlobalChart();
    };

    // --- EFECTOS DE AUTENTICACIÓN ---
    useEffect(() => {
        // Si Firebase no está configurado de forma real con una clave API que comience con 'AIzaSy', evitamos arrancar los oyentes y el initAuth
        if (!isFirebaseConfigured) {
            setAuthLoading(false);
            return;
        }
        
        const initAuth = async () => {
            try {
                // Validación para evitar llamadas a la API de Firebase si hay tokens incorrectos del sandbox de StackBlitz
                if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token && __initial_auth_token.trim() !== "") {
                    // Validar si la api key provista de Firebase es funcional antes de iniciar
                    if (auth && auth.config && auth.config.apiKey && auth.config.apiKey.startsWith("AIzaSy")) {
                        await signInWithCustomToken(auth, __initial_auth_token);
                    }
                }
            } catch (e) {
                console.error("Error durante initAuth de Firebase (Sandbox detectado):", e);
            } finally {
                setAuthLoading(false);
            }
        };

        initAuth();
        
        let unsubscribe = () => {};
        if (auth) {
            unsubscribe = onAuthStateChanged(auth, (u) => {
                setUser(u);
                setAuthLoading(false);
            });
        }
        return () => unsubscribe();
    }, []);

    // --- CARGAR DATOS DESDE LOCAL STORAGE Y FIRESTORE ---
    useEffect(() => {
        const loadLocal = () => {
            const local = localStorage.getItem('DikyStarPortfolios_v2');
            if (local) {
                try { setPortfolios(JSON.parse(local)); } catch (e) { console.error(e); }
            }
        };

        if (!isFirebaseConfigured) {
            loadLocal();
            return;
        }

        if (!user) {
            loadLocal();
            return;
        }

        const fetchData = async () => {
            try {
                setSyncStatus('syncing');
                // MODIFICADO: Cambiamos a una ruta de documento segura con segmentos pares y sanos compatible con Rule 1 y appId sanitizada sin slashes
                const docRef = doc(db, 'artifacts', appId, 'users', user.uid, 'portfolios', 'user_data');
                const docSnap = await getDoc(docRef);
                if (docSnap.exists() && docSnap.data().portfolios) {
                    setPortfolios(docSnap.data().portfolios);
                } else {
                    const local = localStorage.getItem('DikyStarPortfolios_v2');
                    if (local) setPortfolios(JSON.parse(local));
                }
                setSyncStatus('synced');
            } catch (e) { 
                console.error("Error cargando de la nube", e);
                loadLocal();
            }
        };
        fetchData();
    }, [user]);

    // --- GUARDAR DATOS EN FIRESTORE Y LOCAL ---
    useEffect(() => {
        if (portfolios.length === 0) return;
        
        localStorage.setItem('DikyStarPortfolios_v2', JSON.stringify(portfolios));
        updateAllPrices();

        if (user && isFirebaseConfigured) {
            const saveData = async () => {
                setSyncStatus('syncing');
                try {
                    // MODIFICADO: Cambiamos a una ruta de documento segura con segmentos pares y sanos compatible con Rule 1 y appId sanitizada sin slashes
                    const docRef = doc(db, 'artifacts', appId, 'users', user.uid, 'portfolios', 'user_data');
                    await setDoc(docRef, { portfolios });
                    setSyncStatus('synced');
                } catch (e) { console.error("Error guardando en la nube", e); }
            };
            saveData();
        }
    }, [portfolios]);

    useEffect(() => {
        if (dashboardTab === 'evolution') {
            loadGlobalChart();
        }
    }, [dashboardTab, globalChartTimeframe, activePortfolioId, user]);

    // --- FUNCIONES DE AUTENTICACIÓN ---
    const handleAuth = async (e) => {
        e.preventDefault();
        setAuthError('');
        try {
            if (authMode === 'login') await signInWithEmailAndPassword(auth, authEmail, authPassword);
            else await createUserWithEmailAndPassword(auth, authEmail, authPassword);
        } catch (err) {
            console.error("Firebase Auth Error:", err);
            if (err.code === 'auth/operation-not-allowed') {
                setAuthError(lang === 'es' ? '❌ Error: Debes habilitar "Correo/Contraseña" en la consola de Firebase (Sección Authentication).' : '❌ Error: You must enable "Email/Password" in Firebase Authentication.');
            } else if (err.code === 'auth/weak-password') {
                setAuthError(t.errorWeakPassword);
            } else if (err.code === 'auth/email-already-in-use') {
                setAuthError(t.errorEmailInUse);
            } else if (err.code === 'auth/invalid-email') {
                setAuthError(t.errorInvalidEmail);
            } else if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found' || err.code === 'auth/invalid-api-key') {
                setAuthError(t.errorCredentials);
            } else {
                setAuthError(`Error: ${err.message}`);
            }
        }
    };

    const handleLogout = () => {
        if (auth) signOut(auth);
        setUser(null);
        setPortfolios([]);
        localStorage.removeItem('DikyStarPortfolios_v2');
    };

    // --- EJECUTAR CONSULTA DE IA CON GEMINI & GROUNDING ---
    const handleRunAiAnalysis = async (customTab = aiTab) => {
        setAiLoading(true);
        setAiError('');
        setAiResponse('');

        const apiKey = ""; 
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;

        // Obtener activos detallados para armar la pregunta
        let assetsTextList = [];
        portfolios.forEach(port => {
            port.accounts.forEach(acc => {
                acc.assets.forEach(as => {
                    const val = getAssetValueUSD(as);
                    assetsTextList.push(`- ${as.symbol}: ${parseFloat(as.amount).toFixed(4)} unidades (Valor aprox: $${val.toFixed(2)} USD, Tipo: ${as.assetType})`);
                });
            });
        });

        const assetsString = assetsTextList.length > 0 ? assetsTextList.join("\n") : "La cartera del usuario está actualmente vacía.";

        // Personalización de la consulta según la pestaña activa
        let promptText = "";
        if (customTab === 'analysis') {
            promptText = `
            Audita y analiza esta cartera de inversión real y provee sugerencias:
            - Perfil de riesgo seleccionado del Inversor: ${investorProfile.toUpperCase()}
            - Divisa de visualización: ${displayCurrency}
            - Composición de Activos cargados:
            ${assetsString}

            Por favor, elabora:
            1. Un diagnóstico de Diversificación y distribución de riesgo.
            2. Análisis fundamental y técnico simplificado de los activos principales que posee el usuario (identificando patrones recientes o zonas de soporte/resistencia importantes si corresponde).
            3. Sugerencias de inversión personalizadas y directas que encajen estrictamente con su perfil (${investorProfile.toUpperCase()}) y con las condiciones macroeconómicas globales vigentes de esta semana.
            `;
        } else if (customTab === 'news') {
            promptText = `
            Busca y resume las 5 noticias financieras y macroeconómicas de hoy más importantes de forma global, en Estados Unidos, Europa y con un enfoque relevante en el mercado de Argentina. 
            Sé sumamente conciso, estructurado, profesional y explica brevemente por qué estas noticias impactan a un inversor promedio de acciones, CEDEARs o criptomonedas.
            `;
        } else if (customTab === 'calendar') {
            promptText = `
            Busca y presenta de forma clara y formateada el calendario económico de esta semana con eventos macroeconómicos críticos internacionales (decisiones de tasas de interés de la FED, inflación CPI de EEUU, datos de empleo, reportes de ganancias corporativas clave, etc.). 
            Para cada evento, indica: Fecha/Hora aproximada, País/Región, Evento, Impacto esperado (Bajo/Medio/Alto) y breve sugerencia de protección de cartera.
            `;
        } else if (customTab === 'quotes') {
            promptText = `
            Busca y provee las cotizaciones de mercado en tiempo real más importantes de hoy, incluyendo:
            - Principales índices bursátiles globales (S&P 500, Nasdaq, Dow Jones) y locales (Merval de Argentina).
            - Principales tipos de cambio de hoy en Argentina (Dólar oficial, Dólar Blue, Dólar MEP, Dólar CCL).
            - Cotizaciones de monedas internacionales frente al dólar (Euro, Real Brasileño).
            - Cotización en tiempo real de Bitcoin (BTC) y Ethereum (ETH).
            Formatea los datos en una tabla limpia usando Markdown.
            `;
        }

        // Estructura de payload oficial de Gemini con Google Search Grounding habilitado
        const payload = {
            contents: [{
                parts: [{ text: promptText }]
            }],
            systemInstruction: {
                parts: [{ text: t.aiSystemPrompt }]
            },
            tools: [{
                "google_search": {} // Grounding activo para traer cotizaciones y noticias en tiempo real
            }]
        };

        // Implementación con exponencial backoff para tolerancia a fallas de API
        const delay = (ms) => new Promise(res => setTimeout(res, ms));
        const backoffTimes = [1000, 2000, 4000, 8000, 16000];
        let attempt = 0;
        let success = false;

        while (attempt < 5) {
            try {
                const response = await fetch(endpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                if (response.ok) {
                    const result = await response.json();
                    const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
                    if (text) {
                        setAiResponse(text);
                        success = true;
                        break;
                    }
                }
                attempt++;
                await delay(backoffTimes[attempt - 1]);
            } catch (e) {
                attempt++;
                if (attempt === 5) {
                    setAiError(t.aiErrorMsg);
                } else {
                    await delay(backoffTimes[attempt - 1]);
                }
            }
        }

        if (!success && !aiError) {
            setAiError(t.aiErrorMsg);
        }
        setAiLoading(false);
    };

    // Lanzar análisis cada vez que cambiamos de pestaña dentro del modal de IA
    useEffect(() => {
        if (isAiModalOpen) {
            handleRunAiAnalysis(aiTab);
        }
    }, [aiTab, investorProfile, isAiModalOpen]);

    // Función auxiliar para renderizar con formato estético los textos que retorna Gemini (Markdown)
    const renderFormattedAiText = (rawText) => {
        if (!rawText) return null;
        
        return rawText.split('\n').map((line, idx) => {
            let processedLine = line;
            let className = "text-slate-700 text-sm leading-relaxed mb-2.5";

            if (line.startsWith('### ')) {
                processedLine = line.replace('### ', '');
                className = "text-md font-extrabold text-slate-900 mt-5 mb-3 flex items-center gap-2 border-b pb-1.5";
            }
            else if (line.startsWith('## ')) {
                processedLine = line.replace('## ', '');
                className = "text-lg font-black text-blue-900 mt-6 mb-3 flex items-center gap-2 border-b border-blue-100 pb-2";
            }
            else if (line.startsWith('# ')) {
                processedLine = line.replace('# ', '');
                className = "text-xl font-black text-slate-900 mt-7 mb-4";
            }
            else if (line.startsWith('- ') || line.startsWith('* ')) {
                processedLine = "• " + line.substring(2);
                className = "text-slate-700 text-sm pl-4 mb-2.5 list-disc";
            }

            const boldRegex = /\*\*(.*?)\*\*/g;
            const parts = [];
            let lastIndex = 0;
            let match;

            while ((match = boldRegex.exec(processedLine)) !== null) {
                if (match.index > lastIndex) {
                    parts.push(processedLine.substring(lastIndex, match.index));
                }
                parts.push(<strong key={match.index} className="font-extrabold text-slate-900 bg-blue-50/50 px-1 rounded">{match[1]}</strong>);
                lastIndex = boldRegex.lastIndex;
            }
            if (lastIndex < processedLine.length) {
                parts.push(processedLine.substring(lastIndex));
            }

            return (
                <p key={idx} className={className}>
                    {parts.length > 0 ? parts : processedLine}
                </p>
            );
        });
    };

    // --- ACCIONES DE CARTERA ---
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
        } else if (targetAcc?.type === 'broker_br') {
            newType = 'stock_br';
        } else if (targetAcc?.type === 'crypto_exchange' && ['BTC','ETH','USDT','SOL'].includes(sym)) {
            newType = 'crypto';
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
            } else if (['stock_global', 'stock_br', 'cedear_ar', 'accion_ar', 'bono_ar', 'on_ar', 'letra_ar'].includes(assetType)) {
                let ticker = sym;
                if (['cedear_ar', 'accion_ar', 'bono_ar', 'on_ar', 'letra_ar'].includes(assetType) && !ticker.endsWith('.BA')) {
                    ticker = `${ticker}.BA`;
                } else if (assetType === 'stock_br' && !ticker.endsWith('.SA')) {
                    ticker = `${ticker}.SA`;
                }
                const period1 = Math.floor(timestamp / 1000);
                const period2 = period1 + 86400; 
                const targetUrl = `https://query2.finance.yahoo.com/v8/finance/chart/${ticker}?period1=${period1}&period2=${period2}&interval=1d`;
                
                try {
                    const parsed = await fetchWithFallbacks(targetUrl);
                    if (parsed && parsed?.chart?.result?.[0]?.indicators?.quote?.[0]?.open?.[0]) {
                        let rawPrice = parsed.chart.result[0].indicators.quote[0].open[0];
                        if (['cedear_ar', 'accion_ar', 'bono_ar', 'on_ar', 'letra_ar'].includes(assetType)) rawPrice = rawPrice / (forexRates.ARS || 1000); 
                        if (assetType === 'stock_br') rawPrice = rawPrice / (forexRates.BRL || 5.15);
                        setNewAsset(prev => ({ ...prev, purchasePrice: rawPrice.toFixed(2) }));
                    }
                } catch (e) {}
            }
        } catch (error) {}
        setIsFetchingHistory(false);
    };

    // --- PANTALLA PRINCIPAL ---
    return (
        <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans text-slate-800">
            <div className="max-w-6xl mx-auto space-y-6">
                
                {/* Banner de Aviso: Modo Local (Si Firebase no está configurado) */}
                {(!isFirebaseConfigured || isCanvasSandbox) && (
                    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="bg-amber-100 p-2 rounded-xl text-amber-700">
                                <ShieldAlert className="w-6 h-6" />
                            </div>
                            <div>
                                <h4 className="font-extrabold text-amber-900 text-sm">{t.localModeTitle}</h4>
                                <p className="text-xs text-amber-700 font-medium">{t.localModeDesc}</p>
                            </div>
                        </div>
                    </div>
                )}

                <header className="bg-white rounded-2xl shadow-sm p-6 border border-slate-200">
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                        <div className="flex items-center gap-4">
                            <div className="bg-slate-900 p-3 rounded-xl shadow-lg"><Activity className="w-8 h-8 text-blue-400" /></div>
                            <div>
                                <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">DikyStar<span className="text-blue-600"> {t.title}</span></h1>
                                <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500 mt-1">
                                    {syncStatus === 'syncing' ? <Loader2 className="w-4 h-4 animate-spin text-blue-500" /> : <Cloud className="w-4 h-4 text-emerald-500" />}
                                    <span>
                                        {(!isFirebaseConfigured || isCanvasSandbox)
                                            ? t.savingLocal 
                                            : syncStatus === 'syncing' 
                                                ? t.savingCloud 
                                                : user ? `${user.email}` : 'Sincronizado'}
                                    </span>
                                    <span className="mx-1 hidden md:inline">•</span>
                                    <div className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-lg">
                                        <Settings className="w-3.5 h-3.5" />
                                        <select value={displayCurrency} onChange={(e) => setDisplayCurrency(e.target.value)} className="bg-transparent font-bold cursor-pointer outline-none text-slate-700" style={{ colorScheme: 'light' }}>
                                            <option value="USD">USD</option><option value="EUR">EUR</option><option value="BRL">BRL</option><option value="ARS">ARS</option>
                                        </select>
                                    </div>
                                    {isFirebaseConfigured && user && !isCanvasSandbox && (
                                        <button onClick={handleLogout} className="text-slate-400 hover:text-red-500 flex items-center gap-1 font-bold ml-2 bg-red-50 px-2 py-1 rounded-lg transition-colors">
                                            <LogOut className="w-3.5 h-3.5" /> {t.logout}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                            {/* Selector de Idioma Global */}
                            <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
                                <button onClick={() => setLang('es')} className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${lang === 'es' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}>ESP 🇪🇸</button>
                                <button onClick={() => setLang('en')} className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${lang === 'en' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}>ENG 🇬🇧</button>
                            </div>

                            {/* BOTÓN INTERACTIVO DEL ASESOR DE IA */}
                            <button onClick={() => setIsAiModalOpen(true)} className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-5 py-3 rounded-xl font-bold hover:from-violet-700 hover:to-indigo-700 transition-colors shadow-md border border-violet-500/20">
                                <Sparkles className="w-5 h-5 text-yellow-300 animate-pulse" /> <span>{t.aiAdvisor}</span>
                            </button>

                            {/* BOTÓN TRADINGVIEW PROFESIONAL */}
                            <a href="https://es.tradingview.com/markets/" target="_blank" rel="noreferrer" className="flex items-center gap-2 bg-slate-900 text-white px-5 py-3 rounded-xl font-bold hover:bg-slate-800 transition-colors shadow-md">
                                <ExternalLink className="w-5 h-5 text-blue-400" /> <span className="hidden sm:inline">{t.tradingView}</span>
                            </a>
                            
                            <div className="flex items-center gap-4 bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex-1 lg:flex-none">
                                <button onClick={() => setShowBalances(!showBalances)} className="bg-white p-2.5 rounded-full hover:bg-slate-100 transition-colors shadow-sm border border-slate-200">
                                    {showBalances ? <Eye className="w-5 h-5 text-slate-600" /> : <EyeOff className="w-5 h-5 text-slate-600" />}
                                </button>
                                <div className="flex-1 lg:flex-none">
                                    <p className="text-[11px] font-black text-slate-500 uppercase tracking-wider">{t.totalWealth}</p>
                                    <p className="text-2xl md:text-3xl font-black text-slate-900 leading-none mt-1">
                                        {showBalances ? formatCurrency(globalStats.current) : '********'}
                                    </p>
                                </div>
                                <button onClick={updateAllPrices} disabled={isLoadingPrices} className="bg-blue-100 text-blue-700 p-2.5 rounded-xl hover:bg-blue-200 transition-colors">
                                    <RefreshCw className={`w-5 h-5 ${isLoadingPrices ? 'animate-spin' : ''}`} />
                                </button>
                            </div>
                        </div>
                    </div>
                </header>

                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    <button onClick={() => setActivePortfolioId('all')} className={`px-5 py-2.5 rounded-xl font-bold whitespace-nowrap transition-colors shadow-sm ${activePortfolioId === 'all' ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'}`}>
                        {t.allPortfolios}
                    </button>
                    {portfolios.map(p => (
                        <button key={p.id} onClick={() => setActivePortfolioId(p.id)} className={`px-5 py-2.5 rounded-xl font-bold whitespace-nowrap transition-colors shadow-sm flex items-center gap-2 ${activePortfolioId === p.id ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'}`}>
                            <Wallet className="w-4 h-4" /> {p.name}
                        </button>
                    ))}
                    <button onClick={() => setIsAddingPortfolio(true)} className="px-4 py-2.5 rounded-xl font-bold whitespace-nowrap transition-colors bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 flex items-center gap-1">
                        <Plus className="w-4 h-4" /> {t.newPortfolio}
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* PANEL IZQUIERDO: Gráficos */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
                            <div className="flex border-b border-slate-200 mb-4 pb-1">
                                <button onClick={() => setDashboardTab('distribution')} className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-bold transition-colors border-b-2 ${dashboardTab === 'distribution' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}>
                                    <PieChartIcon className="w-4 h-4" /> {t.distribution}
                                </button>
                                <button onClick={() => setDashboardTab('evolution')} className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-bold transition-colors border-b-2 ${dashboardTab === 'evolution' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}>
                                    <LineChartIcon className="w-4 h-4" /> {t.evolution}
                                </button>
                            </div>

                            {dashboardTab === 'distribution' && (
                                globalStats.current > 0 ? (
                                    <div className={`h-64 transition-all duration-300 ${!showBalances ? 'blur-md opacity-40 select-none pointer-events-none' : ''}`}>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart><Pie data={getPieChartData()} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">{getPieChartData().map((e, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Pie><RechartsTooltip formatter={(v) => formatCurrency(v / getDisplayRate())} /><Legend verticalAlign="bottom" height={36} /></PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                ) : <div className="h-64 flex items-center justify-center text-slate-400 text-center text-sm bg-slate-50 rounded-xl border border-dashed border-slate-200">Añade activos para ver distribución.</div>
                            )}

                            {dashboardTab === 'evolution' && (
                                <div className="space-y-4">
                                    <div className="flex gap-1 bg-slate-100 p-1 rounded-lg overflow-x-auto scrollbar-hide">
                                        {TIMEFRAMES.map(tf => <button key={tf.label} onClick={() => setGlobalChartTimeframe(tf.label)} className={`flex-1 py-1 px-2 text-xs font-bold rounded-md transition-colors ${globalChartTimeframe === tf.label ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:bg-slate-200'}`}>{tf.label}</button>)}
                                    </div>
                                    <div className={`h-56 relative ${!showBalances ? 'blur-md opacity-40 select-none pointer-events-none' : ''}`}>
                                        {isGlobalChartLoading && <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-10 flex items-center justify-center rounded-xl"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>}
                                        {globalChartData.length > 0 ? (
                                            <ResponsiveContainer width="100%" height="100%">
                                                <AreaChart data={globalChartData} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                                                    <defs><linearGradient id="cGP" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={globalChartData[globalChartData.length - 1].price >= globalChartData[0].price ? '#10b981' : '#ef4444'} stopOpacity={0.3}/><stop offset="95%" stopColor="#fff" stopOpacity={0}/></linearGradient></defs>
                                                    <XAxis dataKey="date" hide /><YAxis domain={['auto', 'auto']} hide />
                                                    <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} labelStyle={{ color: '#64748b', fontWeight: 'bold', fontSize: '12px' }} itemStyle={{ color: globalChartData[globalChartData.length - 1].price >= globalChartData[0].price ? '#10b981' : '#ef4444', fontWeight: '900', fontSize: '16px' }} formatter={(v) => [formatCurrency(v), 'Patrimonio']} />
                                                    <Area type="monotone" dataKey="price" stroke={globalChartData[globalChartData.length - 1].price >= globalChartData[0].price ? '#10b981' : '#ef4444'} strokeWidth={2} fillOpacity={1} fill="url(#cGP)" />
                                                </AreaChart>
                                            </ResponsiveContainer>
                                        ) : (!isGlobalChartLoading && <div className="h-full flex items-center justify-center text-slate-400 text-center text-sm bg-slate-50 rounded-xl border border-dashed border-slate-200">Datos insuficientes.</div>)}
                                    </div>
                                </div>
                            )}
                        </div>

                        <button onClick={() => { setNewAccount({ name: '', type: 'crypto_exchange', portfolioId: activePortfolioId !== 'all' ? activePortfolioId : (portfolios[0]?.id || '') }); setIsAddingAccount(true); }} className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-md">
                            <Plus className="w-5 h-5" /> {t.addAccount}
                        </button>
                    </div>

                    {/* PANEL DERECHO: Carteras */}
                    <div className="lg:col-span-2 space-y-6">
                        {portfolios.length === 0 ? (
                            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center">
                                <Coins className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                                <h3 className="text-xl font-bold text-slate-700 mb-2">{t.emptyPortfolio}</h3>
                                <p className="text-slate-500">{t.emptyPortfolioDesc}</p>
                            </div>
                        ) : (
                            portfolios.filter(p => activePortfolioId === 'all' || p.id === activePortfolioId).map(port => {
                                const isPortHidden = hiddenPortfolios.has(port.id);
                                return (
                                <div key={port.id} className="space-y-4">
                                    {activePortfolioId === 'all' && (
                                        <div className="flex items-center justify-between border-b border-slate-200 pb-2 mt-2">
                                            <h2 className="text-xl font-extrabold text-slate-800 flex items-center gap-2">{port.name}</h2>
                                            <button onClick={() => { const s = new Set(hiddenPortfolios); s.has(port.id) ? s.delete(port.id) : s.add(port.id); setHiddenPortfolios(s); }} className="text-slate-400 hover:text-slate-700">
                                                {isPortHidden ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                            </button>
                                        </div>
                                    )}

                                    {port.accounts.length === 0 && <p className="text-sm text-slate-400 italic py-2">{t.noAccounts}</p>}

                                    {port.accounts.map(account => {
                                        const isAccHidden = hiddenAccounts.has(account.id);
                                        const totalHidden = !showBalances || isPortHidden || isAccHidden;
                                        let accCurrentUSD = 0, accInvestedUSD = 0;
                                        account.assets.forEach(a => { accCurrentUSD += getAssetValueUSD(a); accInvestedUSD += getAssetInvestedUSD(a); });
                                        const isCollapsed = collapsedAccounts.has(account.id);

                                        return (
                                            <div key={account.id} className={`bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden ${totalHidden ? 'opacity-75 grayscale-[30%]' : ''}`}>
                                                <div className="p-4 bg-slate-50 flex justify-between items-center cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => { const s = new Set(collapsedAccounts); s.has(account.id) ? s.delete(account.id) : s.add(account.id); setCollapsedAccounts(s); }}>
                                                    <div className="flex items-center gap-3">
                                                        <div className="text-slate-400">{isCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}</div>
                                                        <div className="bg-white p-2 rounded-lg shadow-sm border border-slate-100">{getAccountIcon(account.type)}</div>
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <h3 className="font-bold text-slate-900">{account.name}</h3>
                                                                <button onClick={(e) => { e.stopPropagation(); const s = new Set(hiddenAccounts); s.has(account.id) ? s.delete(account.id) : s.add(account.id); setHiddenAccounts(s); }} className="text-slate-300 hover:text-slate-500">
                                                                    {isAccHidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4 opacity-0 group-hover:opacity-100" />}
                                                                </button>
                                                            </div>
                                                            <p className="text-xs text-slate-500 font-medium">{account.type.replace('_',' ')}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-4">
                                                        <div className="text-right">
                                                            <p className="font-bold text-slate-900 text-lg">{totalHidden ? '********' : formatCurrency(accCurrentUSD)}</p>
                                                        </div>
                                                        <button onClick={(e) => { e.stopPropagation(); handleDeleteAccount(port.id, account.id); }} className="text-slate-300 hover:text-red-500 transition-colors p-2"><Trash2 className="w-5 h-5" /></button>
                                                    </div>
                                                </div>
                                                
                                                {!isCollapsed && (
                                                    <div className="p-4 bg-white border-t border-slate-100">
                                                        {account.assets.length === 0 ? <p className="text-sm text-slate-400 text-center py-4">Sin activos.</p> : (
                                                            <div className="space-y-2">
                                                                {account.assets.map(asset => {
                                                                    const currentUSD = getAssetValueUSD(asset);
                                                                    const totalAmt = getAssetTotalAmount(asset);
                                                                    const isFiat = asset.assetType === 'fiat';
                                                                    const yieldAmt = getAssetYieldAmount(asset);

                                                                    return (
                                                                        <div key={asset.id} className="flex justify-between items-center p-3 hover:bg-slate-50 rounded-xl transition-colors border border-slate-100 group">
                                                                            <div className="flex items-center gap-3 cursor-pointer flex-1" onClick={() => setSelectedAsset({ portfolioId: port.id, accountId: account.id, assetId: asset.id })}>
                                                                                <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center font-bold text-white text-xs shadow-sm">{asset.symbol.substring(0, 4)}</div>
                                                                                <div>
                                                                                    <div className="flex items-center gap-2">
                                                                                        <p className="font-bold text-slate-900 uppercase group-hover:text-blue-600 transition-colors">{asset.symbol}</p>
                                                                                    </div>
                                                                                    <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                                                                                        {totalHidden ? '***' : (isFiat ? totalAmt.toFixed(2) : totalAmt.toFixed(4))} {isFiat ? '' : t.assetsUnits}
                                                                                        {yieldAmt > 0 && !totalHidden && <span className="text-green-600 font-bold ml-1">(+{isFiat ? yieldAmt.toFixed(2) : yieldAmt.toFixed(4)} APY)</span>}
                                                                                    </p>
                                                                                </div>
                                                                            </div>
                                                                            <div className="flex items-center gap-4">
                                                                                <div className="text-right cursor-pointer" onClick={() => setSelectedAsset({ portfolioId: port.id, accountId: account.id, assetId: asset.id })}>
                                                                                    <p className="font-bold text-slate-900">{totalHidden ? '********' : formatCurrency(currentUSD)}</p>
                                                                                </div>
                                                                                <button onClick={() => handleDeleteAsset(port.id, account.id, asset.id)} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-2"><Trash2 className="w-4 h-4" /></button>
                                                                            </div>
                                                                        </div>
                                                                    )
                                                                })}
                                                            </div>
                                                        )}
                                                        <button onClick={() => setIsAddingAsset({ active: true, portfolioId: port.id, accountId: account.id })} className="mt-3 w-full py-2.5 border-2 border-dashed border-slate-200 text-slate-600 rounded-xl hover:border-blue-400 hover:text-blue-600 transition-colors flex items-center justify-center gap-2 text-sm font-bold bg-slate-50/50 hover:bg-blue-50/50">
                                                            <Plus className="w-4 h-4" /> {t.addAsset}
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

                {/* MODAL DEL ASESOR DE INTELIGENCIA ARTIFICIAL */}
                {isAiModalOpen && (
                    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 font-sans animate-fade-in">
                        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden max-h-[92vh] flex flex-col border border-slate-100">
                            
                            <div className="p-6 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white flex justify-between items-center relative">
                                <div className="flex items-center gap-3">
                                    <div className="bg-violet-600/30 p-2.5 rounded-2xl border border-violet-500/30">
                                        <Sparkles className="w-7 h-7 text-yellow-300 animate-pulse" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-extrabold tracking-tight">{t.aiTitle}</h3>
                                        <p className="text-xs text-indigo-200 font-medium">Gemini 2.5 Flash</p>
                                    </div>
                                </div>
                                <button onClick={() => setIsAiModalOpen(false)} className="text-slate-300 hover:text-white bg-white/10 hover:bg-white/25 px-4 py-2 rounded-xl transition-all font-bold text-sm">
                                    {t.cancel}
                                </button>
                            </div>

                            <div className="flex border-b border-slate-100 bg-slate-50 overflow-x-auto scrollbar-hide">
                                <button onClick={() => setAiTab('analysis')} className={`flex-1 py-3 px-4 font-bold text-sm whitespace-nowrap border-b-2 transition-all flex items-center justify-center gap-1.5 ${aiTab === 'analysis' ? 'border-indigo-600 text-indigo-600 bg-white' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
                                    <Sparkles className="w-4 h-4" /> {t.aiTabAnalysis}
                                </button>
                                <button onClick={() => setAiTab('news')} className={`flex-1 py-3 px-4 font-bold text-sm whitespace-nowrap border-b-2 transition-all flex items-center justify-center gap-1.5 ${aiTab === 'news' ? 'border-indigo-600 text-indigo-600 bg-white' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
                                    <Newspaper className="w-4 h-4" /> {t.aiTabNews}
                                </button>
                                <button onClick={() => setAiTab('calendar')} className={`flex-1 py-3 px-4 font-bold text-sm whitespace-nowrap border-b-2 transition-all flex items-center justify-center gap-1.5 ${aiTab === 'calendar' ? 'border-indigo-600 text-indigo-600 bg-white' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
                                    <Calendar className="w-4 h-4" /> {t.aiTabCalendar}
                                </button>
                                <button onClick={() => setAiTab('quotes')} className={`flex-1 py-3 px-4 font-bold text-sm whitespace-nowrap border-b-2 transition-all flex items-center justify-center gap-1.5 ${aiTab === 'quotes' ? 'border-indigo-600 text-indigo-600 bg-white' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
                                    <DollarIcon className="w-4 h-4" /> {t.aiTabQuotes}
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-slate-50/50 flex flex-col gap-6">
                                
                                {aiTab === 'analysis' && (
                                    <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                        <div className="space-y-1">
                                            <label className="text-xs font-black text-slate-500 uppercase tracking-wider">{t.aiProfileLabel}</label>
                                            <div className="flex gap-2 mt-1">
                                                {['conservative', 'moderate', 'aggressive'].map(profile => (
                                                    <button 
                                                        key={profile} 
                                                        onClick={() => setInvestorProfile(profile)} 
                                                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${investorProfile === profile ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'}`}
                                                    >
                                                        {profile === 'conservative' ? t.aiProfileCons : profile === 'moderate' ? t.aiProfileMod : t.aiProfileAgg}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => handleRunAiAnalysis()} 
                                            disabled={aiLoading}
                                            className="w-full sm:w-auto px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-md transition-colors"
                                        >
                                            <RefreshCw className={`w-4 h-4 ${aiLoading ? 'animate-spin' : ''}`} />
                                            {t.aiAnalyzeBtn}
                                        </button>
                                    </div>
                                )}

                                <div className="bg-white rounded-2xl border border-slate-200/80 p-6 md:p-8 shadow-sm flex-1 min-h-[350px] relative overflow-hidden">
                                    {aiLoading ? (
                                        <div className="absolute inset-0 bg-white/80 flex flex-col items-center justify-center gap-4 z-20">
                                            <Loader2 className="w-12 h-12 animate-spin text-indigo-600" />
                                            <p className="text-sm font-bold text-slate-600 animate-pulse">{t.aiLoadingText}</p>
                                        </div>
                                    ) : null}

                                    {aiError && (
                                        <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-xl text-sm font-bold text-center mb-4">
                                            {aiError}
                                        </div>
                                    )}

                                    <div className="prose max-w-none text-slate-800">
                                        {aiResponse ? (
                                            <div className="space-y-1 animate-fade-in-up">
                                                {renderFormattedAiText(aiResponse)}
                                            </div>
                                        ) : (
                                            !aiLoading && (
                                                <div className="h-full flex flex-col items-center justify-center text-center p-12 text-slate-400 gap-3">
                                                    <Sparkles className="w-12 h-12 text-slate-300" />
                                                    <p className="text-sm font-bold">Presiona el botón de arriba para iniciar el análisis en vivo.</p>
                                                </div>
                                            )
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* MODALES AÑADIR */}
                {isAddingPortfolio && (
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden">
                            <div className="p-5 border-b border-slate-100"><h3 className="text-lg font-bold text-slate-900">{t.newPortfolio}</h3></div>
                            <form onSubmit={handleAddPortfolio} className="p-5 space-y-4">
                                <div><label className="block text-sm font-bold mb-1 text-slate-700">{t.name}</label><InputField type="text" autoFocus required value={newPortfolioName} onChange={(e) => setNewPortfolioName(e.target.value)} placeholder="Ej: Ahorros Largo Plazo"/></div>
                                <div className="flex gap-3 pt-2"><button type="button" onClick={() => setIsAddingPortfolio(false)} className="flex-1 px-4 py-3 bg-slate-100 rounded-xl font-bold text-slate-700">{t.cancel}</button><button type="submit" className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl font-bold">{t.create}</button></div>
                            </form>
                        </div>
                    </div>
                )}

                {isAddingAccount && (
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
                            <div className="p-6 border-b border-slate-100"><h3 className="text-xl font-bold text-slate-900">{t.addAccount}</h3></div>
                            <form onSubmit={handleAddAccount} className="p-6 space-y-4">
                                {portfolios.length > 1 && <div><label className="block text-sm font-bold mb-1 text-slate-700">{t.destinationPortfolio}</label><SelectField value={newAccount.portfolioId} onChange={(e) => setNewAccount({...newAccount, portfolioId: e.target.value})}>{portfolios.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</SelectField></div>}
                                <div><label className="block text-sm font-bold mb-1 text-slate-700">{t.name}</label><InputField type="text" required value={newAccount.name} onChange={(e) => setNewAccount({...newAccount, name: e.target.value})} placeholder="Ej: Binance"/></div>
                                <div><label className="block text-sm font-bold mb-1 text-slate-700">{t.type}</label><SelectField value={newAccount.type} onChange={(e) => setNewAccount({...newAccount, type: e.target.value})}><option value="crypto_exchange">Exchange Cripto</option><option value="broker_global">Broker Internacional</option><option value="broker_ar">Broker Argentino</option><option value="broker_br">Broker Brasileño</option><option value="bank_us">Banco EE.UU.</option><option value="bank_eu">Banco Europeo</option><option value="bank_br">Banco Brasileño</option><option value="bank_ar">Banco Argentino</option><option value="wallet">Billetera Virtual</option></SelectField></div>
                                <div className="flex gap-3 pt-4"><button type="button" onClick={() => setIsAddingAccount(false)} className="flex-1 px-4 py-3 bg-slate-100 rounded-xl font-bold text-slate-700">{t.cancel}</button><button type="submit" className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl font-bold">{t.save}</button></div>
                            </form>
                        </div>
                    </div>
                )}

                {isAddingAsset.active && (() => {
                    const targetAcc = portfolios.find(p => p.id === isAddingAsset.portfolioId)?.accounts.find(a => a.id === isAddingAsset.accountId);
                    const isArBroker = targetAcc?.type === 'broker_ar';
                    const isBrBroker = targetAcc?.type === 'broker_br';
                    return (
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden max-h-[90vh] overflow-y-auto">
                            <div className="p-6 border-b border-slate-100 bg-slate-50 sticky top-0 z-10"><h3 className="text-xl font-bold text-slate-900">{t.addAsset}</h3></div>
                            <form onSubmit={handleAddAsset} className="p-6 space-y-4">
                                <div><label className="block text-sm font-bold mb-1 text-slate-700">{t.type}</label><SelectField value={newAsset.assetType} onChange={(e) => setNewAsset({...newAsset, assetType: e.target.value})}>
                                    {isArBroker ? (
                                        <><option value="cedear_ar">CEDEAR / ETF Argentino</option><option value="accion_ar">Acción Local (Merval)</option><option value="bono_ar">Bono</option><option value="on_ar">ON</option><option value="letra_ar">Letra / T-Bill</option><option value="fci_ar">Fondo FCI</option><option value="caucion_ar">Caución AR$</option><option value="fiat">Saldos Liquidos</option></>
                                    ) : isBrBroker ? (
                                        <><option value="stock_br">Acción/FCI Brasil (.SA)</option><option value="fiat">Saldos Liquidos</option></>
                                    ) : (
                                        <><option value="crypto">Cripto</option><option value="stock_global">Acción Global</option><option value="fiat">Fiat</option><option value="manual">Manual (USD)</option></>
                                    )}
                                </SelectField></div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div><label className="block text-sm font-bold mb-1 text-slate-700">{t.symbol}</label><InputField type="text" required value={newAsset.symbol} onChange={handleSymbolChange} placeholder="Ej: AAPL" className="uppercase"/></div>
                                    <div><label className="block text-sm font-bold mb-1 text-slate-700">{t.amount}</label><InputField type="number" step="any" required min="0" value={newAsset.amount} onChange={(e) => setNewAsset({...newAsset, amount: e.target.value})} placeholder="Ej: 0.5"/></div>
                                </div>
                                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                                    <div><label className="block text-sm font-medium mb-1 text-slate-700">{t.purchaseDate}</label><InputField type="date" value={newAsset.purchaseDate} onChange={(e) => { setNewAsset({...newAsset, purchaseDate: e.target.value}); setIsFetchingHistory(true); fetchHistoricalPrice(newAsset.symbol, newAsset.assetType, e.target.value).then(() => setIsFetchingHistory(false)); }}/></div>
                                    <div><label className="block text-sm font-medium mb-1 text-slate-700 flex justify-between"><span>{t.purchasePrice}</span>{isFetchingHistory && <Loader2 className="w-4 h-4 animate-spin text-blue-500" />}</label><InputField type="number" step="any" min="0" value={newAsset.purchasePrice} onChange={(e) => setNewAsset({...newAsset, purchasePrice: e.target.value})}/></div>
                                </div>
                                <div className="flex gap-3 pt-2"><button type="button" onClick={() => setIsAddingAsset({ active: false })} className="flex-1 px-4 py-3 bg-slate-100 rounded-xl font-bold text-slate-700">{t.cancel}</button><button type="submit" className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl font-bold">{t.addAsset}</button></div>
                            </form>
                        </div>
                    </div>
                )})()}

                {selectedAsset && (() => {
                    const port = portfolios.find(p => p.id === selectedAsset.portfolioId);
                    const acc = port?.accounts.find(a => a.id === selectedAsset.accountId);
                    const asset = acc?.assets.find(a => a.id === selectedAsset.assetId);
                    if (!asset) return null;
                    return <AssetDetailsModal asset={asset} lang={lang} onClose={() => setSelectedAsset(null)} onUpdateApy={handleUpdateApy} onAddTransaction={handleAddTransaction} />
                })()}

            </div>
        </div>
    );
}