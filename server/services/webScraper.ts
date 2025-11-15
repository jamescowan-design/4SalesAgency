import { invokeLLM } from "../_core/llm";

/**
 * Web Scraper Service
 * Discovers and enriches leads based on campaign ICP criteria
 */

export interface ICPCriteria {
  industries?: string[];
  geographies?: string[];
  companySizeMin?: number;
  companySizeMax?: number;
  keywords?: string[];
}

export interface CompanyData {
  name: string;
  website?: string;
  industry?: string;
  location?: string;
  employeeCount?: number;
  description?: string;
  products?: string[];
  services?: string[];
  hiringSignals?: string[];
  contactEmail?: string;
  contactPhone?: string;
  linkedinUrl?: string;
  confidence: number;
}

/**
 * Discover companies matching ICP criteria
 * Uses Google Search API to find potential leads
 */
export async function discoverCompanies(
  icp: ICPCriteria,
  limit: number = 50
): Promise<{ query: string; companies: string[] }> {
  // Build search query from ICP
  const queryParts: string[] = [];
  
  if (icp.industries && icp.industries.length > 0) {
    queryParts.push(icp.industries.join(" OR "));
  }
  
  if (icp.geographies && icp.geographies.length > 0) {
    queryParts.push(`in ${icp.geographies.join(" OR ")}`);
  }
  
  if (icp.keywords && icp.keywords.length > 0) {
    queryParts.push(icp.keywords.join(" "));
  }
  
  queryParts.push("company");
  
  const searchQuery = queryParts.join(" ");
  
  // In production, this would call Google Search API or similar
  // For now, return mock data structure
  return {
    query: searchQuery,
    companies: [
      // This would be populated from actual search results
      // Each entry would be a company name or website URL
    ],
  };
}

/**
 * Scrape and enrich company data from website
 */
export async function enrichCompanyData(
  companyNameOrUrl: string,
  icp: ICPCriteria
): Promise<CompanyData> {
  let websiteUrl = companyNameOrUrl;
  
  // If it's just a name, try to find the website
  if (!companyNameOrUrl.startsWith("http")) {
    // In production: use Google Search to find official website
    websiteUrl = `https://www.${companyNameOrUrl.toLowerCase().replace(/\s+/g, "")}.com`;
  }
  
  // Scrape website content
  const websiteContent = await scrapeWebsite(websiteUrl);
  
  // Use AI to extract structured data
  const enrichedData = await extractCompanyInfo(websiteContent, websiteUrl);
  
  // Calculate confidence score
  const confidence = calculateConfidenceScore(enrichedData, icp);
  
  return {
    ...enrichedData,
    confidence,
  };
}

/**
 * Scrape website content
 * Uses CORS proxy to fetch website HTML
 */
async function scrapeWebsite(url: string): Promise<string> {
  try {
    // Use CORS proxy to fetch website
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
    
    const response = await fetch(proxyUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
    }
    
    const html = await response.text();
    
    // Extract text content (remove HTML tags)
    const textContent = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    
    // Limit to first 10000 characters to avoid token limits
    return textContent.substring(0, 10000);
  } catch (error) {
    console.error(`Error scraping ${url}:`, error);
    return "";
  }
}

/**
 * Extract structured company information using AI
 */
