import { useState, useRef, useEffect } from 'react';

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Hello! I'm your government services assistant. How can I help you today?",
      isBot: true,
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const callGeminiAPI = async (message) => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    
    console.log('API Key check:', apiKey ? 'API key exists' : 'API key missing');
    
    if (!apiKey || apiKey === 'your_gemini_api_key_here') {
      return "I'm sorry, but the chatbot service is not configured properly. Please contact the administrator.";
    }

    try {
      console.log('Making API call to Gemini...');
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `You are a helpful assistant for a government services platform called "Kchaincha". "Kchaincha" is a platform that 
              centralizes the information of all the government services in the Nepal. All your answers must be in context of Nepal.
              Your role is to help users understand government services, procedures, and requirements.
              Keep responses concise, helpful, and focused on government services.
              If asked about specific services, explain general procedures and suggest they check the services section for detailed information.
              
              User question: ${message}`
            }]
          }]
        })
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', errorText);
        throw new Error(`API Error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('API Response data:', data);
      
      const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      console.log('Extracted response text:', responseText);
      
      return responseText || "I'm sorry, I couldn't generate a response. Please try again.";
    } catch (error) {
      console.error('Gemini API Error Details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      
      // More specific error messages
      if (error.message.includes('403')) {
        return "API key is invalid or doesn't have permission. Please check your Gemini API key.";
      } else if (error.message.includes('429')) {
        return "API quota exceeded. Please try again later or check your API usage limits.";
      } else if (error.message.includes('400')) {
        return "Invalid request format. Please try rephrasing your question.";
      } else if (error.message.includes('Failed to fetch')) {
        return "Network error. Please check your internet connection and try again.";
      }
      
      return "I'm experiencing some technical difficulties. Please try again later or contact support.";
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      text: inputMessage,
      isBot: false,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const botResponse = await callGeminiAPI(inputMessage);
      
      const botMessage = {
        id: Date.now() + 1,
        text: botResponse,
        isBot: true,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = {
        id: Date.now() + 1,
        text: "I'm sorry, I encountered an error. Please try again.",
        isBot: true,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([
      {
        id: 1,
        text: "Hello! I'm your government services assistant. How can I help you today?",
        isBot: true,
        timestamp: new Date()
      }
    ]);
  };

  return (
    <>
      {/* Chatbot Toggle Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="text-white p-4 rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center justify-center"
          style={{ 
            background: 'linear-gradient(135deg, #254a7f 0%, #1e3a66 100%)',
          }}
        >
          {isOpen ? (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          )}
        </button>
      </div>

      {/* Chatbot Window */}
      <div className={`fixed bottom-24 right-6 w-96 h-[500px] bg-white rounded-2xl shadow-2xl border border-gray-200 z-50 flex flex-col overflow-hidden transition-all duration-300 ease-in-out transform ${
        isOpen 
          ? 'opacity-100 scale-100 translate-y-0' 
          : 'opacity-0 scale-95 translate-y-4 pointer-events-none'
      }`}>
        {/* Header */}
        <div className="text-white p-4 flex items-center justify-between" style={{ 
          background: 'linear-gradient(135deg, #254a7f 0%, #1e3a66 100%)',
        }}>
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
            </div>
            <div>
              <h3 className="font-semibold">Kchaincha Assistant</h3>
              <p className="text-xs opacity-90">Government Services Helper</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={clearChat}
              className="p-1 hover:bg-white/20 rounded-full transition-colors duration-200"
              title="Clear chat"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-white/20 rounded-full transition-colors duration-200"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
          {messages.map((message, index) => (
            <div
              key={message.id}
              className={`flex ${message.isBot ? 'justify-start' : 'justify-end'} animate-fadeInUp`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div
                className={`max-w-[80%] p-3 rounded-2xl transition-all duration-200 hover:shadow-md ${
                  message.isBot
                    ? 'bg-white text-gray-800 shadow-sm border border-gray-200'
                    : 'text-white'
                }`}
                style={!message.isBot ? { 
                  background: 'linear-gradient(135deg, #254a7f 0%, #1e3a66 100%)',
                } : {}}
              >
                <p className="text-sm leading-relaxed">{message.text}</p>
                <p className={`text-xs mt-1 ${
                  message.isBot ? 'text-gray-500' : 'text-white/70'
                }`}>
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start animate-fadeInUp">
              <div className="bg-white p-3 rounded-2xl shadow-sm border border-gray-200">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: '#254a7f' }}></div>
                  <div className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: '#254a7f', animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: '#254a7f', animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-gray-200 bg-white">
          <form onSubmit={handleSendMessage} className="flex space-x-2">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Ask about government services..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:ring-2 focus:border-opacity-50 outline-none transition-all duration-200"
              style={{
                '--tw-ring-color': '#254a7f',
                borderColor: inputMessage ? '#254a7f' : undefined
              }}
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!inputMessage.trim() || isLoading}
              className="text-white p-2 rounded-full hover:shadow-lg transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              style={{ 
                background: 'linear-gradient(135deg, #254a7f 0%, #1e3a66 100%)',
              }}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </form>
        </div>
      </div>

      {/* Mobile Responsive Adjustments & Animations */}
      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fadeInUp {
          animation: fadeInUp 0.3s ease-out forwards;
        }
        
        @media (max-width: 640px) {
          .chatbot-window {
            width: calc(100vw - 24px);
            height: calc(100vh - 120px);
            right: 12px;
            bottom: 80px;
          }
        }
      `}</style>
    </>
  );
};

export default Chatbot; 