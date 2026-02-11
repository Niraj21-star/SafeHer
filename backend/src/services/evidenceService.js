/**
 * Evidence Service - Structured evidence storage and verification
 * Generates legally-useful documentation for incidents
 */

import crypto from 'crypto';

/**
 * Generate SHA-256 hash for incident verification
 * Hash ensures evidence integrity and tamper-detection
 */
export function generateEvidenceHash(incidentId, timestamp, location) {
    const evidenceString = `${incidentId}|${timestamp}|${location.lat},${location.lng}`;
    return crypto.createHash('sha256').update(evidenceString).digest('hex');
}

/**
 * Build comprehensive evidence structure for incident
 */
export function buildEvidenceRecord(incidentData, incidentId) {
    const timestamp = incidentData.timestamp?.toDate?.() || new Date(incidentData.timestamp);
    
    const evidenceHash = generateEvidenceHash(
        incidentId,
        timestamp.toISOString(),
        incidentData.location
    );

    return {
        incidentId,
        evidenceHash,
        generatedAt: new Date().toISOString(),
        incident: {
            timestamp: timestamp.toISOString(),
            status: incidentData.status,
            location: {
                coordinates: `${incidentData.location.lat}, ${incidentData.location.lng}`,
                address: incidentData.location.address || 'Not available',
                accuracy: incidentData.location.accuracy || 'unknown',
                mapsLink: incidentData.location.mapsLink
            },
            deviceInfo: incidentData.deviceInfo || 'Unknown device'
        },
        alerts: {
            totalSent: incidentData.alertsSent?.length || 0,
            contacts: (incidentData.alertsSent || []).map(alert => ({
                type: alert.type,
                recipient: alert.recipientName || 'Unknown',
                status: alert.status,
                timestamp: alert.timestamp
            }))
        },
        guardians: {
            notified: incidentData.guardiansNotified?.length || 0,
            responding: incidentData.respondingCount || 0,
            responders: (incidentData.responders || []).map(r => ({
                guardianId: r.guardianId,
                action: r.action,
                distance: r.distance ? `${r.distance}m` : 'Unknown',
                timestamp: r.timestamp
            }))
        },
        escalation: {
            policeEscalated: !!incidentData.policeEscalated,
            escalationActions: incidentData.escalationActions || []
        },
        resolution: {
            resolvedAt: incidentData.resolvedAt || null,
            recoveryCompleted: incidentData.recoveryCompleted || false
        }
    };
}

/**
 * Generate incident timeline from evidence data
 * Returns chronological list of all incident events
 */
export function generateIncidentTimeline(incidentData, incidentId) {
    const timeline = [];
    const incidentTime = incidentData.timestamp?.toDate?.() || new Date(incidentData.timestamp);

    // Initial SOS trigger
    timeline.push({
        type: 'sos_triggered',
        timestamp: incidentTime.toISOString(),
        description: 'Emergency SOS triggered',
        details: {
            location: incidentData.location.address || 'Location captured',
            accuracy: incidentData.location.accuracy
        }
    });

    // Alert events
    (incidentData.alertsSent || []).forEach(alert => {
        timeline.push({
            type: 'alert_sent',
            timestamp: alert.timestamp,
            description: `${alert.type} alert sent to ${alert.recipientName}`,
            details: {
                recipient: alert.recipient,
                status: alert.status
            }
        });
    });

    // Guardian notifications
    if (incidentData.guardiansNotified && incidentData.guardiansNotified.length > 0) {
        incidentData.guardiansNotified.forEach(guardian => {
            timeline.push({
                type: 'guardian_notified',
                timestamp: guardian.timestamp || incidentTime.toISOString(),
                description: `Guardian notified: ${guardian.name || 'Guardian'}`,
                details: {
                    distance: guardian.distance ? `${(guardian.distance / 1000).toFixed(1)} km` : 'Unknown',
                    status: guardian.status
                }
            });
        });
    }

    // Guardian responses
    (incidentData.responders || []).forEach(responder => {
        timeline.push({
            type: 'guardian_response',
            timestamp: responder.timestamp,
            description: `Guardian ${responder.action === 'accepted' ? 'accepted' : 'declined'} response`,
            details: {
                guardianId: responder.guardianId,
                action: responder.action
            }
        });
    });

    // Police escalation events
    (incidentData.escalationActions || []).forEach(action => {
        timeline.push({
            type: 'police_escalation',
            timestamp: action.timestamp,
            description: action.description || 'Police escalation action',
            details: action.details || {}
        });
    });

    // Resolution
    if (incidentData.resolvedAt) {
        timeline.push({
            type: 'incident_resolved',
            timestamp: incidentData.resolvedAt,
            description: 'Incident marked as resolved',
            details: {
                recoveryStarted: !!incidentData.recoveryCompleted
            }
        });
    }

    // Recovery completion
    if (incidentData.recoveryCompleted) {
        timeline.push({
            type: 'recovery_completed',
            timestamp: incidentData.recoveryCompletedAt || new Date().toISOString(),
            description: 'Recovery mode completed',
            details: {}
        });
    }

    // Sort by timestamp
    timeline.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    return timeline;
}

