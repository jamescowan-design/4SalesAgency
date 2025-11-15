import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";

// Import schema tables
const schema = {
  clients: "clients",
  campaigns: "campaigns",
  leads: "leads",
  activities: "activities",
  communications: "communications",
  productKnowledge: "productKnowledge",
  scrapedData: "scrapedData",
  emailCampaigns: "emailCampaigns",
  workflows: "workflows",
};

// Sample data
const sampleClients = [
  { name: "TechStart Solutions", industry: "SaaS", website: "https://techstart.example.com", contactEmail: "contact@techstart.example.com", contactPhone: "+1-555-0101" },
  { name: "CloudScale Inc", industry: "Cloud Infrastructure", website: "https://cloudscale.example.com", contactEmail: "hello@cloudscale.example.com", contactPhone: "+1-555-0102" },
  { name: "DataFlow Analytics", industry: "Business Intelligence", website: "https://dataflow.example.com", contactEmail: "info@dataflow.example.com", contactPhone: "+1-555-0103" },
  { name: "SecureNet Systems", industry: "Cybersecurity", website: "https://securenet.example.com", contactEmail: "sales@securenet.example.com", contactPhone: "+1-555-0104" },
  { name: "AI Innovations Lab", industry: "Machine Learning", website: "https://ailab.example.com", contactEmail: "contact@ailab.example.com", contactPhone: "+1-555-0105" },
];

const sampleCompanies = [
  { name: "Acme Corp", industry: "Manufacturing", website: "https://acme.example.com", employees: "500-1000", revenue: "$50M-$100M" },
  { name: "Beta Technologies", industry: "Software", website: "https://beta.example.com", employees: "100-250", revenue: "$10M-$25M" },
  { name: "Gamma Solutions", industry: "Consulting", website: "https://gamma.example.com", employees: "50-100", revenue: "$5M-$10M" },
  { name: "Delta Enterprises", industry: "E-commerce", website: "https://delta.example.com", employees: "250-500", revenue: "$25M-$50M" },
  { name: "Epsilon Systems", industry: "Healthcare Tech", website: "https://epsilon.example.com", employees: "100-250", revenue: "$10M-$25M" },
  { name: "Zeta Digital", industry: "Marketing", website: "https://zeta.example.com", employees: "50-100", revenue: "$5M-$10M" },
  { name: "Theta Analytics", industry: "Data Science", website: "https://theta.example.com", employees: "25-50", revenue: "$2M-$5M" },
  { name: "Iota Innovations", industry: "IoT", website: "https://iota.example.com", employees: "100-250", revenue: "$10M-$25M" },
  { name: "Kappa Cloud", industry: "Cloud Services", website: "https://kappa.example.com", employees: "250-500", revenue: "$25M-$50M" },
  { name: "Lambda Labs", industry: "Research", website: "https://lambda.example.com", employees: "50-100", revenue: "$5M-$10M" },
];

const firstNames = ["John", "Sarah", "Michael", "Emily", "David", "Jessica", "Robert", "Jennifer", "William", "Lisa", "James", "Karen", "Daniel", "Nancy", "Matthew", "Betty", "Christopher", "Margaret", "Andrew", "Sandra"];
const lastNames = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin"];
const titles = ["CEO", "CTO", "VP of Sales", "Head of Marketing", "Director of Operations", "VP of Engineering", "Chief Revenue Officer", "Head of Product", "VP of Business Development", "Director of Sales"];

const statuses = ["new", "contacted", "qualified", "proposal_sent", "negotiation", "won", "lost", "nurturing"];
const leadSources = ["web_scraper", "referral", "inbound", "cold_outreach", "linkedin", "event"];

