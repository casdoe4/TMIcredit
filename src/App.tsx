import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Shield, 
  LayoutDashboard, 
  FileSearch, 
  Mail, 
  Library, 
  Gavel, 
  AlertCircle, 
  CheckCircle2, 
  Download, 
  Send,
  Loader2,
  Plus,
  Upload,
  FileText,
  X
} from 'lucide-react';
import { analyzeCreditReport, AnalysisResult } from './services/geminiService';
import * as pdfjs from 'pdfjs-dist';
// Import worker matching the installed version
import pdfWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';

// Configure PDF.js worker using Vite's URL handling
pdfjs.GlobalWorkerOptions.workerSrc = pdfWorker;

export default function App() {
  const [reportText, setReportText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [activeTab, setActiveTab] = useState('Report Analysis');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const extractTextFromPDF = async (file: File): Promise<string> => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      // Reset workerSrc just in case or ensure it's set before task
      pdfjs.GlobalWorkerOptions.workerSrc = pdfWorker;
      
      const loadingTask = pdfjs.getDocument({ 
        data: arrayBuffer,
      });
      const pdf = await loadingTask.promise;
      let fullText = '';
      
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ');
        fullText += pageText + '\n';
      }
      return fullText;
    } catch (error: any) {
      console.error('PDF extraction error:', error);
      // More descriptive error message
      if (error?.message?.includes('worker')) {
        throw new Error('PDF Worker failed to initialize. Please try pasting the text manually.');
      }
      throw new Error('Could not extract text from PDF. It might be an image-only PDF, encrypted, or corrupted.');
    }
  };

  const handleFileUpload = async (file: File) => {
    try {
      let text = '';
      if (file.type === 'application/pdf') {
        text = await extractTextFromPDF(file);
      } else if (file.type === 'text/plain') {
        text = await file.text();
      } else {
        alert('Unsupported file type. Please upload a PDF or TXT file.');
        return;
      }
      setReportText(text);
      setActiveTab('Report Analysis'); // Ensure we are on the analysis tab
    } catch (error) {
      console.error('File reading failed:', error);
      alert(error instanceof Error ? error.message : 'Failed to read file.');
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file);
  };

  const handleAnalyze = async () => {
    if (!reportText.trim()) return;
    setIsAnalyzing(true);
    try {
      const data = await analyzeCreditReport(reportText);
      setResult(data);
    } catch (error) {
      console.error('Analysis failed:', error);
      alert('Failed to analyze report. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const navItems = [
    { name: 'Dashboard', icon: LayoutDashboard },
    { name: 'Report Analysis', icon: FileSearch },
    { name: 'Dispute Manager', icon: Mail },
    { name: 'Legal Library', icon: Library },
    { name: 'Case Builder', icon: Gavel },
  ];

  const renderContent = () => {
    if (activeTab === 'Legal Library') {
      return (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          {[
            { title: 'FCRA § 611', desc: 'Procedure in case of disputed accuracy. Requires agencies to reinvestigate within 30 days.' },
            { title: 'FCRA § 623', desc: 'Responsibilities of furnishers of information to provide accurate data.' },
            { title: 'FDCPA § 807', desc: 'Prohibits false, deceptive, or misleading representations by debt collectors.' },
            { title: 'FCRA § 604', desc: 'Permissible purposes of consumer reports. Prevents unauthorized credit pulls.' },
            { title: 'FCRA § 609', desc: 'Disclosures to consumers. Your right to see what is in your file.' },
            { title: 'FDCPA § 809', desc: 'Validation of debts. Requires collectors to provide proof of debt upon request.' },
          ].map((law, i) => (
            <div key={i} className="panel p-6 hover:shadow-md transition-shadow">
              <h3 className="text-lg font-bold text-accent mb-2">{law.title}</h3>
              <p className="text-sm text-text-muted leading-relaxed">{law.desc}</p>
            </div>
          ))}
        </motion.div>
      );
    }

    if (activeTab === 'Dashboard') {
      return (
        <div className="flex flex-col items-center justify-center h-full text-center gap-4">
          <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center">
            <LayoutDashboard className="w-10 h-10 text-accent" />
          </div>
          <h2 className="text-xl font-bold">Welcome to CreditShield Pro</h2>
          <p className="text-text-muted max-w-md">
            Start by analyzing a credit report to see your dashboard metrics and active disputes.
          </p>
          <button 
            onClick={() => setActiveTab('Report Analysis')}
            className="btn btn-primary"
          >
            Go to Report Analysis
          </button>
        </div>
      );
    }

    if (activeTab === 'Dispute Manager' || activeTab === 'Case Builder') {
      return (
        <div className="flex flex-col items-center justify-center h-full text-center gap-4">
          <Gavel className="w-16 h-16 text-slate-200" />
          <h2 className="text-xl font-bold">Coming Soon</h2>
          <p className="text-text-muted">
            We are working on advanced features to manage your disputes and build legal cases.
          </p>
        </div>
      );
    }

    // Default: Report Analysis
    return (
      <div className="flex-1 min-h-0">
        {!result && !isAnalyzing ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="h-full flex flex-col items-center justify-center max-w-3xl mx-auto text-center gap-6"
          >
            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center">
              <FileSearch className="w-8 h-8 text-accent" />
            </div>
            <div>
              <h2 className="text-xl font-semibold mb-2">Upload or Paste Your Credit Report</h2>
              <p className="text-text-muted text-sm">
                Upload a PDF/TXT file or paste the text content of your credit report. 
                Our AI will identify errors and draft dispute letters for you.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
              {/* File Upload Zone */}
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={onDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative group cursor-pointer border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center gap-4 transition-all ${
                  isDragging 
                    ? 'border-accent bg-blue-50/50 scale-[1.02]' 
                    : 'border-border-main hover:border-accent hover:bg-slate-50'
                }`}
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept=".pdf,.txt"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file);
                  }}
                />
                <div className="w-12 h-12 bg-white border border-border-main rounded-xl flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
                  <Upload className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <p className="text-sm font-semibold">Click to upload or drag and drop</p>
                  <p className="text-xs text-text-muted mt-1">PDF or TXT (Max 10MB)</p>
                </div>
              </div>

              {/* Text Area Zone */}
              <div className="relative group">
                <textarea
                  value={reportText}
                  onChange={(e) => setReportText(e.target.value)}
                  placeholder="Or paste report text here..."
                  className="w-full h-full min-h-[180px] p-4 bg-white border border-border-main rounded-2xl focus:ring-2 focus:ring-accent focus:border-transparent outline-none resize-none text-sm font-mono"
                />
                {reportText && (
                  <button 
                    onClick={() => setReportText('')}
                    className="absolute top-3 right-3 p-1 bg-slate-100 rounded-md hover:bg-slate-200 transition-colors"
                  >
                    <X className="w-3 h-3 text-text-muted" />
                  </button>
                )}
              </div>
            </div>

            {reportText && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full p-4 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                    <FileText className="w-4 h-4 text-accent" />
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-semibold text-accent">Content Loaded</p>
                    <p className="text-[10px] text-text-muted">{reportText.length} characters extracted</p>
                  </div>
                </div>
                <button
                  onClick={handleAnalyze}
                  className="btn btn-primary py-2 flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Analyze Report
                </button>
              </motion.div>
            )}
          </motion.div>
        ) : isAnalyzing ? (
          <div className="h-full flex flex-col items-center justify-center gap-4">
            <Loader2 className="w-10 h-10 text-accent animate-spin" />
            <p className="text-text-muted animate-pulse">Analyzing report for legal violations...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6 h-full">
            {/* Left Panel: Dispute Letter */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="panel"
            >
              <div className="panel-header">
                <span>DISPUTE LETTER GENERATOR</span>
                <span className="text-text-muted font-normal">Draft #1</span>
              </div>
              <div className="flex-1 p-8 overflow-y-auto font-serif leading-relaxed text-slate-700 whitespace-pre-wrap">
                {result?.disputeLetter}
              </div>
              <div className="p-5 border-t border-border-main flex justify-end gap-3 bg-gray-50/50">
                <button 
                  onClick={() => {
                    setResult(null);
                    setReportText('');
                  }}
                  className="btn btn-secondary flex items-center gap-2"
                >
                  New Analysis
                </button>
                <button className="btn btn-secondary flex items-center gap-2">
                  <Download className="w-4 h-4" />
                  Download PDF
                </button>
                <button className="btn btn-primary flex items-center gap-2">
                  <Send className="w-4 h-4" />
                  Certified Mail Send
                </button>
              </div>
            </motion.div>

            {/* Right Panels */}
            <div className="flex flex-col gap-6 overflow-hidden">
              {/* Identified Errors */}
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="panel shrink-0"
              >
                <div className="panel-header">IDENTIFIED ERRORS</div>
                <div className="max-h-64 overflow-y-auto">
                  {result?.errors.length === 0 ? (
                    <div className="p-8 text-center">
                      <CheckCircle2 className="w-8 h-8 text-success mx-auto mb-2" />
                      <p className="text-sm font-semibold">No errors identified</p>
                      <p className="text-xs text-text-muted">The report appears to be accurate.</p>
                    </div>
                  ) : (
                    result?.errors.map((error, idx) => (
                      <div key={idx} className="p-4 border-b border-border-main last:border-0 flex gap-4 hover:bg-slate-50 transition-colors">
                        <div className={`w-1 h-10 rounded-full shrink-0 ${error.severity === 'critical' ? 'bg-danger' : 'bg-amber-500'}`} />
                        <div className="min-w-0">
                          <h4 className="text-sm font-semibold truncate">{error.type}</h4>
                          <p className="text-xs text-text-muted truncate">{error.account}</p>
                          <p className="text-xs text-text-muted mt-1 line-clamp-2">{error.description}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>

              {/* Legal Citations */}
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="panel flex-1 min-h-0"
              >
                <div className="panel-header">LEGAL CITATIONS</div>
                <div className="flex-1 overflow-y-auto p-2">
                  {result?.legalCitations.map((citation, idx) => (
                    <div key={idx} className="legal-card border-l-accent">
                      <h5 className="text-[10px] uppercase tracking-wider text-text-muted mb-1 font-bold">
                        {citation.law}
                      </h5>
                      <p className="text-xs font-medium leading-snug">
                        {citation.description}
                      </p>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-bg-main">
      {/* Sidebar */}
      <aside className="w-60 bg-primary text-white p-6 flex flex-col shrink-0">
        <div className="flex items-center gap-2 text-xl font-extrabold tracking-tighter mb-12">
          <Shield className="w-6 h-6 text-accent" />
          <span>CREDIT SHIELD</span>
        </div>
        
        <nav className="flex-1 space-y-2">
          {navItems.map((item) => (
            <button
              key={item.name}
              onClick={() => setActiveTab(item.name)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                activeTab === item.name 
                  ? 'bg-white/10 text-white' 
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <item.icon className="w-4 h-4" />
              {item.name}
            </button>
          ))}
        </nav>

        <div className="mt-auto pt-6 text-xs text-slate-500 flex items-center gap-2 border-t border-white/10">
          <div className="w-2 h-2 rounded-full bg-success" />
          Status: <span className="text-success font-semibold">Secured</span>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col p-8 gap-6 overflow-hidden">
        <header className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-text-main">
              {activeTab}
            </h1>
            <p className="text-text-muted text-sm">
              {activeTab === 'Report Analysis' 
                ? 'Scanning for FCRA non-compliance and reporting errors'
                : activeTab === 'Legal Library'
                ? 'Reference guide for consumer protection laws'
                : 'Manage your credit health and legal protections'}
            </p>
          </div>
          {activeTab === 'Report Analysis' && result && (
            <div className="bg-blue-100 text-accent px-3 py-1.5 rounded-full text-xs font-semibold">
              {result.errors.length} Critical Inconsistencies Found
            </div>
          )}
        </header>

        <div className="flex-1 min-h-0 overflow-y-auto">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}
