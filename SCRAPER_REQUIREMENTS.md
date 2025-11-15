# Web Scraper - Subscription Requirements & Setup Guide

## 📋 Overview

Your 4 Sales Agency platform now includes an **enterprise-grade web scraper** with:
- ✅ Headless browser (Puppeteer) for JavaScript-rendered sites
- ✅ Proxy rotation to avoid IP blocks
- ✅ CAPTCHA solving integration
- ✅ Parallel batch processing
- ✅ LinkedIn profile scraping
- ✅ Job posting extraction
- ✅ Rate limiting and polite delays

## 🔑 Required Subscriptions

### 1. Proxy Service (REQUIRED - Choose One)

#### Option A: ScraperAPI (Recommended for Beginners)
**What it does:** Handles proxies, browser rendering, and CAPTCHA solving automatically

**Pricing:**
- **Free Tier:** 5,000 requests/month (good for testing)
- **Hobby:** $49/month - 100,000 requests
- **Startup:** $149/month - 1,000,000 requests
- **Business:** $299/month - 3,000,000 requests

**Sign Up:**
1. Go to https://www.scraperapi.com
2. Create account
3. Get your API key from dashboard
4. Add to Settings page in your platform

**Pros:**
- All-in-one solution (proxy + rendering + CAPTCHA)
- Easy to use
- Reliable for LinkedIn, job boards, etc.

**Cons:**
- More expensive per request than raw proxies
- Less control over proxy locations

---

#### Option B: Bright Data (Recommended for High Volume)
**What it does:** Premium residential/datacenter proxies with high success rates

**Pricing:**
- **Pay-as-you-go:** $0.60-$15 per GB (varies by proxy type)
- **Residential Proxies:** ~$8.40/GB
- **Datacenter Proxies:** ~$0.60/GB
- **Estimated:** $50-200/month for typical usage

**Sign Up:**
1. Go to https://brightdata.com
2. Create account
3. Create a "Scraping Browser" zone
4. Get username and password from zone settings
5. Add to Settings page

**Pros:**
- Best success rates for difficult sites
- Residential IPs (looks like real users)
- Geographic targeting available

**Cons:**
- More complex setup
- Pay-per-GB can be unpredictable

---

#### Option C: Custom Proxy (For Advanced Users)
**What it does:** Use your own proxy service or proxy list

**Pricing:** Varies by provider ($10-100/month)

**Popular Providers:**
- Oxylabs: https://oxylabs.io
- Smartproxy: https://smartproxy.com
- ProxyMesh: https://proxymesh.com

**Setup:**
1. Get proxy URL (e.g., `http://proxy.example.com:8080`)
2. Get username/password if required
3. Add to Settings page

---

### 2. CAPTCHA Solving (OPTIONAL but Recommended)

#### Option A: 2Captcha (Recommended)
**What it does:** Solves reCAPTCHA, hCaptcha, and other challenges

**Pricing:**
- **Pay-as-you-go:** $1-3 per 1,000 solves
- **No monthly fee**
- **Typical usage:** $5-20/month

**Sign Up:**
1. Go to https://2captcha.com
2. Create account
3. Add funds ($5 minimum)
4. Get API key from dashboard
5. Add to Settings page

**When you need it:**
- Scraping LinkedIn profiles
- Accessing protected content
- High-volume scraping

---

#### Option B: Anti-Captcha
**What it does:** Similar to 2Captcha with slightly different pricing

**Pricing:**
- $0.50-2.00 per 1,000 solves
- No monthly fee

**Sign Up:**
1. Go to https://anti-captcha.com
2. Create account and add funds
3. Get API key
4. Add to Settings page

---

## 💰 Cost Comparison

### Scenario 1: Light Usage (100-500 leads/month)
| Service | Cost |
|---------|------|
| ScraperAPI Free | $0 |
| 2Captcha | $0-5 |
| **Total** | **$0-5/month** |

### Scenario 2: Medium Usage (1,000-5,000 leads/month)
| Service | Cost |
|---------|------|
| ScraperAPI Hobby | $49 |
| 2Captcha | $5-15 |
| **Total** | **$54-64/month** |

### Scenario 3: High Volume (10,000+ leads/month)
| Service | Cost |
|---------|------|
| Bright Data | $100-200 |
| 2Captcha | $20-50 |
| **Total** | **$120-250/month** |

### Comparison to External APIs
| Service | Cost | Features |
|---------|------|----------|
| **Your Custom Scraper** | **$50-250/month** | Unlimited data, full control |
| Clearbit | $99-999/month | 1,000-10,000 enrichments |
| Hunter.io | $49-399/month | 1,000-100,000 searches |
| ZoomInfo | $15,000+/year | Enterprise only |

**Savings: 50-90% compared to external APIs**

---

## 🚀 Setup Instructions

### Step 1: Choose Your Proxy Service
Recommended for most users: **ScraperAPI** (easiest) or **Bright Data** (best quality)

### Step 2: Sign Up and Get Credentials
Follow the sign-up links above for your chosen service