async function extractCompanyInfo(
  websiteContent: string,
  websiteUrl: string
): Promise<Omit<CompanyData, "confidence">> {
  if (!websiteContent) {
    return {
      name: new URL(websiteUrl).hostname.replace("www.", ""),
      website: websiteUrl,
    };
  }
  
  const prompt = `Extract company information from this website content:

${websiteContent}

Extract the following information:
- Company name
- Industry/sector
- Location (city, country)
- Approximate employee count (if mentioned)
- Brief description (1-2 sentences)
- Main products or services (list)
- Any hiring signals (job postings, "we're hiring", team growth mentions)
- Contact email (if found)
- Contact phone (if found)

Return as JSON with these exact fields: name, industry, location, employeeCount, description, products (array), services (array), hiringSignals (array), contactEmail, contactPhone`;

  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: "You are a data extraction assistant. Extract structured company information from website content.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "company_info",
          strict: true,
          schema: {
            type: "object",
            properties: {
              name: { type: "string" },
              industry: { type: "string" },
              location: { type: "string" },
              employeeCount: { type: ["number", "null"] },
              description: { type: "string" },
              products: { type: "array", items: { type: "string" } },
              services: { type: "array", items: { type: "string" } },
              hiringSignals: { type: "array", items: { type: "string" } },
              contactEmail: { type: ["string", "null"] },
              contactPhone: { type: ["string", "null"] },
            },
            required: ["name", "industry", "location", "description", "products", "services", "hiringSignals"],
            additionalProperties: false,
          },
        },
      },
    });

    const messageContent = response.choices[0].message.content;
    if (!messageContent || typeof messageContent !== "string") {
      throw new Error("Invalid LLM response");
    }
    const extracted = JSON.parse(messageContent);
    
    return {
      name: extracted.name || "",
      website: websiteUrl,
      industry: extracted.industry || undefined,
      location: extracted.location || undefined,
      employeeCount: extracted.employeeCount || undefined,
      description: extracted.description || undefined,
      products: extracted.products || [],
      services: extracted.services || [],
      hiringSignals: extracted.hiringSignals || [],
      contactEmail: extracted.contactEmail || undefined,
      contactPhone: extracted.contactPhone || undefined,
    };
  } catch (error) {
    console.error("Error extracting company info:", error);
    return {
      name: new URL(websiteUrl).hostname.replace("www.", ""),
      website: websiteUrl,
    };
  }
}

/**
 * Calculate confidence score (0-100) based on ICP match
 */
function calculateConfidenceScore(
  company: Omit<CompanyData, "confidence">,
  icp: ICPCriteria
): number {
  let score = 0;
  let maxScore = 0;
  
  // Industry match (30 points)
  maxScore += 30;
  if (icp.industries && icp.industries.length > 0 && company.industry) {
    const industryMatch = icp.industries.some((industry) =>
      company.industry?.toLowerCase().includes(industry.toLowerCase())
    );
    if (industryMatch) score += 30;
  }
  
  // Geography match (20 points)
  maxScore += 20;
  if (icp.geographies && icp.geographies.length > 0 && company.location) {
    const geoMatch = icp.geographies.some((geo) =>
      company.location?.toLowerCase().includes(geo.toLowerCase())
    );
    if (geoMatch) score += 20;
  }
  
  // Company size match (20 points)
  maxScore += 20;
  if (company.employeeCount) {
    const sizeMin = icp.companySizeMin || 0;
    const sizeMax = icp.companySizeMax || Infinity;
    if (company.employeeCount >= sizeMin && company.employeeCount <= sizeMax) {
      score += 20;
    }
  }
  
  // Has contact information (15 points)
  maxScore += 15;
  if (company.contactEmail || company.contactPhone) {
    score += 15;
  }
  
  // Has hiring signals (15 points)
  maxScore += 15;
  if (company.hiringSignals && company.hiringSignals.length > 0) {
    score += 15;
  }
  
  // Normalize to 0-100
  return maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
}

/**
 * Batch process multiple companies
 */
export async function batchEnrichCompanies(
  companies: string[],
  icp: ICPCriteria,
  onProgress?: (current: number, total: number) => void
): Promise<CompanyData[]> {
  const results: CompanyData[] = [];
  
  for (let i = 0; i < companies.length; i++) {
    try {
      const enriched = await enrichCompanyData(companies[i], icp);
      results.push(enriched);
      
      if (onProgress) {
        onProgress(i + 1, companies.length);
      }
      
      // Rate limiting: wait 1 second between requests
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`Error enriching ${companies[i]}:`, error);
    }
  }
  
  // Sort by confidence score (highest first)
  return results.sort((a, b) => b.confidence - a.confidence);
}