function randomElement(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateEmail(firstName, lastName, company) {
  const domain = company.website.replace("https://", "").replace("http://", "");
  return `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${domain}`;
}

function generatePhone() {
  return `+1-555-${String(randomInt(1000, 9999)).padStart(4, "0")}`;
}

function daysAgo(days) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

async function seed() {
  console.log("🌱 Starting database seeding...\n");

  // Connect to database
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  const db = drizzle(connection);

  try {
    // Get the owner's user ID (first user in the system)
    const [users] = await connection.execute("SELECT id FROM users ORDER BY id ASC LIMIT 1");
    if (users.length === 0) {
      console.error("❌ No users found. Please log in first to create a user.");
      process.exit(1);
    }
    const userId = users[0].id;
    console.log(`✅ Using user ID: ${userId}\n`);

    // 1. Create Clients
    console.log("📋 Creating clients...");
    const clientIds = [];
    for (const client of sampleClients) {
      const [result] = await connection.execute(
        `INSERT INTO clients (userId, name, industry, website, contactEmail, contactPhone, createdAt, updatedAt) 
         VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [userId, client.name, client.industry, client.website, client.contactEmail, client.contactPhone]
      );
      clientIds.push(result.insertId);
      console.log(`  ✓ Created client: ${client.name}`);
    }

    // 2. Create Campaigns
    console.log("\n📢 Creating campaigns...");
    const campaignIds = [];
    const campaignTypes = ["email", "voice", "multi_channel"];
    
    for (let i = 0; i < clientIds.length; i++) {
      const clientId = clientIds[i];
      const client = sampleClients[i];
      
      // Create 2-3 campaigns per client
      const numCampaigns = randomInt(2, 3);
      for (let j = 0; j < numCampaigns; j++) {
        const campaignName = `${client.name} - Q${randomInt(1, 4)} ${2024 + randomInt(0, 1)} Campaign`;
        const campaignType = randomElement(campaignTypes);
        const status = randomElement(["active", "paused", "completed"]);
        const startDate = daysAgo(randomInt(30, 180));
        
        const icp = JSON.stringify({
          industries: [client.industry, "Technology", "Software"],
          companySize: ["50-100", "100-250", "250-500"],
          revenue: ["$5M-$10M", "$10M-$25M", "$25M-$50M"],
          location: ["United States", "Canada"],
          technologies: ["Cloud", "SaaS", "API"],
        });

        const [result] = await connection.execute(
          `INSERT INTO campaigns (userId, clientId, name, type, status, icp, startDate, createdAt, updatedAt)
           VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
          [userId, clientId, campaignName, campaignType, status, icp, startDate]
        );
        campaignIds.push({ id: result.insertId, clientId, name: campaignName });
        console.log(`  ✓ Created campaign: ${campaignName}`);
      }
    }

    // 3. Create Leads
    console.log("\n👥 Creating leads...");
    const leadIds = [];
    
    for (const campaign of campaignIds) {
      // Create 8-12 leads per campaign
      const numLeads = randomInt(8, 12);
      
      for (let i = 0; i < numLeads; i++) {
        const company = randomElement(sampleCompanies);
        const firstName = randomElement(firstNames);
        const lastName = randomElement(lastNames);
        const title = randomElement(titles);
        const email = generateEmail(firstName, lastName, company);
        const phone = generatePhone();
        const status = randomElement(statuses);
        const source = randomElement(leadSources);
        const confidenceScore = randomInt(60, 98);
        const createdDate = daysAgo(randomInt(1, 90));

        const [result] = await connection.execute(
          `INSERT INTO leads (userId, campaignId, companyName, contactName, title, email, phone, status, source, confidenceScore, createdAt, updatedAt)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
          [userId, campaign.id, company.name, `${firstName} ${lastName}`, title, email, phone, status, source, confidenceScore, createdDate]
        );
        leadIds.push({ id: result.insertId, campaignId: campaign.id, status, email, companyName: company.name });
      }
    }
    console.log(`  ✓ Created ${leadIds.length} leads across all campaigns`);

    // 4. Create Activities
    console.log("\n📊 Creating activities...");
    const activityTypes = ["email_sent", "email_opened", "email_clicked", "call_made", "call_answered", "meeting_scheduled", "note_added"];
    let activityCount = 0;

    for (const lead of leadIds) {
      // Create 2-5 activities per lead
      const numActivities = randomInt(2, 5);
      
      for (let i = 0; i < numActivities; i++) {
        const activityType = randomElement(activityTypes);
        const activityDate = daysAgo(randomInt(1, 60));
        const notes = `${activityType.replace(/_/g, " ")} for ${lead.companyName}`;

        await connection.execute(
          `INSERT INTO activities (userId, leadId, type, notes, createdAt)
           VALUES (?, ?, ?, ?, ?)`,
          [userId, lead.id, activityType, notes, activityDate]
        );
        activityCount++;
      }
    }
    console.log(`  ✓ Created ${activityCount} activities`);

    // 5. Create Communications
    console.log("\n💬 Creating communications...");
    const emailSubjects = [
      "Introduction to our solution",
      "Following up on our conversation",
      "Quick question about your needs",
      "Exclusive offer for your team",
      "Case study you might find interesting",
    ];
    let commCount = 0;

    for (const lead of leadIds) {
      // Create 1-3 communications per lead
      const numComms = randomInt(1, 3);
      
      for (let i = 0; i < numComms; i++) {
        const channel = randomElement(["email", "phone", "linkedin"]);
        const direction = randomElement(["outbound", "inbound"]);
        const subject = randomElement(emailSubjects);
        const body = `This is a sample ${channel} communication with ${lead.companyName}.`;
        const sentDate = daysAgo(randomInt(1, 60));
        const opened = Math.random() > 0.4;
        const clicked = opened && Math.random() > 0.6;

        await connection.execute(
          `INSERT INTO communications (userId, leadId, channel, direction, subject, body, sentAt, opened, clicked, createdAt)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
          [userId, lead.id, channel, direction, subject, body, sentDate, opened, clicked]
        );
        commCount++;
      }
    }
    console.log(`  ✓ Created ${commCount} communications`);

    // 6. Create Product Knowledge entries
    console.log("\n📚 Creating product knowledge...");
    const productDocs = [
      { title: "Product Overview", content: "Comprehensive overview of our flagship product features and benefits." },
      { title: "Technical Specifications", content: "Detailed technical specifications including API documentation and integration guides." },
      { title: "Case Studies", content: "Success stories from our top customers showing real-world results." },
      { title: "Pricing Guide", content: "Pricing tiers and package options for different customer segments." },
    ];

    for (const campaign of campaignIds.slice(0, 5)) {
      for (const doc of productDocs) {
        await connection.execute(
          `INSERT INTO productKnowledge (userId, campaignId, title, content, fileType, createdAt, updatedAt)
           VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
          [userId, campaign.id, doc.title, doc.content, "document"]
        );
      }
    }
    console.log(`  ✓ Created product knowledge for ${Math.min(5, campaignIds.length)} campaigns`);

    // 7. Create Email Campaigns
    console.log("\n📧 Creating email campaigns...");
    for (const campaign of campaignIds.slice(0, 8)) {
      const subject = `Exclusive opportunity for ${sampleCompanies[randomInt(0, sampleCompanies.length - 1)].name}`;
      const body = "Hi {{firstName}},\n\nI noticed your company is growing rapidly in the {{industry}} space...\n\nBest regards,\nSales Team";
      const status = randomElement(["draft", "scheduled", "sent", "completed"]);
      const scheduledFor = status === "scheduled" ? new Date(Date.now() + 86400000) : null;
      const sentAt = status === "sent" || status === "completed" ? daysAgo(randomInt(1, 30)) : null;

      await connection.execute(
        `INSERT INTO emailCampaigns (userId, campaignId, subject, body, status, scheduledFor, sentAt, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [userId, campaign.id, subject, body, status, scheduledFor, sentAt]
      );
    }
    console.log(`  ✓ Created email campaigns`);

    // 8. Create Workflows
    console.log("\n⚙️  Creating workflows...");
    const workflows = [
      {
        name: "Follow-up inactive leads",
        triggerType: "inactivity",
        triggerConfig: JSON.stringify({ days: 7 }),
        actionType: "send_email",
        actionConfig: JSON.stringify({ template: "follow_up" }),
      },
      {
        name: "Notify on qualified status",
        triggerType: "status_change",
        triggerConfig: JSON.stringify({ from: "contacted", to: "qualified" }),
        actionType: "notify_owner",
        actionConfig: JSON.stringify({ message: "New qualified lead" }),
      },
      {
        name: "Daily lead review",
        triggerType: "time_based",
        triggerConfig: JSON.stringify({ schedule: "0 9 * * *" }),
        actionType: "notify_owner",
        actionConfig: JSON.stringify({ message: "Daily lead summary" }),
      },
    ];

    for (const workflow of workflows) {
      await connection.execute(
        `INSERT INTO workflows (userId, name, triggerType, triggerConfig, actionType, actionConfig, isActive, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [userId, workflow.name, workflow.triggerType, workflow.triggerConfig, workflow.actionType, workflow.actionConfig, true]
      );
    }
    console.log(`  ✓ Created ${workflows.length} workflows`);

    console.log("\n✨ Database seeding completed successfully!\n");
    console.log("📊 Summary:");
    console.log(`  - ${sampleClients.length} clients`);
    console.log(`  - ${campaignIds.length} campaigns`);
    console.log(`  - ${leadIds.length} leads`);
    console.log(`  - ${activityCount} activities`);
    console.log(`  - ${commCount} communications`);
    console.log(`  - ${workflows.length} workflows`);
    console.log("\n🚀 You can now test the platform with realistic data!\n");

  } catch (error) {
    console.error("\n❌ Error during seeding:", error);
    throw error;
  } finally {
    await connection.end();
  }
}

// Run the seeder
seed().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
