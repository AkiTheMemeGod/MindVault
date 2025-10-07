import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { 
  XMarkIcon, 
  ChevronLeftIcon, 
  ChevronRightIcon,
  MagnifyingGlassMinusIcon,
  MagnifyingGlassPlusIcon,
  DocumentTextIcon,
  ArrowsPointingOutIcon,
  ArrowsPointingInIcon,
  DocumentDuplicateIcon,
  BookmarkIcon,
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon
} from '@heroicons/react/24/outline';
import { useTheme } from '../contexts/ThemeContext';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// PDF.js worker is configured in main.jsx

const PDFViewer = ({ isOpen, onClose, pdfUrl, fileName }) => {
  const { theme, isDarkMode } = useTheme();
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.2);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [loadTimeout, setLoadTimeout] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [bookmarks, setBookmarks] = useState([]);
  const [showThumbnails, setShowThumbnails] = useState(false);
  const containerRef = useRef(null);
  const pageRef = useRef(null);

  // Auto-fit scale based on container width
  const [autoScale, setAutoScale] = useState(false);

  // Reset states when PDF URL changes
  useEffect(() => {
    if (pdfUrl) {
      console.log('Starting PDF load:', pdfUrl);
      console.log('Worker configured as:', pdfjs.GlobalWorkerOptions.workerSrc);
      setLoading(true);
      setError(null);
      setPageNumber(1);
      setNumPages(null);
      
      // Clear any existing timeout
      if (loadTimeout) {
        clearTimeout(loadTimeout);
      }
      
      // Set a timeout for PDF loading
      const timeout = setTimeout(() => {
        console.error('PDF load timeout after 30 seconds');
        setError('PDF loading timed out. The file might be corrupted or too large.');
        setLoading(false);
      }, 30000); // 30 second timeout
      
      setLoadTimeout(timeout);
    }
    
    // Cleanup timeout on unmount or URL change
    return () => {
      if (loadTimeout) {
        clearTimeout(loadTimeout);
      }
    };
  }, [pdfUrl]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;
      
      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowLeft':
          goToPrevPage();
          break;
        case 'ArrowRight':
          goToNextPage();
          break;
        case '+':
        case '=':
          zoomIn();
          break;
        case '-':
          zoomOut();
          break;
        case 'f':
        case 'F':
          toggleFullscreen();
          break;
        default:
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, numPages]);

  const onDocumentLoadSuccess = useCallback(({ numPages }) => {
    console.log('PDF loaded successfully:', {
      numPages,
      pdfUrl,
      workerSrc: pdfjs.GlobalWorkerOptions.workerSrc
    });
    
    // Clear the loading timeout
    if (loadTimeout) {
      clearTimeout(loadTimeout);
      setLoadTimeout(null);
    }
    
    setNumPages(numPages);
    setLoading(false);
    setError(null);
  }, [pdfUrl, loadTimeout]);

  const onDocumentLoadError = useCallback((error) => {
    console.error('Error loading PDF:', error);
    console.log('PDF URL:', pdfUrl);
    console.log('Worker source:', pdfjs.GlobalWorkerOptions.workerSrc);
    console.log('PDF.js version:', pdfjs.version);
    console.log('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    
    // Clear the loading timeout
    if (loadTimeout) {
      clearTimeout(loadTimeout);
      setLoadTimeout(null);
    }
    
    setError(error.message || 'Failed to load PDF');
    setLoading(false);
  }, [pdfUrl, loadTimeout]);

  const goToPrevPage = () => {
    setPageNumber(prev => Math.max(prev - 1, 1));
  };

  const goToNextPage = () => {
    setPageNumber(prev => Math.min(prev + 1, numPages));
  };

  const goToFirstPage = () => {
    setPageNumber(1);
  };

  const goToLastPage = () => {
    setPageNumber(numPages);
  };

  const zoomIn = () => {
    setAutoScale(false);
    setScale(prev => Math.min(prev + 0.2, 3.0));
  };

  const zoomOut = () => {
    setAutoScale(false);
    setScale(prev => Math.max(prev - 0.2, 0.5));
  };

  const resetZoom = () => {
    setAutoScale(false);
    setScale(1.0);
  };

  const fitToWidth = () => {
    setAutoScale(true);
    if (containerRef.current && pageRef.current) {
      const containerWidth = containerRef.current.offsetWidth - 80; // padding
      const pageWidth = 595; // Standard A4 width in points
      setScale(containerWidth / pageWidth);
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(prev => !prev);
  };

  const addBookmark = () => {
    const bookmark = {
      page: pageNumber,
      title: `Page ${pageNumber}`,
      timestamp: Date.now()
    };
    setBookmarks(prev => [...prev, bookmark]);
  };

  const goToBookmark = (page) => {
    setPageNumber(page);
  };

  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 z-50 flex animate-fade-in ${isFullscreen ? 'p-0' : ''}`}>
      {/* Backdrop */}
      <div 
        className={`absolute inset-0 transition-all duration-300 ${
          isDarkMode ? 'bg-neutral-950/80' : 'bg-neutral-900/50'
        } backdrop-blur-sm`}
        onClick={onClose}
      />
      
      {/* PDF Viewer Panel */}
      <div className={
        `relative flex flex-col min-h-0 ${isFullscreen ? 'w-full' : 'w-3/5'} ml-auto h-full ` +
        `${theme.pdf.viewer.panel} ${theme.border.primary} ${theme.effects.glass} ` +
        `transition-all duration-300 ease-out animate-slide-in-left`
      }>
        {/* Header */}
        <div className={`${theme.pdf.viewer.header} backdrop-blur-xl`}>
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center space-x-4">
              <div className={`p-2 rounded-xl ${theme.bg.gradientPrimary}`}>
                <DocumentTextIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className={`font-bold text-lg ${theme.text.primary} leading-tight`}>
                  {fileName || 'PDF Document'}
                </h3>
                {numPages && (
                  <div className="flex items-center space-x-2 mt-1">
                    <p className={`text-sm ${theme.text.secondary}`}>
                      Page {pageNumber} of {numPages}
                    </p>
                    {bookmarks.length > 0 && (
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${theme.status.info.bg} ${theme.status.info.text}`}>
                        {bookmarks.length} bookmarks
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={toggleFullscreen}
                className={`p-3 rounded-xl ${theme.button.secondaryGhost} transition-all duration-200 hover:scale-105`}
                title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
              >
                {isFullscreen ? (
                  <ArrowsPointingInIcon className="w-5 h-5" />
                ) : (
                  <ArrowsPointingOutIcon className="w-5 h-5" />
                )}
              </button>
              <button
                onClick={onClose}
                className={`p-3 rounded-xl ${theme.button.ghost} transition-all duration-200 hover:scale-105`}
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Enhanced Controls */}
        <div className={`${theme.pdf.viewer.controls} backdrop-blur-xl`}>
          <div className="flex items-center justify-between p-4">
            {/* Navigation Controls */}
            <div className="flex items-center space-x-2">
              <button
                onClick={goToFirstPage}
                disabled={pageNumber <= 1}
                className={`p-2.5 rounded-xl ${theme.button.secondary} disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105 group`}
                title="First page"
              >
                <ChevronDoubleLeftIcon className="w-4 h-4 group-hover:scale-110 transition-transform" />
              </button>
              <button
                onClick={goToPrevPage}
                disabled={pageNumber <= 1}
                className={`p-2.5 rounded-xl ${theme.button.secondary} disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105 group`}
                title="Previous page"
              >
                <ChevronLeftIcon className="w-4 h-4 group-hover:scale-110 transition-transform" />
              </button>
              
              {/* Page indicator with enhanced styling */}
              <div className={`flex items-center space-x-2 px-4 py-2 rounded-xl ${theme.bg.glass} ${theme.border.primary}`}>
                <input
                  type="number"
                  min="1"
                  max={numPages || 1}
                  value={pageNumber}
                  onChange={(e) => {
                    const page = Math.max(1, Math.min(numPages, parseInt(e.target.value) || 1));
                    setPageNumber(page);
                  }}
                  className={`w-16 text-center text-sm font-medium bg-transparent ${theme.text.primary} focus:outline-none`}
                />
                <span className={`text-sm ${theme.text.tertiary}`}>of {numPages || '...'}</span>
              </div>
              
              <button
                onClick={goToNextPage}
                disabled={pageNumber >= numPages}
                className={`p-2.5 rounded-xl ${theme.button.secondary} disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105 group`}
                title="Next page"
              >
                <ChevronRightIcon className="w-4 h-4 group-hover:scale-110 transition-transform" />
              </button>
              <button
                onClick={goToLastPage}
                disabled={pageNumber >= numPages}
                className={`p-2.5 rounded-xl ${theme.button.secondary} disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105 group`}
                title="Last page"
              >
                <ChevronDoubleRightIcon className="w-4 h-4 group-hover:scale-110 transition-transform" />
              </button>
            </div>

            {/* Zoom Controls */}
            <div className="flex items-center space-x-2">
              <button
                onClick={zoomOut}
                disabled={scale <= 0.5}
                className={`p-2.5 rounded-xl ${theme.button.secondary} disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105 group`}
                title="Zoom out"
              >
                <MagnifyingGlassMinusIcon className="w-4 h-4 group-hover:scale-110 transition-transform" />
              </button>
              
              <button
                onClick={resetZoom}
                className={`px-4 py-2 rounded-xl ${theme.bg.glass} ${theme.text.primary} text-sm font-medium min-w-[5rem] text-center transition-all duration-200 hover:scale-105 ${theme.border.primary}`}
                title="Reset zoom (100%)"
              >
                {Math.round(scale * 100)}%
              </button>
              
              <button
                onClick={zoomIn}
                disabled={scale >= 3.0}
                className={`p-2.5 rounded-xl ${theme.button.secondary} disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105 group`}
                title="Zoom in"
              >
                <MagnifyingGlassPlusIcon className="w-4 h-4 group-hover:scale-110 transition-transform" />
              </button>
              
              <button
                onClick={fitToWidth}
                className={`p-2.5 rounded-xl ${theme.button.secondary} transition-all duration-200 hover:scale-105 group ${autoScale ? theme.button.primary : ''}`}
                title="Fit to width"
              >
                <DocumentDuplicateIcon className="w-4 h-4 group-hover:scale-110 transition-transform" />
              </button>
            </div>

            {/* Action Controls */}
            <div className="flex items-center space-x-2">
              <button
                onClick={addBookmark}
                className={`p-2.5 rounded-xl ${theme.button.accent} transition-all duration-200 hover:scale-105 group`}
                title="Add bookmark"
              >
                <BookmarkIcon className="w-4 h-4 group-hover:scale-110 transition-transform" />
              </button>
            </div>
          </div>
        </div>

        {/* PDF Content */}
        <div 
          ref={containerRef}
          className={`flex-1 overflow-auto min-h-0 ${theme.pdf.viewer.content} scrollbar-thin transition-all duration-300`}
        >
          <div className="flex justify-center p-6">
            {loading && !error && (
              <div className={`flex flex-col items-center space-y-6 py-20 ${theme.bg.glass} rounded-2xl p-12 animate-fade-in-up`}>
                <div className="relative">
                  <div className={`animate-spin rounded-full h-16 w-16 border-4 ${theme.border.primary} border-t-primary-500`}></div>
                  <DocumentTextIcon className={`absolute inset-0 m-auto w-8 h-8 ${theme.text.brand} animate-pulse`} />
                </div>
                <div className="text-center">
                  <p className={`${theme.text.primary} text-lg font-semibold mb-2`}>Loading PDF Document</p>
                  <p className={`${theme.text.secondary} text-sm`}>Please wait while we prepare your document...</p>
                </div>
              </div>
            )}
            
            {error && (
              <div className={`flex flex-col items-center space-y-6 py-20 ${theme.bg.glass} rounded-2xl p-12 animate-fade-in-up`}>
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
                    <XMarkIcon className="w-8 h-8 text-red-500" />
                  </div>
                  <p className={`${theme.text.primary} text-lg font-semibold mb-2`}>Failed to Load PDF</p>
                  <p className={`${theme.text.secondary} text-sm mb-4`}>{error}</p>
                  <button
                    onClick={() => {
                      setError(null);
                      setLoading(true);
                    }}
                    className={`px-4 py-2 rounded-lg ${theme.button.primary} text-sm font-medium`}
                  >
                    Try Again
                  </button>
                </div>
              </div>
            )}
            
            {pdfUrl && (
              <div className="transition-all duration-300 animate-fade-in">
                <Document
                  file={pdfUrl}
                  onLoadSuccess={onDocumentLoadSuccess}
                  onLoadError={onDocumentLoadError}
                  loading={null}
                  className={`${theme.effects.premium} rounded-2xl overflow-hidden`}
                >
                  <div ref={pageRef}>
                    <Page
                      pageNumber={pageNumber}
                      scale={scale}
                      renderTextLayer={true}
                      renderAnnotationLayer={true}
                      className={`border-2 rounded-2xl overflow-hidden transition-all duration-300 ${theme.border.primary} ${theme.bg.surface}`}
                    />
                  </div>
                </Document>
              </div>
            )}
          </div>
        </div>

        {/* Enhanced Footer with Bookmarks */}
        {(numPages > 1 || bookmarks.length > 0) && (
          <div className={`${theme.pdf.viewer.header} backdrop-blur-xl`}>
            <div className="p-4">
              {bookmarks.length > 0 && (
                <div className="mb-4">
                  <h4 className={`text-sm font-semibold ${theme.text.primary} mb-2`}>Bookmarks</h4>
                  <div className="flex flex-wrap gap-2">
                    {bookmarks.map((bookmark, index) => (
                      <button
                        key={index}
                        onClick={() => goToBookmark(bookmark.page)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105 ${
                          pageNumber === bookmark.page ? theme.button.primary : theme.button.secondaryGhost
                        }`}
                      >
                        Page {bookmark.page}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Keyboard shortcuts hint */}
              <div className={`text-xs ${theme.text.muted} flex flex-wrap items-center gap-4`}>
                <span>Shortcuts:</span>
                <span>← → Navigate</span>
                <span>+ - Zoom</span>
                <span>F Fullscreen</span>
                <span>Esc Close</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PDFViewer;