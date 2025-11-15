# 4 Sales Agency - Complete Testing Guide

This guide walks you through testing all features of the 4 Sales Agency platform from initial setup to advanced workflows.

## 🚀 Quick Start Checklist

### Phase 1: Initial Setup (5 minutes)

1. **Log In**
   - Visit the platform URL
   - Click "Get Started" button
   - Complete Manus OAuth authentication
   - You'll be redirected to the home page with sidebar navigation

2. **Verify Database Tables** (One-time setup)
   - The database tables are automatically created on first deployment
   - If you encounter "table doesn't exist" errors, contact support

3. **Add API Keys** (Settings → API Keys)
   - Navigate to `/settings`
   - Configure each service with your API credentials:

   **SendGrid (Email)**
   ```
   API Key: SG.xxxxxxxxxxxxxxxxxxxxx
   From Email: noreply@yourdomain.com
   From Name: Your Company Name
   ```

   **Twilio (Calls & SMS)**
   ```
   Account SID: ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   Auth Token: your_auth_token
   Phone Number: +1234567890
   ```

   **VAPI (AI Voice)**
   ```
   API Key: your_vapi_key
   ```

   **ElevenLabs (Voice Synthesis)**
   ```
   API Key: your_elevenlabs_key
   ```

   **AssemblyAI (Transcription)**
   ```
   API Key: your_assemblyai_key
   ```

   **Web Scraper Services** (Optional but recommended)
   ```
   ScraperAPI Key: your_scraperapi_key
   Bright Data Username: your_username
   Bright Data Password: your_password
   2Captcha Key: your_2captcha_key
   ```

4. **Test API Connections**
   - Click "Test Connection" button for each service
   - Verify all services show green checkmarks
   - Fix any connection errors before proceeding

---

## 📊 Phase 2: Create Test Data (10 minutes)

### Manual Data Creation

Since the database seeder requires tables to exist first, let's create test data manually:

#### Step 1: Create Your First Client

1. Navigate to **Clients** (`/clients`)
2. Click "Create Client"
3. Fill in details:
   ```
   Name: TechStart Solutions
   Industry: SaaS
   Website: https://techstart.example.com
   Contact Email: contact@techstart.example.com
   Contact Phone: +1-555-0101
   ```
4. Click "Create Client"
5. Repeat for 2-3 more clients in different industries

#### Step 2: Create Campaigns

1. Click on a client to view details
2. Click "Create Campaign"
3. Fill in campaign details:
   ```
   Name: Q1 2025 Outbound Campaign
   Description: Target mid-market SaaS companies
   Target Industries: SaaS, Software, Technology
   Target Geographies: United States, Canada
   Company Size: 100-500 employees
   Confidence Threshold: 70
   ```
4. Click "Create Campaign"
5. You'll be redirected to the campaign detail page

#### Step 3: Upload Product Knowledge

1. On the campaign detail page, scroll to "Product Knowledge"
2. Click "Upload Document"
3. Upload PDFs, Word docs, or text files containing:
   - Product features and benefits
   - Case studies
   - Pricing information
   - Technical specifications
4. These documents train the Virtual LLM for this campaign

#### Step 4: Add Leads Manually

1. Navigate to **CRM** (`/crm`)
2. Click "Add Lead"
3. Fill in lead details:
   ```
   Campaign: Select your campaign
   Company Name: Acme Corp
   Contact Name: John Smith
   Title: VP of Sales
   Email: john.smith@acme.example.com
   Phone: +1-555-1234
   Status: New
   Source: Cold Outreach
   ```
4. Click "Create Lead"
5. Add 5-10 more leads with varying details

#### Step 5: Import Leads via CSV (Faster)

1. Navigate to **Bulk Operations** (`/bulk`)
2. Download the CSV template
3. Fill in the template with lead data:
   ```csv
   campaignId,companyName,contactName,title,email,phone,status,source
   1,Acme Corp,John Smith,VP of Sales,john@acme.com,+15551234,new,cold_outreach
   1,Beta Tech,Sarah Johnson,CTO,sarah@beta.com,+15555678,new,referral
   ```
4. Upload the completed CSV
5. Review import results (success/duplicates/failures)

---

## 🧪 Phase 3: Test Core Features (20 minutes)

### Feature 1: AI Email Generation

1. Navigate to a lead detail page (`/leads/:id`)
2. Scroll to "Generate Email" section
3. Click "Generate Email"
4. The AI will create a personalized email using:
   - Product knowledge from the campaign
   - Lead's company information
   - ICP matching data
