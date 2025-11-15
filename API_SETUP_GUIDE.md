# API Keys Setup Guide - Complete Walkthrough

This guide provides step-by-step instructions for obtaining and configuring all API keys required for the 4 Sales Agency platform.

## 📋 Overview

The platform integrates with 8 external services. Here's what you need and estimated costs:

| Service | Purpose | Required | Monthly Cost | Free Tier |
|---------|---------|----------|--------------|-----------|
| **SendGrid** | Email delivery | ✅ Yes | $15-$90 | 100 emails/day |
| **Twilio** | Phone calls & SMS | ✅ Yes | $20-$100 | $15 trial credit |
| **VAPI** | AI voice conversations | ⚠️ Optional | $50-$200 | No free tier |
| **ElevenLabs** | Voice synthesis | ⚠️ Optional | $5-$99 | 10k chars/month |
| **AssemblyAI** | Speech transcription | ⚠️ Optional | $0-$50 | 5 hours free |
| **ScraperAPI** | Proxy rotation | ⚠️ Optional | $49-$249 | 5k requests |
| **Bright Data** | Premium proxies | ⚠️ Optional | $500+ | No free tier |
| **2Captcha** | CAPTCHA solving | ⚠️ Optional | $3-$50 | Pay as you go |

**Total Minimum Cost**: $35-$190/month (with free tiers)  
**Recommended Setup**: $100-$300/month (for production use)

---

## 🔑 Service 1: SendGrid (Email Delivery)

### Why You Need It
SendGrid handles all email delivery for the platform, including:
- Cold outreach emails
- Follow-up sequences
- Automated drip campaigns
- Email tracking (opens, clicks)

### Getting Your API Key

