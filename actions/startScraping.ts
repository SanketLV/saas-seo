"use server";

import { ApiPath } from "@/convex/http";
import { buildPerplexityPrompt } from "@/prompts/perplexity";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { auth } from "@clerk/nextjs/server";
import retryAnalysisOnly from "./retryAnalysis";

if (!process.env.BRIGHTDATA_API_KEY) {
  throw new Error("BRIGHTDATA_API_KEY is not set");
}
if (!process.env.NEXT_PUBLIC_CONVEX_URL) {
  throw new Error("NEXT_PUBLIC_CONVEX_URL is not set");
}

export default async function startScraping({
  prompt,
  existingJobId,
  country = "IN",
}: {
  prompt: string;
  existingJobId?: string;
  country: string;
}) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("User ID is required.");
  }

  //* Initialize the convex client
  const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

  let jobId: string;

  if (existingJobId) {
    //* Check if we can use smart retry (analysis only)
    const retryInfo = await convex.query(api.scrapingJobs.canUseSmartRetry, {
      jobId: existingJobId as Id<"scrapingJobs">,
      userId: userId,
    });

    if (retryInfo.canRetryAnalysisOnly) {
      console.log("Using smart retry - analysis only for job:", existingJobId);

      const result = await retryAnalysisOnly(existingJobId);
      if (result.ok) {
        return {
          ok: true,
          data: { snapshot_id: null }, //* No new snapshot for analysis retry
          jobId: existingJobId,
          smartRetry: true,
        };
      } else {
        return {
          ok: false,
          error: result.error || "Smart retry failed",
        };
      }
    } else {
      console.log("Full retry required for job:", existingJobId);
      //* Retry existing job - reset it to pending status
      await convex.mutation(api.scrapingJobs.retryJob, {
        jobId: existingJobId as Id<"scrapingJobs">,
      });
      jobId = existingJobId;
    }
  } else {
    //* Create a new job record in the database
    jobId = await convex.mutation(api.scrapingJobs.createScrapingJob, {
      originalPrompt: prompt,
      userId: userId,
    });
  }

  //* Include the job ID in the webhook URL asquery parameter
  const ENDPOINT = `${process.env.NEXT_PUBLIC_CONVEX_SITE_URL}${ApiPath.Webhook}?jobId=${jobId}`;
  const encodedEndpoint = encodeURIComponent(ENDPOINT);
}
