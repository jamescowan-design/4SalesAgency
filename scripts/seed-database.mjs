#!/usr/bin/env node

/**
 * Database Seeder for 4 Sales Agency
 * 
 * Populates the database with realistic sample data:
 * - 5 clients
 * - 15 campaigns (3 per client)
 * - 100 leads with varied statuses
 * - Activities, communications, and enrichment data
 * 
 * Usage: node scripts/seed-database.mjs
 */

import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';

// Database connection
const connection = await mysql.createConnection(process.env.DATABASE_URL);
const db = drizzle(connection);

// Sample data generators
const industries = ['SaaS', 'FinTech', 'HealthTech', 'E-commerce', 'Consulting', 'Marketing', 'HR Tech', 'EdTech'];
const companyNames = [
  'TechCorp Solutions', 'DataFlow Analytics', 'CloudScale Systems', 'InnovateLabs Inc',
  'NextGen Software', 'Digital Dynamics', 'SmartBiz Technologies', 'Velocity Ventures',
  'Quantum Solutions', 'Apex Innovations', 'Synergy Systems', 'Catalyst Corp',
  'Momentum Tech', 'Zenith Solutions', 'Pinnacle Software', 'Horizon Analytics'
];

const firstNames = ['John', 'Sarah', 'Michael', 'Emily', 'David', 'Jessica', 'James', 'Jennifer', 'Robert', 'Lisa'];
const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'];
const jobTitles = ['CEO', 'CTO', 'VP of Sales', 'Head of Marketing', 'Director of Operations', 'VP of Engineering'];

