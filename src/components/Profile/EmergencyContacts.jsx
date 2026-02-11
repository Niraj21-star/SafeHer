import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
    ArrowLeft,
    Plus,
    User,
    Mail,
    Phone,
    Heart,
    Trash2,
    Edit2,
    Check,
    X,
    AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

const EmergencyContacts = ({ onBack }) => {
    const { userProfile, updateEmergencyContacts } = useAuth();
    const [contacts, setContacts] = useState(userProfile?.emergencyContacts || []);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        relation: '',
    });

    const relationOptions = [
        'Mother', 'Father', 'Sister', 'Brother',
        'Husband', 'Friend', 'Colleague', 'Other'
    ];

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const resetForm = () => {
        setFormData({ name: '', email: '', phone: '', relation: '' });
        setShowForm(false);
        setEditingId(null);
    };

    const validateForm = () => {
        if (!formData.name.trim()) {
            toast.error('Name is required');
            return false;
        }
        if (!formData.email.trim()) {
            toast.error('Email is required');
            return false;
        }
        if (!formData.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
            toast.error('Please enter a valid email');
            return false;
        }
        return true;
    };

    const handleAdd = async () => {
        if (!validateForm()) return;

        const newContact = {
            id: Date.now().toString(),
            ...formData,
        };

        const updatedContacts = [...contacts, newContact];
        await saveContacts(updatedContacts);
    };

    const handleEdit = (contact) => {
        setEditingId(contact.id);
        setFormData({
            name: contact.name,
            email: contact.email,
            phone: contact.phone || '',
            relation: contact.relation || '',
        });
        setShowForm(true);
    };

    const handleUpdate = async () => {
        if (!validateForm()) return;

        const updatedContacts = contacts.map(c =>
            c.id === editingId ? { ...c, ...formData } : c
        );
        await saveContacts(updatedContacts);
    };

    const handleDelete = async (id) => {
        const confirmed = window.confirm('Remove this contact?');
        if (!confirmed) return;

        const updatedContacts = contacts.filter(c => c.id !== id);
        await saveContacts(updatedContacts);
    };

    const saveContacts = async (updatedContacts) => {
        setLoading(true);
        const result = await updateEmergencyContacts(updatedContacts);
        setLoading(false);

        if (result.success) {
            setContacts(updatedContacts);
            resetForm();
            if (result.offline) {
                toast.success('Saved locally. Will sync when online.');
            } else {
                toast.success(editingId ? 'Contact updated!' : 'Contact added!');
            }
        } else {
            toast.error('Failed to save contacts');
        }
    };

    return (
        <div className="page-container pt-6">
            <div className="container">
                {/* Header */}
                <div className="flex items-center gap-3 mb-6">
                    <button
                        onClick={onBack}
                        className="p-2 -ml-2 hover:bg-gray-100 rounded-lg"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Emergency Contacts</h1>
                        <p className="text-sm text-gray-500">
                            {contacts.length} of 5 contacts added
                        </p>
                    </div>
                </div>

                {/* Info Box */}
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
                    <div className="flex items-start gap-3">
                        <AlertCircle size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-blue-700">
                            These contacts will receive an email alert with your live location link
                            when you trigger an SOS emergency.
                        </p>
                    </div>
                </div>

                {/* Contacts List */}
                {contacts.length > 0 && !showForm && (
                    <div className="space-y-3 mb-6">
                        {contacts.map((contact) => (
                            <div key={contact.id} className="card">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-400 to-pink-600 flex items-center justify-center text-white font-semibold">
                                            {contact.name.charAt(0)}
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-gray-900">{contact.name}</h3>
                                            {contact.relation && (
                                                <span className="text-xs text-pink-600 bg-pink-50 px-2 py-0.5 rounded-full">
                                                    {contact.relation}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex gap-1">
                                        <button
                                            onClick={() => handleEdit(contact)}
                                            className="p-2 hover:bg-gray-100 rounded-lg"
                                        >
                                            <Edit2 size={16} className="text-gray-400" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(contact.id)}
                                            className="p-2 hover:bg-red-50 rounded-lg"
                                        >
                                            <Trash2 size={16} className="text-red-400" />
                                        </button>
                                    </div>
                                </div>

                                <div className="mt-3 space-y-1 text-sm">
                                    <div className="flex items-center gap-2 text-gray-600">
                                        <Mail size={14} className="text-gray-400" />
                                        {contact.email}
                                    </div>
                                    {contact.phone && (
                                        <div className="flex items-center gap-2 text-gray-600">
                                            <Phone size={14} className="text-gray-400" />
                                            {contact.phone}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Empty State */}
                {contacts.length === 0 && !showForm && (
                    <div className="text-center py-12 mb-6">
                        <div className="w-16 h-16 mx-auto rounded-full bg-gray-100 flex items-center justify-center mb-4">
                            <Heart size={32} className="text-gray-400" />
                        </div>
                        <h3 className="font-semibold text-gray-900 mb-2">No Contacts Yet</h3>
                        <p className="text-gray-500 text-sm mb-4">
                            Add trusted people who should be notified during emergencies
                        </p>
                    </div>
                )}

                {/* Add/Edit Form */}
                {showForm && (
                    <div className="card mb-6 slide-up">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold text-gray-900">
                                {editingId ? 'Edit Contact' : 'Add New Contact'}
                            </h3>
                            <button onClick={resetForm} className="p-1 hover:bg-gray-100 rounded">
                                <X size={18} className="text-gray-400" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="label">Name *</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-3 text-gray-400" size={18} />
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        placeholder="Contact name"
                                        className="input pl-10"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="label">Email *</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-3 text-gray-400" size={18} />
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        placeholder="contact@email.com"
                                        className="input pl-10"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="label">Phone</label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-3 text-gray-400" size={18} />
                                    <input
                                        type="tel"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        placeholder="+91-XXXXXXXXXX"
                                        className="input pl-10"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="label">Relationship</label>
                                <select
                                    name="relation"
                                    value={formData.relation}
                                    onChange={handleChange}
                                    className="input"
                                >
                                    <option value="">Select relationship</option>
                                    {relationOptions.map(r => (
                                        <option key={r} value={r}>{r}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={resetForm}
                                    className="btn btn-secondary flex-1"
                                    disabled={loading}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={editingId ? handleUpdate : handleAdd}
                                    className="btn btn-primary flex-1"
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <span className="spinner" />
                                    ) : (
                                        <>
                                            <Check size={18} />
                                            {editingId ? 'Update' : 'Add Contact'}
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Add Button */}
                {!showForm && contacts.length < 5 && (
                    <button
                        onClick={() => setShowForm(true)}
                        className="btn btn-primary w-full"
                    >
                        <Plus size={18} />
                        Add Emergency Contact
                    </button>
                )}

                {contacts.length >= 5 && !showForm && (
                    <p className="text-center text-gray-500 text-sm">
                        Maximum 5 contacts allowed
                    </p>
                )}
            </div>
        </div>
    );
};

export default EmergencyContacts;
