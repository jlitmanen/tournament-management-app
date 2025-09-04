const { createClient } = require("@libsql/client");

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

/**
 * Helper that runs a query and returns rows as plain objects.
 */
async function run(query, params = []) {
  try {
    const result = await client.execute(query, params);
    return result.rows;
  } catch (err) {
    console.error("❌ Turso query failed:", err);
    throw err;
  }
}

/**
 * Wrapper for a transaction – useful for multi‑step ops (e.g. match insertion).
 */
async function transaction(callback) {
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

module.exports = { run, transaction };