5. Review the generated email
6. Edit if needed
7. Click "Send Email" (requires SendGrid API key)
8. Verify email appears in Communications section

### Feature 2: Priority Dashboard

1. Navigate to **Priority Dashboard** (`/priority`)
2. View AI-scored leads ranked by:
   - Confidence score (ICP match)
   - Engagement level (activities)
   - Recency (last contact)
   - Urgency indicators
3. Review recommended actions for top leads
4. Click action buttons to:
   - Send email
   - Schedule call
   - Update status
   - Add to workflow

### Feature 3: Web Scraper & Enrichment

1. Navigate to **Enrichment** (`/enrichment`)
2. Enter a company website URL
3. Click "Enrich Company"
4. The scraper will extract:
   - Company description
   - Employee count
   - Technologies used
   - Recent news
   - Job postings
   - Social media links
5. Review confidence score (0-100)
6. Click "Add as Lead" to create a new lead

### Feature 4: Workflow Automation

1. Navigate to **Workflows** (`/workflows`)
2. Click "Create Workflow"
3. Configure trigger:
   ```
   Trigger: Inactivity
   Days: 7
   ```
4. Configure action:
   ```
   Action: Send Email
   Template: Follow-up email
   ```
5. Toggle workflow to "Active"
6. The system will automatically execute this workflow hourly

### Feature 5: Voice Calling (Requires API Keys)

1. Navigate to **Voice Calling** (`/voice`)
2. Select a lead
3. Choose call type:
   - **Manual Call**: Use Twilio to place a call
   - **AI Call**: Use VAPI for AI-powered conversation
4. Click "Start Call"
5. For AI calls, the system will:
   - Generate a call script from product knowledge
   - Use ElevenLabs for voice synthesis
   - Conduct the conversation
   - Transcribe with AssemblyAI
   - Log results automatically

### Feature 6: Multi-Channel Attribution

1. Navigate to **Attribution** (`/attribution`)
2. Select a campaign
3. View the customer journey:
   - All touchpoints (email, call, meeting)
   - Time between touches
   - Conversion path
   - Attribution credit per channel
4. Analyze which channels drive conversions

### Feature 7: Analytics Dashboard

1. Navigate to **Analytics** (`/analytics`)
2. Select time range (7d, 30d, 90d)
3. Review metrics:
   - Total leads by status
   - Email performance (opens, clicks)
   - Call performance (answered, duration)
   - Conversion funnel
   - Top performing campaigns
4. Export data as CSV for further analysis

### Feature 8: Custom Reports

1. Navigate to **Reports** (`/reports`)
2. Select report type:
   - Lead Status Report
   - Campaign Performance
   - Email Performance
   - Call Analytics
   - Conversion Funnel
3. Configure filters (date range, campaign, status)
4. Click "Generate Report"
5. View interactive charts
6. Click "Export CSV" to download data

### Feature 9: GDPR Compliance

1. Navigate to **GDPR Compliance** (`/gdpr`)
2. Test consent management:
   - View all leads with consent status
   - Update consent preferences
   - Record consent changes
3. Test data export:
   - Select a lead
   - Click "Export Data"
   - Download complete data package (JSON)
4. Test deletion requests:
   - Submit deletion request for a test lead
   - Review pending requests
   - Approve/reject requests
   - Verify data is anonymized after approval

### Feature 10: Recruitment Intelligence

1. Navigate to **Recruitment Intel** (`/recruitment`)
2. View hiring signals:
   - Job postings detected
   - Funding announcements
   - Company expansion news
   - Leadership changes
3. Filter by signal type and urgency
4. Click "View Source" to see original data
5. Click "Create Lead" to convert signal to lead

### Feature 11: Campaign Templates

1. Navigate to **Campaign Templates** (`/templates`)
2. Browse 6 industry-specific templates:
   - SaaS Outbound Sales
   - Recruiting Services
   - Consulting Services
   - FinTech Solutions
   - Enterprise Software
   - Developer Tools
3. Click "Use Template" on any template
4. Select a client
5. Customize campaign name
6. Click "Create Campaign"
7. The campaign is created with:
   - Pre-configured ICP
   - Email sequence (3-5 emails)
   - Automated workflows
   - Best practices for the industry

---

## 🔄 Phase 4: Test Complete Workflows (30 minutes)

### Workflow A: Cold Outreach Campaign

**Goal**: Create a campaign, import leads, send emails, track engagement

