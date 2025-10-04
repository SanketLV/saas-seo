import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// The schema is entirely optional.
// You can delete this file (schema.ts) and the
// app will continue to work.
// The schema provides more precise TypeScript types.
export default defineSchema({
  scrapingJobs: defineTable({
    //* User association
    userId: v.string(), //* Clerk user ID

    //* User input
    originalPrompt: v.string(),
    //* Saved data from BD perplexity scrapper
    analysisPrompt: v.optional(v.string()),

    //* BrightData Job tracking
    snapshotId: v.optional(v.string()),

    status: v.union(
      v.literal("pending"),
      v.literal("running"),
      v.literal("analyzing"),
      v.literal("completed"),
      v.literal("failed"),
    ),

    //* Results (Optional, filled when webhook receives data)
    results: v.optional(v.array(v.any())),
    seoReport: v.optional(v.any()), //* Structured SEO report from GPT AI analysis
    error: v.optional(v.string()),

    //* Metadata
    createdAt: v.number(),
    completedAt: v.optional(v.number()),
  })
    .index("by_status", ["status"])
    .index("by_created_at", ["createdAt"])
    .index("by_user", ["userId"])
    .index("by_user_and_created_at", ["userId", "createdAt"]),
});
