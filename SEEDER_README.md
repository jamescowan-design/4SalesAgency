# Database Seeder Instructions

## Overview

The database seeder populates your 4 Sales Agency platform with realistic sample data for immediate testing.

## What Gets Created

- **5 Clients** - Sample companies using your platform
- **15 Campaigns** - 3 campaigns per client across different industries
- **100 Leads** - Realistic company and contact information
- **~150 Activities** - Email, calls, meetings, notes
- **30 Communication Logs** - Email tracking data

## Prerequisites

1. You must be logged into the application at least once (to create your user account)
2. Database must be accessible (DATABASE_URL environment variable set)

## How to Run

```bash
cd /home/ubuntu/4SalesAgency
node scripts/seed-database.mjs
```

## Expected Output

```
🌱 Starting database seeding...

✅ Found owner user ID: 1

📋 Creating clients...
  ✓ Created client 1/5
  ✓ Created client 2/5
  ...

📢 Creating campaigns...
  ✓ Created 15 campaigns

👥 Creating leads...
  ✓ Created 20/100 leads
  ✓ Created 40/100 leads
  ...

📊 Creating activities...
  ✓ Created activities for 50 leads

📧 Creating communication logs...
  ✓ Created 30 communication logs

✅ Database seeding completed successfully!

📊 Summary:
   - 5 clients
   - 15 campaigns
   - 100 leads
   - ~150 activities
   - 30 communication logs

🚀 Your platform is now ready for testing!
```

## After Seeding

You can now:
- View clients at `/clients`
- Browse campaigns at `/campaigns`
- Explore leads in CRM at `/crm`
- Check analytics at `/analytics`
- Test priority dashboard at `/priority`
- Review attribution at `/attribution`

## Re-running the Seeder

The seeder will add NEW data each time you run it. If you want to start fresh:

1. Clear existing data manually through the UI, or
2. Reset the database and run migrations again:
   ```bash
   pnpm db:push
   node scripts/seed-database.mjs
   ```

## Troubleshooting

**Error: "Owner user not found"**
- Solution: Log in to the application first to create your user account

**Error: "Cannot connect to database"**
- Solution: Check that DATABASE_URL environment variable is set correctly

**Error: "Duplicate entry"**
- Solution: This is normal if running multiple times. Data will still be created.
