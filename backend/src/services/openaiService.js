import OpenAI from 'openai';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { isDemoMode, getDemoLegalResponse } from './demoService.js';

dotenv.config();

let openai;
let gemini;

try {
    if (process.env.OPENAI_API_KEY) {
        openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });
    }
    if (process.env.GEMINI_API_KEY) {
        gemini = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    }
} catch (error) {
    console.warn('OpenAI not configured:', error.message);
}

// Anthropic support (Claude family). Enabled when ANTHROPIC_API_KEY is set.
const hasAnthropic = !!process.env.ANTHROPIC_API_KEY;
const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL || 'claude-haiku-4.5';
const ANTHROPIC_ENDPOINT = process.env.ANTHROPIC_ENDPOINT || 'https://api.anthropic.com/v1/complete';

// Gemini support (Google Generative AI). Enabled when GEMINI_API_KEY is set.
const hasGemini = !!process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-1.5-flash';

const LEGAL_SYSTEM_PROMPT = `You are SafeHer's Legal Information Assistant, designed to help women understand their legal rights and the process of reporting incidents in India.

CRITICAL RULES:
1. You are NOT a lawyer and do NOT provide legal advice
2. You provide GENERAL legal information only
3. ALWAYS recommend consulting a qualified lawyer for specific situations
4. Be empathetic, supportive, and clear in your communication
5. Focus on Indian laws related to women's safety (IPC sections, POCSO, domestic violence, etc.)
6. Provide practical steps when possible
7. Include relevant helpline numbers when appropriate

KEY TOPICS YOU CAN HELP WITH:
- Filing an FIR (First Information Report)
- Women's safety laws in India
- Harassment and how to report it
- Domestic violence protection
- Rights during police interaction
- Documentation of incidents
- Legal remedies available

ALWAYS maintain a supportive and professional tone.`;

// Fallback responses when OpenAI is not available
const fallbackResponses = {
    fir: `Here's what you need to know about filing an FIR:

**What is an FIR?**
An FIR is a written document prepared by police when they receive information about a cognizable offense.

**How to File:**
1. Visit the nearest police station
2. Provide your statement verbally or in writing
3. Include: date, time, place, description of incident
4. Police must register FIR for cognizable offenses

**Your Rights:**
• File a Zero FIR at any station
• Get a free copy of the FIR
• If refused, approach the Superintendent of Police`,

    harassment: `**Understanding Harassment Laws:**

**Types:**
1. Workplace - Sexual Harassment at Workplace Act, 2013
2. Street - IPC Section 354A
3. Cyber - IT Act Section 66E, 67

**Steps:**
• Document everything
• Report to authorities
• File police complaint if criminal`,

    domestic: `**Domestic Violence Protection:**

**Protection of Women from Domestic Violence Act, 2005**

**Available Remedies:**
1. Protection Order
2. Residence Order
3. Monetary Relief
4. Custody Order

**Get Help:**
• Women Helpline: 181
• Police: 100`,

    rights: `**Your Rights with Police:**

• Right to dignity and respect
• Female officer presence during questioning
• Right to free legal aid
• No arrest after sunset/before sunrise (usually)
• Medical examination by female doctor only

**Emergency Numbers:**
• Police: 100
• Women Helpline: 181
• Emergency: 112`,

    default: `I can help you with:
• Filing an FIR
• Harassment laws
• Domestic violence protection
• Your rights with police

Please ask about any of these topics.

**Quick Contacts:**
• Emergency: 112
• Women Helpline: 181
• Police: 100`
};

// Generate legal response
export const generateLegalResponse = async (message) => {
    // Demo mode - return realistic cached response
    if (isDemoMode()) {
        console.log('💬 [DEMO MODE] Generating legal response');
        return getDemoLegalResponse(message);
    }

    // If OpenAI is configured, use it
    // Prefer Gemini if configured
    if (hasGemini && gemini) {
        try {
            const model = gemini.getGenerativeModel({
                model: GEMINI_MODEL,
                systemInstruction: LEGAL_SYSTEM_PROMPT
            });

            const result = await model.generateContent(message);
            return result.response.text();
        } catch (error) {
            console.warn('Gemini API unavailable, using fallback responses');
            // fall through to fallback
        }
    }

    // Prefer Anthropic if configured
    if (hasAnthropic) {
        try {
            const prompt = `
System: ${LEGAL_SYSTEM_PROMPT}

Human: ${message}

Assistant:`;

            const resp = await fetch(ANTHROPIC_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-API-Key': process.env.ANTHROPIC_API_KEY,
                    'Authorization': `Bearer ${process.env.ANTHROPIC_API_KEY}`
                },
                body: JSON.stringify({
                    model: ANTHROPIC_MODEL,
                    prompt,
                    max_tokens_to_sample: 800,
                    temperature: 0.7,
                })
            });

            const data = await resp.json();
            // Anthropic may return 'completion' or 'text'
            return data.completion || data.text || '';
        } catch (error) {
            console.error('Anthropic error:', error);
            // fall through to OpenAI or fallback
        }
    }

    if (openai) {
        try {
            const completion = await openai.chat.completions.create({
                model: 'gpt-3.5-turbo',
                messages: [
                    { role: 'system', content: LEGAL_SYSTEM_PROMPT },
                    { role: 'user', content: message }
                ],
                max_tokens: 800,
                temperature: 0.7,
            });

            return completion.choices[0].message.content;
        } catch (error) {
            console.error('OpenAI error:', error);
            // Fall through to fallback
        }
    }

    // Fallback responses based on keywords
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes('fir') || lowerMessage.includes('first information')) {
        return fallbackResponses.fir;
    }
    if (lowerMessage.includes('harass')) {
        return fallbackResponses.harassment;
    }
    if (lowerMessage.includes('domestic') || lowerMessage.includes('violence') || lowerMessage.includes('husband')) {
        return fallbackResponses.domestic;
    }
    if (lowerMessage.includes('right') || lowerMessage.includes('police')) {
        return fallbackResponses.rights;
    }

    return fallbackResponses.default;
};

