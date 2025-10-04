import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api, internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";

const http = httpRouter();

//* Make a safe datatype enum maybe for all API paths
export enum ApiPath {
  Webhook = "/api/webhook",
}

//* Webhook endpoint for when the BrightData Perplexity scraper completes
http.route({
  path: ApiPath.Webhook,
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    type Job = {
      _id: Id<"scrapingJobs">;
      originalPrompt: string;
      status: string;
    };

    let job: Job | null = null;

    try {
      const data = await req.json();
    } catch (error) {}

    const body = await req.bytes();
    return new Response(body, { status: 200 });
  }),
});

http.route({
  path: "/helloworld",
  method: "GET",
  handler: httpAction(async () => {
    return new Response("Hello world from Sanket Lakhani", { status: 200 });
  }),
});

export default http;
