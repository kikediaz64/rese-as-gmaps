import React, { useState } from 'react';
import ReviewGenerator from './components/ReviewGenerator';
import ChatBot from './components/ChatBot';
import SavedReviews from './components/SavedReviews';
import { PencilIcon } from './components/icons/PencilIcon';
import { ChatIcon } from './components/icons/ChatIcon';
import { BookmarkIcon } from './components/icons/BookmarkIcon';
import { isApiKeySet } from './services/geminiService';

type View = 'review' | 'chat' | 'saved';

const ApiKeyMissingBanner: React.FC = () => (
  <div className="min-h-screen bg-gray-900 text-gray-100 font-sans flex items-center justify-center p-4">
    <div className="container mx-auto max-w-2xl p-8 bg-red-900/50 border border-red-700 rounded-lg text-center shadow-2xl">
      <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-4">
        Error de Configuración
      </h1>
      <p className="mt-2 text-lg text-red-200">
        La clave de API para el servicio de IA no se ha encontrado o no es válida.
      </p>
      <div className="text-left bg-gray-800 p-4 rounded-lg mt-6 text-gray-300 space-y-4">
        <div>
            <p className="font-semibold text-lg mb-2">Paso 1: Activa la API de Gemini</p>
            <p className="text-sm">
                Asegúrate de que la <strong>"Generative Language API"</strong> esté habilitada en tu proyecto de Google Cloud.
            </p>
            <a 
                href="https://console.cloud.google.com/apis/library/generativelanguage.googleapis.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-block mt-2 bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded-lg transition duration-200"
            >
                Activar API en Google Cloud
            </a>
        </div>
        <div className="border-t border-gray-700/50 pt-4">
            <p className="font-semibold text-lg mb-2">Paso 2: Configura la Clave en Vercel</p>
            <ol className="list-decimal list-inside mt-2 space-y-2 text-sm">
                <li>Ve a la configuración de tu proyecto en Vercel.</li>
                <li>Busca la sección "Environment Variables" (Variables de Entorno).</li>
                <li>Asegúrate de que existe una variable con el nombre <code className="bg-gray-700 p-1 rounded text-yellow-300 font-mono">API_KEY</code>.</li>
                <li>Pega tu clave de API de Google AI Studio como valor. <strong>Asegúrate de que la clave pertenezca al proyecto donde activaste la API.</strong></li>
                <li><strong>Importante:</strong> Después de guardar la variable, debes volver a desplegar (Redeploy) tu proyecto.</li>
                <li className="pt-2 border-t border-gray-600/50">Si el error persiste, <strong>crea una nueva clave de API</strong> en Google AI Studio (en el proyecto correcto) y úsala.</li>
            </ol>
        </div>
      </div>
    </div>
  </div>
);


const App: React.FC = () => {
  const [apiKeyAvailable] = useState<boolean>(isApiKeySet());
  const [activeView, setActiveView] = useState<View>('review');

  const navButtonClasses = (view: View) =>
    `flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
      activeView === view
        ? 'bg-indigo-600 text-white'
        : 'text-gray-300 hover:bg-gray-700 hover:text-white'
    }`;

  if (!apiKeyAvailable) {
    return <ApiKeyMissingBanner />;
  }

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