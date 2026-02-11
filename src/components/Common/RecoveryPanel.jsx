import { useState } from 'react';
import { 
    Heart, 
    FileText, 
    Shield, 
    Phone, 
    Download, 
    CheckCircle, 
    ExternalLink,
    Scale,
    Users
} from 'lucide-react';
import { incidentsAPI } from '../../services/api';
import toast from 'react-hot-toast';

const RecoveryPanel = ({ incidentId, onComplete }) => {
    const [loading, setLoading] = useState(false);
    const [activeSection, setActiveSection] = useState('overview');

    const handleCompleteRecovery = async () => {
        setLoading(true);
        try {
            await incidentsAPI.completeRecovery(incidentId);
            toast.success('Recovery completed successfully. Take care.');
            if (onComplete) onComplete();
        } catch (error) {
            console.error('Error completing recovery:', error);
            toast.error('Failed to complete recovery');
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadEvidence = async () => {
        try {
            const response = await incidentsAPI.downloadEvidence(incidentId);
            const blob = new Blob([response.data], { type: 'text/plain' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `SafeHer_Incident_${incidentId}.txt`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
            toast.success('Incident report downloaded successfully.');
        } catch (error) {
            console.error('Error downloading evidence:', error);
            toast.error('Failed to download evidence');
        }
    };

    const legalResources = [
        {
            title: 'Know Your Rights',
            description: 'Understand your legal rights in emergency situations',
            points: [
                'Right to file FIR immediately at any police station',
                'Right to medical examination within 24 hours',
                'Right to free legal aid through Legal Services Authority',
                'Right to protection under IPC Sections 354, 509, and others'
            ]
        },
        {
            title: 'Immediate Legal Steps',
            description: 'Actions you should take now',
            points: [
                'File FIR with detailed incident description',
                'Preserve all evidence (messages, photos, timestamps)',
                'Get medical examination if applicable',
                'Note down witness names and contact details'
            ]
        }
    ];

    const mentalHealthResources = [
        {
            name: 'National Women\'s Helpline',
            number: '181',
            description: '24x7 support for women in distress',
            type: 'call'
        },
        {
            name: 'Women in Distress',
            number: '1091',
            description: 'Immediate assistance and counseling',
            type: 'call'
        },
        {
            name: 'NIMHANS Crisis Helpline',
            number: '080-46110007',
            description: 'Mental health support and counseling',
            type: 'call'
        },
        {
            name: 'Vandrevala Foundation',
            number: '1860 2662 345',
            description: 'Free mental health counseling',
            type: 'call'
        }
    ];

    const ngoResources = [
        {
            name: 'National Commission for Women',
            website: 'http://ncw.nic.in',
            description: 'File complaints and seek assistance'
        },
        {
            name: 'Women Power Line',
            website: 'https://wcd.nic.in',
            description: 'Government support for women\'s safety'
        },
        {
            name: 'Sneha Foundation',
            website: 'https://snehamumbai.org',
            description: 'Crisis intervention and counseling'
        }
    ];

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4 overflow-y-auto">
            <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full my-8 animate-scale-in">
                {/* Header */}
                <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-6 rounded-t-xl">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                            <Heart size={24} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold">Recovery & Support</h2>
                            <p className="text-green-100 text-sm">You're safe now. Resources available to support you.</p>
                        </div>
                    </div>
                </div>

                {/* Navigation Tabs */}
                <div className="flex border-b border-gray-200 bg-gray-50">
                    {[
                        { id: 'overview', label: 'Overview', icon: Shield },
                        { id: 'legal', label: 'Legal Rights', icon: Scale },
                        { id: 'support', label: 'Support', icon: Heart },
                        { id: 'evidence', label: 'Evidence', icon: FileText }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveSection(tab.id)}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 font-medium transition-colors ${
                                activeSection === tab.id
                                    ? 'border-b-2 border-green-600 text-green-600 bg-white'
                                    : 'text-gray-600 hover:text-green-600 hover:bg-white'
                            }`}
                        >
                            <tab.icon size={18} />
                            <span className="hidden sm:inline">{tab.label}</span>
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="p-6 max-h-[60vh] overflow-y-auto">
                    {activeSection === 'overview' && (
                        <div className="space-y-6">
                            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                <div className="flex items-start gap-3">
                                    <CheckCircle size={24} className="text-green-600 flex-shrink-0 mt-1" />
                                    <div>
                                        <h3 className="font-semibold text-green-900 mb-1">Incident Resolved Successfully</h3>
                                        <p className="text-sm text-green-700">
                                            Your emergency has been marked as resolved. Access recovery resources and legal guidance below.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="grid sm:grid-cols-2 gap-4">
                                <div className="card border-2 border-blue-200 hover:border-blue-400 cursor-pointer transition-colors"
                                    onClick={() => setActiveSection('legal')}>
                                    <Scale size={32} className="text-blue-600 mb-3" />
                                    <h4 className="font-semibold text-gray-900 mb-2">Legal Resources</h4>
                                    <p className="text-sm text-gray-600">
                                        Understand your rights and next legal steps
                                    </p>
                                </div>

                                <div className="card border-2 border-pink-200 hover:border-pink-400 cursor-pointer transition-colors"
                                    onClick={() => setActiveSection('support')}>
                                    <Heart size={32} className="text-pink-600 mb-3" />
                                    <h4 className="font-semibold text-gray-900 mb-2">Mental Health Support</h4>
                                    <p className="text-sm text-gray-600">
                                        Access counseling and emotional support services
                                    </p>
                                </div>

                                <div className="card border-2 border-purple-200 hover:border-purple-400 cursor-pointer transition-colors"
                                    onClick={() => setActiveSection('evidence')}>
                                    <FileText size={32} className="text-purple-600 mb-3" />
                                    <h4 className="font-semibold text-gray-900 mb-2">Evidence Summary</h4>
                                    <p className="text-sm text-gray-600">
                                        Download detailed incident documentation
                                    </p>
                                </div>

                                <div className="card border-2 border-green-200 hover:border-green-400 cursor-pointer transition-colors">
                                    <Users size={32} className="text-green-600 mb-3" />
                                    <h4 className="font-semibold text-gray-900 mb-2">NGO Support</h4>
                                    <p className="text-sm text-gray-600">
                                        Connect with organizations that can help
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeSection === 'legal' && (
                        <div className="space-y-6">
                            {legalResources.map((resource, index) => (
                                <div key={index} className="card bg-blue-50 border-blue-200">
                                    <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                                        <Scale size={20} />
                                        {resource.title}
                                    </h3>
                                    <p className="text-sm text-blue-700 mb-3">{resource.description}</p>
                                    <ul className="space-y-2">
                                        {resource.points.map((point, i) => (
                                            <li key={i} className="text-sm text-blue-800 flex items-start gap-2">
                                                <span className="text-blue-600 mt-1">•</span>
                                                <span>{point}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))}

                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                <p className="text-sm text-yellow-800">
                                    <strong>Important:</strong> This information is for guidance only. 
                                    Please consult with a qualified legal professional for specific advice.
                                </p>
                            </div>
                        </div>
                    )}

                    {activeSection === 'support' && (
                        <div className="space-y-6">
                            <div className="bg-pink-50 border border-pink-200 rounded-lg p-4 mb-4">
                                <h3 className="font-semibold text-pink-900 mb-2">Mental Health Helplines</h3>
                                <p className="text-sm text-pink-700">
                                    These services provide 24/7 support. Don't hesitate to reach out.
                                </p>
                            </div>

                            <div className="grid gap-3">
                                {mentalHealthResources.map((resource, index) => (
                                    <div key={index} className="card border border-pink-200 hover:border-pink-400 transition-colors">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <h4 className="font-semibold text-gray-900 mb-1">{resource.name}</h4>
                                                <p className="text-sm text-gray-600 mb-2">{resource.description}</p>
                                                <div className="flex items-center gap-2 text-pink-600 font-medium">
                                                    <Phone size={16} />
                                                    <a href={`tel:${resource.number}`} className="hover:underline">
                                                        {resource.number}
                                                    </a>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-6">
                                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                    <Users size={20} className="text-green-600" />
                                    NGO & Support Organizations
                                </h3>
                                <div className="grid gap-3">
                                    {ngoResources.map((ngo, index) => (
                                        <div key={index} className="card border border-gray-200">
                                            <h4 className="font-semibold text-gray-900 mb-1">{ngo.name}</h4>
                                            <p className="text-sm text-gray-600 mb-2">{ngo.description}</p>
                                            <a 
                                                href={ngo.website} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                                            >
                                                Visit Website <ExternalLink size={14} />
                                            </a>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeSection === 'evidence' && (
                        <div className="space-y-6">
                            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                                <h3 className="font-semibold text-purple-900 mb-2 flex items-center gap-2">
                                    <FileText size={20} />
                                    Incident Evidence Report
                                </h3>
                                <p className="text-sm text-purple-700 mb-3">
                                    A comprehensive report of your incident including timestamps, locations, 
                                    guardian responses, and all alert notifications.
                                </p>
                                <p className="text-sm text-purple-700">
                                    This report includes an integrity hash for verification purposes.
                                </p>
                            </div>

                            <button
                                onClick={handleDownloadEvidence}
                                className="w-full py-4 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-purple-800 transition-all shadow-lg flex items-center justify-center gap-3"
                            >
                                <Download size={20} />
                                Download Incident Report
                            </button>

                            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                                <p className="text-xs text-gray-600">
                                    <strong>Legal Disclaimer:</strong> This report is generated for documentation purposes 
                                    and is intended to support legal proceedings. It does not constitute legal advice or 
                                    official testimony. Consult with a qualified attorney for legal guidance.
                                </p>
                            </div>

                            <div className="space-y-2 text-sm text-gray-700">
                                <h4 className="font-semibold text-gray-900">Report Includes:</h4>
                                <ul className="space-y-1">
                                    <li className="flex items-center gap-2">
                                        <CheckCircle size={16} className="text-green-600" />
                                        Incident timestamp and location details
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <CheckCircle size={16} className="text-green-600" />
                                        All emergency contacts notified
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <CheckCircle size={16} className="text-green-600" />
                                        Guardian response details
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <CheckCircle size={16} className="text-green-600" />
                                        Complete incident timeline
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <CheckCircle size={16} className="text-green-600" />
                                        Evidence integrity hash
                                    </li>
                                </ul>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="border-t border-gray-200 p-4 bg-gray-50 rounded-b-xl flex gap-3">
                    <button
                        onClick={handleCompleteRecovery}
                        disabled={loading}
                        className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Processing...' : 'Mark Recovery Complete'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RecoveryPanel;
