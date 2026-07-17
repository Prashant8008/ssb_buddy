import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Send, Bot, Shield, Brain, Timer, MessageSquare, ChevronLeft, Loader2 } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { cn } from '../../lib/utils';
import { AIMentorService } from '../../services/api';

const AIMentor = () => {
  const [searchParams] = useSearchParams();
  const moduleParam = searchParams.get('module');
  const [selectedModule, setSelectedModule] = useState<string | null>(
    moduleParam && ['interview', 'ppdt', 'tat', 'wat', 'general'].includes(moduleParam) ? moduleParam : null
  );
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const modules = [
    { id: 'interview', title: 'Interview Coach', icon: <MessageSquare />, desc: 'Mock Personal Interview with OLQ analysis' },
    { id: 'ppdt', title: 'PPDT Evaluator', icon: <Shield />, desc: 'Upload story for screening evaluation' },
    { id: 'tat', title: 'TAT Evaluator', icon: <Brain />, desc: 'Psychology test story assessment' },
    { id: 'wat', title: 'WAT Evaluator', icon: <Timer />, desc: 'Word association response feedback' },
  ];

  // Initialize chat when a module is selected
  useEffect(() => {
    if (selectedModule) {
      const moduleName = modules.find(m => m.id === selectedModule)?.title;
      setMessages([
        {
          sender: 'bot',
          text: `Jai Hind Aspirant! I am your AI SSB ${moduleName}. I will help you evaluate your answers for this section. What would you like to practice or evaluate?`
        }
      ]);
    } else {
      setMessages([]);
    }
  }, [selectedModule]);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !selectedModule || isLoading) return;

    const userMessage = { sender: 'Me', text: inputText };
    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      const response = await AIMentorService.sendMessage(selectedModule, inputText, messages);
      const botMessage = { sender: 'bot', text: response.data.reply };
      setMessages(prev => [...prev, botMessage]);
    } catch (error: any) {
      console.error("Failed to chat with AI Mentor:", error);
      const errorMessage = {
        sender: 'bot',
        text: error.response?.data?.detail || "Sorry, I am having trouble connecting to the mentor services. Please check if the backend is running."
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  if (selectedModule) {
    const activeModule = modules.find(m => m.id === selectedModule);
    return (
      <div className="flex flex-col h-[calc(100vh-120px)] bg-white max-w-4xl mx-auto rounded-3xl overflow-hidden border border-outline-variant/30 shadow-sm mt-4">
        {/* Header */}
        <div className="p-4 border-b border-outline-variant/30 flex items-center gap-3 bg-primary text-white">
          <button onClick={() => setSelectedModule(null)} className="p-1 hover:bg-primary-container rounded-lg"><ChevronLeft /></button>
          <div>
            <h3 className="font-bold text-sm">{activeModule?.title}</h3>
            <p className="text-[10px] text-green-400 font-bold">AI Mentor Active</p>
          </div>
        </div>
        
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-surface-container-low/20">
          {messages.map((msg, index) => {
            const isOwn = msg.sender === 'Me';
            return (
              <div 
                key={index} 
                className={cn(
                  "flex gap-3 max-w-[85%]",
                  isOwn ? "ml-auto flex-row-reverse" : "mr-auto"
                )}
              >
                {!isOwn && (
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-secondary-fixed flex-shrink-0 shadow-sm">
                    <Bot size={16} />
                  </div>
                )}
                <div 
                  className={cn(
                    "p-3 rounded-2xl text-sm leading-relaxed whitespace-pre-line shadow-sm border",
                    isOwn 
                      ? "bg-primary text-on-primary rounded-tr-none border-primary-container" 
                      : "bg-white text-primary rounded-tl-none border-outline-variant/30"
                  )}
                >
                  {msg.text}
                </div>
              </div>
            );
          })}
          {isLoading && (
            <div className="flex gap-3 max-w-[85%] mr-auto">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-secondary-fixed flex-shrink-0 shadow-sm">
                <Bot size={16} />
              </div>
              <div className="bg-white text-outline p-3 rounded-2xl rounded-tl-none border border-outline-variant/30 flex items-center gap-2 text-sm">
                <Loader2 className="animate-spin" size={14} /> AI is formulating evaluation...
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Form */}
        <form onSubmit={handleSendMessage} className="p-4 border-t border-outline-variant/30 bg-white">
          <div className="flex items-center gap-2 bg-surface-container-low rounded-2xl px-4 py-2 border border-outline-variant/30/50">
            <input 
              type="text" 
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              placeholder={`Send message to ${activeModule?.title}...`}
              className="flex-1 bg-transparent border-none focus:ring-0 text-sm outline-none"
              disabled={isLoading}
            />
            <button 
              type="submit" 
              className="p-2 bg-primary text-white rounded-full hover:bg-primary-container disabled:opacity-55"
              disabled={isLoading || !inputText.trim()}
            >
              <Send size={16} />
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6 max-w-5xl mx-auto bg-background min-h-screen pb-24">
      <div className="bg-primary rounded-2xl p-6 text-on-primary relative overflow-hidden shadow-lg shadow-primary/10">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-secondary-fixed/20 border-2 border-secondary-fixed flex items-center justify-center text-secondary-fixed">
              <Bot size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-secondary-fixed">SSB AI Mentor</h2>
              <p className="text-[10px] text-on-primary-container font-bold">Online — Powered by Groq AI</p>
            </div>
          </div>
          <p className="text-on-primary-container text-xs">Select a module to begin your coaching session.</p>
        </div>
        <Shield className="absolute -right-4 -bottom-4 w-32 h-32 text-on-primary/10" />
      </div>

      <div className="grid grid-cols-1 gap-3">
        {modules.map((module) => (
          <Card
            key={module.id}
            className="p-4 flex items-center gap-4 card-hover cursor-pointer border-outline-variant/20"
            onClick={() => setSelectedModule(module.id)}
          >
            <div className="w-12 h-12 bg-primary-container text-secondary-fixed rounded-xl flex items-center justify-center flex-shrink-0">
              {module.icon}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-primary text-sm">{module.title}</h4>
              <p className="text-xs text-text-secondary truncate">{module.desc}</p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AIMentor;
