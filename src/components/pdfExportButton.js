/**
 * PDF Export Button Component
 * Handles PDF report generation with error handling and user feedback
 */

import React, { useState } from 'react';
import { Download } from 'lucide-react';
import { generateProfessionalPDFReport } from '../utils/pdfGenerator';

const PDFExportButton = ({ daoData, className = '', disabled = false }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [lastGenerated, setLastGenerated] = useState(null);

  const handleExportPDF = async () => {
    if (!daoData || isGenerating) {
      return;
    }
    
    setIsGenerating(true);
    
    try {
      const fileName = generateProfessionalPDFReport(daoData);
      setLastGenerated(new Date().toLocaleTimeString());
      
      // Optional: Show success message
      console.log(`PDF exported successfully: ${fileName}`);
      
    } catch (error) {
      console.error('PDF export failed:', error);
      alert('Failed to generate PDF report. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        onClick={handleExportPDF}
        disabled={disabled || isGenerating || !daoData}
        className={`flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white rounded-xl font-semibold shadow-lg shadow-emerald-500/25 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      >
        <Download className={`w-5 h-5 ${isGenerating ? 'animate-bounce' : ''}`} />
        {isGenerating ? 'Generating Report...' : 'Export Professional Report'}
      </button>
      
      {lastGenerated && (
        <div className="text-xs text-gray-500">
          Last exported: {lastGenerated}
        </div>
      )}
    </div>
  );
};

export default PDFExportButton;