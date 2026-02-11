import express from 'express';
import { verifyToken, optionalAuth } from '../middleware/auth.js';
import { db } from '../config/firebase.js';
import { generateLegalResponse, generateFIRDraft } from '../services/openaiService.js';

const router = express.Router();

// POST /api/legal/chat
router.post('/chat', optionalAuth, async (req, res) => {
    try {
        const { message, chatId } = req.body;

        if (!message || !message.trim()) {
            return res.status(400).json({ error: 'Message is required' });
        }

        // Generate AI response
        const response = await generateLegalResponse(message);

        // Add disclaimer
        const disclaimer = '\n\n⚠️ DISCLAIMER: This is general information only, not legal advice. Please consult a qualified lawyer for your specific situation.';
        const fullResponse = response + disclaimer;

        // Save to Firestore when authenticated; otherwise respond without persistence
        let savedChatId = chatId;
        const timestamp = new Date().toISOString();

        if (req.userId) {
            if (chatId) {
                // Add to existing chat
                const chatRef = db.collection('legalChats').doc(chatId);
                const chatDoc = await chatRef.get();

                if (chatDoc.exists) {
                    const existingMessages = chatDoc.data().messages || [];
                    await chatRef.update({
                        messages: [
                            ...existingMessages,
                            { role: 'user', content: message, timestamp },
                            { role: 'assistant', content: fullResponse, timestamp }
                        ],
                        lastMessageAt: timestamp
                    });
                }
            } else {
                // Create new chat
                const newChatRef = await db.collection('legalChats').add({
                    userId: req.userId,
                    messages: [
                        { role: 'user', content: message, timestamp },
                        { role: 'assistant', content: fullResponse, timestamp }
                    ],
                    createdAt: timestamp,
                    lastMessageAt: timestamp
                });
                savedChatId = newChatRef.id;
            }
        } else {
            savedChatId = null;
        }

        res.json({
            response: fullResponse,
            chatId: savedChatId,
            disclaimer
        });

    } catch (error) {
        console.error('Legal chat error:', error);
        res.status(500).json({ error: 'Failed to get legal response' });
    }
});

// GET /api/legal/chat/:chatId
router.get('/chat/:chatId', verifyToken, async (req, res) => {
    try {
        const { chatId } = req.params;

        const chatDoc = await db.collection('legalChats').doc(chatId).get();

        if (!chatDoc.exists) {
            return res.status(404).json({ error: 'Chat not found' });
        }

        const chat = chatDoc.data();

        // Verify ownership
        if (chat.userId !== req.userId) {
            return res.status(403).json({ error: 'Access denied' });
        }

        res.json({
            id: chatId,
            messages: chat.messages || [],
            createdAt: chat.createdAt,
            lastMessageAt: chat.lastMessageAt
        });

    } catch (error) {
        console.error('Get chat error:', error);
        res.status(500).json({ error: 'Failed to get chat history' });
    }
});

// POST /api/legal/generate-fir
router.post('/generate-fir', optionalAuth, async (req, res) => {
    try {
        const { incidentDetails, incidentId } = req.body;

        if (!incidentDetails) {
            return res.status(400).json({ error: 'Incident details are required' });
        }

        // Get user data if authenticated
        let userData = {};
        if (req.userId) {
            const userDoc = await db.collection('users').doc(req.userId).get();
            userData = userDoc.exists ? userDoc.data() : {};
        }

        // Generate FIR using AI
        const firText = await generateFIRDraft({
            ...incidentDetails,
            userName: userData.name,
            userPhone: userData.phone
        });

        // Save to Firestore when authenticated
        let firId = null;
        if (req.userId) {
            const firRef = await db.collection('firDrafts').add({
                userId: req.userId,
                incidentId: incidentId || null,
                generatedAt: new Date().toISOString(),
                incidentDetails,
                generatedText: firText,
            });
            firId = firRef.id;
        }

        res.json({
            firId,
            firText,
            message: 'FIR draft generated successfully'
        });

    } catch (error) {
        console.error('Generate FIR error:', error);
        res.status(500).json({ error: 'Failed to generate FIR draft' });
    }
});

export default router;
