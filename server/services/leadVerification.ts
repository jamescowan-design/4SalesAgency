import * as db from "../db";

export interface VerificationResult {
  isValid: boolean;
  confidence: number; // 0-100
  reason?: string;
  provider?: string;
}

/**
 * Verify email address validity
 * Uses basic regex + MX record check
 * For production: integrate with ZeroBounce, NeverBounce, or similar
 */
export async function verifyEmail(email: string): Promise<VerificationResult> {
  // Basic format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return {
      isValid: false,
      confidence: 0,
      reason: "Invalid email format",
      provider: "regex",
    };
  }

  // Check for common disposable email domains
  const disposableDomains = [
    "tempmail.com",
    "throwaway.email",
    "guerrillamail.com",
    "10minutemail.com",
    "mailinator.com",
  ];

  const domain = email.split("@")[1].toLowerCase();
  if (disposableDomains.includes(domain)) {
    return {
      isValid: false,
      confidence: 0,
      reason: "Disposable email address",
      provider: "disposable-check",
    };
  }

  // TODO: Add MX record lookup
  // TODO: Integrate with email verification API (ZeroBounce, NeverBounce, etc.)

  // For now, return valid if format is correct
  return {
    isValid: true,
    confidence: 70, // Medium confidence without API verification
    reason: "Format valid, MX check pending",
    provider: "basic",
  };
}

/**
 * Verify phone number validity
 * For production: integrate with Twilio Lookup API or similar
 */
export async function verifyPhone(
  phoneNumber: string
): Promise<VerificationResult> {
  // Remove all non-numeric characters
  const cleaned = phoneNumber.replace(/\D/g, "");

  // Check length (US/international)
  if (cleaned.length < 10 || cleaned.length > 15) {
    return {
      isValid: false,
      confidence: 0,
      reason: "Invalid phone number length",
      provider: "regex",
    };
  }

  // Basic US phone number validation
  if (cleaned.length === 10 || (cleaned.length === 11 && cleaned[0] === "1")) {
    // Check for invalid area codes
    const areaCode = cleaned.length === 11 ? cleaned.slice(1, 4) : cleaned.slice(0, 3);
    const invalidAreaCodes = ["000", "111", "555", "999"];
    
    if (invalidAreaCodes.includes(areaCode)) {
      return {
        isValid: false,
        confidence: 0,
        reason: "Invalid area code",
        provider: "area-code-check",
      };
    }

    // TODO: Integrate with Twilio Lookup API for carrier info
    // TODO: Check if number is mobile vs landline
    // TODO: Verify number is active

    return {
      isValid: true,
      confidence: 70, // Medium confidence without API verification
      reason: "Format valid, carrier check pending",
      provider: "basic",
    };
  }

  // International numbers - basic validation only
  return {
    isValid: true,
    confidence: 50, // Lower confidence for international
    reason: "International number, API verification recommended",
    provider: "basic",
  };
}

/**
 * Verify lead contact information
 */
export async function verifyLead(leadId: number): Promise<{
  emailVerification?: VerificationResult;
  phoneVerification?: VerificationResult;
  overallValid: boolean;
}> {
  const lead = await db.getLeadById(leadId);
  if (!lead) {
    throw new Error("Lead not found");
  }

  const results: {
    emailVerification?: VerificationResult;
    phoneVerification?: VerificationResult;
    overallValid: boolean;
  } = {
    overallValid: false,
  };

  // Verify email if present
  if (lead.contactEmail) {
    results.emailVerification = await verifyEmail(lead.contactEmail);
  }

  // Verify phone if present
  if (lead.contactPhone) {
    results.phoneVerification = await verifyPhone(lead.contactPhone);
  }

  // Overall valid if at least one contact method is valid
  results.overallValid =
    (results.emailVerification?.isValid || false) ||
    (results.phoneVerification?.isValid || false);

  // Note: Verification results are returned but not stored in lead record
  // To persist, add emailVerified/phoneVerified boolean fields to leads schema

  return results;
}

/**
 * Bulk verify leads
 */
export async function bulkVerifyLeads(
  leadIds: number[]
): Promise<Map<number, { emailVerification?: VerificationResult; phoneVerification?: VerificationResult; overallValid: boolean }>> {
  const results = new Map();

  // Process in batches to avoid overwhelming APIs
  const batchSize = 10;
  for (let i = 0; i < leadIds.length; i += batchSize) {
    const batch = leadIds.slice(i, i + batchSize);
    const batchPromises = batch.map(async (leadId) => {
      try {
        const result = await verifyLead(leadId);
        results.set(leadId, result);
      } catch (error) {
        console.error(`Failed to verify lead ${leadId}:`, error);
        results.set(leadId, {
          overallValid: false,
          emailVerification: { isValid: false, confidence: 0, reason: "Verification failed" },
        });
      }
    });

    await Promise.all(batchPromises);
  }

  return results;
}

/**
 * Get verification statistics for a campaign
 */
export async function getCampaignVerificationStats(campaignId: number): Promise<{
  totalLeads: number;
  emailVerified: number;
  phoneVerified: number;
  bothVerified: number;
  noneVerified: number;
  verificationRate: number;
}> {
  const leads = await db.getLeadsByCampaignId(campaignId);

  const stats = {
    totalLeads: leads.length,
    emailVerified: 0,
    phoneVerified: 0,
    bothVerified: 0,
    noneVerified: 0,
    verificationRate: 0,
  };

  for (const lead of leads) {
    // Note: Without emailVerified/phoneVerified fields in schema,
    // we can't track verification status. For now, assume unverified.
    const hasEmail = false;
    const hasPhone = false;

    if (hasEmail) stats.emailVerified++;
    if (hasPhone) stats.phoneVerified++;
    if (hasEmail && hasPhone) stats.bothVerified++;
    if (!hasEmail && !hasPhone) stats.noneVerified++;
  }

  stats.verificationRate =
    stats.totalLeads > 0
      ? ((stats.emailVerified + stats.phoneVerified) / (stats.totalLeads * 2)) * 100
      : 0;

  return stats;
}
