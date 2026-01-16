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
 * Test: /api/parent/child-tasks/pending-approval (no auth)
 * Expected: 401 Unauthorized
 */
async function testPendingApprovalNoAuth() {
  const testName = "pending-approval: 401 without auth";
  try {
    const response = await fetch(
      `${BASE_URL}/api/parent/child-tasks/pending-approval?child_id=fake-id`
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
 * Test: /api/parent/child-tasks/approve (no auth)
 * Expected: 401 Unauthorized
 */
async function testApproveNoAuth() {
  const testName = "child-tasks/approve: 401 without auth";
  try {
    const response = await fetch(`${BASE_URL}/api/parent/child-tasks/approve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ child_task_id: "fake-id" }),
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
 * Test: /api/parent/tasks/approve (no auth)
 * Expected: 401 Unauthorized
 */
async function testTasksApproveNoAuth() {
  const testName = "tasks/approve: 401 without auth";
  try {
    const response = await fetch(`${BASE_URL}/api/parent/tasks/approve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ child_task_id: "fake-id" }),
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
 * Test: /api/parent/tasks/approve (no body)
 * Expected: 400 Invalid Input (or 401 if auth required first)
 */
async function testTasksApproveNoBody() {
  const testName = "tasks/approve: 400/401 without body";
  try {
    const response = await fetch(`${BASE_URL}/api/parent/tasks/approve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });

    // 401 is acceptable (auth check happens first)
    // 400 would be ideal if auth was bypassed for testing
    if (response.status === 401 || response.status === 400) {
      pass(testName);
    } else {
      fail(testName, `Expected 400 or 401, got ${response.status}`);
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

// ===========================================
// PR13: Parent Rewards Admin Tests
// ===========================================

/**
 * Test: /api/parent/rewards/list (no auth)
 * Expected: 401 Unauthorized
 */
async function testParentRewardsListNoAuth() {
  const testName = "parent/rewards/list: 401 without auth";
  try {
    const response = await fetch(
      `${BASE_URL}/api/parent/rewards/list?child_id=fake-id`
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
 * Test: /api/parent/rewards/claims/list (no auth)
 * Expected: 401 Unauthorized
 */
async function testParentClaimsListNoAuth() {
  const testName = "parent/rewards/claims/list: 401 without auth";
  try {
    const response = await fetch(
      `${BASE_URL}/api/parent/rewards/claims/list?child_id=fake-id`
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
 * Test: /api/parent/rewards/claims/approve (no auth)
 * Expected: 401 Unauthorized
 */
async function testParentClaimsApproveNoAuth() {
  const testName = "parent/rewards/claims/approve: 401 without auth";
  try {
    const response = await fetch(
      `${BASE_URL}/api/parent/rewards/claims/approve`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rewardId: "fake-id" }),
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
 * Test: /api/child/rewards/request (no session)
 * Expected: 401 Unauthorized
 */
async function testChildRewardsRequestNoSession() {
  const testName = "child/rewards/request: 401 without session";
  try {
    const response = await fetch(`${BASE_URL}/api/child/rewards/request`, {
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
 * Test: /parent/rewards (no auth - redirect expected)
 * Expected: 307/308 redirect to login
 */
async function testParentRewardsPageNoAuth() {
  const testName = "v2/parent/rewards: redirects without auth";
  try {
    const response = await fetch(`${BASE_URL}/parent/rewards`, {
      redirect: "manual",
    });

    // Should redirect to login
    if (response.status === 307 || response.status === 308 || response.status === 302) {
      pass(testName);
    } else if (response.status === 200) {
      // If it loads, check if it's a login page
      const text = await response.text();
      if (text.includes("login") || text.includes("Login")) {
        pass(testName);
      } else {
        fail(testName, `Expected redirect to login, got 200 with content`);
      }
    } else {
      fail(testName, `Expected redirect, got ${response.status}`);
    }
  } catch (error) {
    fail(testName, `Request failed: ${error}`);
  }
}

// ===========================================
// PR13: Parent Register Tests
// ===========================================

/**
 * Test: /parent/register page loads
 * Expected: 200 OK
 */
async function testParentRegisterPageLoads() {
  const testName = "v2/parent/register: 200 OK";
  try {
    const response = await fetch(`${BASE_URL}/parent/register`);

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
 * Test: /api/parent/register (no body)
 * Expected: 400 Bad Request
 */
async function testParentRegisterNoBody() {
  const testName = "parent/register: 400 without body";
  try {
    const response = await fetch(`${BASE_URL}/api/parent/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });

    if (response.status === 400) {
      pass(testName);
    } else {
      fail(testName, `Expected 400, got ${response.status}`);
    }
  } catch (error) {
    fail(testName, `Request failed: ${error}`);
  }
}

/**
 * Test: /api/parent/register (invalid email)
 * Expected: 400 Bad Request
 */
async function testParentRegisterInvalidEmail() {
  const testName = "parent/register: 400 with invalid email";
  try {
    const response = await fetch(`${BASE_URL}/api/parent/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        full_name: "Test User",
        email: "invalid-email",
        password: "password123",
      }),
    });

    if (response.status === 400) {
      pass(testName);
    } else {
      fail(testName, `Expected 400, got ${response.status}`);
    }
  } catch (error) {
    fail(testName, `Request failed: ${error}`);
  }
}

/**
 * Test: /api/parent/register (short password)
 * Expected: 400 Bad Request
 */
async function testParentRegisterShortPassword() {
  const testName = "parent/register: 400 with short password";
  try {
    const response = await fetch(`${BASE_URL}/api/parent/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        full_name: "Test User",
        email: "test@example.com",
        password: "12345", // < 6 characters
      }),
    });

    if (response.status === 400) {
      pass(testName);
    } else {
      fail(testName, `Expected 400, got ${response.status}`);
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
  await testPendingApprovalNoAuth();
  await testApproveNoAuth();
  await testTasksApproveNoAuth();
  await testTasksApproveNoBody();

  console.log("");
  console.log("PR13: Parent Rewards Admin Tests:");
  await testParentRewardsListNoAuth();
  await testParentClaimsListNoAuth();
  await testParentClaimsApproveNoAuth();
  await testChildRewardsRequestNoSession();
  await testParentRewardsPageNoAuth();

  console.log("");
  console.log("PR13: Parent Register Tests:");
  await testParentRegisterPageLoads();
  await testParentRegisterNoBody();
  await testParentRegisterInvalidEmail();
  await testParentRegisterShortPassword();

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