// Generate FIR draft
export const generateFIRDraft = async (details) => {
    const { incidentDate, incidentTime, incidentLocation, description, accusedName, accusedDescription, witnessName, witnessContact, userName, userPhone } = details;

    const currentDate = new Date().toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
    });

    // If OpenAI is configured, use it to enhance the description
    let enhancedDescription = description;
    // Prefer Gemini if configured
    if (hasGemini && gemini) {
        try {
            const model = gemini.getGenerativeModel({
                model: GEMINI_MODEL,
                systemInstruction: 'You are a legal document assistant. Improve the clarity and structure of incident descriptions for FIR filing. Keep all facts exactly as provided. Do not add any false information.'
            });
            const result = await model.generateContent(description);
            enhancedDescription = result.response.text();
        } catch (error) {
            console.error('Gemini error for FIR:', error);
            // fall back to Anthropic / OpenAI / original
        }
    } else if (hasAnthropic) {
        try {
            const prompt = `You are a legal document assistant. Improve the clarity and structure of incident descriptions for FIR filing. Keep all facts exactly as provided. Do not add any false information.\n\nINCIDENT DESCRIPTION:\n${description}`;

            const resp = await fetch(ANTHROPIC_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-API-Key': process.env.ANTHROPIC_API_KEY,
                    'Authorization': `Bearer ${process.env.ANTHROPIC_API_KEY}`
                },
                body: JSON.stringify({ model: ANTHROPIC_MODEL, prompt, max_tokens_to_sample: 500, temperature: 0.3 })
            });

            const data = await resp.json();
            enhancedDescription = data.completion || data.text || enhancedDescription;
        } catch (error) {
            console.error('Anthropic error for FIR:', error);
            // fall back to OpenAI / original
        }
    } else if (openai) {
        try {
            const completion = await openai.chat.completions.create({
                model: 'gpt-3.5-turbo',
                messages: [
                    {
                        role: 'system',
                        content: 'You are a legal document assistant. Improve the clarity and structure of incident descriptions for FIR filing. Keep all facts exactly as provided. Do not add any false information. Output should be clear, formal, and suitable for an official document.'
                    },
                    {
                        role: 'user',
                        content: `Please improve the clarity of this incident description for an FIR: ${description}`
                    }
                ],
                max_tokens: 500,
                temperature: 0.3,
            });

            enhancedDescription = completion.choices[0].message.content;
        } catch (error) {
            console.error('OpenAI error for FIR:', error);
            // Use original description
        }
    }

    return `══════════════════════════════════════════════════════════════
                    DRAFT FIRST INFORMATION REPORT (FIR)
══════════════════════════════════════════════════════════════

⚠️ IMPORTANT DISCLAIMER:
This is a DRAFT document generated by SafeHer AI. It is intended to help 
you organize information before visiting a police station. This is NOT a 
legally filed FIR. Please review with a legal professional before 
submission to authorities.

══════════════════════════════════════════════════════════════

TO: The Station House Officer
Police Station: _________________________
District: _________________________

SUBJECT: Request for Registration of FIR

COMPLAINANT DETAILS:
────────────────────────────────────────────────────────────────
Name: ${userName || '[Your Full Name]'}
Phone: ${userPhone || '[Your Phone Number]'}
Address: [Your Complete Address]
Date of Filing: ${currentDate}

══════════════════════════════════════════════════════════════
                        INCIDENT DETAILS
══════════════════════════════════════════════════════════════

Date of Incident: ${incidentDate || '[Date]'}
Approximate Time: ${incidentTime || '[Time]'}
Place of Incident: ${incidentLocation || '[Location]'}

────────────────────────────────────────────────────────────────
DESCRIPTION OF INCIDENT:
────────────────────────────────────────────────────────────────

${enhancedDescription}

══════════════════════════════════════════════════════════════
                    ACCUSED PERSON DETAILS
══════════════════════════════════════════════════════════════
${accusedName ? `
Name (if known): ${accusedName}
Description: ${accusedDescription || '[Physical description]'}
` : 'Accused person details unknown at this time.'}

══════════════════════════════════════════════════════════════
                      WITNESS INFORMATION
══════════════════════════════════════════════════════════════
${witnessName ? `
Witness Name: ${witnessName}
Contact: ${witnessContact || '[Not provided]'}
` : 'No witnesses to report at this time.'}

══════════════════════════════════════════════════════════════
                         PRAYER/REQUEST
══════════════════════════════════════════════════════════════

I, the undersigned, request that this FIR be registered and 
appropriate action be taken against the accused person(s) as 
per the law.

I solemnly declare that the information provided above is true 
and correct to the best of my knowledge and belief.


Signature: ________________________

Date: ${currentDate}

Place: ________________________


══════════════════════════════════════════════════════════════
                        END OF DRAFT FIR
══════════════════════════════════════════════════════════════

Generated by SafeHer - AI-Powered Women Safety Platform

⚠️ REMINDER: This is a preliminary draft. Please:
1. Review all details carefully
2. Consult with a lawyer if possible
3. Take this draft to the nearest police station
`;
};

export default { generateLegalResponse, generateFIRDraft };
