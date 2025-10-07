import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { sessionsAPI, uploadAPI } from '../lib/api';
import PDFViewer from '../components/PDFViewer';
import { 
  ArrowLeftIcon,
  PaperAirplaneIcon,
  DocumentArrowUpIcon,
  BookOpenIcon,
  UserIcon,
  ComputerDesktopIcon,
  XMarkIcon,
  SunIcon,
  MoonIcon,
  EyeIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const StudySession = () => {
  const { sessionId } = useParams();
  const { user } = useAuth();
  const { theme, isDarkMode, toggleTheme } = useTheme();
  const navigate = useNavigate();
  
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showUpload, setShowUpload] = useState(false);
  const [showPDF, setShowPDF] = useState(false);
  const [selectedPDF, setSelectedPDF] = useState(null);
  
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (sessionId) {
      fetchSession();
    }
  }, [sessionId]);

  useEffect(() => {
    scrollToBottom();
  }, [session?.messages]);

  const fetchSession = async () => {
    try {
      const response = await sessionsAPI.getById(sessionId);
      setSession(response.session);
    } catch (error) {
      console.error('Error fetching session:', error);
      toast.error('Failed to load study session');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim() || sending) return;

    const userMessage = message.trim();
    setMessage('');
    setSending(true);

    try {
      await sessionsAPI.askQuestion(sessionId, userMessage);
      await fetchSession();
      toast.success('Response received!');
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = error.response?.data?.error || 'Failed to send message';
      toast.error(errorMessage);
    } finally {
      setSending(false);
    }
  };

  const handleFileUpload = async (file) => {
    if (!file || file.type !== 'application/pdf') {
      toast.error('Please select a PDF file');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      await uploadAPI.uploadFile(file, sessionId, (progressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        setUploadProgress(percentCompleted);
      });
      
      toast.success(`${file.name} uploaded successfully!`);
      await fetchSession();
      setShowUpload(false);
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('Failed to upload document');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleViewPDF = (document) => {
    // Create a URL for the uploaded PDF file - use absolute backend URL
    const pdfUrl = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/files/${document.fileName}`;
    console.log('PDF URL constructed:', pdfUrl);
    setSelectedPDF({ url: pdfUrl, name: document.originalName });
    setShowPDF(true);
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className={`min-h-screen ${theme.bg.gradientPremium} flex items-center justify-center animate-fade-in`}>
        <div className={`glass-morphism ${isDarkMode ? 'glass-morphism-dark' : ''} p-12 rounded-3xl ${theme.effects.premium} text-center animate-bounce-in card-hover`}>
          <div className="relative mb-8">
            <div className={`animate-spin rounded-full h-16 w-16 border-4 ${theme.border.primary} border-t-primary-500 mx-auto`}></div>
            <BookOpenIcon className={`absolute inset-0 m-auto w-8 h-8 ${theme.text.brand} animate-pulse`} />
          </div>
          <h2 className={`${theme.text.primary} text-2xl font-bold mb-3`}>Loading Study Session</h2>
          <p className={`${theme.text.secondary} text-lg mb-4`}>Preparing your learning environment...</p>
          <div className={`w-24 h-1 ${theme.bg.gradientPrimary} rounded-full mx-auto opacity-60 animate-pulse`}></div>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className={`min-h-screen ${theme.bg.gradientPremium} flex items-center justify-center animate-fade-in`}>
        <div className={`glass-morphism ${isDarkMode ? 'glass-morphism-dark' : ''} p-12 rounded-3xl ${theme.effects.premium} text-center animate-fade-in-up card-hover max-w-md`}>
          <div className={`p-4 rounded-2xl ${theme.bg.gradientSecondary} inline-flex mb-6`}>
            <BookOpenIcon className="w-12 h-12 text-white" />
          </div>
          <h2 className={`text-3xl font-bold ${theme.text.primary} mb-4`}>Session Not Found</h2>
          <p className={`${theme.text.secondary} text-lg mb-8 leading-relaxed`}>The study session you're looking for doesn't exist or has been removed from your library.</p>
          <Link 
            to="/dashboard" 
            className="btn-gradient inline-flex items-center space-x-2 px-8 py-4 rounded-2xl font-semibold text-lg hover:scale-105 transition-transform"
          >
            <ArrowLeftIcon className="w-5 h-5" />
            <span>Back to Dashboard</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${theme.bg.gradient} ${showPDF ? 'pr-0' : ''}`}>
      {/* Header */}
      <header className={`navbar-glass sticky top-0 z-40 ${theme.border.primary}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link 
                to="/dashboard" 
                className={`p-2 rounded-lg ${theme.button.ghost} transition-colors hover:scale-105`}
              >
                <ArrowLeftIcon className="w-5 h-5" />
              </Link>
              <div>
                <h1 className={`text-xl font-bold ${theme.text.primary} text-glow`}>
                  {session.title}
                </h1>
                <p className={`text-sm ${theme.text.tertiary}`}>
                  {session.documents?.length || 0} documents • {session.totalMessages || 0} messages
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              {/* Documents List */}
              {session.documents?.length > 0 && (
                <div className="flex items-center space-x-2">
                  {session.documents.map((doc, index) => (
                    <button
                      key={index}
                      onClick={() => handleViewPDF(doc)}
                      className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${theme.button.secondary} text-sm transition-all hover:scale-105`}
                      title={`View ${doc.originalName}`}
                    >
                      <DocumentTextIcon className="w-4 h-4" />
                      <span className="hidden sm:inline truncate max-w-[100px]">
                        {doc.originalName}
                      </span>
                      <EyeIcon className="w-4 h-4" />
                    </button>
                  ))}
                </div>
              )}
              
              <button
                onClick={() => setShowUpload(!showUpload)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${theme.button.primary} transition-all hover:scale-105 shadow-lg`}
              >
                <DocumentArrowUpIcon className="w-5 h-5" />
                <span className="hidden sm:inline">Upload PDF</span>
              </button>
              
              <button
                onClick={toggleTheme}
                className={`p-2 rounded-lg ${theme.button.ghost} transition-all hover:scale-105`}
                title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {isDarkMode ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}
              </button>
              
              <span className={`text-sm ${theme.text.secondary} hidden md:inline`}>
                Welcome, {user?.name}!
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Upload Section */}
      {showUpload && (
        <div className={`${theme.bg.accent} border-b ${theme.border.primary} px-4 py-4 animate-slide-in`}>
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      handleFileUpload(file);
                    }
                  }}
                  accept=".pdf"
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className={`btn-gradient px-6 py-3 rounded-xl font-medium disabled:opacity-50 transition-all hover:scale-105`}
                >
                  {uploading ? 'Uploading...' : 'Choose PDF File'}
                </button>
                
                {uploading && (
                  <div className="flex items-center space-x-3">
                    <div className="w-48 bg-gray-200 rounded-full h-3 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-500"
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                    <span className={`text-sm font-medium ${theme.text.primary}`}>{uploadProgress}%</span>
                  </div>
                )}
              </div>
              
              <button
                onClick={() => setShowUpload(false)}
                className={`p-2 rounded-lg ${theme.button.ghost}`}
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Chat Messages */}
      <div className={`flex-1 ${showPDF ? 'mr-[50%]' : ''} transition-all duration-300`}>
        <div className="h-[calc(100vh-200px)] overflow-y-auto px-4 py-6 scrollbar-thin">
          <div className="max-w-4xl mx-auto space-y-6">
            {session.messages?.length === 0 ? (
              <div className={`text-center py-16 ${theme.bg.glass} rounded-2xl mx-4 animate-fade-in`}>
                <BookOpenIcon className={`mx-auto h-16 w-16 ${theme.text.accent} mb-6 animate-pulse`} />
                <h3 className={`text-2xl font-bold ${theme.text.primary} mb-4`}>
                  Welcome to Your Study Session!
                </h3>
                <p className={`${theme.text.secondary} text-lg mb-8 max-w-md mx-auto`}>
                  {session.documents?.length === 0 
                    ? "Upload a PDF document to begin studying with AI assistance."
                    : "Ask questions about your uploaded documents to start an intelligent conversation!"
                  }
                </p>
                {session.documents?.length === 0 && (
                  <button
                    onClick={() => setShowUpload(true)}
                    className="btn-gradient px-8 py-4 rounded-xl font-semibold text-lg"
                  >
                    Upload Your First Document
                  </button>
                )}
              </div>
            ) : (
              session.messages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'} animate-slide-in`}
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className={`flex space-x-3 max-w-4xl w-full ${msg.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                    <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center shadow-lg ${
                      msg.type === 'user' 
                        ? 'bg-gradient-to-r from-blue-500 to-blue-600' 
                        : 'bg-gradient-to-r from-purple-500 to-purple-600'
                    }`}>
                      {msg.type === 'user' ? (
                        <UserIcon className="w-5 h-5 text-white" />
                      ) : (
                        <ComputerDesktopIcon className="w-5 h-5 text-white" />
                      )}
                    </div>
                    
                    <div className={`flex flex-col ${msg.type === 'user' ? 'items-end' : 'items-start'} flex-1`}>
                      <div className={`rounded-2xl px-6 py-4 shadow-elegant max-w-[85%] ${
                        msg.type === 'user'
                          ? `${theme.chat.user.bg} ${theme.chat.user.text}`
                          : `${theme.chat.assistant.bg} ${theme.chat.assistant.text}`
                      }`}>
                        <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                      </div>
                      
                      {msg.sources && msg.sources.length > 0 && (
                        <div className={`mt-3 text-xs ${theme.text.tertiary} max-w-[85%]`}>
                          <p className="mb-2 font-medium">📚 Sources:</p>
                          <div className="space-y-2">
                            {msg.sources.map((source, idx) => (
                              <div key={idx} className={`${theme.bg.tertiary} rounded-lg px-3 py-2 border ${theme.border.primary}`}>
                                <span className={`font-medium ${theme.text.accent}`}>{source.fileName}</span>
                                {source.pageNumber && (
                                  <span className={`ml-2 ${theme.text.tertiary}`}>(Page {source.pageNumber})</span>
                                )}
                                <div className={`mt-1 ${theme.text.secondary} text-xs`}>
                                  Relevance: {Math.round(source.similarity * 100)}%
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      <span className={`text-xs ${theme.text.muted} mt-2`}>
                        {formatTime(msg.timestamp)}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
            
            {sending && (
              <div className="flex justify-start animate-fade-in">
                <div className="flex space-x-3 max-w-4xl">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-purple-600 flex items-center justify-center shadow-lg">
                    <ComputerDesktopIcon className="w-5 h-5 text-white" />
                  </div>
                  <div className={`${theme.chat.assistant.bg} rounded-2xl px-6 py-4 shadow-elegant`}>
                    <div className="flex space-x-2">
                      <div className={`w-2 h-2 ${theme.text.accent.replace('text-', 'bg-')} rounded-full animate-bounce`}></div>
                      <div className={`w-2 h-2 ${theme.text.accent.replace('text-', 'bg-')} rounded-full animate-bounce`} style={{ animationDelay: '0.1s' }}></div>
                      <div className={`w-2 h-2 ${theme.text.accent.replace('text-', 'bg-')} rounded-full animate-bounce`} style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Message Input */}
        <div className={`${theme.bg.glass} border-t ${theme.border.primary} px-4 py-6 backdrop-blur-xl`}>
          <div className="max-w-4xl mx-auto">
            <form onSubmit={handleSendMessage} className="flex space-x-4">
              <div className="flex-1">
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={
                    session.documents?.length === 0 
                      ? "Upload a document first to start asking questions..." 
                      : "Ask a question about your study material..."
                  }
                  disabled={sending || session.documents?.length === 0}
                  rows={3}
                  className={`w-full px-6 py-4 border rounded-2xl ${theme.input.base} ${theme.input.focus} resize-none disabled:opacity-50 disabled:cursor-not-allowed shadow-lg text-sm leading-relaxed`}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      if (!sending && message.trim() && session.documents?.length > 0) {
                        handleSendMessage(e);
                      }
                    }
                  }}
                />
              </div>
              <button
                type="submit"
                disabled={sending || !message.trim() || session.documents?.length === 0}
                className="px-8 py-4 btn-gradient rounded-2xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-3 shadow-lg hover:shadow-2xl transition-all"
              >
                {sending ? (
                  <div className="spinner h-5 w-5 border-2 border-white border-t-transparent"></div>
                ) : (
                  <>
                    <PaperAirplaneIcon className="w-5 h-5" />
                    <span className="hidden sm:inline">Send</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* PDF Viewer */}
      <PDFViewer
        isOpen={showPDF}
        onClose={() => setShowPDF(false)}
        pdfUrl={selectedPDF?.url}
        fileName={selectedPDF?.name}
      />
    </div>
  );
};

export default StudySession;