import dotenv from 'dotenv';
import { isDemoMode, simulateSMSDelivery } from './demoService.js';
dotenv.config();

let client = null;
let fromNumber = process.env.TWILIO_PHONE_NUMBER;

try {
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
        const Twilio = await import('twilio');
        client = Twilio.default(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    }
} catch (error) {
    console.warn('Twilio not configured:', error.message);
}

export const sendEmergencySMS = async ({ to, body }) => {
    if (!to) throw new Error('Recipient phone number required');

    // Demo mode - return realistic simulated response
    if (isDemoMode()) {
        return simulateSMSDelivery(to, body);
    }

    // Real mode - attempt actual SMS delivery
    if (!client) {
        console.warn('⚠️  SMS service not configured. Set Twilio credentials or enable DEMO_MODE.');
        throw new Error('SMS service not available');
    }

    try {
        const msg = await client.messages.create({
            body,
            from: fromNumber,
            to,
        });
        console.log('📱 SMS sent:', msg.sid);
        return { success: true, sid: msg.sid };
    } catch (error) {
        console.error('SMS send error:', error);
        throw error;
    }
};

export default { sendEmergencySMS };
