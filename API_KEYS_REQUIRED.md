# 4 Sales Agency - API Keys & Credentials Required

This document lists all external API keys and credentials needed to activate the full functionality of the 4 Sales Agency platform.

---

## 🔑 Required API Keys

### 1. **Email Sending (Choose One)**

#### Option A: SendGrid (Recommended)
- **Service**: SendGrid Email API
- **Sign up**: https://signup.sendgrid.com/
- **What you need**:
  - `SENDGRID_API_KEY` - API key from SendGrid dashboard
- **Where to enter**: Settings page → Email/SMTP tab
- **Free tier**: 100 emails/day
- **Pricing**: $19.95/month for 50,000 emails
- **Features**: Email tracking, analytics, deliverability insights

#### Option B: SMTP Server
- **Service**: Any SMTP provider (Gmail, Outlook, custom server)
- **What you need**:
  - `SMTP_HOST` - SMTP server hostname (e.g., smtp.gmail.com)
  - `SMTP_PORT` - Port number (usually 587 or 465)
  - `SMTP_USER` - Your email address
  - `SMTP_PASSWORD` - Email password or app-specific password
  - `SMTP_FROM_EMAIL` - Sender email address
  - `SMTP_FROM_NAME` - Sender display name
- **Where to enter**: Settings page → Email/SMTP tab
- **Note**: Gmail requires "App Password" if 2FA is enabled

---

### 2. **Voice Calling & SMS**

#### Twilio (Required for phone calls)
- **Service**: Twilio Voice & SMS API
- **Sign up**: https://www.twilio.com/try-twilio
- **What you need**:
  - `TWILIO_ACCOUNT_SID` - Account identifier
  - `TWILIO_AUTH_TOKEN` - Authentication token
  - `TWILIO_PHONE_NUMBER` - Your Twilio phone number (format: +1234567890)
- **Where to enter**: Settings page → Twilio tab
- **Free tier**: $15 trial credit
- **Pricing**: 
  - Voice: $0.013/min (US)
  - SMS: $0.0079/message (US)
- **How to get phone number**: Twilio Console → Phone Numbers → Buy a Number
- **Features**: Outbound calling, SMS, call recording, call tracking

---

### 3. **AI Voice Conversations**

#### VAPI (AI Voice Assistant)
- **Service**: VAPI AI Voice Platform
- **Sign up**: https://vapi.ai/
- **What you need**:
  - `VAPI_API_KEY` - API key from VAPI dashboard
  - `VAPI_ASSISTANT_ID` - Your AI assistant ID (created in VAPI dashboard)
- **Where to enter**: Settings page → VAPI tab
- **Pricing**: Pay-as-you-go, ~$0.05-0.15/min
- **Features**: AI-powered phone conversations, natural language understanding
- **Setup**: Create an assistant in VAPI dashboard, configure voice and behavior

---

### 4. **Voice Synthesis**

#### ElevenLabs (Text-to-Speech)
- **Service**: ElevenLabs AI Voice Generation
- **Sign up**: https://elevenlabs.io/
- **What you need**:
  - `ELEVENLABS_API_KEY` - API key from ElevenLabs dashboard
  - `ELEVENLABS_VOICE_ID` - Voice ID (e.g., "21m00Tcm4TlvDq8ikWAM" for Rachel)
- **Where to enter**: Settings page → ElevenLabs tab
- **Free tier**: 10,000 characters/month
- **Pricing**: $5/month for 30,000 characters
- **Features**: Ultra-realistic AI voices, multiple languages, voice cloning
- **Voice IDs**: Browse voices at https://elevenlabs.io/voice-library

---

### 5. **Speech-to-Text Transcription**

#### AssemblyAI (Audio Transcription)
- **Service**: AssemblyAI Speech Recognition
- **Sign up**: https://www.assemblyai.com/
- **What you need**:
  - `ASSEMBLYAI_API_KEY` - API key from AssemblyAI dashboard
- **Where to enter**: Settings page → AssemblyAI tab
- **Free tier**: 5 hours of audio/month
- **Pricing**: $0.00025/second (~$0.90/hour)
- **Features**: Call transcription, sentiment analysis, speaker diarization
- **Use case**: Transcribe call recordings for analysis

---

## 🔧 Optional API Keys (Enhanced Features)

### 6. **Email Verification**

#### ZeroBounce or NeverBounce
- **Service**: Email validation and verification
- **Sign up**: 
  - ZeroBounce: https://www.zerobounce.net/
  - NeverBounce: https://neverbounce.com/
- **What you need**:
  - `EMAIL_VERIFICATION_API_KEY` - API key
  - `EMAIL_VERIFICATION_PROVIDER` - "zerobounce" or "neverbounce"