1. **Setup** (5 min)
   - Create client: "CloudTech Inc"
   - Create campaign: "Q1 SaaS Outreach"
   - Upload product knowledge documents
   - Set ICP: SaaS companies, 100-500 employees, $10M-$50M revenue

2. **Lead Generation** (10 min)
   - Use web scraper to find 10 target companies
   - Review confidence scores
   - Add high-scoring companies as leads
   - OR import 20 leads via CSV

3. **Email Campaign** (10 min)
   - Generate AI emails for top 5 leads
   - Review and customize each email
   - Send emails (requires SendGrid)
   - Verify emails appear in Communications log

4. **Track Engagement** (5 min)
   - Wait for email opens/clicks (or simulate)
   - View engagement in Analytics dashboard
   - Check Priority Dashboard for engaged leads
   - Follow up with engaged leads

### Workflow B: Recruitment Intelligence

**Goal**: Find companies with hiring signals and convert to leads

1. **Setup** (5 min)
   - Create client: "TalentSource Recruiting"
   - Create campaign: "Tech Recruiting Q1"
   - Configure ICP for tech companies

2. **Find Hiring Signals** (10 min)
   - Navigate to Recruitment Intel
   - Web scraper automatically detects:
     - Companies with 5+ job postings
     - Recent funding announcements
     - Office expansion news
   - Review signals with "high" urgency

3. **Convert to Leads** (10 min)
   - Click "Create Lead" on top signals
   - Enrich company data via web scraper
   - Generate personalized recruitment pitch
   - Send outreach email

4. **Automate Follow-ups** (5 min)
   - Create workflow: "Follow up on hiring signals"
   - Trigger: New recruitment signal detected
   - Action: Send email template
   - Activate workflow

### Workflow C: Multi-Touch Attribution

**Goal**: Track a lead through multiple touchpoints to conversion

1. **Initial Contact** (Day 1)
   - Send cold email to lead
   - Log email sent activity

2. **Follow-up** (Day 3)
   - Lead opens email (tracked automatically)
   - Send follow-up email
   - Log activity

3. **Engagement** (Day 5)
   - Lead clicks link in email (tracked)
   - Make phone call
   - Log call activity with notes

4. **Conversion** (Day 10)
   - Schedule meeting
   - Update lead status to "Qualified"
   - Send proposal
   - Update status to "Proposal Sent"

5. **Attribution Analysis**
   - Navigate to Attribution dashboard
   - View complete journey for this lead
   - See attribution credit:
     - First touch: Cold email (30%)
     - Middle touch: Follow-up email (20%)
     - Last touch: Phone call (50%)

---

## 🐛 Troubleshooting Common Issues

### Issue: "Database table doesn't exist"
**Solution**: The database tables should be automatically created. If you see this error, the database migration may not have run. Contact support or check the deployment logs.

### Issue: "API key invalid" when testing connections
**Solution**: 
- Verify you copied the entire API key without spaces
- Check that the API key is active in the service provider's dashboard
- Ensure you have sufficient credits/quota with the service

### Issue: Web scraper returns empty results
**Solution**:
- Verify ScraperAPI or Bright Data credentials are correct
- Check that you have remaining API credits
- Try a different target website (some sites block scrapers)
- Enable CAPTCHA solving if the site uses CAPTCHA

### Issue: Emails not sending
**Solution**:
- Verify SendGrid API key is correct
- Check that "From Email" is verified in SendGrid
- Ensure you're not in SendGrid sandbox mode
- Check SendGrid activity log for errors

### Issue: AI-generated emails are generic
**Solution**:
- Upload more detailed product knowledge documents
- Include case studies and specific use cases
- Add technical specifications
- Provide pricing information
- The AI learns from the documents you provide

### Issue: Workflows not executing
**Solution**:
- Verify workflow is toggled to "Active"
- Check workflow execution logs in database
- Workflows run on a schedule (hourly for time-based, on trigger for event-based)
- Wait at least 1 hour for time-based workflows

### Issue: Voice calls failing
**Solution**:
- Verify all voice-related API keys (Twilio, VAPI, ElevenLabs, AssemblyAI)
- Check Twilio phone number is active and has calling enabled
- Ensure you have sufficient balance in Twilio account
- Test with a verified phone number first

---

## 📈 Performance Benchmarks

After completing setup and testing, you should see:

### Data Metrics
- **5-10 clients** created
- **10-20 campaigns** configured
- **50-100 leads** in CRM
- **100-300 activities** logged
- **50-150 communications** tracked

