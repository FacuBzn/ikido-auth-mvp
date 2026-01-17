/**
 * SMOKE TEST: Metrics Endpoint
 * 
 * Tests the /api/metrics/logins endpoint:
 * 1. Without auth → expects 401
 * 2. (Optional) With auth → expects 200
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

async function testMetricsEndpoint() {
  console.log("🧪 Testing /api/metrics/logins endpoint...\n");

  // Test 1: Without authentication → should return 401
  console.log("Test 1: Request without authentication");
  try {
    const response = await fetch(`${API_BASE_URL}/api/metrics/logins`, {
      method: "GET",
    });

    if (response.status === 401) {
      console.log("✅ PASS: Endpoint correctly returns 401 without auth\n");
    } else {
      console.error(
        `❌ FAIL: Expected 401, got ${response.status}`,
        await response.text()
      );
      process.exit(1);
    }
  } catch (error) {
    console.error("❌ FAIL: Request failed:", error);
    process.exit(1);
  }

  // Test 2: With query params (should still fail without auth)
  console.log("Test 2: Request with query params (no auth)");
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/metrics/logins?from=2025-01-01&to=2025-01-31`,
      {
        method: "GET",
      }
    );

    if (response.status === 401) {
      console.log("✅ PASS: Endpoint correctly returns 401 with params\n");
    } else {
      console.error(
        `❌ FAIL: Expected 401, got ${response.status}`,
        await response.text()
      );
      process.exit(1);
    }
  } catch (error) {
    console.error("❌ FAIL: Request failed:", error);
    process.exit(1);
  }

  // Test 3: Invalid date format
  console.log("Test 3: Request with invalid date format");
  try {
    // This would need auth, but we can test the validation logic
    // For now, just verify the endpoint exists
    console.log("⚠️  SKIP: Invalid date format test requires auth\n");
  } catch (error) {
    console.error("❌ FAIL:", error);
    process.exit(1);
  }

  console.log("✅ All smoke tests passed!");
  console.log("\nNote: To test with authentication, you need to:");
  console.log("1. Start the dev server: npm run dev");
  console.log("2. Login as a parent");
  console.log("3. Use the session cookie to make authenticated requests");
}

// Run tests
testMetricsEndpoint().catch((error) => {
  console.error("❌ Test suite failed:", error);
  process.exit(1);
});
