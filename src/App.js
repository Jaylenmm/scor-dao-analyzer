import React, { useState, useEffect } from 'react';
import { Search, DollarSign, TrendingUp, AlertTriangle, CheckCircle, Users, Activity, ArrowLeft, Sun, Moon } from 'lucide-react';
import jsPDF from 'jspdf';

const ScorApp = () => {
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [daoData, setDaoData] = useState(null);
  const [error, setError] = useState('');
  const [darkMode, setDarkMode] = useState(true);

  // Mock data for demonstration
  const mockDAOData = {
    '0x2b591e99afe9f32eaa6214f7b7629768c40eeb39': {
      name: 'HexTrust DAO',
      balance: '1,247.8',
      balanceUSD: '2,847,234',
      // riskScore: 78,
      // riskLevel: 'Medium-Low',
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
      // riskScore: 92,
      // riskLevel: 'Low',
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
      // riskScore: 34,
      // riskLevel: 'High',
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
      // riskScore: 67,
      // riskLevel: 'Medium',
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
      // riskScore: 88,
      // riskLevel: 'Low',
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
     // riskScore: 28,
      // riskLevel: 'High',
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

  const DataSourcesSection = () => {
    const dataSources = [
      { name: "Etherscan", description: "Real-time blockchain data", icon: "🔗" },
      { name: "Moralis", description: "Multi-chain analytics", icon: "⚡" },
      { name: "The Graph", description: "Decentralized indexing", icon: "📊" },
      { name: "CoinGecko", description: "Token pricing data", icon: "💰" }
    ];

    return (
      <div className={`${darkMode ? 'bg-gray-900/50' : 'bg-white'} ${darkMode ? 'border-gray-800' : 'border-gray-200'} border rounded-2xl p-8 shadow-lg`}>
        <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-6 text-center`}>Trusted Data Sources</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {dataSources.map((source, index) => (
            <div key={index} className="text-center">
              <div className="text-3xl mb-2">{source.icon}</div>
              <div className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{source.name}</div>
              <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{source.description}</div>
            </div>
          ))}
        </div>
        <div className="mt-6 text-center">
          <div className={`inline-flex items-center gap-2 px-4 py-2 ${darkMode ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-700'} rounded-full text-sm`}>
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
            Live Data • Updated Every 15 Minutes
          </div>
        </div>
      </div>
    );
  };

  const generatePDFReport = (daoData) => {
    const doc = new jsPDF();
    const currentDate = new Date().toLocaleDateString();
    const currentTime = new Date().toLocaleTimeString();
  
    // Helper function for adding text with word wrap
    const addText = (text, x, y, options = {}) => {
      const { fontSize = 12, fontStyle = 'normal', maxWidth = 180 } = options;
      doc.setFontSize(fontSize);
      doc.setFont('helvetica', fontStyle);
      
      if (maxWidth) {
        const splitText = doc.splitTextToSize(text, maxWidth);
        doc.text(splitText, x, y);
        return y + (splitText.length * fontSize * 0.35);
      } else {
        doc.text(text, x, y);
        return y + (fontSize * 0.35);
      }
    };
  
    // Header
    doc.setFillColor(37, 99, 235); // Blue color
    doc.rect(0, 0, 210, 25, 'F');
    
    doc.setTextColor(255, 255, 255);
    addText('scor', 15, 16, { fontSize: 20, fontStyle: 'bold' });
    addText('DAO Risk Assessment Report', 60, 16, { fontSize: 16, fontStyle: 'bold' });
    
    // Reset text color
    doc.setTextColor(0, 0, 0);
    
    // Report metadata
    let yPos = 40;
    addText(`Generated: ${currentDate} at ${currentTime}`, 15, yPos, { fontSize: 10 });
    addText(`Report ID: ${Date.now()}`, 130, yPos, { fontSize: 10 });
    
    // DAO Name and Risk Score (Prominent)
    yPos += 15;
    doc.setFillColor(248, 250, 252);
    doc.rect(10, yPos - 5, 190, 25, 'F');
    doc.setDrawColor(229, 231, 235);
    doc.rect(10, yPos - 5, 190, 25);
    
    addText(daoData.name, 15, yPos + 5, { fontSize: 18, fontStyle: 'bold' });
    
    // Risk score with color coding
    const riskColor = daoData.riskScore >= 75 ? [34, 197, 94] : 
                     daoData.riskScore >= 50 ? [251, 191, 36] : [239, 68, 68];
    doc.setTextColor(...riskColor);
    addText(`Risk Score: ${daoData.riskScore}/100`, 130, yPos + 5, { fontSize: 16, fontStyle: 'bold' });
    addText(`(${daoData.riskLevel} Risk)`, 130, yPos + 12, { fontSize: 12 });
    
    doc.setTextColor(0, 0, 0);
    
    // Credit Decision
    yPos += 35;
    const approvalStatus = daoData.riskScore >= 70 ? 'APPROVED FOR FINANCING' : 'REQUIRES FURTHER REVIEW';
    const approvalColor = daoData.riskScore >= 70 ? [34, 197, 94] : [251, 191, 36];
    
    doc.setFillColor(...approvalColor);
    doc.rect(10, yPos - 3, 190, 12, 'F');
    doc.setTextColor(255, 255, 255);
    addText(approvalStatus, 15, yPos + 3, { fontSize: 12, fontStyle: 'bold' });
    doc.setTextColor(0, 0, 0);
    
    // Treasury Information
    yPos += 25;
    addText('TREASURY OVERVIEW', 15, yPos, { fontSize: 14, fontStyle: 'bold' });
    yPos += 8;
    
    addText(`Total Balance: ${daoData.balance} ETH ($${daoData.balanceUSD})`, 15, yPos);
    yPos += 6;
    addText(`30-Day Transactions: ${daoData.transactions30d}`, 15, yPos);
    yPos += 6;
    addText(`Average Transaction: ${daoData.avgTxValue} ETH`, 15, yPos);
    yPos += 6;
    addText(`Treasury Stability: ${daoData.treasuryStability}`, 15, yPos);
    
    // Risk Factors
    yPos += 20;
    addText('RISK ANALYSIS', 15, yPos, { fontSize: 14, fontStyle: 'bold' });
    yPos += 8;
    
    const riskFactors = [
      ['Diversification Score', `${daoData.diversificationScore}/100`],
      ['Payment Reliability', `${daoData.paymentReliability}%`],
      ['Governance Activity', daoData.governanceActivity],
      ['Last Activity', daoData.lastActivity]
    ];
    
    riskFactors.forEach(([label, value]) => {
      addText(`${label}:`, 15, yPos);
      addText(value, 100, yPos, { fontStyle: 'bold' });
      yPos += 6;
    });
    
    // Treasury Composition
    yPos += 15;
    addText('TREASURY COMPOSITION', 15, yPos, { fontSize: 14, fontStyle: 'bold' });
    yPos += 8;
    
    daoData.topHoldings.forEach((holding) => {
      addText(`${holding.token}: ${holding.amount} (${holding.percentage}%)`, 15, yPos);
      yPos += 6;
    });
    
    // Algorithm Explanation
    yPos += 15;
    addText('SCORING METHODOLOGY', 15, yPos, { fontSize: 14, fontStyle: 'bold' });
    yPos += 8;
    
    const methodology = [
      'Treasury Health (30%): Size, stability, and asset composition',
      'Transaction Activity (25%): Volume and frequency of operations', 
      'Diversification (20%): Asset spread and risk distribution',
      'Payment History (15%): Historical reliability and patterns',
      'Governance (10%): Community engagement and decision-making'
    ];
    
    methodology.forEach((item) => {
      yPos = addText(`• ${item}`, 15, yPos, { maxWidth: 180 });
      yPos += 2;
    });
    
    // Footer
    const pageHeight = doc.internal.pageSize.height;
    doc.setFillColor(248, 250, 252);
    doc.rect(0, pageHeight - 20, 210, 20, 'F');
    
    doc.setTextColor(107, 114, 128);
    addText('This report is generated by scor - DAO Risk Assessment Platform', 15, pageHeight - 10, { fontSize: 8 });
    addText('For questions about this analysis, contact support@scor.com', 15, pageHeight - 5, { fontSize: 8 });
    
    // Save the PDF
    doc.save(`${daoData.name}_Risk_Assessment_${currentDate.replace(/\//g, '-')}.pdf`);
  };
  
  // PDF Export Button Component
  const PDFExportButton = ({ daoData }) => {
    const handleExportPDF = () => {
      generatePDFReport(daoData);
    };
  
    return (
      <button
        onClick={handleExportPDF}
        className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white rounded-xl font-semibold shadow-lg shadow-emerald-500/25 transition-all duration-300"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        Export PDF Report
      </button>
    );
  };

  // Theme classes
  const bgClass = darkMode ? 'bg-gray-900' : 'bg-gray-50';
  const textClass = darkMode ? 'text-white' : 'text-gray-900';
  const cardClass = darkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-200';
  const inputClass = darkMode ? 'bg-gray-800/50 border-gray-700 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500';

  return (
    <div className={`min-h-screen ${bgClass} ${textClass} transition-colors duration-300`}>
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-12">
          <button 
            onClick={resetToHome}
            className="text-3xl font-bold text-blue-600 hover:text-blue-500 transition-colors duration-300 flex items-center gap-3"
          >
            scor
            {daoData && <ArrowLeft className="w-6 h-6" />}
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
                <div className="text-sm">BETA</div>
              </div>
            )}
          </div>
        </div>

        {!daoData ? (
          /* Home Page */
          <div className="space-y-16">
            {/* Hero Section */}
            <div className="text-center space-y-8 max-w-4xl mx-auto">
              <div className="space-y-4">
                <h1 className="text-5xl md:text-6xl font-bold leading-tight">
                  Credit risk assessment
                  <br />
                  <span className="text-blue-600">for DAOs</span>
                </h1>
                <p className={`text-xl ${darkMode ? 'text-gray-300' : 'text-gray-600'} max-w-2xl mx-auto leading-relaxed`}>
                  Get instant risk scores and creditworthiness analysis for any DAO with real-time on-chain data.
                </p>
              </div>
            </div>

            {/* Search Section */}
            <div className="max-w-2xl mx-auto">
              <div className={`${cardClass} border rounded-2xl p-8 shadow-lg`}>
                <div className="space-y-6">
                  <input
                    type="text"
                    placeholder="Enter DAO wallet address or ENS name"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className={`w-full px-6 py-4 ${inputClass} border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg transition-all duration-300`}
                    onKeyPress={(e) => e.key === 'Enter' && analyzDAO()}
                  />
                  
                  <button
                    onClick={analyzDAO}
                    disabled={loading}
                    className="w-full px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-lg shadow-lg disabled:opacity-50 transition-all duration-300 flex items-center justify-center gap-3"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent"></div>
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Search className="w-6 h-6" />
                        Analyze DAO
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
                  Try analyzing these sample DAOs:
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(mockDAOData).slice(0, 4).map(([address, data]) => (
                    <button
                      key={address}
                      onClick={() => setAddress(address)}
                      className={`p-4 ${cardClass} border rounded-xl hover:shadow-md transition-all duration-300 text-left`}
                    >
                      <div className={`font-medium ${textClass}`}>{data.name}</div>
                      <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        ${data.balanceUSD} Treasury
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
                <h3 className={`text-lg font-semibold ${textClass}`}>Real-time Analysis</h3>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Instant risk assessment based on live blockchain data
                </p>
              </div>
              
              <div className="text-center space-y-4">
                <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center mx-auto">
                  <Activity className="w-6 h-6" />
                </div>
                <h3 className={`text-lg font-semibold ${textClass}`}>Deep Analytics</h3>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Treasury health, governance activity, and payment patterns
                </p>
              </div>
              
              <div className="text-center space-y-4">
                <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center mx-auto">
                  <CheckCircle className="w-6 h-6" />
                </div>
                <h3 className={`text-lg font-semibold ${textClass}`}>Enterprise Ready</h3>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  API integration for existing financial systems
                </p>
              </div>
            </div>
          </div>
        ) : (
          /* Results Page */
          <div className="space-y-8">
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
                    <p className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`}>Treasury</p>
                    <p className={`text-3xl font-bold ${textClass}`}>{daoData.balance}</p>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>ETH • ${daoData.balanceUSD}</p>
                  </div>
                  <DollarSign className="w-10 h-10 text-blue-600" />
                </div>
              </div>

              <div className={`${cardClass} border rounded-2xl p-6 shadow-lg`}>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`}>Transactions (30d)</p>
                    <p className={`text-3xl font-bold ${textClass}`}>{daoData.transactions30d}</p>
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
                    ['Diversification', `${daoData.diversificationScore}/100`],
                    ['Treasury Stability', daoData.treasuryStability],
                    ['Governance Activity', daoData.governanceActivity],
                    ['Last Activity', daoData.lastActivity]
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
                          <div className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-600'}`}>{holding.token}</div>
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
              <h3 className={`text-2xl font-bold ${textClass} mb-6`}>Assessment Summary</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div>
                  <p className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-2`}>DAO Name</p>
                  <p className={`text-xl font-bold ${textClass}`}>{daoData.name}</p>
                </div>
                <div>
                  <p className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-2`}>Avg Transaction</p>
                  <p className={`text-xl font-bold ${textClass}`}>{daoData.avgTxValue} ETH</p>
                </div>
                <div>
                  <p className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-2`}>Credit Decision</p>
                  <p className={`text-xl font-bold ${daoData.riskScore >= 70 ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {daoData.riskScore >= 70 ? 'Approved' : 'Review Required'}
                  </p>
                </div>
              </div>
            </div>
            {/* PDF Export */}
              <div className="flex justify-center">
                <PDFExportButton daoData={daoData} />
              </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ScorApp;