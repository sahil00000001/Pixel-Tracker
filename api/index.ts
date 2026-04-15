// Vercel serverless entry point.
// Vercel auto-detects files in api/ and compiles them with @vercel/node.
// The init promise registers all routes exactly once (module is cached between
// warm invocations), then hands each request to the Express app.
import { init } from "../server/index.js";

export default async function handler(req: any, res: any) {
  const app = await init;
  app(req, res);
}
