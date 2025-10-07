import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { sessionsAPI } from '../lib/api';
import { 
  PlusIcon, 
  BookOpenIcon, 
  ChatBubbleLeftRightIcon,
  ClockIcon,
  DocumentTextIcon,
  TrashIcon,
  PencilIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newSession, setNewSession] = useState({ title: '', description: '' });
  const [isCreating, setIsCreating] = useState(false);
  
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const response = await sessionsAPI.getAll();
      setSessions(response.sessions);
    } catch (error) {
      console.error('Error fetching sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSession = async (e) => {
    e.preventDefault();
    if (!newSession.title.trim()) return;
    
    setIsCreating(true);
    try {
      const response = await sessionsAPI.create(newSession);
      setSessions(prev => [response.session, ...prev]);
      setShowCreateModal(false);
      setNewSession({ title: '', description: '' });
      toast.success('Study session created successfully!');
    } catch (error) {
      console.error('Error creating session:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteSession = async (sessionId) => {
    if (!window.confirm('Are you sure you want to delete this study session? This action cannot be undone.')) {
      return;
    }
    
    try {
      await sessionsAPI.delete(sessionId);
      setSessions(prev => prev.filter(s => s._id !== sessionId));
      toast.success('Study session deleted successfully');
    } catch (error) {
      console.error('Error deleting session:', error);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <BookOpenIcon className="w-5 h-5 text-white" />
                </div>
                <span className="ml-2 text-xl font-bold text-gray-900">MindVault</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">Welcome back, {user?.name}!</span>
              <button
                onClick={logout}
                className="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Page header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Study Sessions</h1>
          <p className="mt-2 text-gray-600">Manage your learning materials and chat with your AI study assistant</p>
        </div>

        {/* Create new session button */}
        <div className="mb-6">
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-gradient px-6 py-3 rounded-lg font-semibold inline-flex items-center"
          >
            <PlusIcon className="w-5 h-5 mr-2" />
            New Study Session
          </button>
        </div>

        {/* Sessions grid */}
        {sessions.length === 0 ? (
          <div className="text-center py-12">
            <BookOpenIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No study sessions yet</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by creating your first study session.</p>
            <div className="mt-6">
              <button
                onClick={() => setShowCreateModal(true)}
                className="btn-gradient px-4 py-2 rounded-lg font-medium inline-flex items-center"
              >
                <PlusIcon className="w-5 h-5 mr-2" />
                Create Study Session
              </button>
            </div>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {sessions.map((session) => (
              <div key={session._id} className="bg-white rounded-xl shadow-sm border border-gray-200 card-hover">
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">{session.title}</h3>
                      {session.description && (
                        <p className="text-gray-600 text-sm mb-4 line-clamp-2">{session.description}</p>
                      )}
                    </div>
                    <div className="flex space-x-1 ml-4">
                      <button
                        onClick={() => handleDeleteSession(session._id)}
                        className="p-2 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50"
                        title="Delete session"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex items-center text-sm text-gray-500 mb-4">
                    <ClockIcon className="w-4 h-4 mr-1" />
                    {formatDate(session.lastActivity)}
                  </div>
                  
                  <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                    <div className="flex items-center">
                      <DocumentTextIcon className="w-4 h-4 mr-1" />
                      {session.documents?.length || 0} documents
                    </div>
                    <div className="flex items-center">
                      <ChatBubbleLeftRightIcon className="w-4 h-4 mr-1" />
                      {session.totalMessages || 0} messages
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <Link
                      to={`/session/${session._id}`}
                      className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium text-center transition-colors"
                    >
                      Open Session
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Session Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Create New Study Session</h2>
            
            <form onSubmit={handleCreateSession} className="space-y-4">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                  Session Title
                </label>
                <input
                  type="text"
                  id="title"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg input-focus"
                  placeholder="e.g., Biology Chapter 5 - Cell Division"
                  value={newSession.title}
                  onChange={(e) => setNewSession(prev => ({ ...prev, title: e.target.value }))}
                />
              </div>
              
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  Description (optional)
                </label>
                <textarea
                  id="description"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg input-focus"
                  placeholder="Brief description of what you'll be studying..."
                  value={newSession.description}
                  onChange={(e) => setNewSession(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>
              
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setNewSession({ title: '', description: '' });
                  }}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating || !newSession.title.trim()}
                  className="flex-1 btn-gradient px-4 py-2 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCreating ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mx-auto"></div>
                  ) : (
                    'Create Session'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;