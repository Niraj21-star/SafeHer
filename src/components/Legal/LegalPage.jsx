import { useState } from 'react';
import ChatInterface from './ChatInterface';
import FIRGenerator from './FIRGenerator';
import { MessageSquare, FileText } from 'lucide-react';

const LegalPage = () => {
    const [activeTab, setActiveTab] = useState('chat');

    return (
        <div className="min-h-screen">
            {/* Tab Navigation */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
                <div className="container flex">
                    <button
                        onClick={() => setActiveTab('chat')}
                        className={`flex-1 py-4 px-4 flex items-center justify-center gap-2 font-medium transition-colors ${activeTab === 'chat'
                                ? 'text-blue-600 border-b-2 border-blue-600'
                                : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        <MessageSquare size={18} />
                        <span>Legal Chat</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('fir')}
                        className={`flex-1 py-4 px-4 flex items-center justify-center gap-2 font-medium transition-colors ${activeTab === 'fir'
                                ? 'text-blue-600 border-b-2 border-blue-600'
                                : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        <FileText size={18} />
                        <span>FIR Generator</span>
                    </button>
                </div>
            </div>

            {/* Content */}
            {activeTab === 'chat' ? (
                <ChatInterface />
            ) : (
                <FIRGenerator onBack={() => setActiveTab('chat')} />
            )}
        </div>
    );
};

export default LegalPage;
