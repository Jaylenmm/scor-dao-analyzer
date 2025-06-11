import React, { useState, useEffect } from 'react';
import { Search, DollarSign, TrendingUp, AlertTriangle, CheckCircle, Clock, Users, Activity, ArrowLeft } from 'lucide-react';

function App() {
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [daoData, setDaoData] = useState(null);
  const [error, setError] = useState('');

  // Mock data for demonstration - in real app, this would come from APIs
  const mockDAOData = {
    '0x2b591e99afe9f32eaa6214f7b7629768c40eeb39': {
      name: 'HexTrust DAO',
      balance: '1,247.8',
      balanceUSD: '2,847,234',
      riskScore: 78,
      riskLevel: 'Medium-Low',
      transactions30d: 234,
      avgTxValue: '12.4',
      diversificationScore: 82,
      governanceActivity: 'High',
      lastActivity: '2 hours ago',
      paymentReliability: 89,
      treasuryStability: 'Stable',
      topHoldings: [
        { token: 'ETH', amount: '847.2', percentage: 68 },
        { token: 'USDC', amount: '284,723', percentage: 22 },
        { token: 'DAI', amount: '98,456', percentage: 10 }
      ]
    },
    '0xa0b86a33e6411cbfc773c6e1f5e4c5c6ee9fc91c': {
      name: 'AlphaGrowth DAO',
      balance: '5,892.3',
      balanceUSD: '13,456,789',
      riskScore: 92,
      riskLevel: 'Low',
      transactions30d: 567,
      avgTxValue: '45.7',
      diversificationScore: 94,
      governanceActivity: 'Very High',
      lastActivity: '18 minutes ago',
      paymentReliability: 97,
      treasuryStability: 'Very Stable',
      topHoldings: [
        { token: 'ETH', amount: '2,347.1', percentage: 40 },
        { token: 'USDC', amount: '4,567,890', percentage: 34 },
        { token: 'WBTC', amount: '89.4', percentage: 26 }
      ]
    },
    '0xc3d688b66703497daa19211eedff47f25384cdc3': {
      name: 'StartupFund DAO',
      balance: '234.7',
      balanceUSD: '536,421',
      riskScore: 34,
      riskLevel: 'High',
      transactions30d: 12,
      avgTxValue: '2.3',
      diversificationScore: 23,
      governanceActivity: 'Low',
      lastActivity: '3 days ago',
      paymentReliability: 45,
      treasuryStability: 'Volatile',
      topHoldings: [
        { token: 'ETH', amount: '156.2', percentage: 67 },
        { token: 'USDT', amount: '67,890', percentage: 21 },
        { token: 'LINK', amount: '2,340', percentage: 12 }
      ]
    },
    '0xd4e5f6a789b012c34567890123456789abcdef01': {
      name: 'TechInnovate DAO',
      balance: '3,456.9',
      balanceUSD: '7,890,123',
      riskScore: 67,
      riskLevel: 'Medium',
      transactions30d: 189,
      avgTxValue: '18.7',
      diversificationScore: 71,
      governanceActivity: 'Medium',
      lastActivity: '6 hours ago',
      paymentReliability: 76,
      treasuryStability: 'Moderately Stable',
      topHoldings: [
        { token: 'ETH', amount: '1,890.4', percentage: 55 },
        { token: 'USDC', amount: '1,234,567', percentage: 31 },
        { token: 'UNI', amount: '45,678', percentage: 14 }
      ]
    },
    '0xe5f6a789b012c34567890123456789abcdef012': {
      name: 'DeFiProtocol DAO',
      balance: '8,934.2',
      balanceUSD: '20,401,567',
      riskScore: 88,
      riskLevel: 'Low',
      transactions30d: 823,
      avgTxValue: '67.3',
      diversificationScore: 89,
      governanceActivity: 'Very High',
      lastActivity: '32 minutes ago',
      paymentReliability: 94,
      treasuryStability: 'Very Stable',
      topHoldings: [
        { token: 'ETH', amount: '3,567.8', percentage: 40 },
        { token: 'USDC', amount: '7,845,123', percentage: 38 },
        { token: 'AAVE', amount: '89,456', percentage: 22 }
      ]
    },
    '0xf6a789b012c34567890123456789abcdef0123': {
      name: 'CreativeDAO',
      balance: '89.4',
      balanceUSD: '204,123',
      riskScore: 28,
      riskLevel: 'High',
      transactions30d: 3,
      avgTxValue: '0.8',
      diversificationScore: 15,
      governanceActivity: 'Very Low',
      lastActivity: '2 weeks ago',
      paymentReliability: 23,
      treasuryStability: 'Highly Volatile',
      topHoldings: [
        { token: 'ETH', amount: '67.8', percentage: 76 },
        { token: 'USDC', amount: '18,456', percentage: 18 },
        { token: 'ENS', amount: '1,234', percentage: 6 }
      ]
    }
  };

  const calculateRiskScore = (data) => {
    // Treasury Health (30% weight)
    const treasuryScore = Math.min(100, Math.log10(parseFloat(data.balanceUSD.replace(/,/g, '')) / 100000) * 25);
    
    // Activity Score (25% weight)
    const activityScore = Math.min(100, data.transactions30d / 5);
    
    // Diversification (20% weight)
    const diversificationScore = data.diversificationScore;
    
    // Payment History (15% weight)
    const paymentScore = data.paymentReliability;
    
    // Governance (10% weight)
    const governanceMap = { 'Very High': 100, 'High': 80, 'Medium': 60, 'Low': 40, 'Very Low': 20 };
    const governanceScore = governanceMap[data.governanceActivity] || 20;
    
    // Weighted calculation
    const finalScore = Math.round(
      treasuryScore * 0.30 + 
      activityScore * 0.25 + 
      diversificationScore * 0.20 + 
      paymentScore * 0.15 + 
      governanceScore * 0.10
    );
    
    return Math.max(1, Math.min(100, finalScore));
  };

  const analyzDAO = async () => {
    if (!address.trim()) {
      setError('Please enter a valid DAO address');
      return;
    }

    setLoading(true);
    setError('');
    
    // Simulate API call delay
    setTimeout(() => {
      let mockData = mockDAOData[address.toLowerCase()] || {
        name: 'Unknown DAO',
        balance: '0',
        balanceUSD: '0',
        riskScore: 45,
        riskLevel: 'High',
        transactions30d: 0,
        avgTxValue: '0',
        diversificationScore: 0,
        governanceActivity: 'Low',
        lastActivity: 'Unknown',
        paymentReliability: 0,
        treasuryStability: 'Unknown',
        topHoldings: []
      };
      
      // Recalculate risk score for consistency
      if (mockData.balanceUSD !== '0') {
        mockData.riskScore = calculateRiskScore(mockData);
        
        // Update risk level based on new score
        if (mockData.riskScore >= 80) mockData.riskLevel = 'Low';
        else if (mockData.riskScore >= 65) mockData.riskLevel = 'Medium-Low';
        else if (mockData.riskScore >= 45) mockData.riskLevel = 'Medium';
        else mockData.riskLevel = 'High';
      }
      
      setDaoData(mockData);
      setLoading(false);
    }, 2000);
  };

  const resetToHome = () => {
    setDaoData(null);
    setAddress('');
    setError('');
  };

  const getRiskColor = (score) => {
    if (score >= 75) return 'text-emerald-400';
    if (score >= 50) return 'text-amber-400';
    return 'text-red-400';
  };

  const getRiskBadge = (level) => {
    const colors = {
      'Low': 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      'Medium-Low': 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      'Medium': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
      'High': 'bg-red-500/20 text-red-400 border-red-500/30'
    };
    return colors[level] || colors['High'];
  };

  const getRiskGradient = (score) => {
    if (score >= 75) return 'from-emerald-500/20 to-emerald-600/20';
    if (score >= 50) return 'from-amber-500/20 to-amber-600/20';
    return 'from-red-500/20 to-red-600/20';
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Animated background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-cyan-500/5"></div>
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button 
            onClick={resetToHome}
            className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent hover:from-blue-300 hover:to-purple-300 transition-all duration-300 flex items-center gap-2"
          >
            <span className="text-blue-400">scor</span>
            {daoData && <ArrowLeft className="w-5 h-5 text-blue-400 ml-2" />}
          </button>
          
          {!daoData && (
            <div className="text-right">
              <div className="text-sm text-gray-400">BETA</div>
              <div className="text-xs text-gray-500">v0.1.0</div>
            </div>
          )}
        </div>

        {!daoData ? (
          /* Home Page */
          <div className="text-center space-y-12">
            {/* Hero Section */}
            <div className="space-y-6 max-w-4xl mx-auto">
              <div className="space-y-4">
                <h1 className="text-6xl font-bold">
                  <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
                    Credit Risk
                  </span>
                </h1>
                <h1 className="text-6xl font-bold">
                  <span className="bg-gradient-to-r from-purple-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent">
                    Redefined
                  </span>
                </h1>
              </div>
              <p className="text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
                Assess DAO creditworthiness with real-time on-chain analytics. 
                Get instant risk scores that traditional credit agencies can't provide.
              </p>
            </div>

            {/* Search Section */}
            <div className="max-w-2xl mx-auto">
              <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-2xl p-8 shadow-2xl">
                <div className="space-y-6">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Enter DAO wallet address or ENS name"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full px-6 py-4 bg-gray-800/50 border border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400 text-lg backdrop-blur-sm"
                      onKeyPress={(e) => e.key === 'Enter' && analyzDAO()}
                    />
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/10 to-purple-500/10 pointer-events-none"></div>
                  </div>
                  
                  <button
                    onClick={analyzDAO}
                    disabled={loading}
                    className="w-full px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-xl font-semibold text-lg shadow-lg shadow-blue-500/25 disabled:opacity-50 transition-all duration-300 flex items-center justify-center gap-3"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent"></div>
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Search className="w-6 h-6" />
                        Analyze Risk
                      </>
                    )}
                  </button>
                </div>
                
                {error && (
                  <div className="mt-4 p-4 bg-red-500/20 border border-red-500/30 rounded-xl text-red-400">
                    {error}
                  </div>
                )}
              </div>

              {/* Demo Options */}
              <div className="mt-8 space-y-4">
                <div className="text-center text-sm text-gray-400 mb-4">Try analyzing these sample DAOs:</div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <button
                    onClick={() => setAddress('0xa0b86a33e6411cbfc773c6e1f5e4c5c6ee9fc91c')}
                    className="p-4 bg-gradient-to-r from-emerald-500/20 to-emerald-600/20 border border-emerald-500/30 rounded-xl hover:from-emerald-500/30 hover:to-emerald-600/30 transition-all duration-300 text-left"
                  >
                    <div className="text-emerald-400 font-semibold text-sm">Low Risk • Score: 92</div>
                    <div className="text-white font-medium">AlphaGrowth DAO</div>
                    <div className="text-gray-400 text-xs">$13.4M Treasury • Very Active</div>
                  </button>
                  
                  <button
                    onClick={() => setAddress('0x2b591e99afe9f32eaa6214f7b7629768c40eeb39')}
                    className="p-4 bg-gradient-to-r from-amber-500/20 to-amber-600/20 border border-amber-500/30 rounded-xl hover:from-amber-500/30 hover:to-amber-600/30 transition-all duration-300 text-left"
                  >
                    <div className="text-amber-400 font-semibold text-sm">Medium-Low Risk • Score: 78</div>
                    <div className="text-white font-medium">HexTrust DAO</div>
                    <div className="text-gray-400 text-xs">$2.8M Treasury • High Activity</div>
                  </button>
                  
                  <button
                    onClick={() => setAddress('0xd4e5f6a789b012c34567890123456789abcdef01')}
                    className="p-4 bg-gradient-to-r from-orange-500/20 to-orange-600/20 border border-orange-500/30 rounded-xl hover:from-orange-500/30 hover:to-orange-600/30 transition-all duration-300 text-left"
                  >
                    <div className="text-orange-400 font-semibold text-sm">Medium Risk • Score: 67</div>
                    <div className="text-white font-medium">TechInnovate DAO</div>
                    <div className="text-gray-400 text-xs">$7.9M Treasury • Medium Activity</div>
                  </button>
                  
                  <button
                    onClick={() => setAddress('0xe5f6a789b012c34567890123456789abcdef012')}
                    className="p-4 bg-gradient-to-r from-emerald-500/20 to-emerald-600/20 border border-emerald-500/30 rounded-xl hover:from-emerald-500/30 hover:to-emerald-600/30 transition-all duration-300 text-left"
                  >
                    <div className="text-emerald-400 font-semibold text-sm">Low Risk • Score: 88</div>
                    <div className="text-white font-medium">DeFiProtocol DAO</div>
                    <div className="text-gray-400 text-xs">$20.4M Treasury • Very Active</div>
                  </button>
                  
                  <button
                    onClick={() => setAddress('0xc3d688b66703497daa19211eedff47f25384cdc3')}
                    className="p-4 bg-gradient-to-r from-red-500/20 to-red-600/20 border border-red-500/30 rounded-xl hover:from-red-500/30 hover:to-red-600/30 transition-all duration-300 text-left"
                  >
                    <div className="text-red-400 font-semibold text-sm">High Risk • Score: 34</div>
                    <div className="text-white font-medium">StartupFund DAO</div>
                    <div className="text-gray-400 text-xs">$536K Treasury • Low Activity</div>
                  </button>
                  
                  <button
                    onClick={() => setAddress('0xf6a789b012c34567890123456789abcdef0123')}
                    className="p-4 bg-gradient-to-r from-red-500/20 to-red-600/20 border border-red-500/30 rounded-xl hover:from-red-500/30 hover:to-red-600/30 transition-all duration-300 text-left"
                  >
                    <div className="text-red-400 font-semibold text-sm">High Risk • Score: 28</div>
                    <div className="text-white font-medium">CreativeDAO</div>
                    <div className="text-gray-400 text-xs">$204K Treasury • Inactive</div>
                  </button>
                </div>
                
                <div className="text-center mt-6">
                  <div className="text-xs text-gray-500">
                    Or paste any Ethereum address to analyze a custom DAO
                  </div>
                </div>
              </div>
            </div>

            {/* Algorithm Explanation */}
            <div className="max-w-4xl mx-auto mb-12">
              <div className="bg-gray-900/30 backdrop-blur-sm border border-gray-800 rounded-xl p-8">
                <h2 className="text-2xl font-bold text-white mb-6 text-center">How We Score DAOs</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-400 mb-2">30%</div>
                    <div className="text-white font-semibold mb-1">Treasury Health</div>
                    <div className="text-sm text-gray-400">Size, stability, and asset composition</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-purple-400 mb-2">25%</div>
                    <div className="text-white font-semibold mb-1">Transaction Activity</div>
                    <div className="text-sm text-gray-400">Volume and frequency of operations</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-cyan-400 mb-2">20%</div>
                    <div className="text-white font-semibold mb-1">Diversification</div>
                    <div className="text-sm text-gray-400">Asset spread and risk distribution</div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-emerald-400 mb-2">15%</div>
                    <div className="text-white font-semibold mb-1">Payment History</div>
                    <div className="text-sm text-gray-400">Historical reliability and patterns</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-amber-400 mb-2">10%</div>
                    <div className="text-white font-semibold mb-1">Governance</div>
                    <div className="text-sm text-gray-400">Community engagement and decision-making</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              <div className="p-6 bg-gray-900/30 backdrop-blur-sm border border-gray-800 rounded-xl">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center mb-4">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Real-time Scoring</h3>
                <p className="text-gray-400 text-sm">Instant risk assessment based on live on-chain data</p>
              </div>
              
              <div className="p-6 bg-gray-900/30 backdrop-blur-sm border border-gray-800 rounded-xl">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-lg flex items-center justify-center mb-4">
                  <Activity className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Deep Analytics</h3>
                <p className="text-gray-400 text-sm">Treasury health, governance activity, and payment patterns</p>
              </div>
              
              <div className="p-6 bg-gray-900/30 backdrop-blur-sm border border-gray-800 rounded-xl">
                <div className="w-12 h-12 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg flex items-center justify-center mb-4">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Enterprise Ready</h3>
                <p className="text-gray-400 text-sm">API integration for existing loan management systems</p>
              </div>
            </div>
          </div>
        ) : (
          /* Results Page */
          <div className="space-y-8">
            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className={`bg-gradient-to-br ${getRiskGradient(daoData.riskScore)} backdrop-blur-xl border border-gray-800 rounded-2xl p-6 shadow-2xl`}>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm font-medium text-gray-400 mb-1">Risk Score</p>
                    <p className={`text-4xl font-bold ${getRiskColor(daoData.riskScore)}`}>
                      {daoData.riskScore}
                    </p>
                    <p className="text-gray-500 text-sm">/100</p>
                  </div>
                  <TrendingUp className={`w-10 h-10 ${getRiskColor(daoData.riskScore)}`} />
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-medium border ${getRiskBadge(daoData.riskLevel)}`}>
                  {daoData.riskLevel} Risk
                </div>
              </div>

              <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-2xl p-6 shadow-2xl">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm font-medium text-gray-400 mb-1">Treasury Balance</p>
                    <p className="text-3xl font-bold text-white">{daoData.balance}</p>
                    <p className="text-sm text-gray-400">ETH • ${daoData.balanceUSD}</p>
                  </div>
                  <DollarSign className="w-10 h-10 text-emerald-400" />
                </div>
              </div>

              <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-2xl p-6 shadow-2xl">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm font-medium text-gray-400 mb-1">30d Transactions</p>
                    <p className="text-3xl font-bold text-white">{daoData.transactions30d}</p>
                  </div>
                  <Activity className="w-10 h-10 text-blue-400" />
                </div>
              </div>

              <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-2xl p-6 shadow-2xl">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm font-medium text-gray-400 mb-1">Payment Reliability</p>
                    <p className="text-3xl font-bold text-emerald-400">{daoData.paymentReliability}%</p>
                  </div>
                  <CheckCircle className="w-10 h-10 text-emerald-400" />
                </div>
              </div>
            </div>

            {/* Detailed Analysis */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Risk Factors */}
              <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-2xl p-8 shadow-2xl">
                <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                  <AlertTriangle className="w-6 h-6 text-amber-400" />
                  Risk Assessment
                </h3>
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Diversification Score</span>
                    <span className="font-bold text-emerald-400">{daoData.diversificationScore}/100</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Treasury Stability</span>
                    <span className="font-bold text-emerald-400">{daoData.treasuryStability}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Governance Activity</span>
                    <span className="font-bold text-emerald-400">{daoData.governanceActivity}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Last Activity</span>
                    <span className="font-bold text-white">{daoData.lastActivity}</span>
                  </div>
                </div>
              </div>

              {/* Treasury Composition */}
              <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-2xl p-8 shadow-2xl">
                <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                  <Users className="w-6 h-6 text-purple-400" />
                  Treasury Composition
                </h3>
                <div className="space-y-4">
                  {daoData.topHoldings.map((holding, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-sm font-bold text-white">
                          {holding.token}
                        </div>
                        <div>
                          <div className="font-medium text-white">{holding.amount}</div>
                          <div className="text-xs text-gray-500">{holding.token}</div>
                        </div>
                      </div>
                      <span className="text-gray-300 font-medium">{holding.percentage}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* DAO Information */}
            <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-2xl p-8 shadow-2xl">
              <h3 className="text-2xl font-bold text-white mb-6">DAO Overview</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div>
                  <p className="text-sm font-medium text-gray-400 mb-2">DAO Name</p>
                  <p className="text-xl font-bold text-white">{daoData.name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-400 mb-2">Average Transaction Value</p>
                  <p className="text-xl font-bold text-white">{daoData.avgTxValue} ETH</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-400 mb-2">Credit Decision</p>
                  <p className={`text-xl font-bold ${daoData.riskScore >= 70 ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {daoData.riskScore >= 70 ? 'Approved for Financing' : 'Requires Further Review'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;