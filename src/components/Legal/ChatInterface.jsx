import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { legalAPI } from '../../services/api';
import { Send, Bot, User, Loader2, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

const LEGAL_DISCLAIMER = `⚠️ DISCLAIMER: This is general information only, not legal advice. Please consult a qualified lawyer for your specific situation.`;

const ChatInterface = () => {
    const { user } = useAuth();
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [chatId, setChatId] = useState(null);
    const messagesEndRef = useRef(null);

    // Sample pre-loaded messages for demo
    useEffect(() => {
        const demoMessages = [
            {
                role: 'assistant',
                content: `Hello! I'm SafeHer's Legal Information Assistant. I can help you understand your legal rights and the process of reporting incidents in India.\n\nHow can I assist you today?\n\n${LEGAL_DISCLAIMER}`,
                timestamp: new Date().toISOString(),
            }
        ];
        setMessages(demoMessages);
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!input.trim() || loading) return;

        const userMessage = input.trim();
        setInput('');

        // Add user message to UI
        const newUserMessage = {
            role: 'user',
            content: userMessage,
            timestamp: new Date().toISOString(),
        };
        setMessages(prev => [...prev, newUserMessage]);
        setLoading(true);

        try {
            // Call backend legal API (uses OpenAI if configured)
            const resp = await legalAPI.chat({ message: userMessage, chatId });

            const aiResponse = resp.data?.response;
            const returnedChatId = resp.data?.chatId;

            const newAssistantMessage = {
                role: 'assistant',
                content: aiResponse || 'Sorry, no response available.',
                timestamp: new Date().toISOString(),
            };

            setMessages(prev => [...prev, newAssistantMessage]);
            setChatId(returnedChatId || chatId);
            saveChatToStorage(userMessage, aiResponse || '');

        } catch (error) {
            console.error('Chat error:', error);
            toast.error('Failed to get response. Please try again.');

            // Add error message
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: `I'm sorry, I'm having trouble responding right now. Please try again in a moment.\n\n${LEGAL_DISCLAIMER}`,
                timestamp: new Date().toISOString(),
                isError: true,
            }]);
        } finally {
            setLoading(false);
        }
    };

    // Note: Backend handles AI generation; client keeps a lightweight fallback if API fails.

    const saveChatToStorage = (userMsg, assistantMsg) => {
        try {
            const chats = JSON.parse(localStorage.getItem('safeher_chats') || '[]');
            chats.push({
                userMessage: userMsg,
                assistantMessage: assistantMsg,
                timestamp: new Date().toISOString()
            });
            localStorage.setItem('safeher_chats', JSON.stringify(chats.slice(-50)));
        } catch (error) {
            console.error('Error saving chat:', error);
        }
    };

    const suggestedQuestions = [
        'How do I file an FIR?',
        'What are my rights against harassment?',
        'Tell me about domestic violence laws',
        'What should I do if police refuse to help?',
    ];

    return (
        <div className="flex flex-col h-[calc(100vh-90px)]">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 p-4">
                <div className="container flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-600 to-pink-500 flex items-center justify-center">
                        <Bot size={20} className="text-white" />
                    </div>
                    <div>
                        <h1 className="font-semibold text-gray-900">Legal Assistant</h1>
                        <p className="text-xs text-gray-500">AI-powered legal information</p>
                    </div>
                </div>
            </div>

            {/* Disclaimer Banner */}
            <div className="bg-amber-50 border-b border-amber-200 px-4 py-2">
                <div className="container flex items-center gap-2 text-amber-700 text-xs">
                    <AlertTriangle size={14} />
                    <span>This provides general information only, not legal advice</span>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4">
                <div className="container space-y-4">
                    {messages.map((message, index) => (
                        <div
                            key={index}
                            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div className={`flex gap-2 max-w-[90%] ${message.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                {/* Avatar */}
                                <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center ${message.role === 'user'
                                        ? 'bg-blue-600'
                                        : 'bg-blue-600 '
                                    }`}>
                                    {message.role === 'user'
                                        ? <User size={16} className="text-white" />
                                        : <Bot size={16} className="text-white" />
                                    }
                                </div>

                                {/* Message Bubble */}
                                <div className={`chat-bubble ${message.role === 'user' ? 'chat-bubble-user' : 'chat-bubble-assistant'
                                    } ${message.isError ? 'border-red-200 bg-red-50' : ''}`}>
                                    <div className="whitespace-pre-wrap text-sm">
                                        {message.content}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}

                    {/* Loading indicator */}
                    {loading && (
                        <div className="flex justify-start">
                            <div className="flex gap-2">
                                <div className="w-8 h-8 rounded-full bg-blue-600  flex items-center justify-center">
                                    <Bot size={16} className="text-white" />
                                </div>
                                <div className="chat-bubble chat-bubble-assistant">
                                    <div className="flex items-center gap-2">
                                        <Loader2 size={16} className="animate-spin" />
                                        <span className="text-sm">Thinking...</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>
            </div>

            {/* Suggested Questions */}
            {messages.length <= 1 && (
                <div className="px-4 pb-2">
                    <div className="container">
                        <p className="text-xs text-gray-500 mb-2">Suggested questions:</p>
                        <div className="flex flex-wrap gap-2">
                            {suggestedQuestions.map((q, i) => (
                                <button
                                    key={i}
                                    onClick={() => setInput(q)}
                                    className="text-xs px-3 py-1.5 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                                >
                                    {q}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Input */}
            <div className="border-t border-gray-200 p-4 bg-white">
                <div className="container">
                    <form onSubmit={handleSubmit} className="flex gap-2">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Ask about your legal rights..."
                            className="input flex-1"
                            disabled={loading}
                        />
                        <button
                            type="submit"
                            disabled={!input.trim() || loading}
                            className="btn btn-primary px-4"
                        >
                            <Send size={18} />
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ChatInterface;
