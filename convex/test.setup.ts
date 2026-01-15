import { convexTest } from "convex-test";
import schema from "./schema";

/**
 * Create a test context with mocked Convex database.
 * Usage:
 *   const t = convexTest(schema);
 *   await t.run(async (ctx) => { ... });
 */
export { convexTest, schema };
