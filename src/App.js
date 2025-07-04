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

import { 
  calculateComprehensiveRiskScore, 
  determineRiskLevel,
  generateCreditDecision 
} from './utils/riskCalculator';

import { 
  buildFormattedHoldings,
  analyzePortfolioDiversification,
  analyzeTransactionActivity 
} from './utils/dataProcessing';

import PDFExportButton from './components/pdfExportButton';

import EmailSignup from './components/emailSignup';

const ScorApp = () => {
  const [currentView, setCurrentView] = useState('landing'); // 'landing', 'app'
  const [email, setEmail] = useState('');
  const [emailSubmitted, setEmailSubmitted] = useState(false);
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [daoData, setDaoData] = useState(null);
  const [error, setError] = useState('');
  const [darkMode, setDarkMode] = useState(true);

  // ADD THE STATE CHANGE MONITOR HERE 👇
  useEffect(() => {
    console.log('📋 === DAO DATA STATE CHANGE ===')
    console.log('daoData is now:', daoData)
    console.log('Type:', typeof daoData)
    console.log('Is truthy?', !!daoData)
    if (daoData) {
      console.log('Data keys:', Object.keys(daoData))
      console.log('Has riskScore?', 'riskScore' in daoData)
    }
    console.log('================================')
  }, [daoData])
  // END OF STATE CHANGE MONITOR 👆


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

  const analyzeDAO = async () => {
    console.log('🚀 === ANALYZE DAO START ===')
    const cleanAddress = address.trim().toLowerCase();
    console.log('Clean address:', cleanAddress)
    
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
    console.log('✅ Validation passed, starting analysis...')

    try {
      const cachedData = getCachedAnalysis(cleanAddress);
      if (cachedData) {
        setDaoData(cachedData);
        setLoading(false);
        return;
      }

      console.log('🔗 Step 1: Fetching Etherscan data...')
      const etherscanData = await fetchEtherscanData(cleanAddress);
      console.log('✅ Etherscan data fetched successfully')
      
      console.log('🔗 Step 2: Fetching CoinGecko data...')
      const priceData = await fetchCoinGeckoData(etherscanData.tokens);
      console.log('✅ CoinGecko data fetched successfully')
      
      console.log('🔗 Step 3: Calculating risk analysis...')
      const riskAnalysis = calculateComprehensiveRiskScore(etherscanData, priceData);
      console.log('✅ Risk analysis completed successfully')
      
      console.log('🔗 Step 4: Building formatted data object...')
      const riskLevel = determineRiskLevel(riskAnalysis.finalScore);
      const creditDecision = generateCreditDecision(riskAnalysis.finalScore);
      const holdings = buildFormattedHoldings(etherscanData, priceData, riskAnalysis);
      const activityAnalysis = analyzeTransactionActivity(etherscanData);

      console.log('✅ Formatted data object built successfully')

      // Build the final data object
      const finalData = {
      // Basic info
      name: DAO_NAMES[cleanAddress] || 'Unknown DAO',
      address: cleanAddress,
      isRealData: true,
      
      // Risk scores
      riskScore: riskAnalysis.finalScore,
      riskLevel: riskLevel,
      breakdown: riskAnalysis.breakdown,
      
      // Treasury info  
      balance: etherscanData.ethBalance,
      balanceUSD: (riskAnalysis.portfolioMetrics?.totalValue || 0).toLocaleString(),
      
      // Activity metrics
      transactions30d: etherscanData.recentTxs,
      totalTransactions: etherscanData.txCount,
      lastActivity: activityAnalysis.lastActivity,
      walletAge: activityAnalysis.walletAge,
      
      // Analysis results
      diversificationScore: riskAnalysis.breakdown.diversification,
      treasuryStability: activityAnalysis.treasuryStability,
      governanceActivity: activityAnalysis.activityLevel,
      paymentReliability: Math.min(95, riskAnalysis.finalScore + 10), // Calculated field
      
      // Holdings data - ENSURE THIS IS AN ARRAY
      topHoldings: holdings || [],
      
      // Cache the data
      lastUpdated: new Date().toISOString()
    };
      
      console.log('🎯 Step 5: Setting DAO data...')
      console.log('Final data object:', finalData)
      
      setDaoData(finalData);
      console.log('✅ setDaoData called successfully')

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
            <div className={`${darkMode ? 'bg-gray-50' : 'bg-gray-50'} text-black rounded-2xl p-8 max-w-2xl mx-auto shadow-lg`}>
              <EmailSignup 
                onSuccess={(result) => {
                  if (!result.skipped) {  
                    // Email stored successfully
                    console.log('Email signup successful:', result);
                  }
                  // Redirect to app
                  setCurrentView('app');
                }}
                source="landing_page"
                darkMode={darkMode} 
              />
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
                  {DEMO_ADDRESSES.slice(0, 6).map((addr) => (
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
                  Analysis based on live blockchain data • Last updated: {new Date().toLocaleTimeString()}
                </div>
    
                <PDFExportButton daoData={daoData} />
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