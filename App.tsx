import React, { useState } from 'react';
import ReviewGenerator from './components/ReviewGenerator';
import ChatBot from './components/ChatBot';
import SavedReviews from './components/SavedReviews';
import { PencilIcon } from './components/icons/PencilIcon';
import { ChatIcon } from './components/icons/ChatIcon';
import { BookmarkIcon } from './components/icons/BookmarkIcon';

type View = 'review' | 'chat' | 'saved';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<View>('review');

  const navButtonClasses = (view: View) =>
    `flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
      activeView === view
        ? 'bg-indigo-600 text-white'
        : 'text-gray-300 hover:bg-gray-700 hover:text-white'
    }`;

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-sans">
      <div className="container mx-auto max-w-4xl p-4">
        <header className="text-center my-8">
          <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-600">
            Travel Review AI
          </h1>
          <p className="mt-2 text-lg text-gray-400">
            Your personal AI-powered travel companion
          </p>
        </header>

        <nav className="flex justify-center mb-8 bg-gray-800/50 p-2 rounded-lg backdrop-blur-sm border border-gray-700 w-fit mx-auto">
          <div className="flex space-x-2">
            <button onClick={() => setActiveView('review')} className={navButtonClasses('review')}>
              <PencilIcon />
              Review Generator
            </button>
            <button onClick={() => setActiveView('chat')} className={navButtonClasses('chat')}>
              <ChatIcon />
              Chat Bot
            </button>
            <button onClick={() => setActiveView('saved')} className={navButtonClasses('saved')}>
              <BookmarkIcon />
              Saved Reviews
            </button>
          </div>
        </nav>

        <main>
          {activeView === 'review' && <ReviewGenerator />}
          {activeView === 'chat' && <ChatBot />}
          {activeView === 'saved' && <SavedReviews />}
        </main>

        <footer className="text-center mt-12 text-gray-500 text-sm">
          <p>Powered by Gemini 2.5 Flash</p>
        </footer>
      </div>
    </div>
  );
};

export default App;