- **Where to enter**: Settings page → Email Verification tab
- **Free tier**: 100-2,000 verifications
- **Pricing**: ~$0.001-0.01 per verification
- **Features**: Validate email deliverability, reduce bounce rates

---

### 7. **Phone Number Verification**

#### Twilio Lookup API
- **Service**: Phone number validation
- **Sign up**: Same as Twilio account above
- **What you need**: Same Twilio credentials (ACCOUNT_SID + AUTH_TOKEN)
- **Pricing**: $0.005 per lookup
- **Features**: Validate phone numbers, get carrier info, detect mobile vs landline

---

### 8. **Lead Enrichment**

#### Option A: Clearbit (Recommended)
- **Service**: Company and contact data enrichment
- **Sign up**: https://clearbit.com/
- **What you need**:
  - `CLEARBIT_API_KEY` - API key
- **Pricing**: $99/month for 2,500 enrichments
- **Features**: Company info, employee count, tech stack, funding data

#### Option B: Hunter.io
- **Service**: Email finder and verification
- **Sign up**: https://hunter.io/
- **What you need**:
  - `HUNTER_API_KEY` - API key
- **Free tier**: 25 searches/month
- **Pricing**: $49/month for 500 searches
- **Features**: Find email addresses, verify emails, company domain search

---

### 9. **Web Scraping Proxies** (Optional)

#### ScraperAPI or Bright Data
- **Service**: Proxy network for web scraping
- **Sign up**:
  - ScraperAPI: https://www.scraperapi.com/
  - Bright Data: https://brightdata.com/
- **What you need**:
  - `SCRAPER_API_KEY` - API key
- **Free tier**: 1,000-5,000 requests/month
- **Pricing**: $49/month for 100,000 requests
- **Features**: Bypass CORS, handle CAPTCHAs, rotate IPs
- **Use case**: Enhanced web scraping for lead discovery

---

## 📋 Quick Setup Checklist

### Minimum Required (Core Functionality)
- [ ] **Email**: SendGrid API key OR SMTP credentials
- [ ] **Voice**: Twilio Account SID, Auth Token, Phone Number
- [ ] **AI Voice**: VAPI API key + Assistant ID
- [ ] **Voice Synthesis**: ElevenLabs API key + Voice ID
- [ ] **Transcription**: AssemblyAI API key

### Recommended (Enhanced Features)
- [ ] **Email Verification**: ZeroBounce or NeverBounce API key
- [ ] **Lead Enrichment**: Clearbit or Hunter.io API key

### Optional (Advanced Features)
- [ ] **Web Scraping**: ScraperAPI or Bright Data proxy key
- [ ] **Phone Verification**: Twilio Lookup (uses same Twilio account)

---

## 💰 Estimated Monthly Costs

### Minimal Setup (Small Agency)
- SendGrid: $19.95/month (50K emails)
- Twilio: ~$50/month (100 calls + SMS)
- VAPI: ~$30/month (200 AI call minutes)
- ElevenLabs: $5/month (30K characters)
- AssemblyAI: ~$20/month (20 hours transcription)
- **Total: ~$125/month**

### Professional Setup (Growing Agency)
- SendGrid: $89.95/month (300K emails)
- Twilio: ~$200/month (500 calls + SMS)
- VAPI: ~$100/month (1,000 AI call minutes)
- ElevenLabs: $22/month (100K characters)
- AssemblyAI: ~$50/month (50 hours)
- Clearbit: $99/month (2,500 enrichments)
- **Total: ~$560/month**

---

## 🔐 Security Best Practices

1. **Never commit API keys to Git** - Use environment variables only
2. **Use separate keys for dev/staging/production**
3. **Rotate keys every 90 days** - Platform supports key rotation
4. **Set spending limits** - Configure in each API provider's dashboard
5. **Monitor usage** - Use the test connection feature regularly
6. **Enable 2FA** - On all API provider accounts

---

## 📞 Where to Get Help

- **Twilio**: https://www.twilio.com/docs
- **SendGrid**: https://docs.sendgrid.com/
- **VAPI**: https://docs.vapi.ai/
- **ElevenLabs**: https://docs.elevenlabs.io/
- **AssemblyAI**: https://www.assemblyai.com/docs

---

## ✅ Testing Your API Keys

Once you've entered all keys in the Settings page:

1. Click "Test Connection" button for each service
2. Green checkmark = Working correctly
3. Red error = Check credentials or account status
4. Review server logs for detailed error messages

The platform will automatically encrypt and store all API keys securely using AES-256-GCM encryption.