1. **Create Account**
   - Visit [https://signup.sendgrid.com/](https://signup.sendgrid.com/)
   - Sign up with your email
   - Verify your email address
   - Complete account setup

2. **Verify Sender Identity**
   - Go to Settings → Sender Authentication
   - Choose "Single Sender Verification" (quick) or "Domain Authentication" (recommended)
   - For Single Sender:
     - Click "Create New Sender"
     - Enter your email address (e.g., sales@yourcompany.com)
     - Fill in sender details
     - Verify via email link
   - For Domain Authentication (better deliverability):
     - Click "Authenticate Your Domain"
     - Enter your domain (e.g., yourcompany.com)
     - Add DNS records provided by SendGrid
     - Wait for verification (can take up to 48 hours)

3. **Create API Key**
   - Go to Settings → API Keys
   - Click "Create API Key"
   - Name: "4 Sales Agency Production"
   - Permissions: "Full Access" (or "Restricted Access" with Mail Send enabled)
   - Click "Create & View"
   - **IMPORTANT**: Copy the API key immediately (starts with `SG.`)
   - You won't be able to see it again!

4. **Configure in Platform**
   - Navigate to Settings (`/settings`) in 4 Sales Agency
   - Go to "Email Settings" tab
   - Enter:
     ```
     API Key: SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
     From Email: sales@yourcompany.com (must match verified sender)
     From Name: Your Company Sales Team
     ```
   - Click "Save Settings"
   - Click "Test Connection" to verify

### Free Tier Limits
- 100 emails per day forever
- Upgrade to Essentials ($15/month) for 50,000 emails/month

### Troubleshooting
- **Error: "Sender email not verified"** → Complete sender verification first
- **Error: "Invalid API key"** → Regenerate key and copy carefully
- **Emails going to spam** → Set up domain authentication (DNS records)

---

## 📞 Service 2: Twilio (Phone Calls & SMS)

### Why You Need It
Twilio powers all phone communication:
- Outbound sales calls
- SMS follow-ups
- Call recording
- Phone number provisioning

### Getting Your Credentials

1. **Create Account**
   - Visit [https://www.twilio.com/try-twilio](https://www.twilio.com/try-twilio)
   - Sign up with your email
   - Verify your phone number
   - You'll get $15 trial credit

2. **Get Account SID and Auth Token**
   - After login, you'll see your dashboard
   - Find "Account SID" and "Auth Token" in the dashboard
   - Click the eye icon to reveal Auth Token
   - Copy both values

3. **Get a Phone Number**
   - Go to Phone Numbers → Manage → Buy a Number
   - Search for numbers in your country
   - Filter by capabilities:
     - ✅ Voice
     - ✅ SMS (optional)
   - Select a number and click "Buy"
   - Cost: ~$1/month per number

4. **Configure Voice Settings**
   - Go to your phone number settings
   - Under "Voice & Fax":
     - Configure with: Webhooks
     - A call comes in: (leave blank for now)
     - Call Status Changes: (leave blank)
   - Click "Save"

5. **Configure in Platform**
   - Navigate to Settings (`/settings`) in 4 Sales Agency
   - Go to "Twilio Settings" tab
   - Enter:
     ```
     Account SID: ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
     Auth Token: your_auth_token_here
     Phone Number: +1234567890
     ```
   - Click "Save Settings"
   - Click "Test Connection" to verify

### Upgrading from Trial
- Trial accounts can only call verified numbers
- Upgrade to paid account ($20+ minimum) to call any number
- Go to Console → Billing → Upgrade

### Cost Estimates
- Outbound calls: $0.013-$0.085 per minute
- SMS: $0.0075 per message
- Phone number: $1/month
- **Example**: 100 calls/month (5 min avg) = ~$30-$50/month

### Troubleshooting
- **Error: "Unable to create record"** → Verify phone number format (+1234567890)
- **Calls not connecting** → Check you've upgraded from trial account
- **Error: "Insufficient balance"** → Add funds to Twilio account

---

## 🤖 Service 3: VAPI (AI Voice Conversations)

### Why You Need It
VAPI enables AI-powered phone conversations:
- Automated qualification calls
- Lead nurturing via voice
- 24/7 availability
- Natural conversation flow

### Getting Your API Key

1. **Create Account**
   - Visit [https://vapi.ai/](https://vapi.ai/)
   - Click "Get Started"
   - Sign up with your email
   - Complete onboarding

2. **Create API Key**
   - Go to Dashboard → API Keys
   - Click "Create New Key"
   - Name: "4 Sales Agency"
   - Copy the API key

3. **Configure in Platform**
   - Navigate to Settings (`/settings`)
   - Go to "VAPI Settings" tab
   - Enter:
     ```
     API Key: your_vapi_api_key_here
     ```
   - Click "Save Settings"
   - Click "Test Connection"

### Pricing
- No free tier
- Pay per minute of conversation
- ~$0.10-$0.20 per minute
- **Example**: 100 calls/month (5 min avg) = ~$50-$100/month

### Note
VAPI is optional. You can use Twilio for manual calls without VAPI.

---

## 🎙️ Service 4: ElevenLabs (Voice Synthesis)

### Why You Need It
ElevenLabs provides realistic AI voice synthesis:
- Generate voice for AI calls
- Multiple voice options
- Natural-sounding speech
- Emotional tone control

### Getting Your API Key

1. **Create Account**
   - Visit [https://elevenlabs.io/](https://elevenlabs.io/)
   - Click "Get Started Free"
   - Sign up with your email

2. **Get API Key**
   - Go to Profile → API Keys
   - Copy your API key
   - Or click "Generate New Key"

3. **Configure in Platform**
   - Navigate to Settings (`/settings`)
   - Go to "ElevenLabs Settings" tab
   - Enter:
     ```
     API Key: your_elevenlabs_api_key
     ```
   - Click "Save Settings"
   - Click "Test Connection"

### Free Tier
- 10,000 characters per month
- ~5-10 minutes of speech
- Good for testing

### Pricing
- Starter: $5/month (30k characters)
- Creator: $22/month (100k characters)
- Pro: $99/month (500k characters)

---

## 📝 Service 5: AssemblyAI (Speech Transcription)

### Why You Need It
AssemblyAI transcribes call recordings:
- Automatic call transcription
- Sentiment analysis
- Key phrase extraction
- Searchable call logs

### Getting Your API Key

1. **Create Account**
   - Visit [https://www.assemblyai.com/](https://www.assemblyai.com/)
   - Click "Get Started Free"
   - Sign up with your email

2. **Get API Key**
   - After signup, you'll see your API key on the dashboard
   - Or go to Settings → API Keys
   - Copy the API key

3. **Configure in Platform**
   - Navigate to Settings (`/settings`)
   - Go to "AssemblyAI Settings" tab
   - Enter:
     ```
     API Key: your_assemblyai_api_key
     ```
   - Click "Save Settings"
   - Click "Test Connection"

### Free Tier
- 5 hours of transcription per month
- Good for ~60-100 calls

### Pricing
- Pay as you go: $0.00025 per second (~$0.90 per hour)
- **Example**: 50 hours/month = ~$45/month

---

## 🌐 Service 6: ScraperAPI (Web Scraping)

### Why You Need It
ScraperAPI enables reliable web scraping:
- Proxy rotation
- CAPTCHA handling
- JavaScript rendering
- Company data enrichment

### Getting Your API Key

1. **Create Account**
   - Visit [https://www.scraperapi.com/](https://www.scraperapi.com/)
   - Click "Start Free Trial"
   - Sign up with your email

2. **Get API Key**
   - After login, your API key is displayed on the dashboard
   - Or go to Documentation → API Key
   - Copy the API key

3. **Configure in Platform**
   - Navigate to Settings (`/settings`)
   - Go to "Web Scraper Settings" tab
   - Select "ScraperAPI" as proxy provider
   - Enter:
     ```
     ScraperAPI Key: your_scraperapi_key
     ```
   - Click "Save Settings"
   - Click "Test Connection"

### Free Tier
- 5,000 API credits
- Good for testing

### Pricing
- Hobby: $49/month (100k credits)
- Startup: $99/month (300k credits)
- Business: $249/month (1M credits)

---

## 🔒 Service 7: Bright Data (Premium Proxies)

### Why You Need It
Bright Data provides premium proxy services:
- Higher success rates than ScraperAPI
- Residential proxies
- Better for LinkedIn scraping
- More reliable for large-scale scraping

### Getting Your Credentials

1. **Create Account**
   - Visit [https://brightdata.com/](https://brightdata.com/)
   - Click "Get Started"
   - Sign up (requires business email)
   - Complete verification

2. **Create Proxy Zone**
   - Go to Proxy & Scraping Infrastructure
   - Click "Add Zone"
   - Select "Residential Proxies"
   - Name: "4 Sales Agency"
   - Create zone

3. **Get Credentials**
   - Click on your zone
   - Find "Access Parameters"
   - Copy:
     - Username
     - Password
     - Host
     - Port

4. **Configure in Platform**
   - Navigate to Settings (`/settings`)
   - Go to "Web Scraper Settings" tab
   - Select "Bright Data" as proxy provider
   - Enter:
     ```
     Username: your_brightdata_username
     Password: your_brightdata_password
     ```
   - Click "Save Settings"

### Pricing
- Pay as you go: $8.40 per GB
- Monthly plans: $500+ per month
- **Recommended for**: High-volume scraping (1000+ companies/month)

---

## 🔓 Service 8: 2Captcha (CAPTCHA Solving)

### Why You Need It
2Captcha solves CAPTCHAs automatically:
- Bypass CAPTCHA challenges
- Enable scraping of protected sites
- Automatic reCAPTCHA solving
- High success rate

### Getting Your API Key

1. **Create Account**
   - Visit [https://2captcha.com/](https://2captcha.com/)
   - Click "Sign Up"
   - Register with your email
   - Verify your email

2. **Add Funds**
   - Go to Dashboard
   - Click "Add Funds"
   - Minimum: $3
   - Payment methods: PayPal, Bitcoin, cards

3. **Get API Key**
   - Go to Settings → API Key
   - Copy your API key

4. **Configure in Platform**
   - Navigate to Settings (`/settings`)
   - Go to "Web Scraper Settings" tab
   - Enable "CAPTCHA Solving"
   - Select "2Captcha" as provider
   - Enter:
     ```
     2Captcha Key: your_2captcha_api_key
     ```
   - Click "Save Settings"

### Pricing
- Pay per CAPTCHA solved
- reCAPTCHA v2: $2.99 per 1000 solves
- reCAPTCHA v3: $2.99 per 1000 solves
- **Example**: 100 CAPTCHAs/month = ~$0.30/month

---

## ✅ Configuration Checklist

Use this checklist to track your API setup progress:

### Essential Services (Required for core features)
- [ ] **SendGrid**
  - [ ] Account created
  - [ ] Sender email verified
  - [ ] API key generated
  - [ ] Configured in platform
  - [ ] Test connection successful
  - [ ] Test email sent successfully

- [ ] **Twilio**
  - [ ] Account created
  - [ ] Account upgraded from trial (if needed)
  - [ ] Phone number purchased
  - [ ] Account SID copied
  - [ ] Auth Token copied
  - [ ] Configured in platform
  - [ ] Test connection successful
  - [ ] Test call made successfully

### Voice AI Services (Optional but recommended)
- [ ] **VAPI**
  - [ ] Account created
  - [ ] API key generated
  - [ ] Configured in platform
  - [ ] Test connection successful

- [ ] **ElevenLabs**
  - [ ] Account created
  - [ ] API key generated
  - [ ] Configured in platform
  - [ ] Test connection successful

- [ ] **AssemblyAI**
  - [ ] Account created
  - [ ] API key generated
  - [ ] Configured in platform
  - [ ] Test connection successful

### Web Scraping Services (Optional but recommended)
- [ ] **ScraperAPI or Bright Data**
  - [ ] Account created
  - [ ] API credentials generated
  - [ ] Configured in platform
  - [ ] Test connection successful
  - [ ] Test scrape completed

- [ ] **2Captcha** (if using scraping)
  - [ ] Account created
  - [ ] Funds added
  - [ ] API key generated
  - [ ] Configured in platform

---

## 💰 Cost Optimization Tips

### Start Small
1. **Month 1**: Use free tiers only
   - SendGrid: 100 emails/day
   - Twilio: $15 trial credit
   - ElevenLabs: 10k characters
   - AssemblyAI: 5 hours
   - ScraperAPI: 5k credits
   - **Total cost**: $0-$20

2. **Month 2-3**: Upgrade essential services
   - SendGrid Essentials: $15/month
   - Twilio: $50/month budget
   - **Total cost**: $65/month

3. **Month 4+**: Add optional services as needed
   - VAPI: $100/month
   - ScraperAPI: $49/month
   - **Total cost**: $214/month

### Save Money
- **Use SendGrid free tier** until you hit 100 emails/day
- **Verify numbers in Twilio trial** before upgrading
- **Start with ScraperAPI** instead of expensive Bright Data
- **Only enable CAPTCHA solving** when needed
- **Monitor usage** in each service dashboard
- **Set spending limits** where available

---

## 🔒 Security Best Practices

### Storing API Keys
- ✅ **DO**: Store in platform's encrypted settings
- ✅ **DO**: Use environment variables for local development
- ✅ **DO**: Rotate keys every 90 days
- ❌ **DON'T**: Commit keys to Git repositories
- ❌ **DON'T**: Share keys via email or Slack
- ❌ **DON'T**: Use production keys for testing

### Key Rotation Schedule
1. **Quarterly**: Rotate all API keys
2. **After team member leaves**: Rotate immediately
3. **If compromised**: Rotate immediately and audit usage

### Monitoring
- Check API usage weekly in each service dashboard
- Set up billing alerts for unexpected charges
- Review API logs for unusual activity
- Monitor rate limits to avoid service disruptions

---

## 🆘 Getting Help

### Service-Specific Support
- **SendGrid**: [https://support.sendgrid.com/](https://support.sendgrid.com/)
- **Twilio**: [https://support.twilio.com/](https://support.twilio.com/)
- **VAPI**: [https://docs.vapi.ai/](https://docs.vapi.ai/)
- **ElevenLabs**: [https://help.elevenlabs.io/](https://help.elevenlabs.io/)
- **AssemblyAI**: [https://www.assemblyai.com/docs](https://www.assemblyai.com/docs)
- **ScraperAPI**: [https://www.scraperapi.com/documentation/](https://www.scraperapi.com/documentation/)
- **Bright Data**: [https://help.brightdata.com/](https://help.brightdata.com/)
- **2Captcha**: [https://2captcha.com/support](https://2captcha.com/support)

### Platform Support
- Check `TESTING_GUIDE.md` for feature testing
- Review `SCRAPER_REQUIREMENTS.md` for scraper setup
- Contact platform support at https://help.manus.im

---

## 📊 Quick Reference: API Key Formats

| Service | Format | Example |
|---------|--------|---------|
| SendGrid | `SG.` + 66 chars | `SG.abc123...` |
| Twilio SID | `AC` + 32 hex chars | `ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` |
| Twilio Token | 32 chars | `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` |
| VAPI | UUID format | `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx` |
| ElevenLabs | 32 chars | `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` |
| AssemblyAI | 32 chars | `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` |
| ScraperAPI | 32 chars | `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` |
| 2Captcha | 32 chars | `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` |

---

**Next Steps**: After configuring all API keys, proceed to `TESTING_GUIDE.md` to test each integration.
