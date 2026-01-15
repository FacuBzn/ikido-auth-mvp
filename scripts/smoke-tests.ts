/**
 * Smoke Tests for V2 API Endpoints
 *
 * Usage: npx tsx scripts/smoke-tests.ts
 *
 * These tests verify basic API behavior without a full test framework.
 * They require a running dev server and test data in the database.
 *
 * For CI, consider adding Jest or Vitest later.
 */

const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:3000";

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
}

const results: TestResult[] = [];

function log(message: string) {
  console.log(`[smoke-test] ${message}`);
}

function pass(name: string) {
  results.push({ name, passed: true });
  console.log(`  ✅ ${name}`);
}

function fail(name: string, error: string) {
  results.push({ name, passed: false, error });
  console.log(`  ❌ ${name}: ${error}`);
}

/**
 * Test: /api/child/rewards (no session)
 * Expected: 401 Unauthorized
 */
async function testRewardsNoSession() {
  const testName = "rewards: 401 without session";
  try {
    const response = await fetch(`${BASE_URL}/api/child/rewards`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });

    if (response.status === 401) {
      pass(testName);
    } else {
      fail(testName, `Expected 401, got ${response.status}`);
    }
  } catch (error) {
    fail(testName, `Request failed: ${error}`);
  }
}

/**
 * Test: /api/child/rewards/claim (no session)
 * Expected: 401 Unauthorized
 */
async function testRewardsClaimNoSession() {
  const testName = "rewards/claim: 401 without session";
  try {
    const response = await fetch(`${BASE_URL}/api/child/rewards/claim`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reward_id: "fake-id" }),
    });

    if (response.status === 401) {
      pass(testName);
    } else {
      fail(testName, `Expected 401, got ${response.status}`);
    }
  } catch (error) {
    fail(testName, `Request failed: ${error}`);
  }
}

/**
 * Test: /api/child/rewards/claim (no reward_id)
 * Expected: 400 Bad Request (if has session) or 401 (if no session)
 */
async function testRewardsClaimNoRewardId() {
  const testName = "rewards/claim: 400/401 without reward_id";
  try {
    const response = await fetch(`${BASE_URL}/api/child/rewards/claim`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });

    if (response.status === 400 || response.status === 401) {
      pass(testName);
    } else {
      fail(testName, `Expected 400 or 401, got ${response.status}`);
    }
  } catch (error) {
    fail(testName, `Request failed: ${error}`);
  }
}

/**
 * Test: /api/parent/tasks/custom-create-and-assign (no auth)
 * Expected: 401 Unauthorized
 */
async function testCustomCreateNoAuth() {
  const testName = "custom-create-and-assign: 401 without auth";
  try {
    const response = await fetch(
      `${BASE_URL}/api/parent/tasks/custom-create-and-assign`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          childId: "fake-id",
          title: "Test Task",
          points: 10,
        }),
      }
    );

    if (response.status === 401) {
      pass(testName);
    } else {
      fail(testName, `Expected 401, got ${response.status}`);
    }
  } catch (error) {
    fail(testName, `Request failed: ${error}`);
  }
}

/**
 * Test: /api/parent/tasks/list (no auth)
 * Expected: 401 Unauthorized
 */
async function testTasksListNoAuth() {
  const testName = "tasks/list: 401 without auth";
  try {
    const response = await fetch(`${BASE_URL}/api/parent/tasks/list`, {
      method: "GET",
    });

    if (response.status === 401) {
      pass(testName);
    } else {
      fail(testName, `Expected 401, got ${response.status}`);
    }
  } catch (error) {
    fail(testName, `Request failed: ${error}`);
  }
}

/**
 * Test: /api/child/points (no session)
 * Expected: 401 Unauthorized
 */
async function testPointsNoSession() {
  const testName = "child/points: 401 without session";
  try {
    const response = await fetch(`${BASE_URL}/api/child/points`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });

    if (response.status === 401) {
      pass(testName);
    } else {
      fail(testName, `Expected 401, got ${response.status}`);
    }
  } catch (error) {
    fail(testName, `Request failed: ${error}`);
  }
}

/**
 * Test: /api/child/tasks (no session)
 * Expected: 401 Unauthorized
 */
async function testTasksNoSession() {
  const testName = "child/tasks: 401 without session";
  try {
    const response = await fetch(`${BASE_URL}/api/child/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });

    if (response.status === 401) {
      pass(testName);
    } else {
      fail(testName, `Expected 401, got ${response.status}`);
    }
  } catch (error) {
    fail(testName, `Request failed: ${error}`);
  }
}

/**
 * Test: V2 role select page loads
 * Expected: 200 OK
 */
async function testV2RoleSelectLoads() {
  const testName = "v2 role select: 200 OK";
  try {
    const response = await fetch(`${BASE_URL}/v2`);

    if (response.status === 200) {
      pass(testName);
    } else {
      fail(testName, `Expected 200, got ${response.status}`);
    }
  } catch (error) {
    fail(testName, `Request failed: ${error}`);
  }
}

/**
 * Test: / redirects to /v2
 * Expected: 307/308 redirect
 */
async function testRootRedirectsToV2() {
  const testName = "root redirects to /v2";
  try {
    const response = await fetch(`${BASE_URL}/`, {
      redirect: "manual",
    });

    if (response.status === 307 || response.status === 308) {
      const location = response.headers.get("location");
      if (location?.includes("/v2")) {
        pass(testName);
      } else {
        fail(testName, `Expected redirect to /v2, got ${location}`);
      }
    } else {
      fail(testName, `Expected 307/308, got ${response.status}`);
    }
  } catch (error) {
    fail(testName, `Request failed: ${error}`);
  }
}

/**
 * Test: /legacy page loads
 * Expected: 200 OK
 */
async function testLegacyLoads() {
  const testName = "legacy page: 200 OK";
  try {
    const response = await fetch(`${BASE_URL}/legacy`);

    if (response.status === 200) {
      pass(testName);
    } else {
      fail(testName, `Expected 200, got ${response.status}`);
    }
  } catch (error) {
    fail(testName, `Request failed: ${error}`);
  }
}

// Run all tests
async function runAllTests() {
  log("Starting smoke tests...");
  log(`Base URL: ${BASE_URL}`);
  console.log("");

  console.log("API Security Tests:");
  await testRewardsNoSession();
  await testRewardsClaimNoSession();
  await testRewardsClaimNoRewardId();
  await testCustomCreateNoAuth();
  await testTasksListNoAuth();
  await testPointsNoSession();
  await testTasksNoSession();

  console.log("");
  console.log("Page Load Tests:");
  await testV2RoleSelectLoads();
  await testRootRedirectsToV2();
  await testLegacyLoads();

  console.log("");
  console.log("================================");
  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;
  console.log(`Results: ${passed} passed, ${failed} failed`);

  if (failed > 0) {
    console.log("");
    console.log("Failed tests:");
    results
      .filter((r) => !r.passed)
      .forEach((r) => console.log(`  - ${r.name}: ${r.error}`));
    process.exit(1);
  } else {
    console.log("All tests passed! ✅");
    process.exit(0);
  }
}

runAllTests().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
