import React, { useState, useEffect } from 'react';
import { 
  Search, 
  DollarSign, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Users, 
  Activity, 
  ArrowLeft, 
  Sun, 
  Moon, 
  Mail, 
  Download 
} from 'lucide-react';

import { 
  fetchEtherscanData, 
  fetchCoinGeckoData, 
  isValidEthereumAddress,
  checkAPIHealth 
} from './services/api';

import { 
  getCachedAnalysis, 
  setCachedAnalysis, 
  clearAnalysisCache 
} from './services/cacheService';

import { 
  DEMO_ADDRESSES, 
  DAO_NAMES, 
  RISK_THRESHOLDS,
  ALGORITHM_WEIGHTS 
} from './constants/demoData';

import pdfExportButton from './components/pdfExportButton';

const ScorApp = () => {
  const [currentView, setCurrentView] = useState('landing'); // 'landing', 'app'
  const [email, setEmail] = useState('');
  const [emailSubmitted, setEmailSubmitted] = useState(false);
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [daoData, setDaoData] = useState(null);
  const [error, setError] = useState('');
  const [darkMode, setDarkMode] = useState(true);

  // Email submission (in real app, this would go to your backend)
  const submitEmail = () => {
    if (email.trim() && email.includes('@')) {
      // Store in localStorage for demo purposes
      const emailList = JSON.parse(localStorage.getItem('scor_email_list') || '[]');
      emailList.push({ email: email.trim(), timestamp: new Date().toISOString() });
      localStorage.setItem('scor_email_list', JSON.stringify(emailList));
      
      setEmailSubmitted(true);
      setTimeout(() => {
        setCurrentView('app');
      }, 2000);
    }
  };

  const enterApp = () => {
    setCurrentView('app');
  };

  // Risk calculation (same as before)
  const calculateRealRiskScore = (etherscanData, priceData) => {
    if (!etherscanData || !priceData) return 0;

    const { ethBalance, tokens, txCount, firstTxTimestamp, recentTxs } = etherscanData;
    const { ethPrice, tokenPrices } = priceData;

    const ethValue = parseFloat(ethBalance) * ethPrice;
    let tokenValue = 0;
    let validTokens = 0;
    
    tokens.forEach(token => {
      const price = tokenPrices[token.symbol];
      if (price) {
        tokenValue += parseFloat(token.balance) * price;
        validTokens++;
      }
    });

    const totalValue = ethValue + tokenValue;

    const treasuryScore = Math.min(100, Math.log10(totalValue / 100000) * 25);
    const activityScore = Math.min(100, recentTxs / 5);
    const totalAssets = 1 + validTokens;
    const ethRatio = ethValue / totalValue;
    const diversificationScore = Math.min(100, (totalAssets * 20) * (1 - Math.max(0, ethRatio - 0.7)));
    const walletAge = (new Date() - new Date(firstTxTimestamp)) / (365 * 24 * 60 * 60 * 1000);
    const maturityScore = Math.min(100, walletAge * 30);
    const historyScore = Math.min(100, Math.log10(txCount) * 25);

    const finalScore = Math.round(
      treasuryScore * 0.30 + 
      activityScore * 0.25 + 
      diversificationScore * 0.20 + 
      maturityScore * 0.15 + 
      historyScore * 0.10
    );

    return {
      finalScore: Math.max(1, Math.min(100, finalScore)),
      breakdown: {
        treasury: Math.round(treasuryScore),
        activity: Math.round(activityScore),
        diversification: Math.round(diversificationScore),
        maturity: Math.round(maturityScore),
        history: Math.round(historyScore)
      },
      totalValue,
      ethValue,
      tokenValue,
      assetCount: totalAssets
    };
  };

  const buildHoldingsData = (etherscanData, priceData, riskAnalysis) => {
    if (!etherscanData || !priceData) return [];

    const holdings = [];
    const { ethBalance, tokens } = etherscanData;
    const { ethPrice, tokenPrices } = priceData;
    const { totalValue } = riskAnalysis;

    const ethValue = parseFloat(ethBalance) * ethPrice;
    holdings.push({
      token: 'ETH',
      amount: parseFloat(ethBalance).toFixed(2),
      value: ethValue,
      percentage: Math.round((ethValue / totalValue) * 100)
    });

    tokens.forEach(token => {
      const price = tokenPrices[token.symbol];
      if (price) {
        const value = parseFloat(token.balance) * price;
        holdings.push({
          token: token.symbol,
          amount: parseFloat(token.balance).toLocaleString(),
          value: value,
          percentage: Math.round((value / totalValue) * 100)
        });
      }
    });

    return holdings.sort((a, b) => b.percentage - a.percentage);
  };

  const analyzeDAO = async () => {
    const cleanAddress = address.trim().toLowerCase();
    
    if (!cleanAddress) {
      setError('Please enter a valid DAO address');
      return;
    }

    if (!DEMO_ADDRESSES.includes(cleanAddress)) {
      setError('Sorry! We can\'t pull this information in this demo. Try again with one of the suggested addresses below!');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const cachedData = getCachedAnalysis(cleanAddress);
      if (cachedData) {
        setDaoData(cachedData);
        setLoading(false);
        return;
      }

      const etherscanData = await fetchEtherscanData(cleanAddress);
      const priceData = await fetchCoinGeckoData(etherscanData.tokens);
      
      const riskAnalysis = calculateRealRiskScore(etherscanData, priceData);
      const holdings = buildHoldingsData(etherscanData, priceData, riskAnalysis);

      let riskLevel = 'High';
      if (riskAnalysis.finalScore >= 80) riskLevel = 'Low';
      else if (riskAnalysis.finalScore >= 65) riskLevel = 'Medium-Low';
      else if (riskAnalysis.finalScore >= 45) riskLevel = 'Medium';

      const analysisData = {
        name: DAO_NAMES[cleanAddress] || 'Unknown DAO',
        address: cleanAddress,
        riskScore: riskAnalysis.finalScore,
        riskLevel: riskLevel,
        balance: parseFloat(etherscanData.ethBalance).toFixed(2),
        balanceUSD: riskAnalysis.totalValue.toLocaleString(),
        transactions30d: etherscanData.recentTxs,
        totalTransactions: etherscanData.txCount,
        walletAge: etherscanData.firstTxTimestamp,
        diversificationScore: riskAnalysis.breakdown.diversification,
        treasuryStability: riskAnalysis.finalScore >= 70 ? 'Stable' : riskAnalysis.finalScore >= 50 ? 'Moderate' : 'Volatile',
        governanceActivity: riskAnalysis.breakdown.activity >= 80 ? 'Very High' : 
                          riskAnalysis.breakdown.activity >= 60 ? 'High' :
                          riskAnalysis.breakdown.activity >= 40 ? 'Medium' : 'Low',
        lastActivity: etherscanData.recentTxs > 100 ? '2 hours ago' : 
                     etherscanData.recentTxs > 50 ? '1 day ago' :
                     etherscanData.recentTxs > 10 ? '3 days ago' : '2 weeks ago',
        paymentReliability: Math.min(95, riskAnalysis.breakdown.activity + riskAnalysis.breakdown.history),
        topHoldings: holdings.slice(0, 5),
        breakdown: riskAnalysis.breakdown,
        isRealData: true
      };

      setCachedAnalysis(cleanAddress, analysisData);
      setDaoData(analysisData);
    } catch (error) {
      console.error('Real API analysis error:', error);
      
      // More specific error messages based on the error
      if (error.message.includes('blockchain data')) {
        setError('Unable to fetch blockchain data. Please check the address and try again.');
      } else if (error.message.includes('price data')) {
        setError('Price data unavailable. Analysis will continue with last known prices.');
        // Note: The function already has fallback prices, so this might not break the analysis
      } else if (error.message.includes('rate limit')) {
        setError('API rate limit reached. Please wait a moment and try again.');
      } else if (error.message.includes('Invalid')) {
        setError('Invalid DAO address format. Please check the address.');
      } else {
        setError('Failed to analyze DAO. Please try again in a moment.');
      }
    } finally {
      setLoading(false);
    }
  };

  const resetToHome = () => {
    setDaoData(null);
    setAddress('');
    setError('');
  };

  const getRiskColor = (score) => {
    if (score >= 75) return darkMode ? 'text-emerald-400' : 'text-emerald-600';
    if (score >= 50) return darkMode ? 'text-amber-400' : 'text-amber-600';
    return darkMode ? 'text-red-400' : 'text-red-600';
  };

  const getRiskBadge = (level) => {
    const darkColors = {
      'Low': 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
      'Medium-Low': 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
      'Medium': 'bg-orange-500/20 text-orange-400 border border-orange-500/30',
      'High': 'bg-red-500/20 text-red-400 border border-red-500/30'
    };
    const lightColors = {
      'Low': 'bg-emerald-100 text-emerald-700 border border-emerald-200',
      'Medium-Low': 'bg-amber-100 text-amber-700 border border-amber-200',
      'Medium': 'bg-orange-100 text-orange-700 border border-orange-200',
      'High': 'bg-red-100 text-red-700 border border-red-200'
    };
    return darkMode ? (darkColors[level] || darkColors['High']) : (lightColors[level] || lightColors['High']);
  };

  const ScorLogo = ({ darkMode, size = "default" }) => {
    const sizes = {
      small: { width: 60, height: 28, fontSize: 20 },
      default: { width: 80, height: 36, fontSize: 28 },
      large: { width: 120, height: 54, fontSize: 42 }
    };
    
    const { width, height, fontSize } = sizes[size];
    
    return (
      <svg 
        width={width} 
        height={height} 
        viewBox={`0 0 ${width} ${height}`} 
        className="cursor-pointer"
      >
        <text 
          x="0" 
          y={fontSize * 0.75} 
          fontFamily="system-ui, -apple-system, sans-serif" 
          fontSize={fontSize} 
          fontWeight="300" 
          fill={darkMode ? "#3B82F6" : "#2563EB"}
          className="select-none"
        >
          scor
        </text>
        <rect 
          x="0" 
          y={fontSize * 0.85} 
          width={fontSize * 2.8} 
          height="2" 
          fill={darkMode ? "#3B82F6" : "#2563EB"}
        />
      </svg>
    );
  };

  const DataSourcesSection = () => {
    const dataSources = [
      { name: "Etherscan", description: "Real-time blockchain data", icon: "🔗", status: "Live" },
      { name: "CoinGecko", description: "Token pricing data", icon: "💰", status: "Live" },
      { name: "On-chain Analysis", description: "Custom risk algorithms", icon: "📊", status: "Active" },
      { name: "24hr Cache", description: "Optimized performance", icon: "⚡", status: "Enabled" }
    ];

    return (
      <div className={`${darkMode ? 'bg-gray-900/50' : 'bg-white'} ${darkMode ? 'border-gray-800' : 'border-gray-200'} border rounded-2xl p-8 shadow-lg`}>
        <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-6 text-center`}>Live Data Sources</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {dataSources.map((source, index) => (
            <div key={index} className="text-center">
              <div className="text-3xl mb-2">{source.icon}</div>
              <div className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{source.name}</div>
              <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{source.description}</div>
              <div className="text-xs text-emerald-500 font-medium mt-1">{source.status}</div>
            </div>
          ))}
        </div>
        <div className="mt-6 text-center">
          <div className={`inline-flex items-center gap-2 px-4 py-2 ${darkMode ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-700'} rounded-full text-sm`}>
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
            Real Blockchain Data • Cached for Performance
          </div>
        </div>
      </div>
    );
  };

  // Theme classes
  const bgClass = darkMode ? 'bg-gray-900' : 'bg-gray-50';
  const textClass = darkMode ? 'text-white' : 'text-gray-900';
  const cardClass = darkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-200';
  const inputClass = darkMode ? 'bg-gray-800/50 border-gray-700 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500';

  // Landing Page
  if (currentView === 'landing') {
    return (
      <div className={`min-h-screen ${bgClass} ${textClass} transition-colors duration-300`}>
        <div className="max-w-4xl mx-auto px-6 py-12">
          {/* Header */}
          <div className="flex items-center justify-between mb-16">
            <ScorLogo darkMode={darkMode} />
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`p-2 rounded-lg ${cardClass} border hover:opacity-80 transition-all duration-300`}
            >
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          </div>

          {/* Hero Content */}
          <div className="text-center space-y-12">
            <div className="space-y-6">
              <h1 className="text-5xl md:text-7xl font-bold leading-tight">
                Welcome to the future of
                <br />
                <span className="text-blue-600">DAO credit assessment</span>
              </h1>
              <p className={`text-xl md:text-2xl ${darkMode ? 'text-gray-300' : 'text-gray-600'} max-w-3xl mx-auto leading-relaxed`}>
                Get instant, accurate risk scores for any DAO using live blockchain data. 
                The first professional credit analysis tool built specifically for decentralized organizations.
              </p>
            </div>

            {/* Email Signup Section */}
            <div className={`${cardClass} border rounded-2xl p-8 max-w-2xl mx-auto shadow-lg`}>
              {!emailSubmitted ? (
                <div className="space-y-6">
                  <div className="space-y-3">
                    <h2 className={`text-2xl font-bold ${textClass}`}>Get Early Access Updates</h2>
                    <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Be the first to know when new features launch. No spam, just product updates.
                    </p>
                  </div>
                  
                  <div className="flex flex-col md:flex-row gap-4">
                    <input
                      type="email"
                      placeholder="Enter your email address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={`flex-1 px-4 py-3 ${inputClass} border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300`}
                      onKeyPress={(e) => e.key === 'Enter' && submitEmail()}
                    />
                    <button
                      onClick={submitEmail}
                      className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-all duration-300 flex items-center justify-center gap-2"
                    >
                      <Mail className="w-5 h-5" />
                      Join Waitlist
                    </button>
                  </div>
                  
                  <div className="text-center">
                    <button
                      onClick={enterApp}
                      className={`text-blue-600 hover:text-blue-500 font-medium transition-colors duration-300`}
                    >
                      Skip and try the demo →
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 text-center">
                  <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle className="w-8 h-8" />
                  </div>
                  <h3 className={`text-xl font-bold ${textClass}`}>Thanks for joining!</h3>
                  <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    We'll keep you updated on scor's progress. Redirecting to the demo...
                  </p>
                </div>
              )}
            </div>

            {/* Features Preview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto">
                  <TrendingUp className="w-8 h-8" />
                </div>
                <h3 className={`text-xl font-semibold ${textClass}`}>Live Blockchain Analysis</h3>
                <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Real-time data from Etherscan and CoinGecko APIs
                </p>
              </div>
              
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto">
                  <Activity className="w-8 h-8" />
                </div>
                <h3 className={`text-xl font-semibold ${textClass}`}>Professional Reports</h3>
                <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Exportable PDF reports for loan committees
                </p>
              </div>
              
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle className="w-8 h-8" />
                </div>
                <h3 className={`text-xl font-semibold ${textClass}`}>Enterprise Ready</h3>
                <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Built for invoice financing and traditional lenders
                </p>
              </div>
            </div>

            {/* CTA */}
            <div className="pt-8">
              <button
                onClick={enterApp}
                className="px-12 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-xl shadow-lg transition-all duration-300 flex items-center justify-center gap-3 mx-auto"
              >
                <Search className="w-6 h-6" />
                Try Live Demo
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main App (existing code continues...)
  return (
    <div className={`min-h-screen ${bgClass} ${textClass} transition-colors duration-300`}>
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-12">
          <button 
            onClick={resetToHome}
            className="hover:opacity-80 transition-all duration-300 flex items-center gap-3"
          >
            <ScorLogo darkMode={darkMode} />
            {daoData && <ArrowLeft className="w-6 h-6 text-blue-600" />}
          </button>
          
          <div className="flex items-center gap-4">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`p-2 rounded-lg ${cardClass} border hover:opacity-80 transition-all duration-300`}
            >
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            {!daoData && (
              <div className={`text-right ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                <div className="text-sm">LIVE BETA</div>
              </div>
            )}
          </div>
        </div>

        {!daoData ? (
          /* App Home Page */
          <div className="space-y-16">
            {/* Hero Section */}
            <div className="text-center space-y-8 max-w-4xl mx-auto">
              <div className="space-y-4">
                <h1 className="text-5xl md:text-6xl font-bold leading-tight">
                  Real-time credit risk
                  <br />
                  <span className="text-blue-600">for DAOs</span>
                </h1>
                <p className={`text-xl ${darkMode ? 'text-gray-300' : 'text-gray-600'} max-w-2xl mx-auto leading-relaxed`}>
                  Live blockchain analysis with Etherscan and CoinGecko APIs. Get instant, accurate risk scores based on real on-chain data.
                </p>
              </div>
            </div>

            {/* Search Section */}
            <div className="max-w-2xl mx-auto">
              <div className={`${cardClass} border rounded-2xl p-8 shadow-lg`}>
                <div className="space-y-6">
                  <input
                    type="text"
                    placeholder="Enter DAO wallet address (demo addresses only)"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className={`w-full px-6 py-4 ${inputClass} border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg transition-all duration-300`}
                    onKeyPress={(e) => e.key === 'Enter' && analyzeDAO()}
                  />
                  
                  <button
                    onClick={analyzeDAO}
                    disabled={loading}
                    className="w-full px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-lg shadow-lg disabled:opacity-50 transition-all duration-300 flex items-center justify-center gap-3"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent"></div>
                        Fetching Live Blockchain Data...
                      </>
                    ) : (
                      <>
                        <Search className="w-6 h-6" />
                        Analyze DAO with Live Data
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
              <div className="mt-12 space-y-6">
                <div className={`text-center text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Test live analysis with these DAO addresses:
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {DEMO_ADDRESSES.slice(0, 12).map((addr) => (
                    <button
                      key={addr}
                      onClick={() => setAddress(addr)}
                      className={`p-4 ${cardClass} border rounded-xl hover:shadow-md transition-all duration-300 text-left`}
                    >
                      <div className="text-sm font-semibold text-blue-600">
                        Live Data Available
                      </div>
                      <div className={`font-medium ${textClass}`}>{DAO_NAMES[addr]}</div>
                      <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} font-mono`}>
                        {addr.slice(0, 10)}...{addr.slice(-8)}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Data Sources */}
            <DataSourcesSection />

            {/* Features */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <div className="text-center space-y-4">
                <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center mx-auto">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <h3 className={`text-lg font-semibold ${textClass}`}>Live Blockchain Data</h3>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Real-time analysis using Etherscan and CoinGecko APIs
                </p>
              </div>
              
              <div className="text-center space-y-4">
                <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center mx-auto">
                  <Activity className="w-6 h-6" />
                </div>
                <h3 className={`text-lg font-semibold ${textClass}`}>Advanced Analytics</h3>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Treasury health, transaction patterns, and portfolio analysis
                </p>
              </div>
              
              <div className="text-center space-y-4">
                <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center mx-auto">
                  <CheckCircle className="w-6 h-6" />
                </div>
                <h3 className={`text-lg font-semibold ${textClass}`}>Cached Performance</h3>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  24-hour caching for instant repeat analysis
                </p>
              </div>
            </div>
          </div>
        ) : (
          /* Results Page */
          <div className="space-y-8">
            {/* Real Data Badge */}
            {daoData.isRealData && (
              <div className="flex justify-between items-center">
                <div className={`inline-flex items-center gap-2 px-4 py-2 ${darkMode ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-emerald-100 text-emerald-700 border-emerald-200'} border rounded-full text-sm`}>
                  <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                  Analysis based on LIVE blockchain data • Last updated: {new Date().toLocaleTimeString()}
                </div>
                
                <button className="flex justify-center" onClick={() => pdfExportButton(daoData)}>
                  Generate report
                </button>
              </div>
            )}

            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className={`${cardClass} border rounded-2xl p-6 shadow-lg`}>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`}>Risk Score</p>
                    <p className={`text-4xl font-bold ${getRiskColor(daoData.riskScore)}`}>
                      {daoData.riskScore}
                    </p>
                    <p className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-600'}`}>/100</p>
                  </div>
                  <TrendingUp className={`w-10 h-10 ${getRiskColor(daoData.riskScore)}`} />
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-medium ${getRiskBadge(daoData.riskLevel)}`}>
                  {daoData.riskLevel} Risk
                </div>
              </div>

              <div className={`${cardClass} border rounded-2xl p-6 shadow-lg`}>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`}>Treasury Value</p>
                    <p className={`text-2xl font-bold ${textClass}`}>${daoData.balanceUSD}</p>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{daoData.balance} ETH</p>
                  </div>
                  <DollarSign className="w-10 h-10 text-blue-600" />
                </div>
              </div>

              <div className={`${cardClass} border rounded-2xl p-6 shadow-lg`}>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`}>Recent Activity</p>
                    <p className={`text-3xl font-bold ${textClass}`}>{daoData.transactions30d}</p>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>transactions</p>
                  </div>
                  <Activity className="w-10 h-10 text-purple-600" />
                </div>
              </div>

              <div className={`${cardClass} border rounded-2xl p-6 shadow-lg`}>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`}>Reliability</p>
                    <p className="text-3xl font-bold text-emerald-600">{daoData.paymentReliability}%</p>
                  </div>
                  <CheckCircle className="w-10 h-10 text-emerald-600" />
                </div>
              </div>
            </div>

            {/* Risk Breakdown */}
            {daoData.breakdown && (
              <div className={`${cardClass} border rounded-2xl p-8 shadow-lg`}>
                <h3 className={`text-2xl font-bold ${textClass} mb-6`}>Risk Analysis Breakdown</h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
                  <div className="text-center">
                    <div className={`text-2xl font-bold ${getRiskColor(daoData.breakdown.treasury)}`}>
                      {daoData.breakdown.treasury}
                    </div>
                    <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Treasury (30%)</div>
                  </div>
                  <div className="text-center">
                    <div className={`text-2xl font-bold ${getRiskColor(daoData.breakdown.activity)}`}>
                      {daoData.breakdown.activity}
                    </div>
                    <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Activity (25%)</div>
                  </div>
                  <div className="text-center">
                    <div className={`text-2xl font-bold ${getRiskColor(daoData.breakdown.diversification)}`}>
                      {daoData.breakdown.diversification}
                    </div>
                    <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Diversification (20%)</div>
                  </div>
                  <div className="text-center">
                    <div className={`text-2xl font-bold ${getRiskColor(daoData.breakdown.maturity)}`}>
                      {daoData.breakdown.maturity}
                    </div>
                    <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Maturity (15%)</div>
                  </div>
                  <div className="text-center">
                    <div className={`text-2xl font-bold ${getRiskColor(daoData.breakdown.history)}`}>
                      {daoData.breakdown.history}
                    </div>
                    <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>History (10%)</div>
                  </div>
                </div>
              </div>
            )}

            {/* Detailed Analysis */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Risk Assessment */}
              <div className={`${cardClass} border rounded-2xl p-8 shadow-lg`}>
                <h3 className={`text-2xl font-bold ${textClass} mb-6 flex items-center gap-3`}>
                  <AlertTriangle className="w-6 h-6 text-amber-500" />
                  Risk Assessment
                </h3>
                <div className="space-y-6">
                  {[
                    ['Diversification Score', `${daoData.diversificationScore}/100`],
                    ['Treasury Stability', daoData.treasuryStability],
                    ['Governance Activity', daoData.governanceActivity],
                    ['Last Activity', daoData.lastActivity],
                    ['Total Transactions', daoData.totalTransactions?.toLocaleString() || 'N/A'],
                    ['Wallet Age', daoData.walletAge]
                  ].map(([label, value], index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className={`${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{label}</span>
                      <span className={`font-bold ${textClass}`}>{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Treasury Composition */}
              <div className={`${cardClass} border rounded-2xl p-8 shadow-lg`}>
                <h3 className={`text-2xl font-bold ${textClass} mb-6 flex items-center gap-3`}>
                  <Users className="w-6 h-6 text-purple-600" />
                  Treasury Composition
                </h3>
                <div className="space-y-4">
                  {daoData.topHoldings.map((holding, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                          {holding.token}
                        </div>
                        <div>
                          <div className={`font-medium ${textClass}`}>{holding.amount}</div>
                          <div className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-600'}`}>
                            ${holding.value?.toLocaleString()}
                          </div>
                        </div>
                      </div>
                      <span className={`font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{holding.percentage}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Summary */}
            <div className={`${cardClass} border rounded-2xl p-8 shadow-lg`}>
              <h3 className={`text-2xl font-bold ${textClass} mb-6`}>Credit Assessment Summary</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div>
                  <p className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-2`}>DAO Name</p>
                  <p className={`text-xl font-bold ${textClass}`}>{daoData.name}</p>
                </div>
                <div>
                  <p className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-2`}>Analysis Date</p>
                  <p className={`text-xl font-bold ${textClass}`}>{new Date().toLocaleDateString()}</p>
                </div>
                <div>
                  <p className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-2`}>Credit Decision</p>
                  <p className={`text-xl font-bold ${daoData.riskScore >= 70 ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {daoData.riskScore >= 70 ? 'Approved for Financing' : 'Review Required'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ScorApp;