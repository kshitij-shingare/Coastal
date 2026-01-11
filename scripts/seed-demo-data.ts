/**
 * Seed Demo Data Script
 * 
 * Generates sample reports, alerts, and users for development and testing.
 * Run with: npm run seed
 * 
 * Requirements: 12.5
 */

import { Pool } from 'pg';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_NAME || 'coastal_hazard_intelligence',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
};

// Hazard types and severities
const HAZARD_TYPES = ['flooding', 'storm_surge', 'high_waves', 'erosion', 'rip_current', 'tsunami', 'pollution', 'other'] as const;
const SEVERITIES = ['low', 'moderate', 'high'] as const;
const SOURCE_TYPES = ['citizen', 'social', 'official'] as const;
const REPORT_STATUSES = ['pending', 'verified', 'rejected'] as const;
const ALERT_STATUSES = ['active', 'verified', 'resolved', 'false_alarm'] as const;

// Coastal regions with coordinates (US East Coast focus)
const REGIONS = [
  { name: 'Miami Beach', lat: 25.7907, lng: -80.1300, population: 92307 },
  { name: 'Fort Lauderdale', lat: 26.1224, lng: -80.1373, population: 182760 },
  { name: 'Palm Beach', lat: 26.7056, lng: -80.0364, population: 9094 },
  { name: 'Jacksonville Beach', lat: 30.2947, lng: -81.3931, population: 23562 },
  { name: 'Savannah', lat: 32.0809, lng: -81.0912, population: 147780 },
  { name: 'Charleston', lat: 32.7765, lng: -79.9311, population: 150227 },
  { name: 'Myrtle Beach', lat: 33.6891, lng: -78.8867, population: 34695 },
  { name: 'Virginia Beach', lat: 36.8529, lng: -75.9780, population: 459470 },
  { name: 'Ocean City', lat: 38.3365, lng: -75.0849, population: 6957 },
  { name: 'Atlantic City', lat: 39.3643, lng: -74.4229, population: 38497 },
];

// Sample report descriptions by hazard type
const REPORT_DESCRIPTIONS: Record<string, string[]> = {
  flooding: [
    'Street flooding near the beach access point. Water is about 6 inches deep.',
    'Coastal flooding affecting parking lots and low-lying areas.',
    'Flash flooding reported after heavy rainfall. Roads impassable.',
    'Tidal flooding in downtown area. Several businesses affected.',
    'Flooding in residential area near the coast. Basements taking water.',
  ],
  storm_surge: [
    'Storm surge pushing water inland. Beach erosion visible.',
    'Significant storm surge activity. Waves reaching seawall.',
    'Storm surge warning in effect. Water levels rising rapidly.',
    'Moderate storm surge causing beach overwash.',
    'Storm surge flooding coastal roads and properties.',
  ],
  high_waves: [
    'Dangerous wave conditions. Waves exceeding 10 feet.',
    'High surf advisory in effect. Strong rip currents present.',
    'Large waves crashing over the pier. Very dangerous conditions.',
    'Unusually high waves for this time of year. Beach closed.',
    'Wave action causing significant beach erosion.',
  ],
  erosion: [
    'Beach erosion exposing tree roots and infrastructure.',
    'Significant dune erosion after recent storm.',
    'Cliff erosion threatening nearby structures.',
    'Erosion has removed several feet of beach in past week.',
    'Coastal erosion undermining boardwalk supports.',
  ],
  rip_current: [
    'Strong rip currents observed. Multiple rescues today.',
    'Dangerous rip current conditions. Red flags posted.',
    'Rip current pulled swimmer out. Lifeguards on alert.',
    'Multiple rip currents visible from shore.',
    'Rip current advisory issued for this beach.',
  ],
  tsunami: [
    'Unusual wave patterns observed. Monitoring situation.',
    'Water receding unusually far from shore.',
    'Tsunami warning issued for coastal areas.',
    'Seismic activity detected offshore. Tsunami watch in effect.',
    'Abnormal tidal activity reported by fishermen.',
  ],
  pollution: [
    'Oil sheen visible on water surface near marina.',
    'Algae bloom affecting beach water quality.',
    'Debris and trash washing up on shore.',
    'Sewage smell reported near beach outfall.',
    'Dead fish washing up on beach. Possible pollution event.',
  ],
  other: [
    'Unusual marine life activity near shore.',
    'Jellyfish swarm reported at beach.',
    'Shark sighting near swimming area.',
    'Debris field floating offshore.',
    'Unknown substance in water. Beach closed for testing.',
  ],
};

