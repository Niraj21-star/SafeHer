import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import { isDemoMode, simulateEmailDelivery } from './demoService.js';

dotenv.config();

// Create transporter
let transporter;

try {
    transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.GMAIL_USER,
            pass: process.env.GMAIL_APP_PASSWORD,
        },
    });
} catch (error) {
    console.warn('Email service not configured:', error.message);
}

// Email template for emergency alerts
const createEmergencyEmailHTML = ({ userName, userPhone, location, timestamp }) => {
    const mapsLink = location.mapsLink || `https://www.google.com/maps?q=${location.lat},${location.lng}`;

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Emergency Alert</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f9fafb;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <tr>
      <td>
        <!-- Header -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: linear-gradient(135deg, #DC2626, #991B1B); border-radius: 16px 16px 0 0; padding: 30px; text-align: center;">
          <tr>
            <td>
              <h1 style="color: #ffffff; margin: 0; font-size: 28px;">🚨 EMERGENCY ALERT</h1>
              <p style="color: #fecaca; margin: 10px 0 0; font-size: 16px;">SafeHer Safety Notification</p>
            </td>
          </tr>
        </table>

        <!-- Content -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none;">
          <tr>
            <td>
              <p style="font-size: 18px; color: #1f2937; margin: 0 0 20px;">
                <strong>${userName || 'A SafeHer user'}</strong> has triggered an emergency SOS alert.
              </p>

              <!-- Alert Details -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: #fef2f2; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
                <tr>
                  <td>
                    <p style="margin: 0 0 10px; color: #991b1b; font-weight: 600;">Alert Details:</p>
                    <p style="margin: 5px 0; color: #374151;">
                      <strong>Time:</strong> ${new Date(timestamp).toLocaleString('en-IN', {
        dateStyle: 'full',
        timeStyle: 'short',
        timeZone: 'Asia/Kolkata'
    })}
                    </p>
                    ${userPhone ? `<p style="margin: 5px 0; color: #374151;"><strong>Phone:</strong> ${userPhone}</p>` : ''}
                    <p style="margin: 5px 0; color: #374151;">
                      <strong>Location:</strong> ${location.address || `${location.lat}, ${location.lng}`}
                    </p>
                    <p style="margin: 5px 0; color: #374151;">
                      <strong>Accuracy:</strong> ${location.accuracy || 'Unknown'}
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Map Link Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 20px;">
                <tr>
                  <td align="center">
                    <a href="${mapsLink}" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #1E3A8A, #3B82F6); color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 12px; font-weight: 600; font-size: 16px;">
                      📍 View Location on Google Maps
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Action Steps -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: #eff6ff; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
                <tr>
                  <td>
                    <p style="margin: 0 0 10px; color: #1e3a8a; font-weight: 600;">Recommended Actions:</p>
                    <ol style="margin: 0; padding-left: 20px; color: #374151;">
                      <li style="margin-bottom: 8px;">Try to contact ${userName || 'them'} immediately</li>
                      <li style="margin-bottom: 8px;">Go to the shared location if you can</li>
                      <li style="margin-bottom: 8px;">Call emergency services (Police: 100, Women Helpline: 181)</li>
                      <li>Stay calm and keep this information accessible</li>
                    </ol>
                  </td>
                </tr>
              </table>

              <!-- Emergency Numbers -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: #f3f4f6; border-radius: 12px; padding: 15px; text-align: center;">
                <tr>
                  <td>
                    <p style="margin: 0; color: #6b7280; font-size: 14px;">
                      <strong>Emergency Numbers:</strong> Police: 100 | Women Helpline: 181 | Emergency: 112
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>

        <!-- Footer -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: #1f2937; border-radius: 0 0 16px 16px; padding: 20px; text-align: center;">
          <tr>
            <td>
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                This is an automated emergency alert from SafeHer - Women Safety App
              </p>
              <p style="margin: 10px 0 0; color: #6b7280; font-size: 11px;">
                If you believe you received this in error, please disregard this message.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
};

// Send emergency email
export const sendEmergencyEmail = async ({ to, recipientName, userName, userPhone, location, timestamp }) => {
    // Demo mode - return realistic simulated response
    if (isDemoMode()) {
        const subject = `🚨 EMERGENCY ALERT from ${userName || 'SafeHer User'}`;
        console.log('📧 [DEMO MODE] Email sent successfully');
        console.log(`   To: ${to}`);
        console.log(`   Subject: ${subject}`);
        console.log(`   Location: ${location.mapsLink || 'N/A'}`);
        return simulateEmailDelivery(to, subject);
    }

    // Real mode - attempt actual email delivery
    if (!transporter) {
        console.warn('⚠️  Email service not configured. Set Gmail credentials or enable DEMO_MODE.');
        throw new Error('Email service not available');
    }

    const mailOptions = {
        from: `"SafeHer Alert" <${process.env.GMAIL_USER}>`,
        to,
        subject: `🚨 EMERGENCY ALERT from ${userName || 'SafeHer User'}`,
        html: createEmergencyEmailHTML({ userName, userPhone, location, timestamp }),
        text: `
EMERGENCY ALERT - SafeHer

${userName || 'A SafeHer user'} has triggered an emergency SOS alert.

Time: ${new Date(timestamp).toLocaleString()}
Location: ${location.address || `${location.lat}, ${location.lng}`}
${userPhone ? `Phone: ${userPhone}` : ''}

View on Google Maps: ${location.mapsLink}

Please try to contact them immediately and consider calling emergency services.

Emergency Numbers:
- Police: 100
- Women Helpline: 181
- Emergency: 112

This is an automated alert from SafeHer - Women Safety App
    `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('📧 Email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
};

export default { sendEmergencyEmail };
