import mysql from 'mysql2/promise';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is not set');
  process.exit(1);
}

const tables = `
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  openId VARCHAR(64) NOT NULL UNIQUE,
  name TEXT,
  email VARCHAR(320),
  loginMethod VARCHAR(64),
  role ENUM('user', 'admin') NOT NULL DEFAULT 'user',
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  lastSignedIn TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS clients (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  industry VARCHAR(255),
  website VARCHAR(500),
  contactEmail VARCHAR(320),
  contactPhone VARCHAR(50),
  address TEXT,
  notes TEXT,
  status ENUM('active', 'inactive', 'archived') NOT NULL DEFAULT 'active',
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS campaigns (
  id INT AUTO_INCREMENT PRIMARY KEY,
  clientId INT NOT NULL,
  userId INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  status ENUM('draft', 'active', 'paused', 'completed', 'archived') NOT NULL DEFAULT 'draft',
  targetIndustries JSON,
  targetGeographies JSON,
  companySizeMin INT DEFAULT 1,
  companySizeMax INT DEFAULT 10000,
  revenueMin INT DEFAULT 0,
  revenueMax INT DEFAULT 1000000000,
  targetJobTitles JSON,
  confidenceThreshold INT DEFAULT 70,
  leadsGenerated INT DEFAULT 0,
  leadsQualified INT DEFAULT 0,
  leadsContacted INT DEFAULT 0,
  startedAt TIMESTAMP NULL,
  completedAt TIMESTAMP NULL,
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS leads (
  id INT AUTO_INCREMENT PRIMARY KEY,
  campaignId INT NOT NULL,
  companyName VARCHAR(255) NOT NULL,
  companyWebsite VARCHAR(500),
  companyIndustry VARCHAR(255),
  companySize INT,
  companyRevenue INT,
  companyLocation VARCHAR(255),
  contactName VARCHAR(255),
  contactEmail VARCHAR(320),
  contactPhone VARCHAR(50),
  contactJobTitle VARCHAR(255),
  contactLinkedin VARCHAR(500),
  confidenceScore INT DEFAULT 0,
  status ENUM('new', 'contacted', 'responded', 'qualified', 'unqualified', 'converted', 'rejected') NOT NULL DEFAULT 'new',
  sourceUrl VARCHAR(500),
  notes TEXT,
  lastContactedAt TIMESTAMP NULL,
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS productKnowledge (
  id INT AUTO_INCREMENT PRIMARY KEY,
  campaignId INT NOT NULL,
  productName VARCHAR(255),
  productDescription TEXT,
  keyFeatures JSON,
  benefits JSON,
  useCases JSON,
  pricingInfo TEXT,
  targetMarket TEXT,
  competitiveAdvantages JSON,
  painPointsAddressed JSON,
  valueProposition TEXT,
  salesTalkingPoints JSON,
  commonObjections JSON,
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS knowledgeDocuments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  campaignId INT NOT NULL,
  documentType ENUM('pdf', 'text', 'transcript', 'recording', 'other') NOT NULL,
  fileName VARCHAR(255) NOT NULL,
  fileUrl VARCHAR(500) NOT NULL,
  fileSize INT,
  mimeType VARCHAR(100),
  extractedText TEXT,
  summary TEXT,
  keyInsights JSON,
  processedAt TIMESTAMP NULL,
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS campaignLlmConfig (
  id INT AUTO_INCREMENT PRIMARY KEY,
  campaignId INT NOT NULL UNIQUE,
  modelName VARCHAR(100) DEFAULT 'gpt-4',
  temperature INT DEFAULT 70,
  maxTokens INT DEFAULT 1000,
  systemPrompt TEXT,
  emailTone ENUM('professional', 'casual', 'friendly', 'formal', 'consultative') DEFAULT 'professional',
  personalizationLevel ENUM('low', 'medium', 'high') DEFAULT 'medium',
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS activities (
  id INT AUTO_INCREMENT PRIMARY KEY,
  leadId INT,
  campaignId INT NOT NULL,
  userId INT,
  activityType ENUM('email', 'call', 'sms', 'note', 'task', 'meeting') NOT NULL,
  subject VARCHAR(500),
  description TEXT,
  status ENUM('pending', 'completed', 'cancelled') DEFAULT 'pending' NOT NULL,
  scheduledAt TIMESTAMP NULL,
  completedAt TIMESTAMP NULL,
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS communicationLogs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  leadId INT NOT NULL,
  campaignId INT NOT NULL,
  communicationType ENUM('email', 'call', 'sms') NOT NULL,
  direction ENUM('outbound', 'inbound') NOT NULL,
  subject VARCHAR(500),
  content TEXT,
  status ENUM('sent', 'delivered', 'opened', 'clicked', 'replied', 'bounced', 'failed') DEFAULT 'sent' NOT NULL,
  metadata JSON,
  sentAt TIMESTAMP NULL,
  deliveredAt TIMESTAMP NULL,
  openedAt TIMESTAMP NULL,
  clickedAt TIMESTAMP NULL,
  repliedAt TIMESTAMP NULL,
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS emailTemplates (
  id INT AUTO_INCREMENT PRIMARY KEY,
  campaignId INT,
  userId INT,
  templateName VARCHAR(255) NOT NULL,
  subject VARCHAR(500) NOT NULL,
  bodyTemplate TEXT NOT NULL,
  variables JSON,
  isAiGenerated BOOLEAN DEFAULT FALSE,
  usageCount INT DEFAULT 0,
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS voiceCallSessions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  leadId INT NOT NULL,
  campaignId INT NOT NULL,
  callSid VARCHAR(255) UNIQUE,
  vapiCallId VARCHAR(255),
  phoneNumber VARCHAR(50),
  duration INT,
  status ENUM('initiated', 'ringing', 'in_progress', 'completed', 'failed', 'no_answer', 'busy') DEFAULT 'initiated' NOT NULL,
  recordingUrl VARCHAR(500),
  transcript TEXT,
  sentiment VARCHAR(50),
  keyPoints JSON,
  followUpActions JSON,
  metadata JSON,
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS callScripts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  campaignId INT NOT NULL,
  scriptName VARCHAR(255) NOT NULL,
  scriptContent TEXT NOT NULL,
  scriptType ENUM('intro', 'discovery', 'objection_handling', 'closing', 'follow_up') NOT NULL,
  variables JSON,
  isActive BOOLEAN DEFAULT TRUE,
  usageCount INT DEFAULT 0,
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS callRecordings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  voiceCallSessionId INT NOT NULL,
  recordingUrl VARCHAR(500) NOT NULL,
  duration INT,
  fileSize INT,
  transcription TEXT,
  summary TEXT,
  actionItems JSON,
  sentiment VARCHAR(50),
  processedAt TIMESTAMP NULL,
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS emailSequences (
  id INT AUTO_INCREMENT PRIMARY KEY,
  campaignId INT NOT NULL,
  sequenceName VARCHAR(255) NOT NULL,
  description TEXT,
  isActive BOOLEAN DEFAULT TRUE,
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS emailSequenceSteps (
  id INT AUTO_INCREMENT PRIMARY KEY,
  sequenceId INT NOT NULL,
  stepNumber INT NOT NULL,
  subject VARCHAR(500) NOT NULL,
  bodyTemplate TEXT NOT NULL,
  delayDays INT DEFAULT 0,
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS emailSequenceEnrollments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  sequenceId INT NOT NULL,
  leadId INT NOT NULL,
  currentStep INT DEFAULT 0,
  status ENUM('active', 'paused', 'completed', 'unsubscribed') DEFAULT 'active' NOT NULL,
  enrolledAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  lastEmailSentAt TIMESTAMP NULL,
  completedAt TIMESTAMP NULL
);

CREATE TABLE IF NOT EXISTS emailVariants (
  id INT AUTO_INCREMENT PRIMARY KEY,
  campaignId INT NOT NULL,
  variantName VARCHAR(255) NOT NULL,
  subject VARCHAR(500) NOT NULL,
  bodyTemplate TEXT NOT NULL,
  sentCount INT DEFAULT 0,
  openCount INT DEFAULT 0,
  clickCount INT DEFAULT 0,
  replyCount INT DEFAULT 0,
  conversionCount INT DEFAULT 0,
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS workflows (
  id INT AUTO_INCREMENT PRIMARY KEY,
  campaignId INT NOT NULL,
  workflowName VARCHAR(255) NOT NULL,
  description TEXT,
  triggerType VARCHAR(100) NOT NULL,
  triggerConfig JSON,
  actions JSON,
  isActive BOOLEAN DEFAULT FALSE,
  executionCount INT DEFAULT 0,
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS workflow_executions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  workflowId INT NOT NULL,
  leadId INT,
  status VARCHAR(50) NOT NULL,
  result JSON,
  errorMessage TEXT,
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS scrapedData (
  id INT AUTO_INCREMENT PRIMARY KEY,
  campaignId INT,
  url VARCHAR(1000) NOT NULL,
  scrapedContent JSON,
  extractedLeads JSON,
  confidenceScore INT,
  scrapedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS recruitmentIntelligence (
  id INT AUTO_INCREMENT PRIMARY KEY,
  campaignId INT,
  companyName VARCHAR(255) NOT NULL,
  companyWebsite VARCHAR(500),
  jobPostingsCount INT DEFAULT 0,
  recentFunding INT,
  fundingDate TIMESTAMP NULL,
  fundingRound VARCHAR(100),
  growthIndicators JSON,
  hiringSignals JSON,
  confidenceScore INT,
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS recruitmentSignals (
  id INT AUTO_INCREMENT PRIMARY KEY,
  recruitmentIntelligenceId INT NOT NULL,
  signalType VARCHAR(100) NOT NULL,
  signalDescription TEXT,
  source VARCHAR(500),
  urgency ENUM('low', 'medium', 'high') DEFAULT 'medium' NOT NULL,
  metadata JSON,
  detectedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS api_settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  serviceName VARCHAR(100) NOT NULL,
  apiKey TEXT NOT NULL,
  additionalConfig JSON,
  isActive BOOLEAN DEFAULT TRUE,
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_user_service (userId, serviceName)
);

CREATE TABLE IF NOT EXISTS consentRecords (
  id INT AUTO_INCREMENT PRIMARY KEY,
  leadId INT NOT NULL,
  consentType VARCHAR(100) NOT NULL,
  granted BOOLEAN NOT NULL,
  grantedAt TIMESTAMP NULL,
  revokedAt TIMESTAMP NULL,
  ipAddress VARCHAR(45),
  userAgent TEXT,
  metadata JSON,
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS deletionRequests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  leadId INT NOT NULL,
  requestedBy VARCHAR(255) NOT NULL,
  requestedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  status ENUM('pending', 'approved', 'rejected', 'completed') DEFAULT 'pending' NOT NULL,
  processedAt TIMESTAMP NULL,
  processedBy INT,
  reason TEXT,
  notes TEXT,
  metadata JSON,
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS errorLogs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT,
  errorType VARCHAR(100) NOT NULL,
  errorMessage TEXT NOT NULL,
  stackTrace TEXT,
  context JSON,
  resolved BOOLEAN DEFAULT FALSE,
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS auditLogs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  action VARCHAR(100) NOT NULL,
  resourceType VARCHAR(100),
  resourceId INT,
  entityType VARCHAR(100),
  entityId INT,
  changes JSON,
  ipAddress VARCHAR(45),
  userAgent TEXT,
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
`;

async function createAllTables() {
  console.log('🔧 Creating all database tables...\n');

  let connection;
  try {
    connection = await mysql.createConnection(DATABASE_URL);
    
    console.log('✅ Connected to database\n');

    // Split by semicolons and execute each CREATE TABLE statement
    const statements = tables.split(';').filter(stmt => stmt.trim().length > 0);
    
    for (const statement of statements) {
      const trimmed = statement.trim();
      if (!trimmed) continue;
      
      // Extract table name for logging
      const match = trimmed.match(/CREATE TABLE IF NOT EXISTS (\w+)/);
      const tableName = match ? match[1] : 'unknown';
      
      try {
        await connection.query(trimmed);
        console.log(`✅ Created table: ${tableName}`);
      } catch (error) {
        console.error(`❌ Failed to create table ${tableName}:`, error.message);
      }
    }

    console.log('\n✨ All tables created successfully!');
    
  } catch (error) {
    console.error('❌ Database operation failed:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

createAllTables();