// AI summaries for alerts
const AI_SUMMARIES = [
  'Multiple reports indicate significant coastal hazard activity in this region. Recommend increased monitoring and public advisories.',
  'Cluster of citizen reports suggests developing hazard situation. Confidence level based on report consistency and source diversity.',
  'Analysis of recent reports indicates elevated risk. Geographic clustering and temporal patterns support alert escalation.',
  'AI analysis confirms hazard conditions based on multiple independent sources. Recommend precautionary measures.',
  'Report aggregation indicates localized hazard event. Monitoring for potential escalation.',
];

// Helper functions
function randomElement<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomFloat(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDate(daysBack: number): Date {
  const now = new Date();
  const pastDate = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000);
  return new Date(pastDate.getTime() + Math.random() * (now.getTime() - pastDate.getTime()));
}

function addLocationJitter(lat: number, lng: number, radiusKm: number = 5): { lat: number; lng: number } {
  // Approximate degrees per km
  const latDegPerKm = 1 / 111;
  const lngDegPerKm = 1 / (111 * Math.cos(lat * Math.PI / 180));
  
  const latOffset = (Math.random() - 0.5) * 2 * radiusKm * latDegPerKm;
  const lngOffset = (Math.random() - 0.5) * 2 * radiusKm * lngDegPerKm;
  
  return {
    lat: lat + latOffset,
    lng: lng + lngOffset,
  };
}

// Generate sample users
async function seedUsers(pool: Pool): Promise<string[]> {
  console.log('Seeding users...');
  
  const users = [
    { email: 'admin@coastalhazards.gov', password: 'Admin123!', name: 'System Admin', role: 'admin' },
    { email: 'responder@coastalhazards.gov', password: 'Responder123!', name: 'Emergency Responder', role: 'responder' },
    { email: 'citizen1@example.com', password: 'Citizen123!', name: 'John Smith', role: 'citizen' },
    { email: 'citizen2@example.com', password: 'Citizen123!', name: 'Jane Doe', role: 'citizen' },
    { email: 'citizen3@example.com', password: 'Citizen123!', name: 'Bob Wilson', role: 'citizen' },
  ];

  const userIds: string[] = [];
  const BCRYPT_ROUNDS = 12;

  for (const user of users) {
    const passwordHash = await bcrypt.hash(user.password, BCRYPT_ROUNDS);
    const id = uuidv4();
    
    await pool.query(
      `INSERT INTO users (id, email, password_hash, name, role, is_active)
       VALUES ($1, $2, $3, $4, $5, true)
       ON CONFLICT (email) DO UPDATE SET
         password_hash = EXCLUDED.password_hash,
         name = EXCLUDED.name,
         role = EXCLUDED.role`,
      [id, user.email, passwordHash, user.name, user.role]
    );
    
    userIds.push(id);
    console.log(`  Created user: ${user.email} (${user.role})`);
  }

  return userIds;
}


// Generate sample reports
async function seedReports(pool: Pool, userIds: string[]): Promise<string[]> {
  console.log('Seeding reports...');
  
  const reportIds: string[] = [];
  const numReports = 50;

  for (let i = 0; i < numReports; i++) {
    const region = randomElement(REGIONS);
    const hazardType = randomElement(HAZARD_TYPES);
    const severity = randomElement(SEVERITIES);
    const sourceType = randomElement(SOURCE_TYPES);
    const status = randomElement(REPORT_STATUSES);
    const location = addLocationJitter(region.lat, region.lng);
    const descriptions = REPORT_DESCRIPTIONS[hazardType] || REPORT_DESCRIPTIONS.other;
    const description = randomElement(descriptions);
    const timestamp = randomDate(30); // Reports from last 30 days
    const confidence = randomFloat(30, 95);
    const userId = sourceType === 'citizen' ? randomElement(userIds) : null;

    const id = uuidv4();
    
    await pool.query(
      `INSERT INTO reports (
        id, timestamp, latitude, longitude, location_accuracy, address, region,
        source_type, user_id, original_text, language,
        hazard_type, severity, confidence, status, ai_summary
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)`,
      [
        id,
        timestamp,
        location.lat,
        location.lng,
        randomFloat(5, 50), // accuracy in meters
        `Near ${region.name} Beach`,
        region.name,
        sourceType,
        userId,
        description,
        'en',
        hazardType,
        severity,
        confidence,
        status,
        `AI Analysis: ${description.substring(0, 50)}... Confidence: ${confidence.toFixed(1)}%`,
      ]
    );
    
    reportIds.push(id);
    
    if ((i + 1) % 10 === 0) {
      console.log(`  Created ${i + 1}/${numReports} reports`);
    }
  }

  console.log(`  Total reports created: ${reportIds.length}`);
  return reportIds;
}

