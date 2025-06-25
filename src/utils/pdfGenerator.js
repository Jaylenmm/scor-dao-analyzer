/**
 * Professional PDF Report Generator for Scor DAO Analysis
 * Generates comprehensive risk assessment reports for financial institutions
 */

import jsPDF from 'jspdf';

// PDF styling constants
const PDF_STYLES = {
  colors: {
    primary: [59, 130, 246],     // Blue
    dark: [15, 23, 42],          // Dark blue
    gray: [100, 116, 139],       // Gray
    success: [34, 197, 94],      // Green
    warning: [251, 191, 36],     // Yellow
    danger: [239, 68, 68],       // Red
    light: [248, 250, 252],      // Light gray
    white: [255, 255, 255]       // White
  },
  fonts: {
    small: 8,
    normal: 10,
    medium: 12,
    large: 16,
    xlarge: 20,
    xxlarge: 24
  },
  spacing: {
    small: 5,
    normal: 10,
    medium: 15,
    large: 20,
    xlarge: 30
  }
};

/**
 * Helper function to add formatted text to PDF
 * @param {jsPDF} doc - PDF document instance
 * @param {string} text - Text to add
 * @param {number} x - X coordinate
 * @param {number} y - Y coordinate
 * @param {Object} options - Formatting options
 * @returns {number} New Y position after text
 */
const addFormattedText = (doc, text, x, y, options = {}) => {
  const { 
    fontSize = PDF_STYLES.fonts.normal, 
    fontStyle = 'normal', 
    color = PDF_STYLES.colors.dark,
    align = 'left',
    maxWidth = null 
  } = options;
  
  doc.setFontSize(fontSize);
  doc.setFont('helvetica', fontStyle);
  doc.setTextColor(...color);
  
  if (maxWidth) {
    const splitText = doc.splitTextToSize(text, maxWidth);
    if (align === 'center') {
      doc.text(splitText, x, y, { align: 'center' });
    } else {
      doc.text(splitText, x, y);
    }
    return y + (splitText.length * (fontSize * 0.4)) + 2;
  } else {
    if (align === 'center') {
      doc.text(text, x, y, { align: 'center' });
    } else {
      doc.text(text, x, y);
    }
    return y + fontSize + 2;
  }
};

/**
 * Adds the professional header with scor branding
 * @param {jsPDF} doc - PDF document instance
 * @param {number} pageWidth - Page width
 * @returns {number} Y position after header
 */
const addPDFHeader = (doc, pageWidth) => {
  // Header background
  doc.setFillColor(...PDF_STYLES.colors.primary);
  doc.rect(0, 0, pageWidth, 35, 'F');
  
  // Scor logo
  doc.setTextColor(...PDF_STYLES.colors.white);
  doc.setFontSize(PDF_STYLES.fonts.xxlarge);
  doc.setFont('helvetica', 'light');
  doc.text('scor', 15, 22);
  
  // Header title
  doc.setFontSize(PDF_STYLES.fonts.large);
  doc.setFont('helvetica', 'bold');
  doc.text('DAO Risk Assessment Report', 60, 22);
  
  // Live data badge
  doc.setFillColor(...PDF_STYLES.colors.success);
  doc.roundedRect(pageWidth - 65, 8, 50, 18, 3, 3, 'F');
  doc.setTextColor(...PDF_STYLES.colors.white);
  doc.setFontSize(PDF_STYLES.fonts.normal);
  doc.setFont('helvetica', 'bold');
  doc.text('LIVE DATA', pageWidth - 52, 19, { align: 'center' });
  
  return 45; // Return Y position after header
};

/**
 * Adds report metadata section
 * @param {jsPDF} doc - PDF document instance
 * @param {Object} daoData - DAO analysis data
 * @param {number} pageWidth - Page width
 * @param {number} startY - Starting Y position
 * @returns {number} Y position after metadata
 */
