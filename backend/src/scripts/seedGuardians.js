/**
 * Seed Script - Pre-populate Guardian Data
 * Run this to add 5-10 demo guardian profiles to the database
 */

import { db } from '../config/firebase.js';

const sampleGuardians = [
    {
        userId: 'guardian_1',
        name: 'Priya Sharma',
        phone: '+919876543210',
        email: 'priya.sharma@example.com',
        location: {
            lat: 18.5204,
            lng: 73.8567,
            address: 'Shivajinagar, Pune'
        },
        optIn: true,
        status: 'active',
        responseTime: 8, // minutes
        reliabilityScore: 95,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    },
    {
        userId: 'guardian_2',
        name: 'Rajesh Kumar',
        phone: '+919876543211',
        email: 'rajesh.kumar@example.com',
        location: {
            lat: 18.5362,
            lng: 73.8797,
            address: 'Koregaon Park, Pune'
        },
        optIn: true,
        status: 'active',
        responseTime: 6,
        reliabilityScore: 98,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    },
    {
        userId: 'guardian_3',
        name: 'Anjali Patel',
        phone: '+919876543212',
        email: 'anjali.patel@example.com',
        location: {
            lat: 18.5912,
            lng: 73.7389,
            address: 'Hinjewadi, Pune'
        },
        optIn: true,
        status: 'active',
        responseTime: 10,
        reliabilityScore: 92,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    },
    {
        userId: 'guardian_4',
        name: 'Vikram Singh',
        phone: '+919876543213',
        email: 'vikram.singh@example.com',
        location: {
            lat: 18.5074,
            lng: 73.8077,
            address: 'Kothrud, Pune'
        },
        optIn: true,
        status: 'active',
        responseTime: 7,
        reliabilityScore: 90,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    },
    {
        userId: 'guardian_5',
        name: 'Meera Desai',
        phone: '+919876543214',
        email: 'meera.desai@example.com',
        location: {
            lat: 18.5642,
            lng: 73.7769,
            address: 'Baner, Pune'
        },
        optIn: true,
        status: 'active',
        responseTime: 9,
        reliabilityScore: 94,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    },
    {
        userId: 'guardian_6',
        name: 'Arjun Reddy',
        phone: '+919876543215',
        email: 'arjun.reddy@example.com',
        location: {
            lat: 18.5679,
            lng: 73.9143,
            address: 'Viman Nagar, Pune'
        },
        optIn: true,
        status: 'active',
        responseTime: 5,
        reliabilityScore: 97,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    },
    {
        userId: 'guardian_7',
        name: 'Kavita Joshi',
        phone: '+919876543216',
        email: 'kavita.joshi@example.com',
        location: {
            lat: 18.5089,
            lng: 73.9260,
            address: 'Hadapsar, Pune'
        },
        optIn: true,
        status: 'active',
        responseTime: 12,
        reliabilityScore: 88,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    },
    {
        userId: 'guardian_8',
        name: 'Sanjay Malhotra',
        phone: '+919876543217',
        email: 'sanjay.malhotra@example.com',
        location: {
            lat: 18.5584,
            lng: 73.8080,
            address: 'Aundh, Pune'
        },
        optIn: true,
        status: 'active',
        responseTime: 8,
        reliabilityScore: 93,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    },
    {
        userId: 'guardian_9',
        name: 'Neha Kapoor',
        phone: '+919876543218',
        email: 'neha.kapoor@example.com',
        location: {
            lat: 18.5986,
            lng: 73.7386,
            address: 'Wakad, Pune'
        },
        optIn: true,
        status: 'active',
        responseTime: 11,
        reliabilityScore: 89,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    },
    {
        userId: 'guardian_10',
        name: 'Rahul Verma',
        phone: '+919876543219',
        email: 'rahul.verma@example.com',
        location: {
            lat: 18.6298,
            lng: 73.7997,
            address: 'Pimpri-Chinchwad, Pune'
        },
        optIn: true,
        status: 'active',
        responseTime: 6,
        reliabilityScore: 96,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    }
];

async function seedGuardians() {
    try {
        console.log('🌱 Starting guardian data seeding...\n');
        
        const batch = db.batch();
        
        for (const guardian of sampleGuardians) {
            const docRef = db.collection('guardians').doc(guardian.userId);
            batch.set(docRef, guardian);
            console.log(`✓ Prepared: ${guardian.name} (${guardian.email})`);
        }
        
        await batch.commit();
        
        console.log('\n✅ Successfully seeded ' + sampleGuardians.length + ' guardians to the database!');
        console.log('\nGuardian Summary:');
        console.log('- Total Guardians: ' + sampleGuardians.length);
        console.log('- All opted in for alerts');
        console.log('- Response times: 5-12 minutes');
        console.log('- Reliability scores: 88-98%');
        console.log('\n📍 Locations covered across Pune:');
        console.log('  - Central Pune (Shivajinagar, Koregaon Park)');
        console.log('  - West Pune (Kothrud, Baner, Aundh)');
        console.log('  - North Pune (Wakad, Pimpri-Chinchwad)');
        console.log('  - East Pune (Viman Nagar, Hadapsar)');
        console.log('  - IT Hub (Hinjewadi)');
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding guardians:', error);
        process.exit(1);
    }
}

// Run the seeding
seedGuardians();
