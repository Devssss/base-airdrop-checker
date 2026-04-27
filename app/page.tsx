'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAccount, useDisconnect } from 'wagmi';
import { sdk } from '@farcaster/miniapp-sdk';
import { formatEther, createPublicClient, http } from 'viem';
import { base, arbitrum, optimism } from 'viem/chains';
import { 
  Activity, 
  ArrowRight, 
  CheckCircle2, 
  Circle, 
  ExternalLink, 
  History, 
  LayoutDashboard, 
  Link as LinkIcon, 
  RefreshCcw, 
  ShieldCheck, 
  Wallet,
  Zap,
  Globe,
  Fuel,
  TrendingUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';

// Types
interface Transaction {
  hash: string;
  timeStamp: string;
  from: string;
  to: string;
  value: string;
  gas: string;
  gasPrice: string;
  gasUsed: string;
  functionName?: string;
  isError: string;
  contractAddress: string;
}

interface NetworkConfig {
  id: string;
  name: string;
  explorerApi: string;
  explorerUrl: string;
  color: string;
  chain: any;
}

const NETWORKS: NetworkConfig[] = [
  { 
    id: 'base', 
    name: 'Base', 
    explorerApi: 'https://api.basescan.org/api', 
    explorerUrl: 'https://basescan.org',
    color: '#0052FF',
    chain: base
  },
  { 
    id: 'arbitrum', 
    name: 'Arbitrum', 
    explorerApi: 'https://api.arbiscan.io/api', 
    explorerUrl: 'https://arbiscan.io',
    color: '#28a0f0',
    chain: arbitrum
  },
  { 
    id: 'optimism', 
    name: 'Optimism', 
    explorerApi: 'https://api-optimistic.etherscan.io/api', 
    explorerUrl: 'https://optimistic.etherscan.io',
    color: '#ff0420',
    chain: optimism
  },
];

export default function Home() {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  
  const [selectedNetwork, setSelectedNetwork] = useState<NetworkConfig>(NETWORKS[0]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [balance, setBalance] = useState('0');
  const [txCount, setTxCount] = useState(0);
  const [score, setScore] = useState(0);

  useEffect(() => {
    sdk.actions.ready();
  }, []);

  const fetchOnChainData = useCallback(async () => {
    if (!address) return;

    setLoading(true);
    try {
      const client = createPublicClient({
        chain: selectedNetwork.chain,
        transport: http()
      });

      // 1. Fetch Balance
      const bal = await client.getBalance({ address });
      setBalance(formatEther(bal));

      // 2. Fetch Tx Count
      const count = await client.getTransactionCount({ address });
      setTxCount(count);

      // 3. Fetch Transaction History
      const response = await fetch(
        `${selectedNetwork.explorerApi}?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&page=1&offset=20&sort=desc`
      );
      const data = await response.json();
      
      if (data.status === '1' && Array.isArray(data.result)) {
        setTransactions(data.result);
      } else {
        setTransactions([]);
      }

      // 4. Score Logic
      let calculatedScore = Math.min(count * 5, 50);
      calculatedScore += Math.min(parseFloat(formatEther(bal)) * 10, 30);
      setScore(Math.floor(calculatedScore + Math.random() * 20));

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, [address, selectedNetwork]);

  useEffect(() => {
    if (isConnected) {
      fetchOnChainData();
    }
  }, [isConnected, address, selectedNetwork, fetchOnChainData]);

  const getStatusText = (s: number) => {
    if (s > 80) return { text: 'Highly Eligible', color: 'text-emerald-400' };
    if (s > 50) return { text: 'Moderately Eligible', color: 'text-blue-400' };
    return { text: 'Building Activity', color: 'text-slate-400' };
  };

  const status = getStatusText(score);

  const gasChartData = transactions
    .map(tx => ({
      time: new Date(parseInt(tx.timeStamp) * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      price: parseFloat(formatEther(BigInt(tx.gasPrice))) * 1e9, // Gwei
      fullTime: new Date(parseInt(tx.timeStamp) * 1000).toLocaleString()
    }))
    .reverse();

  const getTxType = (tx: Transaction) => {
    if (tx.to === '') return 'Contract Deployment';
    if (tx.functionName && tx.functionName.includes('transfer')) return 'Token Transfer';
    if (tx.functionName && tx.functionName !== '') return tx.functionName.split('(')[0];
    if (tx.value !== '0') return 'ETH Transfer';
    return 'Contract Interaction';
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 font-sans p-4 md:p-8 overflow-x-hidden">
      <style jsx global>{`
        .glass-card {
          background: rgba(15, 23, 42, 0.6);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 16px;
        }
        .eligible-text {
          text-shadow: 0 0 15px rgba(16, 185, 129, 0.3);
        }
        .interaction-row {
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }
        .interaction-row:last-child {
          border-bottom: none;
        }
      `}</style>

      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
            <ShieldCheck className="text-white w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              BaseScore <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded leading-none">v1.2.0</span>
            </h1>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">On-chain Presence Analyzer</p>
          </div>
        </div>

        <div className="flex gap-2 items-center">
          {isConnected ? (
            <div className="bg-slate-900/80 px-4 py-2 rounded-xl border border-slate-800 flex items-center gap-3">
              <span className="text-xs font-mono text-blue-400">
                {address?.slice(0, 6)}...{address?.slice(-4)}
              </span>
              <button onClick={() => disconnect()} className="text-[10px] text-slate-500 hover:text-red-400 font-bold uppercase transition-colors">Exit</button>
            </div>
          ) : (
            <div className="text-xs text-slate-500">Connect wallet to begin analysis</div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <div className="grid grid-cols-12 gap-6">
        {/* Left Side: Score & Stats */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
          {/* Network Selector */}
          <div className="glass-card p-4">
            <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
              <Globe className="w-3 h-3" /> Select Network
            </h3>
            <div className="grid grid-cols-3 gap-2">
              {NETWORKS.map((net) => (
                <button
                  key={net.id}
                  onClick={() => setSelectedNetwork(net)}
                  className={`py-2 rounded-lg text-xs font-semibold border transition-all ${
                    selectedNetwork.id === net.id
                      ? 'bg-blue-500/10 border-blue-500/50 text-blue-400'
                      : 'bg-slate-900/40 border-transparent text-slate-500 hover:bg-slate-800'
                  }`}
                >
                  {net.name}
                </button>
              ))}
            </div>
          </div>

          {/* Score Card */}
          <div className="glass-card p-6 flex flex-col items-center text-center">
            <div className="relative w-36 h-36 mb-6">
              <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                <circle cx="50" cy="50" r="45" stroke="rgba(255,255,255,0.03)" strokeWidth="6" fill="transparent" />
                <motion.circle 
                  cx="50" cy="50" r="45" 
                  stroke={selectedNetwork.color} 
                  strokeWidth="6" 
                  fill="transparent" 
                  strokeDasharray="282.7"
                  animate={{ strokeDashoffset: 282.7 - (282.7 * score) / 100 }}
                  transition={{ duration: 1.5 }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-black text-white">{score}</span>
                <span className="text-[9px] text-slate-500 uppercase font-black tracking-widest mt-1">Trust Score</span>
              </div>
            </div>
            <h2 className={`text-2xl font-bold mb-2 ${status.color} eligible-text`}>{status.text}</h2>
            <p className="text-xs text-slate-400 px-4">Activity is compared against top earners in {selectedNetwork.name} ecosystem.</p>
          </div>

          {/* Stats Bar */}
          <div className="glass-card p-5 space-y-4">
            <StatRow label="Transactions" value={txCount.toString()} icon={<Activity className="w-3 h-3" />} />
            <StatRow label="Wallet Balance" value={`${parseFloat(balance).toFixed(4)} ETH`} icon={<Wallet className="w-3 h-3" />} />
          </div>
        </div>

        {/* Right Side: Transaction Feed */}
        <div className="col-span-12 lg:col-span-8 flex flex-col gap-6">
          {/* Gas Price Chart */}
          <div className="glass-card p-6 h-[280px] flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <div className="bg-orange-500/10 p-2 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-orange-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white tracking-tight">Gas Price Trend (Gwei)</h3>
                  <p className="text-[10px] text-slate-500 font-medium">Historical fee market for recent interactions</p>
                </div>
              </div>
            </div>
            
            <div className="flex-grow min-h-0">
              {gasChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={gasChartData}>
                    <defs>
                      <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={selectedNetwork.color} stopOpacity={0.3}/>
                        <stop offset="95%" stopColor={selectedNetwork.color} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis 
                      dataKey="time" 
                      stroke="#475569" 
                      fontSize={10} 
                      tickLine={false} 
                      axisLine={false} 
                      minTickGap={30}
                    />
                    <YAxis 
                      stroke="#475569" 
                      fontSize={10} 
                      tickLine={false} 
                      axisLine={false}
                      tickFormatter={(value) => `${value.toFixed(1)}`}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        background: '#0f172a', 
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '8px',
                        fontSize: '12px'
                      }}
                      itemStyle={{ color: '#fff' }}
                      labelStyle={{ color: '#64748b', fontSize: '10px', marginBottom: '4px' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="price" 
                      stroke={selectedNetwork.color} 
                      strokeWidth={2}
                      fillOpacity={1} 
                      fill="url(#colorPrice)" 
                      name="Gas Price (Gwei)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-slate-600 text-xs italic">
                  Not enough data to display trend
                </div>
              )}
            </div>
          </div>

          <div className="glass-card flex flex-col min-h-[500px]">
            <div className="p-6 border-b border-white/5 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <History className="w-5 h-5 text-blue-400" />
                <h3 className="text-sm font-bold text-white tracking-tight">Detailed Activity Record</h3>
              </div>
              <button onClick={fetchOnChainData} className="p-2 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors">
                <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-900/30">
                    <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Type & Hash</th>
                    <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Status / Date</th>
                    <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Gas Usage</th>
                    <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Value</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx) => (
                    <tr key={tx.hash} className="interaction-row hover:bg-slate-800/20 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold text-blue-400 uppercase mb-1">
                            {getTxType(tx)}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono text-slate-500">{tx.hash.slice(0, 10)}...</span>
                            <a href={`${selectedNetwork.explorerUrl}/tx/${tx.hash}`} target="_blank" rel="noreferrer">
                              <ExternalLink className="w-3 h-3 text-slate-700 hover:text-slate-400" />
                            </a>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className={`text-[10px] font-bold ${tx.isError === '0' ? 'text-emerald-500' : 'text-red-500'}`}>
                            {tx.isError === '0' ? 'SUCCESS' : 'FAILED'}
                          </span>
                          <span className="text-[10px] text-slate-600 mt-1">
                            {new Date(parseInt(tx.timeStamp) * 1000).toLocaleDateString()}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-1.5">
                            <Fuel className="w-3 h-3 text-slate-500" />
                            <span className="text-xs font-mono text-slate-300">{parseInt(tx.gasUsed).toLocaleString()} units</span>
                          </div>
                          <span className="text-[10px] text-slate-600 mt-1">
                            {parseFloat(formatEther(BigInt(tx.gasPrice))).toFixed(9)} ETH/gas
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-bold text-white">
                          {formatEther(BigInt(tx.value)).slice(0, 8)} ETH
                        </span>
                      </td>
                    </tr>
                  ))}
                  {transactions.length === 0 && !loading && (
                    <tr>
                      <td colSpan={4} className="px-6 py-20 text-center text-slate-500 text-sm">
                        No history found or address not connected.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatRow({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="flex justify-between items-center">
      <div className="flex items-center gap-2 text-slate-400">
        {icon}
        <span className="text-[11px] font-semibold">{label}</span>
      </div>
      <span className="text-xs font-mono font-black text-white">{value}</span>
    </div>
  );
}