const addReportMetadata = (doc, daoData, pageWidth, startY) => {
  const currentDate = new Date().toLocaleDateString();
  const currentTime = new Date().toLocaleTimeString();
  const cacheDate = daoData.cacheTimestamp ? 
    new Date(daoData.cacheTimestamp).toLocaleString() : 'Live Analysis';
  
  let yPos = startY;
  
  // Report metadata
  addFormattedText(doc, `Generated: ${currentDate} at ${currentTime}`, 15, yPos, {
    fontSize: PDF_STYLES.fonts.small,
    color: PDF_STYLES.colors.gray
  });
  addFormattedText(doc, `Report ID: SCOR-${Date.now()}`, pageWidth - 60, yPos, {
    fontSize: PDF_STYLES.fonts.small,
    color: PDF_STYLES.colors.gray
  });
  
  yPos += 8;
  addFormattedText(doc, 'Data Source: Live Blockchain Analysis (Etherscan + CoinGecko)', 15, yPos, {
    fontSize: PDF_STYLES.fonts.small,
    color: PDF_STYLES.colors.gray
  });
  addFormattedText(doc, `Analysis Date: ${cacheDate}`, pageWidth - 80, yPos, {
    fontSize: PDF_STYLES.fonts.small,
    color: PDF_STYLES.colors.gray
  });
  
  return yPos + PDF_STYLES.spacing.large;
};

/**
 * Adds DAO overview section with risk score
 * @param {jsPDF} doc - PDF document instance
 * @param {Object} daoData - DAO analysis data
 * @param {number} pageWidth - Page width
 * @param {number} startY - Starting Y position
 * @returns {number} Y position after overview
 */
const addDAOOverview = (doc, daoData, pageWidth, startY) => {
  let yPos = startY;
  
  // Background box
  doc.setFillColor(...PDF_STYLES.colors.light);
  doc.rect(10, yPos - 5, pageWidth - 20, 35, 'F');
  doc.setDrawColor(...PDF_STYLES.colors.gray);
  doc.rect(10, yPos - 5, pageWidth - 20, 35);
  
  // DAO name and address
  addFormattedText(doc, daoData.name, 15, yPos + 5, {
    fontSize: PDF_STYLES.fonts.xlarge,
    fontStyle: 'bold',
    color: PDF_STYLES.colors.dark
  });
  addFormattedText(doc, `Address: ${daoData.address}`, 15, yPos + 15, {
    fontSize: PDF_STYLES.fonts.small,
    color: PDF_STYLES.colors.gray
  });
  
  // Risk score visualization
  const riskColor = daoData.riskScore >= 75 ? PDF_STYLES.colors.success : 
                   daoData.riskScore >= 50 ? PDF_STYLES.colors.warning : PDF_STYLES.colors.danger;
  
  // Risk score circle
  doc.setFillColor(...riskColor);
  doc.circle(pageWidth - 40, yPos + 12, 15, 'F');
  doc.setTextColor(...PDF_STYLES.colors.white);
  doc.setFontSize(PDF_STYLES.fonts.large);
  doc.setFont('helvetica', 'bold');
  doc.text(daoData.riskScore.toString(), pageWidth - 40, yPos + 15, { align: 'center' });
  
  // Risk level text
  doc.setTextColor(...riskColor);
  doc.setFontSize(PDF_STYLES.fonts.medium);
  doc.text(`${daoData.riskLevel} Risk`, pageWidth - 70, yPos + 25, { align: 'center' });
  
  return yPos + 50;
};

/**
 * Adds credit decision section
 * @param {jsPDF} doc - PDF document instance
 * @param {Object} daoData - DAO analysis data
 * @param {number} pageWidth - Page width
 * @param {number} startY - Starting Y position
 * @returns {number} Y position after decision
 */
const addCreditDecision = (doc, daoData, pageWidth, startY) => {
  const approvalStatus = daoData.riskScore >= 70 ? 'APPROVED FOR FINANCING' : 'REQUIRES FURTHER REVIEW';
  const approvalColor = daoData.riskScore >= 70 ? PDF_STYLES.colors.success : PDF_STYLES.colors.warning;
  
  doc.setFillColor(...approvalColor);
  doc.rect(10, startY - 3, pageWidth - 20, 15, 'F');
  doc.setTextColor(...PDF_STYLES.colors.white);
  doc.setFontSize(PDF_STYLES.fonts.medium + 2);
  doc.setFont('helvetica', 'bold');
  doc.text(approvalStatus, pageWidth / 2, startY + 6, { align: 'center' });
  
  return startY + 25;
};

/**
 * Adds treasury overview section
 * @param {jsPDF} doc - PDF document instance
 * @param {Object} daoData - DAO analysis data
 * @param {number} pageWidth - Page width
 * @param {number} startY - Starting Y position
 * @returns {number} Y position after treasury section
 */
