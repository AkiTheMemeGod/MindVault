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
  EyeIcon
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
  
  // Tabs state: chat | flashcards | quiz
  const [activeTab, setActiveTab] = useState('chat');
  
  // Flashcards state
  const [flashcards, setFlashcards] = useState([]);
  const [generatingFlashcards, setGeneratingFlashcards] = useState(false);
  
  // Quiz state
  const [quizCount, setQuizCount] = useState(5);
  const [quizLoading, setQuizLoading] = useState(false);
  const [quiz, setQuiz] = useState(null); // { quizId, questions }
  const [answers, setAnswers] = useState([]);
  const [quizResult, setQuizResult] = useState(null); // { score, total, correctAnswers }
  const [quizHistory, setQuizHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  
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
      const response = await sessionsAPI.askQuestion(sessionId, userMessage);
      
      // Refresh session to get updated messages
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
    
    const loadingToast = toast.loading('Processing PDF and generating embeddings...');

    try {
      const response = await uploadAPI.uploadFile(file, sessionId, (progressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        setUploadProgress(percentCompleted);
      });
      
      toast.dismiss(loadingToast);
      
      if (response.success) {
        toast.success(`${file.name} uploaded and processed successfully! Created ${response.chunksCreated} chunks.`);
        await fetchSession(); // Refresh to show new document
        setShowUpload(false);
      } else {
        throw new Error(response.message || 'Upload failed');
      }
    } catch (error) {
      toast.dismiss(loadingToast);
      console.error('Error uploading file:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to upload document';
      toast.error(errorMessage);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleViewPDF = (document) => {
  // Create a URL for the uploaded PDF file - use absolute backend URL
  // Backend serves uploaded files under /api/files (see backend/src/server.js)
  const pdfUrl = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/files/${document.fileName}`;
    console.log('PDF URL constructed:', pdfUrl);
    setSelectedPDF({ url: pdfUrl, name: document.originalName });
    setShowPDF(true);
  };

  const handleGenerateFlashcards = async () => {
    if (generatingFlashcards) return;
    if (!session?.documents || session.documents.length === 0) {
      toast.error('Upload documents first to generate flashcards');
      return;
    }
    setGeneratingFlashcards(true);
    try {
      const { flashcards } = await import('../lib/api').then(m => m.studyAidsAPI.generateFlashcards(sessionId));
      setFlashcards(flashcards);
      toast.success(`Generated ${flashcards.length} flashcards`);
    } catch (e) {
      console.error(e);
      toast.error('Failed to generate flashcards');
    } finally {
      setGeneratingFlashcards(false);
    }
  };

  const loadQuizHistory = async () => {
    try {
      setLoadingHistory(true);
      const { quizzes } = await import('../lib/api').then(m => m.studyAidsAPI.listQuizzes(sessionId));
      setQuizHistory(quizzes);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'quiz') {
      loadQuizHistory();
    }
  }, [activeTab]);

  const handleGenerateQuiz = async () => {
    if (quizLoading) return;
    if (!session?.documents || session.documents.length === 0) {
      toast.error('Upload documents first to take a quiz');
      return;
    }
    setQuizLoading(true);
    setQuizResult(null);
    try {
      const { quizId, questions } = await import('../lib/api').then(m => m.studyAidsAPI.generateQuiz(sessionId, quizCount));
      setQuiz({ quizId, questions });
      setAnswers(new Array(questions.length).fill(null));
      toast.success('Quiz generated');
    } catch (e) {
      console.error(e);
      toast.error('Failed to generate quiz');
    } finally {
      setQuizLoading(false);
    }
  };

  const handleSubmitQuiz = async () => {
    if (!quiz) return;
    try {
      const { score, total, correctAnswers } = await import('../lib/api').then(m => m.studyAidsAPI.assessQuiz(sessionId, quiz.quizId, answers));
      setQuizResult({ score, total, correctAnswers });
      toast.success(`Scored ${score}/${total}`);
      await loadQuizHistory();
    } catch (e) {
      console.error(e);
      toast.error('Failed to assess quiz');
    }
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
    <div className={`min-h-screen ${theme.bg.gradientPremium} ${showPDF ? 'pr-0' : ''}`}>
      {/* Header */}
      <header className={`glass-morphism ${isDarkMode ? 'glass-morphism-dark' : ''} sticky top-0 z-40 ${theme.border.primary}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link 
                to="/dashboard" 
                className={`p-2 rounded-xl ${theme.button.ghost} transition-all hover:scale-105`}
              >
                <ArrowLeftIcon className="w-5 h-5" />
              </Link>
              <div>
                <h1 className={`text-xl font-bold ${theme.text.primary}`}>{session.title}</h1>
                <p className={`text-sm ${theme.text.secondary}`}>
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
                      className={`flex items-center space-x-2 px-3 py-2 rounded-xl ${theme.button.secondary} text-sm transition-all hover:scale-105`}
                      title={`View ${doc.originalName}`}
                    >
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
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl ${theme.button.primary} transition-all hover:scale-105 ${theme.effects.glow}`}
              >
                <DocumentArrowUpIcon className="w-5 h-5" />
                <span className="hidden sm:inline">Upload PDF</span>
              </button>
              
              <button
                onClick={toggleTheme}
                className={`p-2 rounded-xl ${theme.button.ghost} transition-all hover:scale-105`}
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

      {/* Tabs */}
      <div className={`${theme.bg.surface} border-b ${theme.border.primary}`}>
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex space-x-2 pt-3">
            {[
              { key: 'chat', label: 'Chat' },
              { key: 'flashcards', label: 'Flashcards' },
              { key: 'quiz', label: 'Quiz' }
            ].map(t => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${activeTab === t.key ? theme.button.primary : theme.button.secondary}`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Upload Section */}
      {showUpload && (
        <div className={`${theme.bg.surface} border-b ${theme.border.primary} px-4 py-6 animate-slide-in`}>
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
                  className="btn-gradient px-6 py-3 rounded-xl font-medium disabled:opacity-50 transition-all hover:scale-105"
                >
                  {uploading ? 'Processing...' : 'Choose PDF File'}
                </button>
                
                {uploading && (
                  <div className="flex items-center space-x-3">
                    <div className={`w-48 ${theme.bg.secondary} rounded-full h-3 overflow-hidden`}>
                      <div
                        className="bg-gradient-to-r from-primary-500 to-secondary-500 h-3 rounded-full transition-all duration-500"
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                    <span className={`text-sm font-medium ${theme.text.primary}`}>{uploadProgress}%</span>
                  </div>
                )}
              </div>
              
              <button
                onClick={() => setShowUpload(false)}
                className={`p-2 rounded-xl ${theme.button.ghost} transition-all hover:scale-105`}
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content by Tab */}
      {activeTab === 'chat' && (
        <div className={`flex-1 ${showPDF ? 'mr-[60%]' : ''} transition-all duration-300`}>
          <div className="h-[calc(100vh-200px)] overflow-y-auto px-4 py-6 scrollbar-thin">
            <div className="max-w-4xl mx-auto space-y-6">
              {session.messages?.length === 0 ? (
              <div className={`text-center py-16 glass-morphism ${isDarkMode ? 'glass-morphism-dark' : ''} rounded-3xl mx-4 animate-fade-in-up card-hover`}>
                <div className={`p-4 rounded-2xl ${theme.bg.gradientPrimary} inline-flex mb-6`}>
                  <BookOpenIcon className="w-12 h-12 text-white" />
                </div>
                <h3 className={`text-2xl font-bold ${theme.text.primary} mb-4`}>
                  Welcome to Your Study Session!
                </h3>
                <p className={`${theme.text.secondary} text-lg mb-8 max-w-md mx-auto leading-relaxed`}>
                  {session.documents?.length === 0 
                    ? "Upload a PDF document to begin studying with AI assistance."
                    : "Ask questions about your uploaded documents to start an intelligent conversation!"
                  }
                </p>
                {session.documents?.length === 0 && (
                  <button
                    onClick={() => setShowUpload(true)}
                    className="btn-gradient px-8 py-4 rounded-2xl font-semibold text-lg hover:scale-105 transition-transform"
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
                    <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${theme.effects.glow} ${
                      msg.type === 'user' 
                        ? theme.bg.gradientPrimary 
                        : theme.bg.gradientSecondary
                    }`}>
                      {msg.type === 'user' ? (
                        <UserIcon className="w-5 h-5 text-white" />
                      ) : (
                        <ComputerDesktopIcon className="w-5 h-5 text-white" />
                      )}
                    </div>
                    
                    <div className={`flex flex-col ${msg.type === 'user' ? 'items-end' : 'items-start'} flex-1`}>
                      <div className={`rounded-2xl px-6 py-4 ${theme.effects.premium} max-w-[85%] ${
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
                                <span className={`font-medium ${theme.text.brand}`}>{source.fileName}</span>
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
                  <div className={`flex-shrink-0 w-10 h-10 rounded-full ${theme.bg.gradientSecondary} flex items-center justify-center ${theme.effects.glow}`}>
                    <ComputerDesktopIcon className="w-5 h-5 text-white" />
                  </div>
                  <div className={`${theme.chat.assistant.bg} rounded-2xl px-6 py-4 ${theme.effects.premium}`}>
                    <div className="flex space-x-2">
                      <div className={`w-2 h-2 ${theme.text.brand.replace('text-', 'bg-')} rounded-full animate-bounce`}></div>
                      <div className={`w-2 h-2 ${theme.text.brand.replace('text-', 'bg-')} rounded-full animate-bounce`} style={{ animationDelay: '0.1s' }}></div>
                      <div className={`w-2 h-2 ${theme.text.brand.replace('text-', 'bg-')} rounded-full animate-bounce`} style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Message Input */}
          <div className={`glass-morphism ${isDarkMode ? 'glass-morphism-dark' : ''} border-t ${theme.border.primary} px-4 py-6 backdrop-blur-xl`}>
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
                  className={`w-full px-6 py-4 border rounded-2xl ${theme.input.base} ${theme.input.focus} resize-none disabled:opacity-50 disabled:cursor-not-allowed ${theme.effects.glow} text-sm leading-relaxed`}
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
                className="px-8 py-4 btn-gradient rounded-2xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-3 hover:scale-105 transition-all"
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
      )}

      {activeTab === 'flashcards' && (
        <div className="px-4 py-6">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className={`text-xl font-semibold ${theme.text.primary}`}>Flashcards</h2>
              <button onClick={handleGenerateFlashcards} disabled={generatingFlashcards} className={`px-4 py-2 rounded-xl ${theme.button.primary} disabled:opacity-50`}>
                {generatingFlashcards ? 'Generating...' : 'Generate Flash Cards'}
              </button>
            </div>
            {flashcards.length === 0 ? (
              <p className={theme.text.secondary}>No flashcards yet. Click "Generate Flash Cards" to create them from your study session.</p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {flashcards.map((fc, idx) => (
                  <Flashcard key={idx} front={fc.front} back={fc.back} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'quiz' && (
        <div className="px-4 py-6">
          <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <h2 className={`text-xl font-semibold ${theme.text.primary}`}>Quiz</h2>
                <div className="flex items-center space-x-2">
                  <input type="number" min={1} max={50} value={quizCount} onChange={(e)=>setQuizCount(parseInt(e.target.value)||5)} className={`w-24 px-3 py-2 border rounded-lg ${theme.input.base} ${theme.input.focus}`} />
                  <button onClick={handleGenerateQuiz} disabled={quizLoading} className={`px-4 py-2 rounded-xl ${theme.button.primary} disabled:opacity-50`}>
                    {quizLoading ? 'Generating...' : 'Take a Quiz'}
                  </button>
                </div>
              </div>

              {!quiz ? (
                <p className={theme.text.secondary}>Generate a quiz to get started.</p>
              ) : (
                <div className="space-y-6">
                  {quiz.questions.map((q, qi) => (
                    <div key={qi} className={`p-4 rounded-xl border ${theme.border.primary} ${theme.bg.surface}`}>
                      <p className={`font-medium mb-3 ${theme.text.primary}`}>{qi+1}. {q.question}</p>
                      <div className="space-y-2">
                        {q.options.map((opt, oi) => (
                          <label key={oi} className={`flex items-center space-x-2 p-2 rounded-lg cursor-pointer ${answers[qi]===oi ? 'bg-primary-50 dark:bg-neutral-800' : ''}`}>
                            <input type="radio" name={`q-${qi}`} checked={answers[qi]===oi} onChange={()=>setAnswers(prev => { const a=[...prev]; a[qi]=oi; return a; })} />
                            <span className={theme.text.secondary}>{opt}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}

                  <div className="flex justify-end">
                    <button onClick={handleSubmitQuiz} className={`px-6 py-3 rounded-xl ${theme.button.accent}`}>Submit for assessment</button>
                  </div>

                  {quizResult && (
                    <div className={`p-4 rounded-xl ${theme.status.info.bg} ${theme.status.info.text} border ${theme.status.info.border}`}>
                      <p className="font-semibold">Your Score: {quizResult.score}/{quizResult.total}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="md:col-span-1">
              <div className={`p-4 rounded-xl border ${theme.border.primary} ${theme.bg.surface}`}>
                <h3 className={`font-semibold mb-3 ${theme.text.primary}`}>Past Quizzes</h3>
                {loadingHistory ? (
                  <p className={theme.text.secondary}>Loading...</p>
                ) : quizHistory.length === 0 ? (
                  <p className={theme.text.secondary}>No quizzes yet.</p>
                ) : (
                  <div className="space-y-3">
                    {quizHistory.map(q => (
                      <div key={q.id} className="p-3 rounded-lg border border-neutral-200 dark:border-neutral-700">
                        <p className="text-sm text-neutral-600 dark:text-neutral-300">{new Date(q.createdAt).toLocaleString()}</p>
                        <p className="text-sm font-medium">{q.totalQuestions} questions</p>
                        <p className="text-sm">{q.lastScore !== null ? `Last score: ${q.lastScore}/${q.totalQuestions}` : 'Not attempted yet'}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

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

// Simple flashcard component with flip
const Flashcard = ({ front, back }) => {
  const [flipped, setFlipped] = useState(false);
  return (
    <div className="relative h-40 cursor-pointer perspective" onClick={()=>setFlipped(f=>!f)}>
      <div className={`absolute inset-0 rounded-xl border border-neutral-200 dark:border-neutral-700 p-4 transition-transform duration-300 preserve-3d ${flipped ? 'rotate-y-180' : ''}`}>
        <div className="absolute inset-0 backface-hidden">
          <p className="font-semibold text-neutral-900 dark:text-neutral-50">{front}</p>
        </div>
        <div className="absolute inset-0 rotate-y-180 backface-hidden">
          <p className="text-neutral-700 dark:text-neutral-200">{back}</p>
        </div>
      </div>
    </div>
  );
};

export default StudySession;
