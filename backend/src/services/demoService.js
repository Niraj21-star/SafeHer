/**
 * Demo Service - Centralized demo mode logic
 * Provides realistic simulated responses when DEMO_MODE=true
 */

import dotenv from 'dotenv';
dotenv.config();

const DEMO_MODE = process.env.DEMO_MODE === 'true';

export const isDemoMode = () => DEMO_MODE;

/**
 * Generate realistic SMS demo response
 */
export const simulateSMSDelivery = (to, message) => {
    console.log('📱 [DEMO MODE] SMS sent successfully');
    console.log(`   To: ${to}`);
    console.log(`   Message: ${message.substring(0, 100)}...`);
    
    return {
        success: true,
        demo: true,
        sid: `SM${Date.now()}${Math.random().toString(36).substr(2, 9)}`,
        to,
        timestamp: new Date().toISOString(),
        status: 'delivered'
    };
};

/**
 * Generate realistic email demo response
 */
export const simulateEmailDelivery = (to, subject) => {
    console.log('📧 [DEMO MODE] Email sent successfully');
    console.log(`   To: ${to}`);
    console.log(`   Subject: ${subject}`);
    
    return {
        success: true,
        demo: true,
        messageId: `<${Date.now()}.${Math.random().toString(36).substr(2, 9)}@safeher.demo>`,
        to,
        timestamp: new Date().toISOString()
    };
};

/**
 * Generate mock guardian responses for demo
 */
export const generateDemoGuardians = (count = 2) => {
    const guardianNames = [
        'Priya Sharma',
        'Rajesh Kumar',
        'Anjali Patel',
        'Vikram Singh',
        'Meera Desai'
    ];
    
    const guardians = [];
    for (let i = 0; i < count; i++) {
        guardians.push({
            id: `guardian_demo_${Date.now()}_${i}`,
            name: guardianNames[i % guardianNames.length],
            distance: (Math.random() * 10 + 10).toFixed(1), // 10 - 20 km
            eta: Math.floor(Math.random() * 20 + 15), // 15-35 minutes
            status: i === 0 ? 'responding' : 'notified',
            timestamp: new Date().toISOString()
        });
    }
    
    console.log(`👮 [DEMO MODE] ${count} guardians notified successfully`);
    return guardians;
};

/**
 * Simulate emergency services notification
 */
export const simulateEmergencyServices = () => {
    console.log('🚨 [DEMO MODE] Emergency services notified');
    
    return {
        success: true,
        demo: true,
        services: [
            { type: 'police', status: 'dispatched', eta: 8 },
            { type: 'medical', status: 'on-standby', eta: 12 }
        ],
        timestamp: new Date().toISOString()
    };
};

/**
 * Generate realistic AI legal response for demo
 */
export const getDemoLegalResponse = (query) => {
    const responses = {
        'default': `Based on your situation, here are the immediate legal steps you should consider:

1. **File an FIR Immediately**: Visit the nearest police station or use online FIR filing. Include all relevant details - time, location, and description of the incident.

2. **Preserve Evidence**: Take photographs, save any messages, and note down names of witnesses. This documentation will be crucial for your case.

3. **Medical Examination**: If applicable, get a medical examination done within 24 hours. The report serves as critical evidence.

4. **Legal Representation**: Consider consulting a lawyer who specializes in women's safety cases. Many organizations provide free legal aid.

5. **Support Services**: Contact local women's helplines (1091) or NGOs for emotional and legal support.

Remember: Your safety is the priority. You have the right to protection under IPC Sections 354, 509, and other relevant provisions.

*This is a simulated response for prototype evaluation. Please consult a qualified legal professional for actual legal advice.*`,
        
        'fir': `To file an FIR (First Information Report), you can:

**Option 1: In Person**
- Visit the nearest police station
- Provide a written statement of the incident
- Request a copy of the FIR (mandatory under law)

**Option 2: Online**
- Visit your state police website
- Look for "e-FIR" or "Online Complaint"
- Fill in the required details

**What to Include:**
- Date, time, and exact location
- Detailed description of the incident
- Names/descriptions of accused (if known)
- Names of witnesses (if any)
- Your contact information

**Important:** Police CANNOT refuse to register an FIR. If they do, contact the Superintendent of Police or file through the online portal.

*Demo response for prototype evaluation. Consult legal counsel for specific guidance.*`,
        
        'harassment': `Under Indian law, you are protected by several provisions:

**Relevant Laws:**
- IPC Section 354A: Sexual harassment
- IPC Section 354D: Stalking
- IPC Section 509: Words/gestures to insult modesty
- IT Act Section 67: Cyber harassment

**Immediate Actions:**
1. Document everything (screenshots, messages, dates)
2. File a complaint with the National Commission for Women (NCW)
3. Register an FIR at the police station
4. Block and report on all platforms

**Protection Available:**
- Restraining orders
- Police protection
- Free legal aid through Legal Services Authority
- Support from women's helpline: 181

The law is on your side. Take action immediately.

*Simulated legal guidance for demonstration purposes.*`
    };
    
    // Simple keyword matching for demo purposes
    const lowerQuery = query.toLowerCase();
    if (lowerQuery.includes('fir') || lowerQuery.includes('file') || lowerQuery.includes('complaint')) {
        return responses.fir;
    } else if (lowerQuery.includes('harassment') || lowerQuery.includes('stalk') || lowerQuery.includes('threat')) {
        return responses.harassment;
    }
    
    return responses.default;
};

/**
 * Log demo mode status on startup
 */
export const logDemoModeStatus = () => {
    if (DEMO_MODE) {
        console.log('\n🎭 ========================================');
        console.log('   DEMO MODE ENABLED');
        console.log('   External services will be simulated');
        console.log('   Responses will be realistic but not real');
        console.log('========================================\n');
    }
};

export default {
    isDemoMode,
    simulateSMSDelivery,
    simulateEmailDelivery,
    generateDemoGuardians,
    simulateEmergencyServices,
    getDemoLegalResponse,
    logDemoModeStatus
};