const addTreasuryOverview = (doc, daoData, pageWidth, startY) => {
  let yPos = startY;
  
  addFormattedText(doc, 'TREASURY OVERVIEW', 15, yPos, {
    fontSize: PDF_STYLES.fonts.large,
    fontStyle: 'bold',
    color: PDF_STYLES.colors.dark
  });
  yPos += 15;
  
  // Two-column layout
  const col1X = 15;
  const col2X = pageWidth / 2;
  
  // Column 1
  addFormattedText(doc, 'Total Treasury Value:', col1X, yPos, {
    fontSize: 11,
    fontStyle: 'bold',
    color: PDF_STYLES.colors.gray
  });
  addFormattedText(doc, `$${daoData.balanceUSD || '0'} (${daoData.balance || '0'} ETH)`, col1X, yPos + 10, {
    fontSize: PDF_STYLES.fonts.medium,
    fontStyle: 'bold',
    color: PDF_STYLES.colors.dark
  });
  
  // Column 2
  addFormattedText(doc, 'Recent Activity (30d):', col2X, yPos, {
    fontSize: 11,
    fontStyle: 'bold',
    color: PDF_STYLES.colors.gray
  });
  addFormattedText(doc, `${daoData.transactions30d || 0} transactions`, col2X, yPos + 10, {
    fontSize: PDF_STYLES.fonts.medium,
    fontStyle: 'bold',
    color: PDF_STYLES.colors.dark
  });
  
  yPos += 25;
  
  // Second row
  addFormattedText(doc, 'Total Transaction History:', col1X, yPos, {
    fontSize: 11,
    fontStyle: 'bold',
    color: PDF_STYLES.colors.gray
  });
  addFormattedText(doc, `${daoData.totalTransactions?.toLocaleString() || 'N/A'} transactions`, col1X, yPos + 10, {
    fontSize: PDF_STYLES.fonts.medium,
    fontStyle: 'bold',
    color: PDF_STYLES.colors.dark
  });
  
  addFormattedText(doc, 'Wallet Age:', col2X, yPos, {
    fontSize: 11,
    fontStyle: 'bold',
    color: PDF_STYLES.colors.gray
  });
  addFormattedText(doc, `Since ${daoData.walletAge || 'Unknown'}`, col2X, yPos + 10, {
    fontSize: PDF_STYLES.fonts.medium,
    fontStyle: 'bold',
    color: PDF_STYLES.colors.dark
  });
  
  return yPos + 30;
};

/**
 * Adds risk breakdown section with progress bars
 * @param {jsPDF} doc - PDF document instance
 * @param {Object} daoData - DAO analysis data
 * @param {number} pageWidth - Page width
 * @param {number} startY - Starting Y position
 * @returns {number} Y position after breakdown
 */
const addRiskBreakdown = (doc, daoData, pageWidth, startY) => {
  if (!daoData.breakdown) return startY;
  
  let yPos = startY;
  
  addFormattedText(doc, 'RISK ANALYSIS BREAKDOWN', 15, yPos, {
    fontSize: PDF_STYLES.fonts.large,
    fontStyle: 'bold',
    color: PDF_STYLES.colors.dark
  });
  yPos += 15;
  
  const breakdown = [
    ['Treasury Health (30%)', daoData.breakdown.treasury],
    ['Activity Score (25%)', daoData.breakdown.activity],
    ['Diversification (20%)', daoData.breakdown.diversification],
    ['Maturity Score (15%)', daoData.breakdown.maturity],
    ['Transaction History (10%)', daoData.breakdown.history]
  ];
  
  breakdown.forEach(([label, score]) => {
    const scoreColor = score >= 75 ? PDF_STYLES.colors.success : 
                      score >= 50 ? PDF_STYLES.colors.warning : PDF_STYLES.colors.danger;
    
    addFormattedText(doc, label, 15, yPos, {
      fontSize: PDF_STYLES.fonts.normal,
      color: PDF_STYLES.colors.gray
    });
    addFormattedText(doc, `${score}/100`, pageWidth - 40, yPos, {
      fontSize: PDF_STYLES.fonts.normal,
      fontStyle: 'bold',
      color: scoreColor
    });
    
    // Progress bar
    const barWidth = 60;
    const barHeight = 4;
    const barX = pageWidth - 130;
    
    // Background bar
    doc.setFillColor(230, 230, 230);
    doc.rect(barX, yPos - 3, barWidth, barHeight, 'F');
    // Progress bar
    doc.setFillColor(...scoreColor);
    doc.rect(barX, yPos - 3, (barWidth * score / 100), barHeight, 'F');
    
    yPos += 12;
  });
  
  return yPos + 15; // Added extra spacing before footer
};

/**
 * Adds professional footer with dynamic positioning
 * @param {jsPDF} doc - PDF document instance
 * @param {number} pageWidth - Page width
 * @param {number} pageHeight - Page height
 * @param {number} contentEndY - Y position where content ends
 */
