import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpenIcon, ChatBubbleLeftRightIcon, LightBulbIcon, RocketLaunchIcon } from '@heroicons/react/24/outline';

const Landing = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <div className="mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mb-4">
              <BookOpenIcon className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-gray-800 mb-4">
              <span className="text-transparent bg-clip-text bg-[linear-gradient(90deg,#f59e0b,#ef4444,#f97316,#f43f5e,#fb7185)] bg-[length:200%_200%] animate-gradient-shift">MindVault</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Your AI-powered study companion that transforms how you learn from documents. 
              Upload your materials and have intelligent conversations that enhance your understanding.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Link 
              to="/login" 
              className="btn-gradient px-8 py-4 text-lg font-semibold rounded-xl shadow-lg"
            >
              Get Started
              <RocketLaunchIcon className="w-5 h-5 ml-2 inline" />
            </Link>
            <Link 
              to="/register" 
              className="bg-white text-gray-800 px-8 py-4 text-lg font-semibold rounded-xl border-2 border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all duration-200"
            >
              Create Account
            </Link>
          </div>
        </div>

        {/* Features Section */}
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <div className="bg-white p-8 rounded-2xl shadow-lg card-hover">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <ChatBubbleLeftRightIcon className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-3">Interactive Learning</h3>
            <p className="text-gray-600">
              Ask questions about your study materials and get intelligent, contextual answers that help you understand complex concepts.
            </p>
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-lg card-hover">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <LightBulbIcon className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-3">Smart Insights</h3>
            <p className="text-gray-600">
              Our AI analyzes your documents and provides insights, explanations, and connections you might have missed.
            </p>
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-lg card-hover">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <BookOpenIcon className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-3">Organized Sessions</h3>
            <p className="text-gray-600">
              Keep your study materials organized in sessions. Track your learning progress and revisit important topics anytime.
            </p>
          </div>
        </div>

        {/* How it works section */}
        <div className="mt-20 max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">How MindVault Works</h2>
          <div className="space-y-8">
            <div className="flex items-center gap-6">
              <div className="flex-shrink-0 w-12 h-12 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold text-lg">
                1
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Upload Your Documents</h3>
                <p className="text-gray-600">Upload PDF documents, research papers, textbooks, or any study material you want to learn from.</p>
              </div>
            </div>
            
            <div className="flex items-center gap-6">
              <div className="flex-shrink-0 w-12 h-12 bg-purple-500 text-white rounded-full flex items-center justify-center font-bold text-lg">
                2
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Start Asking Questions</h3>
                <p className="text-gray-600">Ask questions about the content, request explanations, or explore related topics through natural conversation.</p>
              </div>
            </div>
            
            <div className="flex items-center gap-6">
              <div className="flex-shrink-0 w-12 h-12 bg-green-500 text-white rounded-full flex items-center justify-center font-bold text-lg">
                3
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Learn Effectively</h3>
                <p className="text-gray-600">Get detailed answers with references to specific parts of your documents, helping you learn more effectively.</p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-20 text-center bg-white rounded-2xl p-12 shadow-lg">
          <h2 className="text-3xl font-bold text-gray-800 mb-4">Ready to Transform Your Learning?</h2>
          <p className="text-gray-600 text-lg mb-8 max-w-2xl mx-auto">
            Join thousands of students who are already using MindVault to study smarter, not harder.
          </p>
          <Link 
            to="/register" 
            className="btn-gradient px-8 py-4 text-lg font-semibold rounded-xl shadow-lg inline-flex items-center"
          >
            Start Learning Today
            <RocketLaunchIcon className="w-5 h-5 ml-2" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Landing;