### Feature Usage
- ✅ Email generation working with AI
- ✅ Web scraper enriching company data
- ✅ Priority dashboard ranking leads
- ✅ Analytics showing trends
- ✅ Workflows executing automatically
- ✅ Attribution tracking touchpoints
- ✅ GDPR compliance tools functional

### Integration Status
- ✅ SendGrid: Emails sending successfully
- ✅ Twilio: Calls connecting
- ✅ VAPI: AI conversations working
- ✅ ElevenLabs: Voice synthesis active
- ✅ AssemblyAI: Transcriptions accurate
- ✅ ScraperAPI: Data enrichment functional

---

## 🎯 Advanced Testing Scenarios

### Scenario 1: A/B Testing Email Campaigns

1. Navigate to a campaign
2. Create email campaign with 2 variants:
   - Variant A: Subject "Quick question about [Company]"
   - Variant B: Subject "Exclusive offer for [Company]"
3. Send to 50% of leads each
4. Track open rates and click rates
5. Analyze which variant performs better
6. Use winning variant for remaining leads

### Scenario 2: Drip Campaign Sequence

1. Create email sequence:
   - Day 0: Introduction email
   - Day 3: Follow-up with value proposition
   - Day 7: Case study
   - Day 14: Final offer
   - Day 30: Re-engagement
2. Enroll 20 leads in sequence
3. Track progression through sequence
4. Monitor drop-off points
5. Optimize sequence based on results

### Scenario 3: Lead Scoring Optimization

1. Review Priority Dashboard rankings
2. Analyze which factors correlate with conversions:
   - Company size
   - Industry match
   - Engagement level
   - Response time
3. Adjust confidence threshold in campaigns
4. Re-score existing leads
5. Compare before/after conversion rates

---

## 📚 Next Steps After Testing

Once you've completed all testing phases:

1. **Clean Up Test Data** (Optional)
   - Delete test clients, campaigns, and leads
   - Or keep as examples for training

2. **Import Real Data**
   - Export leads from your existing CRM
   - Format as CSV matching the template
   - Import via Bulk Operations

3. **Configure Production Workflows**
   - Create workflows for your actual sales process
   - Set appropriate triggers and actions
   - Test with a small batch first

4. **Train Your Team**
   - Share this testing guide with team members
   - Have each person complete the Quick Start
   - Assign roles (admin vs user)
   - Set up team processes

5. **Monitor & Optimize**
   - Review Analytics dashboard weekly
   - Identify bottlenecks in conversion funnel
   - A/B test email templates
   - Refine ICP definitions based on results

---

## 🆘 Getting Help

If you encounter issues not covered in this guide:

1. Check `API_KEYS_REQUIRED.md` for API setup details
2. Review `SCRAPER_REQUIREMENTS.md` for web scraper configuration
3. Check `todo.md` for known issues and roadmap
4. Contact support at https://help.manus.im

---

## ✅ Testing Completion Checklist

Use this checklist to verify you've tested all features:

**Setup**
- [ ] Logged in successfully
- [ ] Added all API keys
- [ ] Tested all API connections
- [ ] Created 3+ clients
- [ ] Created 5+ campaigns
- [ ] Uploaded product knowledge

**Lead Management**
- [ ] Added leads manually
- [ ] Imported leads via CSV
- [ ] Enriched leads with web scraper
- [ ] Updated lead statuses
- [ ] Added notes and activities

**Communication**
- [ ] Generated AI emails
- [ ] Sent test emails
- [ ] Tracked email opens/clicks
- [ ] Made test phone calls
- [ ] Logged call outcomes

**Automation**
- [ ] Created workflows
- [ ] Activated workflows
- [ ] Verified workflow execution
- [ ] Created email sequences
- [ ] Enrolled leads in sequences

**Analytics**
- [ ] Viewed Analytics dashboard
- [ ] Generated custom reports
- [ ] Exported data to CSV
- [ ] Analyzed attribution
- [ ] Reviewed conversion funnel

**Advanced Features**
- [ ] Tested A/B email variants
- [ ] Used campaign templates
- [ ] Monitored recruitment signals
- [ ] Tested GDPR compliance tools
- [ ] Reviewed priority dashboard

**Production Readiness**
- [ ] All API integrations working
- [ ] Team members trained
- [ ] Real data imported
- [ ] Production workflows configured
- [ ] Monitoring processes established

---

**Congratulations!** You've completed comprehensive testing of the 4 Sales Agency platform. You're now ready to use it for real B2B lead generation and qualification campaigns.