const addPDFFooter = (doc, pageWidth, pageHeight, contentEndY) => {
  // Calculate footer position - ensure minimum 20pt gap from content
  const minFooterY = contentEndY + 20;
  const defaultFooterY = pageHeight - 40;
  const footerY = Math.max(minFooterY, defaultFooterY);
  
  // If footer would go beyond page, add new page
  if (footerY + 30 > pageHeight) {
    doc.addPage();
    const newFooterY = pageHeight - 40;
    
    // Footer background
    doc.setFillColor(...PDF_STYLES.colors.light);
    doc.rect(0, newFooterY, pageWidth, 30, 'F');
    
    // Footer text
    doc.setTextColor(...PDF_STYLES.colors.gray);
    doc.setFontSize(PDF_STYLES.fonts.small);
    addFormattedText(doc, 'This report is generated by scor - Professional DAO Risk Assessment Platform', 15, newFooterY + 8);
    addFormattedText(doc, 'Analysis based on live blockchain data from Etherscan and CoinGecko APIs', 15, newFooterY + 16);
    addFormattedText(doc, `For questions about this analysis, visit: ${window.location.origin}`, 15, newFooterY + 24);
    
    // Right side footer
    addFormattedText(doc, 'CONFIDENTIAL', pageWidth - 45, newFooterY + 8, { fontStyle: 'bold' });
    addFormattedText(doc, 'Page 2 of 2', pageWidth - 35, newFooterY + 16);
  } else {
    // Footer background
    doc.setFillColor(...PDF_STYLES.colors.light);
    doc.rect(0, footerY, pageWidth, 30, 'F');
    
    // Footer text
    doc.setTextColor(...PDF_STYLES.colors.gray);
    doc.setFontSize(PDF_STYLES.fonts.small);
    addFormattedText(doc, 'This report is generated by scor - Professional DAO Risk Assessment Platform', 15, footerY + 8);
    addFormattedText(doc, 'Analysis based on live blockchain data from Etherscan and CoinGecko APIs', 15, footerY + 16);
    addFormattedText(doc, `For questions about this analysis, visit: ${window.location.origin}`, 15, footerY + 24);
    
    // Right side footer
    addFormattedText(doc, 'CONFIDENTIAL', pageWidth - 45, footerY + 8, { fontStyle: 'bold' });
    addFormattedText(doc, 'Page 1 of 1', pageWidth - 35, footerY + 16);
  }
};

/**
 * Main function to generate comprehensive PDF report
 * @param {Object} daoData - Complete DAO analysis data
 * @param {Object} options - PDF generation options
 */
export const generateProfessionalPDFReport = (daoData, options = {}) => {
  if (!daoData) {
    throw new Error('No DAO data provided for PDF generation');
  }
  
  try {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    
    console.log('📋 Starting PDF generation with data:', {
      name: daoData.name,
      riskScore: daoData.riskScore,
      hasBreakdown: !!daoData.breakdown
    });
    
    // Build PDF sections and track Y position
    let currentY = addPDFHeader(doc, pageWidth);
    currentY = addReportMetadata(doc, daoData, pageWidth, currentY);
    currentY = addDAOOverview(doc, daoData, pageWidth, currentY);
    currentY = addCreditDecision(doc, daoData, pageWidth, currentY);
    currentY = addTreasuryOverview(doc, daoData, pageWidth, currentY);
    currentY = addRiskBreakdown(doc, daoData, pageWidth, currentY);
    
    console.log('📏 Content ends at Y position:', currentY);
    
    // Add footer with dynamic positioning
    addPDFFooter(doc, pageWidth, pageHeight, currentY);
    
    // Generate filename
    const currentDate = new Date().toLocaleDateString().replace(/\//g, '-');
    const safeDAOName = (daoData.name || 'Unknown_DAO').replace(/[^a-zA-Z0-9]/g, '_');
    const fileName = `${safeDAOName}_Risk_Assessment_${currentDate}.pdf`;
    
    // Save the PDF
    doc.save(fileName);
    
    console.log(`✅ PDF report generated successfully: ${fileName}`);
    return fileName;
    
  } catch (error) {
    console.error('❌ PDF generation failed:', error);
    throw new Error(`Failed to generate PDF report: ${error.message}`);
  }
};

/**
 * Generates a quick summary PDF (single page, essential info only)
 * @param {Object} daoData - DAO analysis data
 */
export const generateQuickSummaryPDF = (daoData) => {
  // Simplified version for quick exports
  console.log('Quick summary PDF generation - feature coming soon');
};