### Step 3: Add to Your Platform
1. Log in to your 4 Sales Agency platform
2. Go to **Settings** page
3. Scroll to **Web Scraper Configuration** section
4. Select your proxy service
5. Enter API key or credentials
6. (Optional) Add CAPTCHA solving service
7. Click **Save Settings**

### Step 4: Test the Scraper
1. Go to any campaign
2. Click "Run Web Scraper"
3. Enter a company website or LinkedIn profile
4. Watch it extract data automatically

---

## 📊 Usage Recommendations

### For Testing (First Month)
- Use **ScraperAPI Free Tier** (5,000 requests)
- Skip CAPTCHA solving initially
- Test with 50-100 companies
- **Cost: $0**

### For Production (Ongoing)
- Upgrade to **ScraperAPI Hobby** ($49) or **Bright Data** ($50-200)
- Add **2Captcha** ($5-20/month)
- Process 1,000-10,000 leads/month
- **Cost: $54-220/month**

### For Enterprise (High Volume)
- Use **Bright Data** with residential proxies
- Add **2Captcha** with higher balance
- Process 50,000+ leads/month
- Consider dedicated proxies
- **Cost: $200-500/month**

---

## 🛡️ Legal & Ethical Guidelines

### ✅ What's Legal
- Scraping publicly available data
- Extracting company information from websites
- Collecting job postings
- Gathering contact information from public profiles

### ⚠️ Best Practices
- Respect `robots.txt` files
- Use rate limiting (1-2 seconds between requests)
- Don't overload servers
- Cache results to avoid re-scraping
- Honor opt-out requests

### ❌ What to Avoid
- Scraping personal data without consent (GDPR violation)
- Bypassing authentication or paywalls
- Scraping copyrighted content
- Violating terms of service (use at your own risk)

**Note:** Web scraping legality varies by jurisdiction. The hiQ Labs v. LinkedIn ruling (2019) established that scraping public data is generally legal in the US, but consult a lawyer for your specific use case.

---

## 🔧 Technical Details

### What's Included in Your Scraper

**Core Features:**
- Puppeteer headless browser
- User-agent rotation (5 different browsers)
- Cookie management
- Screenshot capture for debugging
- Automatic retry on failure
- Parallel batch processing (5 concurrent by default)

**Proxy Integration:**
- ScraperAPI integration
- Bright Data integration
- Custom proxy support
- Automatic proxy rotation

**CAPTCHA Solving:**
- 2Captcha integration
- Anti-Captcha integration
- reCAPTCHA v2/v3 support
- Automatic solution injection

**Rate Limiting:**
- Configurable delays between requests
- Polite scraping (default 1-2 seconds)
- Batch processing with delays

### Supported Websites
- ✅ Company websites (any)
- ✅ LinkedIn profiles (with proxy)
- ✅ Job boards (Indeed, LinkedIn Jobs, etc.)
- ✅ Company career pages
- ✅ News sites
- ✅ Social media (public profiles)

---

## 📞 Support & Troubleshooting

### Common Issues

**Issue: "Too many requests" or IP blocked**
- **Solution:** Add proxy service (ScraperAPI or Bright Data)

**Issue: "CAPTCHA detected"**
- **Solution:** Add 2Captcha or Anti-Captcha service

**Issue: "Page not loading" or timeout**
- **Solution:** Increase timeout in scraper settings (default 30 seconds)

**Issue: "No data extracted"**
- **Solution:** Website might use JavaScript rendering - Puppeteer handles this automatically

### Getting Help
- Check scraper logs in your platform
- Test with screenshot enabled to see what the scraper sees
- Contact proxy service support if connection issues
- Adjust rate limiting if getting blocked

---

## 🎯 Next Steps

1. **Sign up for ScraperAPI free tier** (5,000 requests to test)
2. **Add API key to Settings page**
3. **Test scraper on 10-20 companies**
4. **Evaluate results and upgrade if needed**
5. **Add CAPTCHA solving if scraping LinkedIn**

---

## 📝 Quick Reference

### Minimum Setup (Free)
- ScraperAPI Free Tier
- No CAPTCHA solving
- **Cost: $0/month**
- **Limit: 5,000 requests/month**

### Recommended Setup (Production)
- ScraperAPI Hobby ($49)
- 2Captcha ($5-20)
- **Cost: $54-69/month**
- **Limit: 100,000 requests/month**

### Enterprise Setup (High Volume)
- Bright Data ($100-200)
- 2Captcha ($20-50)
- **Cost: $120-250/month**
- **Limit: Unlimited**

---

## 🔗 Sign-Up Links

- **ScraperAPI:** https://www.scraperapi.com
- **Bright Data:** https://brightdata.com
- **2Captcha:** https://2captcha.com
- **Anti-Captcha:** https://anti-captcha.com
- **Oxylabs:** https://oxylabs.io
- **Smartproxy:** https://smartproxy.com

---

**Questions?** All services offer free trials or free tiers - start there and scale as needed!
