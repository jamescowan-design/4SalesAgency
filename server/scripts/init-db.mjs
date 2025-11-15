import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is not set');
  process.exit(1);
}

async function initDatabase() {
  console.log('🔧 Initializing database...\n');

  let connection;
  try {
    connection = await mysql.createConnection(DATABASE_URL);
    const db = drizzle(connection);

    console.log('✅ Connected to database');

    // Create all tables
    const tables = [
      {
        name: 'users',
        sql: `CREATE TABLE IF NOT EXISTS users (
          id INT AUTO_INCREMENT PRIMARY KEY,
          openId VARCHAR(64) NOT NULL UNIQUE,
          name TEXT,
          email VARCHAR(320),
          loginMethod VARCHAR(64),
          role ENUM('user', 'admin') NOT NULL DEFAULT 'user',
          createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          lastSignedIn TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        )`
      },
      {
        name: 'clients',
        sql: `CREATE TABLE IF NOT EXISTS clients (
          id INT AUTO_INCREMENT PRIMARY KEY,
          userId INT NOT NULL,
          name VARCHAR(255) NOT NULL,
          industry VARCHAR(255),
          website VARCHAR(500),
          contactEmail VARCHAR(320),
          contactPhone VARCHAR(50),
          notes TEXT,
          createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )`
      },
      {
        name: 'campaigns',
        sql: `CREATE TABLE IF NOT EXISTS campaigns (
          id INT AUTO_INCREMENT PRIMARY KEY,
          userId INT NOT NULL,
          clientId INT NOT NULL,
          name VARCHAR(255) NOT NULL,
          description TEXT,
          status ENUM('active', 'paused', 'completed') NOT NULL DEFAULT 'active',
          targetIndustries TEXT,
          targetGeographies TEXT,
          companySizeMin INT,
          companySizeMax INT,
          revenueMin DECIMAL(15,2),
          revenueMax DECIMAL(15,2),
          confidenceThreshold INT DEFAULT 70,
          createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )`
      },
      {
        name: 'leads',
        sql: `CREATE TABLE IF NOT EXISTS leads (
          id INT AUTO_INCREMENT PRIMARY KEY,
          userId INT NOT NULL,
          campaignId INT NOT NULL,
          companyName VARCHAR(255) NOT NULL,
          contactName VARCHAR(255),
          title VARCHAR(255),
          email VARCHAR(320),
          phone VARCHAR(50),
          status ENUM('new', 'contacted', 'qualified', 'proposal_sent', 'negotiation', 'won', 'lost', 'nurturing') NOT NULL DEFAULT 'new',
          source VARCHAR(100),
          confidenceScore INT,
          industry VARCHAR(255),
          companySize INT,
          revenue DECIMAL(15,2),
          location VARCHAR(255),
          website VARCHAR(500),
          notes TEXT,
          metadata JSON,
          createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )`
      },
      {
        name: 'activities',
        sql: `CREATE TABLE IF NOT EXISTS activities (
          id INT AUTO_INCREMENT PRIMARY KEY,
          userId INT NOT NULL,
          leadId INT NOT NULL,
          type VARCHAR(100) NOT NULL,
          description TEXT,
          metadata JSON,
          createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        )`
      },
      {
        name: 'communications',
        sql: `CREATE TABLE IF NOT EXISTS communications (
          id INT AUTO_INCREMENT PRIMARY KEY,
          userId INT NOT NULL,
          leadId INT NOT NULL,
          channel ENUM('email', 'phone', 'linkedin', 'other') NOT NULL,
          direction ENUM('inbound', 'outbound') NOT NULL,
          subject VARCHAR(500),
          content TEXT,
          status VARCHAR(50),
          metadata JSON,
          createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        )`
      },
      {
        name: 'productKnowledge',
        sql: `CREATE TABLE IF NOT EXISTS productKnowledge (
          id INT AUTO_INCREMENT PRIMARY KEY,
          userId INT NOT NULL,
          campaignId INT NOT NULL,
          title VARCHAR(255) NOT NULL,
          content TEXT NOT NULL,
          fileType VARCHAR(50),
          fileUrl VARCHAR(1000),
          fileSize INT,
          metadata JSON,
          embedding JSON,
          vectorId VARCHAR(255),
          createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )`
      },
      {
        name: 'emailCampaigns',
        sql: `CREATE TABLE IF NOT EXISTS emailCampaigns (
          id INT AUTO_INCREMENT PRIMARY KEY,
          userId INT NOT NULL,
          campaignId INT NOT NULL,
          name VARCHAR(255) NOT NULL,
          subject VARCHAR(500) NOT NULL,
          body TEXT NOT NULL,
          status ENUM('draft', 'scheduled', 'sending', 'sent', 'paused') NOT NULL DEFAULT 'draft',
          scheduledAt TIMESTAMP,
          sentAt TIMESTAMP,
          createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )`
      },
      {
        name: 'workflows',
        sql: `CREATE TABLE IF NOT EXISTS workflows (
          id INT AUTO_INCREMENT PRIMARY KEY,
          userId INT NOT NULL,
          name VARCHAR(255) NOT NULL,
          description TEXT,
          triggerType VARCHAR(100) NOT NULL,
          triggerConfig JSON,
          actionType VARCHAR(100) NOT NULL,
          actionConfig JSON,
          isActive BOOLEAN NOT NULL DEFAULT false,
          createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )`
      },
      {
        name: 'workflow_executions',
        sql: `CREATE TABLE IF NOT EXISTS workflow_executions (
          id INT AUTO_INCREMENT PRIMARY KEY,
          workflowId INT NOT NULL,
          leadId INT,
          status VARCHAR(50) NOT NULL,
          result JSON,
          createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        )`
      },
      {
        name: 'emailSequences',
        sql: `CREATE TABLE IF NOT EXISTS emailSequences (
          id INT AUTO_INCREMENT PRIMARY KEY,
          userId INT NOT NULL,
          campaignId INT NOT NULL,
          name VARCHAR(255) NOT NULL,
          description TEXT,
          isActive BOOLEAN NOT NULL DEFAULT true,
          createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )`
      },
      {
        name: 'emailSequenceSteps',
        sql: `CREATE TABLE IF NOT EXISTS emailSequenceSteps (
          id INT AUTO_INCREMENT PRIMARY KEY,
          sequenceId INT NOT NULL,
          stepNumber INT NOT NULL,
          subject VARCHAR(500) NOT NULL,
          body TEXT NOT NULL,
          delayDays INT NOT NULL DEFAULT 0,
          createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )`
      },
      {
        name: 'emailSequenceEnrollments',
        sql: `CREATE TABLE IF NOT EXISTS emailSequenceEnrollments (
          id INT AUTO_INCREMENT PRIMARY KEY,
          sequenceId INT NOT NULL,
          leadId INT NOT NULL,
          currentStep INT NOT NULL DEFAULT 0,
          status ENUM('active', 'paused', 'completed', 'unsubscribed') NOT NULL DEFAULT 'active',
          enrolledAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          lastEmailSentAt TIMESTAMP,
          completedAt TIMESTAMP,
          createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        )`
      },
      {
        name: 'emailTemplates',
        sql: `CREATE TABLE IF NOT EXISTS emailTemplates (
          id INT AUTO_INCREMENT PRIMARY KEY,
          userId INT NOT NULL,
          name VARCHAR(255) NOT NULL,
          subject VARCHAR(500) NOT NULL,
          body TEXT NOT NULL,
          category VARCHAR(100),
          variables JSON,
          isDefault BOOLEAN NOT NULL DEFAULT false,
          usageCount INT NOT NULL DEFAULT 0,
          createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )`
      },
      {
        name: 'emailVariants',
        sql: `CREATE TABLE IF NOT EXISTS emailVariants (
          id INT AUTO_INCREMENT PRIMARY KEY,
          userId INT NOT NULL,
          campaignId INT NOT NULL,
          name VARCHAR(255) NOT NULL,
          subject VARCHAR(500) NOT NULL,
          body TEXT NOT NULL,
          sentCount INT NOT NULL DEFAULT 0,
          openCount INT NOT NULL DEFAULT 0,
          clickCount INT NOT NULL DEFAULT 0,
          replyCount INT NOT NULL DEFAULT 0,
          createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )`
      },
      {
        name: 'voiceCallSessions',
        sql: `CREATE TABLE IF NOT EXISTS voiceCallSessions (
          id INT AUTO_INCREMENT PRIMARY KEY,
          userId INT NOT NULL,
          leadId INT NOT NULL,
          callType ENUM('manual', 'ai') NOT NULL,
          status VARCHAR(50) NOT NULL,
          duration INT,
          recordingUrl VARCHAR(1000),
          transcription TEXT,
          sentiment VARCHAR(50),
          keyPoints JSON,
          followUpActions JSON,
          callSid VARCHAR(255),
          metadata JSON,
          createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )`
      },
      {
        name: 'scrapedData',
        sql: `CREATE TABLE IF NOT EXISTS scrapedData (
          id INT AUTO_INCREMENT PRIMARY KEY,
          userId INT NOT NULL,
          url VARCHAR(1000) NOT NULL,
          data JSON NOT NULL,
          confidenceScore INT,
          createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        )`
      },
      {
        name: 'recruitmentIntelligence',
        sql: `CREATE TABLE IF NOT EXISTS recruitmentIntelligence (
          id INT AUTO_INCREMENT PRIMARY KEY,
          userId INT NOT NULL,
          companyName VARCHAR(255) NOT NULL,
          companyWebsite VARCHAR(500),
          jobPostingsCount INT NOT NULL DEFAULT 0,
          recentFunding DECIMAL(15,2),
          fundingDate TIMESTAMP,
          growthIndicators JSON,
          hiringSignals JSON,
          confidenceScore INT,
          createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )`
      },
      {
        name: 'recruitmentSignals',
        sql: `CREATE TABLE IF NOT EXISTS recruitmentSignals (
          id INT AUTO_INCREMENT PRIMARY KEY,
          recruitmentIntelligenceId INT NOT NULL,
          signalType VARCHAR(100) NOT NULL,
          description TEXT NOT NULL,
          source VARCHAR(500),
          urgency ENUM('low', 'medium', 'high') NOT NULL DEFAULT 'medium',
          metadata JSON,
          detectedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        )`
      },
      {
        name: 'knowledgeDocuments',
        sql: `CREATE TABLE IF NOT EXISTS knowledgeDocuments (
          id INT AUTO_INCREMENT PRIMARY KEY,
          userId INT NOT NULL,
          campaignId INT NOT NULL,
          title VARCHAR(255) NOT NULL,
          content TEXT NOT NULL,
          fileType VARCHAR(50),
          fileUrl VARCHAR(1000),
          fileSize INT,
          chunkIndex INT,
          embedding JSON,
          metadata JSON,
          createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )`
      },
      {
        name: 'consentRecords',
        sql: `CREATE TABLE IF NOT EXISTS consentRecords (
          id INT AUTO_INCREMENT PRIMARY KEY,
          leadId INT NOT NULL,
          consentType VARCHAR(100) NOT NULL,
          granted BOOLEAN NOT NULL,
          grantedAt TIMESTAMP,
          revokedAt TIMESTAMP,
          ipAddress VARCHAR(45),
          userAgent TEXT,
          createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        )`
      },
      {
        name: 'deletionRequests',
        sql: `CREATE TABLE IF NOT EXISTS deletionRequests (
          id INT AUTO_INCREMENT PRIMARY KEY,
          leadId INT NOT NULL,
          requestedBy VARCHAR(255) NOT NULL,
          requestedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          status ENUM('pending', 'approved', 'rejected', 'completed') NOT NULL DEFAULT 'pending',
          processedAt TIMESTAMP,
          processedBy INT,
          reason TEXT,
          notes TEXT,
          metadata JSON,
          createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        )`
      },
      {
        name: 'errorLogs',
        sql: `CREATE TABLE IF NOT EXISTS errorLogs (
          id INT AUTO_INCREMENT PRIMARY KEY,
          userId INT,
          errorType VARCHAR(100) NOT NULL,
          errorMessage TEXT NOT NULL,
          stackTrace TEXT,
          context JSON,
          resolved BOOLEAN NOT NULL DEFAULT false,
          createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        )`
      }
    ];

    for (const table of tables) {
      try {
        await connection.query(table.sql);
        console.log(`✅ Created table: ${table.name}`);
      } catch (error) {
        console.error(`❌ Failed to create table ${table.name}:`, error.message);
      }
    }

    console.log('\n✨ Database initialization completed successfully!');
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

initDatabase();
