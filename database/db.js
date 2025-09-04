import { createClient } from "@libsql/client";

const client = createClient({
  url: process.env.TURSO_DATABASE_URL, // e.g. "libsql://<your‑instance>.turso.io"
  authToken: process.env.TURSO_AUTH_TOKEN, // the secret token from Turso dashboard
});

/**
 * Helper that runs a query and returns rows as plain objects.
 * It also logs errors in a consistent way.
 */
export async function run(query, params = []) {
  try {
    const result = await client.execute(query, params);
    return result.rows; // array of row objects
  } catch (err) {
    console.error("❌ Turso query failed:", err);
    throw err;
  }
}

/**
 * Wrapper for a transaction – useful for multi‑step ops (e.g. match insertion).
 */
export async function transaction(callback) {
  const tx = await client.transaction();
  try {
    const value = await callback(tx);
    await tx.commit();
    return value;
  } catch (err) {
    await tx.rollback();
    console.error("🔁 Transaction rolled back:", err);
    throw err;
  }
}
