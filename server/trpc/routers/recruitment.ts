import { router, protectedProcedure } from "../../_core/trpc";
import { getDb } from "../../db";
import { recruitmentSignals } from "../../../drizzle/schema";
import { desc, eq, and, gte, sql } from "drizzle-orm";
import { z } from "zod";

export const recruitmentRouter = router({
  getHiringSignals: protectedProcedure
    .input(
      z.object({
        limit: z.number().optional().default(50),
        signalType: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];

      const conditions = [eq(recruitmentSignals.userId, ctx.user.id)];
      
      if (input.signalType) {
        conditions.push(sql`${recruitmentSignals.signalType} = ${input.signalType}`);
      }

      const signals = await db
        .select()
        .from(recruitmentSignals)
        .where(and(...conditions))
        .orderBy(desc(recruitmentSignals.detectedAt))
        .limit(input.limit);

      return signals;
    }),

  getStats: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) {
      return {
        totalSignals: 0,
        newThisWeek: 0,
        jobPostings: 0,
        companiesHiring: 0,
        fundingEvents: 0,
        totalFunding: 0,
        expansions: 0,
        trendingIndustries: [],
      };
    }

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    // Total signals
    const [totalResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(recruitmentSignals)
      .where(eq(recruitmentSignals.userId, ctx.user.id));

    // New this week
    const [newThisWeekResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(recruitmentSignals)
      .where(
        and(
          eq(recruitmentSignals.userId, ctx.user.id),
          gte(recruitmentSignals.detectedAt, oneWeekAgo)
        )
      );

    // Job postings
    const [jobPostingsResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(recruitmentSignals)
      .where(
        and(
          eq(recruitmentSignals.userId, ctx.user.id),
          eq(recruitmentSignals.signalType, "job_posting")
        )
      );

    // Funding events
    const [fundingResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(recruitmentSignals)
      .where(
        and(
          eq(recruitmentSignals.userId, ctx.user.id),
          eq(recruitmentSignals.signalType, "funding")
        )
      );

    // Expansions
    const [expansionsResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(recruitmentSignals)
      .where(
        and(
          eq(recruitmentSignals.userId, ctx.user.id),
          eq(recruitmentSignals.signalType, "expansion")
        )
      );

    // Companies hiring (distinct companies with job postings)
    const [companiesResult] = await db
      .select({ count: sql<number>`count(DISTINCT companyName)` })
      .from(recruitmentSignals)
      .where(
        and(
          eq(recruitmentSignals.userId, ctx.user.id),
          eq(recruitmentSignals.signalType, "job_posting")
        )
      );

    return {
      totalSignals: Number(totalResult?.count || 0),
      newThisWeek: Number(newThisWeekResult?.count || 0),
      jobPostings: Number(jobPostingsResult?.count || 0),
      companiesHiring: Number(companiesResult?.count || 0),
      fundingEvents: Number(fundingResult?.count || 0),
      totalFunding: 0, // Would need to parse metadata for actual amounts
      expansions: Number(expansionsResult?.count || 0),
      trendingIndustries: [], // Would need industry data from leads/companies
    };
  }),

  createSignal: protectedProcedure
    .input(
      z.object({
        companyName: z.string(),
        signalType: z.enum(["job_posting", "funding", "expansion", "leadership_change"]),
        description: z.string(),
        source: z.string(),
        sourceUrl: z.string().optional(),
        urgency: z.enum(["low", "medium", "high"]),
        metadata: z.record(z.string(), z.any()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db.insert(recruitmentSignals).values({
        userId: ctx.user.id,
        companyName: input.companyName,
        signalType: input.signalType,
        description: input.description,
        source: input.source,
        sourceUrl: input.sourceUrl || null,
        urgency: input.urgency,
        metadata: input.metadata ? JSON.stringify(input.metadata) : null,
        detectedAt: new Date(),
        createdAt: new Date(),
      });

      return { success: true };
    }),
});