// Generate sample alerts
async function seedAlerts(pool: Pool, reportIds: string[]): Promise<void> {
  console.log('Seeding alerts...');
  
  const numAlerts = 15;

  for (let i = 0; i < numAlerts; i++) {
    const region = randomElement(REGIONS);
    const hazardType = randomElement(HAZARD_TYPES);
    const severity = randomElement(SEVERITIES);
    const status = randomElement(ALERT_STATUSES);
    const timestamp = randomDate(14); // Alerts from last 14 days
    const confidence = randomFloat(50, 98);
    const reportCount = randomInt(3, 12);
    
    // Select random related reports
    const relatedReports = [];
    const numRelated = Math.min(reportCount, reportIds.length);
    const shuffled = [...reportIds].sort(() => Math.random() - 0.5);
    for (let j = 0; j < numRelated; j++) {
      relatedReports.push(shuffled[j]);
    }

    const sourceTypes = [];
    if (Math.random() > 0.3) sourceTypes.push('citizen');
    if (Math.random() > 0.5) sourceTypes.push('social');
    if (Math.random() > 0.7) sourceTypes.push('official');
    if (sourceTypes.length === 0) sourceTypes.push('citizen');

    const id = uuidv4();
    const incidentId = uuidv4();
    
    await pool.query(
      `INSERT INTO alerts (
        id, incident_id, timestamp, region_name, affected_population,
        hazard_type, severity, confidence,
        report_count, source_types, time_window, geographic_spread,
        thresholds_met, reasoning, related_reports, status, ai_summary
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)`,
      [
        id,
        incidentId,
        timestamp,
        region.name,
        region.population,
        hazardType,
        severity,
        confidence,
        reportCount,
        sourceTypes,
        '1 hour',
        randomFloat(1, 10), // geographic spread in km
        ['report_count', 'confidence', 'source_diversity'],
        `Alert generated based on ${reportCount} reports from ${sourceTypes.join(', ')} sources. Geographic clustering detected within ${randomFloat(1, 5).toFixed(1)}km radius.`,
        relatedReports,
        status,
        randomElement(AI_SUMMARIES),
      ]
    );
    
    console.log(`  Created alert: ${hazardType} (${severity}) in ${region.name}`);
  }

  console.log(`  Total alerts created: ${numAlerts}`);
}

// Main seed function
async function seed(): Promise<void> {
  console.log('Starting database seed...');
  console.log(`Database: ${dbConfig.database}@${dbConfig.host}:${dbConfig.port}`);
  
  const pool = new Pool(dbConfig);

  try {
    // Test connection
    await pool.query('SELECT NOW()');
    console.log('Database connection successful');

    // Clear existing demo data (optional - comment out to append)
    console.log('Clearing existing data...');
    await pool.query('DELETE FROM media_files');
    await pool.query('DELETE FROM audit_log');
    await pool.query('DELETE FROM alerts');
    await pool.query('DELETE FROM reports');
    await pool.query('DELETE FROM users');
    console.log('  Existing data cleared');

    // Seed data
    const userIds = await seedUsers(pool);
    const reportIds = await seedReports(pool, userIds);
    await seedAlerts(pool, reportIds);

    // Print summary
    const userCount = await pool.query('SELECT COUNT(*) FROM users');
    const reportCount = await pool.query('SELECT COUNT(*) FROM reports');
    const alertCount = await pool.query('SELECT COUNT(*) FROM alerts');

    console.log('\n=== Seed Complete ===');
    console.log(`Users: ${userCount.rows[0].count}`);
    console.log(`Reports: ${reportCount.rows[0].count}`);
    console.log(`Alerts: ${alertCount.rows[0].count}`);
    console.log('\nDemo credentials:');
    console.log('  Admin: admin@coastalhazards.gov / Admin123!');
    console.log('  Responder: responder@coastalhazards.gov / Responder123!');
    console.log('  Citizen: citizen1@example.com / Citizen123!');

  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
    console.log('\nDatabase connection closed');
  }
}

// Run seed
seed().catch(console.error);