/**
 * Generate downloadable incident summary text
 */
export function generateIncidentSummaryText(evidenceRecord, timeline) {
    const lines = [];
    
    lines.push('═══════════════════════════════════════════════════');
    lines.push('         SAFEHER INCIDENT EVIDENCE REPORT');
    lines.push('═══════════════════════════════════════════════════');
    lines.push('');
    lines.push(`Incident ID: ${evidenceRecord.incidentId}`);
    lines.push(`Evidence Hash: ${evidenceRecord.evidenceHash}`);
    lines.push(`Generated: ${new Date(evidenceRecord.generatedAt).toLocaleString()}`);
    lines.push('');
    lines.push('───────────────────────────────────────────────────');
    lines.push('INCIDENT DETAILS');
    lines.push('───────────────────────────────────────────────────');
    lines.push(`Time: ${new Date(evidenceRecord.incident.timestamp).toLocaleString()}`);
    lines.push(`Status: ${evidenceRecord.incident.status.toUpperCase()}`);
    lines.push(`Location: ${evidenceRecord.incident.location.address}`);
    lines.push(`Coordinates: ${evidenceRecord.incident.location.coordinates}`);
    lines.push(`Location Accuracy: ${evidenceRecord.incident.location.accuracy}`);
    lines.push(`Device: ${evidenceRecord.incident.deviceInfo}`);
    lines.push('');
    lines.push('───────────────────────────────────────────────────');
    lines.push('ALERTS SENT');
    lines.push('───────────────────────────────────────────────────');
    lines.push(`Total Alerts: ${evidenceRecord.alerts.totalSent}`);
    evidenceRecord.alerts.contacts.forEach((contact, i) => {
        lines.push(`${i + 1}. ${contact.recipient} (${contact.type}) - ${contact.status}`);
        lines.push(`   Time: ${new Date(contact.timestamp).toLocaleString()}`);
    });
    lines.push('');
    lines.push('───────────────────────────────────────────────────');
    lines.push('GUARDIAN RESPONSE');
    lines.push('───────────────────────────────────────────────────');
    lines.push(`Guardians Notified: ${evidenceRecord.guardians.notified}`);
    lines.push(`Guardians Responding: ${evidenceRecord.guardians.responding}`);
    if (evidenceRecord.guardians.responders.length > 0) {
        evidenceRecord.guardians.responders.forEach((r, i) => {
            lines.push(`${i + 1}. Guardian ${r.guardianId.substring(0, 8)}...`);
            lines.push(`   Action: ${r.action.toUpperCase()}`);
            lines.push(`   Distance: ${r.distance}`);
            lines.push(`   Time: ${new Date(r.timestamp).toLocaleString()}`);
        });
    } else {
        lines.push('No guardian responses recorded');
    }
    lines.push('');
    lines.push('───────────────────────────────────────────────────');
    lines.push('INCIDENT TIMELINE');
    lines.push('───────────────────────────────────────────────────');
    timeline.forEach((event, i) => {
        const time = new Date(event.timestamp).toLocaleTimeString();
        lines.push(`[${time}] ${event.description}`);
        if (event.details && Object.keys(event.details).length > 0) {
            Object.entries(event.details).forEach(([key, value]) => {
                if (value) lines.push(`           ${key}: ${value}`);
            });
        }
    });
    lines.push('');
    lines.push('───────────────────────────────────────────────────');
    lines.push('LEGAL DISCLAIMER');
    lines.push('───────────────────────────────────────────────────');
    lines.push('This report is generated for documentation purposes.');
    lines.push('It is intended to support legal proceedings but does');
    lines.push('not constitute legal advice or official testimony.');
    lines.push('');
    lines.push('The evidence hash can be used to verify the integrity');
    lines.push('of this report. Any modification to the core incident');
    lines.push('data will result in a different hash value.');
    lines.push('');
    lines.push('For legal assistance, please consult with a qualified');
    lines.push('attorney specializing in emergency response and safety.');
    lines.push('═══════════════════════════════════════════════════');
    
    return lines.join('\n');
}

export default {
    generateEvidenceHash,
    buildEvidenceRecord,
    generateIncidentTimeline,
    generateIncidentSummaryText
};
