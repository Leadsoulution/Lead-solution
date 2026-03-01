import React, { useState, useRef, useEffect } from 'react';
import { Order, Product, Client } from '../types';
import { BrainCircuit, Sparkles, AlertTriangle, RefreshCw, Send, User, Bot, Settings, Save } from 'lucide-react';
import { useCustomization } from '../contexts/CustomizationContext';

interface AIAnalysisProps {
  orders: Order[];
  products: Product[];
  clients: Client[];
}

interface Message {
  role: 'user' | 'model';
  text: string;
}

const AIAnalysis: React.FC<AIAnalysisProps> = ({ orders, products, clients }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { geminiApiKey, setGeminiApiKey, saveGeminiApiKey } = useCustomization();
  const [showSettings, setShowSettings] = useState(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSaveApiKey = async () => {
    await saveGeminiApiKey();
    setShowSettings(false);
    setError(null); // Clear any previous auth errors
  };

  const getSystemContext = () => {
    const totalRevenue = orders.reduce((sum, order) => sum + order.price, 0);
    const averageOrderValue = totalRevenue / orders.length || 0;
    const topProducts = products
      .map(p => ({
        name: p.name,
        sales: orders.filter(o => o.product === p.name).length
      }))
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 5);

    return `
      You are an expert e-commerce business analyst for "Orderly".
      
      Here is the current business data:
      - Total Orders: ${orders.length}
      - Total Revenue: ${totalRevenue.toFixed(2)}
      - Average Order Value: ${averageOrderValue.toFixed(2)}
      - Total Clients: ${clients.length}
      - Top 5 Products: ${JSON.stringify(topProducts)}
      
      Your goal is to provide strategic advice, identify trends, anomalies, and marketing strategies.
      Keep your responses concise, professional, and actionable. Use Markdown for formatting.
    `;
  };

  const callGemini = async (userMessage: string, history: Message[]) => {
    const apiKey = geminiApiKey || process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      throw new Error("API Key is missing. Please configure it in the settings icon above.");
    }

    const systemContext = getSystemContext();
    
    const contents = [
      {
        role: 'user',
        parts: [{ text: systemContext + "\n\n" + (history.length === 0 ? "Please provide a comprehensive analysis of this data." : "Context provided above.") }]
      },
      ...history.map(msg => ({
        role: msg.role,
        parts: [{ text: msg.text }]
      })),
      {
        role: 'user',
        parts: [{ text: userMessage }]
      }
    ];

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: contents
        })
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || `API Error: ${response.status}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!text) {
      throw new Error("No response generated.");
    }

    return text;
  };

  const handleGenerateInitialAnalysis = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const analysisPrompt = "Please provide a comprehensive analysis of my business data, including Key Trends, Anomalies, Recommendations, and Marketing Strategy.";
      const responseText = await callGemini(analysisPrompt, []);
      
      setMessages([
        { role: 'user', text: analysisPrompt },
        { role: 'model', text: responseText }
      ]);
    } catch (err: any) {
      console.error("AI Analysis Error:", err);
      setError(err.message || "Failed to generate analysis.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    const userText = input.trim();
    setInput('');
    setError(null);
    
    const newMessages = [...messages, { role: 'user', text: userText } as Message];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      // Pass the history *excluding* the new message, because callGemini appends the new message
      const responseText = await callGemini(userText, messages);
      
      setMessages(prev => [...prev, { role: 'model', text: responseText }]);
    } catch (err: any) {
      console.error("Chat Error:", err);
      setError(err.message || "Failed to send message.");
      // Optionally remove the user message if it failed, or show an error state
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-100px)] max-w-5xl mx-auto p-4 gap-4">
      <div className="flex flex-col gap-2 flex-shrink-0">
        <div className="flex justify-between items-start">
            <h1 className="text-3xl font-bold flex items-center gap-3">
            <BrainCircuit className="text-purple-600" size={32} />
            AI Business Analysis & Chat
            </h1>
            <button 
                onClick={() => setShowSettings(!showSettings)}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                title="API Settings"
            >
                <Settings size={20} />
            </button>
        </div>
        <p className="text-muted-foreground">
          Chat with your data. Get insights, ask questions, and refine your strategy with Orderly AI.
        </p>
        
        {showSettings && (
            <div className="p-4 bg-card border rounded-lg shadow-sm mb-2 animate-in slide-in-from-top-2">
                <label className="block text-sm font-medium mb-1">Gemini API Key</label>
                <div className="flex gap-2">
                    <input 
                        type="password" 
                        value={geminiApiKey}
                        onChange={(e) => setGeminiApiKey(e.target.value)}
                        placeholder="Enter your Gemini API Key"
                        className="flex-1 p-2 border rounded-md bg-transparent text-sm"
                    />
                    <button 
                        onClick={handleSaveApiKey}
                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-2 text-sm"
                    >
                        <Save size={16} /> Save
                    </button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                    Leave empty to use the default system key. Your key is stored in the database.
                </p>
            </div>
        )}
      </div>

      {messages.length === 0 && !isLoading && (
        <div className="flex-1 flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-xl bg-card text-card-foreground">
          <Sparkles className="text-yellow-500 mb-4" size={48} />
          <h3 className="text-xl font-semibold mb-2">Start the Conversation</h3>
          <p className="text-muted-foreground text-center max-w-md mb-6">
            Generate a full initial analysis or ask a specific question about your sales and products.
          </p>
          <div className="flex gap-4">
            <button
                onClick={handleGenerateInitialAnalysis}
                className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg shadow-lg transition-all flex items-center gap-2"
            >
                <BrainCircuit size={20} />
                Generate Full Analysis
            </button>
          </div>
        </div>
      )}

      {messages.length > 0 && (
        <div className="flex-1 overflow-y-auto space-y-4 p-4 rounded-xl bg-muted/30 border">
            {messages.map((msg, index) => (
                <div key={index} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {msg.role === 'model' && (
                        <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                            <Bot size={18} className="text-purple-600" />
                        </div>
                    )}
                    <div className={`max-w-[80%] p-4 rounded-xl shadow-sm ${
                        msg.role === 'user' 
                        ? 'bg-blue-600 text-white rounded-tr-none' 
                        : 'bg-card text-card-foreground border rounded-tl-none'
                    }`}>
                        <div className="prose dark:prose-invert max-w-none text-sm">
                            {msg.text.split('\n').map((line, i) => {
                                // Simple markdown rendering
                                if (line.startsWith('### ') || line.startsWith('**')) {
                                     return <p key={i} className="font-bold mt-2 mb-1">{line.replace(/#/g, '').replace(/\*\*/g, '')}</p>
                                }
                                if (line.trim().startsWith('- ')) {
                                    return <li key={i} className="ml-4 list-disc">{line.replace('-', '')}</li>
                                }
                                return <p key={i} className="mb-1">{line}</p>
                            })}
                        </div>
                    </div>
                    {msg.role === 'user' && (
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                            <User size={18} className="text-blue-600" />
                        </div>
                    )}
                </div>
            ))}
            {isLoading && (
                 <div className="flex gap-3 justify-start">
                    <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                        <Bot size={18} className="text-purple-600" />
                    </div>
                    <div className="bg-card p-4 rounded-xl rounded-tl-none border shadow-sm flex items-center gap-2">
                        <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                </div>
            )}
            <div ref={messagesEndRef} />
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-100 text-red-800 rounded-lg flex items-center gap-2 text-sm">
          <AlertTriangle size={16} />
          {error}
        </div>
      )}

      <div className="flex-shrink-0">
        <form onSubmit={handleSendMessage} className="flex gap-2">
            <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask a question about your data..."
                className="flex-1 p-3 border rounded-lg bg-card focus:ring-2 focus:ring-purple-500 focus:outline-none"
                disabled={isLoading}
            />
            <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="p-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
                <Send size={20} />
            </button>
        </form>
      </div>
    </div>
  );
};

export default AIAnalysis;