const leadStatuses = ['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'closed_won', 'closed_lost', 'unqualified'];

function randomItem(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

console.log('🌱 Starting database seeding...\n');

// Get owner user ID
const [ownerUser] = await connection.query(
  'SELECT id FROM users WHERE openId = ? LIMIT 1',
  [process.env.OWNER_OPEN_ID]
);

if (!ownerUser || ownerUser.length === 0) {
  console.error('❌ Owner user not found. Please log in to the application first.');
  process.exit(1);
}

const userId = ownerUser[0].id;
console.log(`✅ Found owner user ID: ${userId}\n`);

// 1. Create Clients
console.log('📋 Creating clients...');
const clientIds = [];

for (let i = 0; i < 5; i++) {
  const [result] = await connection.query(
    `INSERT INTO clients (userId, name, industry, website, createdAt, updatedAt) 
     VALUES (?, ?, ?, ?, NOW(), NOW())`,
    [
      userId,
      `${randomItem(['Acme', 'Global', 'Premier', 'Elite', 'Summit'])} ${randomItem(['Corp', 'Industries', 'Solutions', 'Group', 'Partners'])}`,
      randomItem(industries),
      `https://example-client-${i + 1}.com`
    ]
  );
  clientIds.push(result.insertId);
  console.log(`  ✓ Created client ${i + 1}/5`);
}

// 2. Create Campaigns
console.log('\n📢 Creating campaigns...');
const campaignIds = [];

for (const clientId of clientIds) {
  for (let i = 0; i < 3; i++) {
    const industry = randomItem(industries);
    const [result] = await connection.query(
      `INSERT INTO campaigns (
        clientId, userId, name, description, status, 
        icpIndustry, icpCompanySize, icpRevenue, icpLocation, icpJobTitles,
        createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        clientId,
        userId,
        `${industry} Outreach Q${randomInt(1, 4)} 2024`,
        `Targeted outreach campaign for ${industry} companies`,
        randomItem(['active', 'active', 'active', 'paused', 'completed']),
        industry,
        randomItem(['1-50', '51-200', '201-1000', '1000+']),
        randomItem(['$1M-$10M', '$10M-$50M', '$50M-$100M', '$100M+']),
        randomItem(['United States', 'United Kingdom', 'Canada', 'Europe', 'Global']),
        JSON.stringify([randomItem(jobTitles), randomItem(jobTitles)])
      ]
    );
    campaignIds.push(result.insertId);
  }
}
console.log(`  ✓ Created ${campaignIds.length} campaigns`);

// 3. Create Leads
console.log('\n👥 Creating leads...');

for (let i = 0; i < 100; i++) {
  const campaignId = randomItem(campaignIds);
  const companyName = `${randomItem(companyNames)} ${i > 50 ? randomInt(1, 999) : ''}`.trim();
  const firstName = randomItem(firstNames);
  const lastName = randomItem(lastNames);
  const domain = companyName.toLowerCase().replace(/[^a-z0-9]/g, '') + '.com';
  
  await connection.query(
    `INSERT INTO leads (
      campaignId, userId, companyName, companyWebsite, companyIndustry, 
      companySize, companyRevenue, companyLocation,
      contactName, contactEmail, contactPhone, contactJobTitle, contactLinkedin,
      status, confidence, source, notes, lastContactedAt, createdAt, updatedAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
    [
      campaignId,
      userId,
      companyName,
      `https://${domain}`,
      randomItem(industries),
      randomItem(['1-50', '51-200', '201-1000', '1000+']),
      randomItem(['$1M-$10M', '$10M-$50M', '$50M+', 'Unknown']),
      randomItem(['San Francisco, CA', 'New York, NY', 'Austin, TX', 'London, UK', 'Toronto, Canada']),
      `${firstName} ${lastName}`,
      `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${domain}`,
      i % 3 === 0 ? `+1-555-${randomInt(100, 999)}-${randomInt(1000, 9999)}` : null,
      randomItem(jobTitles),
      i % 2 === 0 ? `https://linkedin.com/in/${firstName.toLowerCase()}-${lastName.toLowerCase()}` : null,
      randomItem(leadStatuses),
      randomInt(60, 95),
      randomItem(['web_scraper', 'manual_upload', 'csv_import', 'api_integration']),
      i % 5 === 0 ? 'High priority lead - follow up soon' : null,
      i % 3 === 0 ? randomDate(new Date(2024, 0, 1), new Date()) : null
    ]
  );
  
  if ((i + 1) % 20 === 0) {
    console.log(`  ✓ Created ${i + 1}/100 leads`);
  }
}

// 4. Create Activities
console.log('\n📊 Creating activities...');
const [leads] = await connection.query('SELECT id, campaignId, userId FROM leads LIMIT 50');

for (const lead of leads) {
  const numActivities = randomInt(1, 5);
  
  for (let i = 0; i < numActivities; i++) {
    await connection.query(
      `INSERT INTO activities (
        leadId, campaignId, userId, activityType, subject, notes, createdAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        lead.id,
        lead.campaignId,
        lead.userId,
        randomItem(['email', 'call', 'meeting', 'note', 'task']),
        randomItem(['Initial outreach', 'Follow-up', 'Demo scheduled', 'Proposal sent', 'Check-in call']),
        'Auto-generated activity from seeder script',
        randomDate(new Date(2024, 0, 1), new Date())
      ]
    );
  }
}
console.log(`  ✓ Created activities for 50 leads`);

// 5. Create Communication Logs
console.log('\n📧 Creating communication logs...');

for (let i = 0; i < 30; i++) {
  const lead = randomItem(leads);
  await connection.query(
    `INSERT INTO communicationLogs (
      leadId, campaignId, userId, channel, direction, subject, 
      status, metadata, createdAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      lead.id,
      lead.campaignId,
      lead.userId,
      randomItem(['email', 'sms', 'call']),
      randomItem(['outbound', 'inbound']),
      `${randomItem(['Re:', 'Fwd:', ''])} ${randomItem(['Meeting request', 'Quick question', 'Follow-up', 'Proposal'])}`,
      randomItem(['sent', 'delivered', 'opened', 'clicked', 'replied', 'bounced']),
      JSON.stringify({ 
        opened: Math.random() > 0.5,
        clicked: Math.random() > 0.7,
        timestamp: new Date().toISOString()
      }),
      randomDate(new Date(2024, 0, 1), new Date())
    ]
  );
}
console.log(`  ✓ Created 30 communication logs`);

await connection.end();

console.log('\n✅ Database seeding completed successfully!');
console.log('\n📊 Summary:');
console.log(`   - 5 clients`);
console.log(`   - ${campaignIds.length} campaigns`);
console.log(`   - 100 leads`);
console.log(`   - ~150 activities`);
console.log(`   - 30 communication logs`);
console.log('\n🚀 Your platform is now ready for testing!');
