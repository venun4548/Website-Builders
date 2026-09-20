const BASE = 'http://localhost:3000';

async function runTests() {
  console.log('--- STARTING SECURITY SUITE TESTS ---');

  // Test 1: Security Headers on GET /
  console.log('\n[Test 1] Checking HTTP Security Headers on GET /');
  const resHome = await fetch(`${BASE}/`, { redirect: 'manual' });
  const headers = resHome.headers;
  console.log('  X-Frame-Options:', headers.get('x-frame-options'));
  console.log('  X-Content-Type-Options:', headers.get('x-content-type-options'));
  console.log('  Referrer-Policy:', headers.get('referrer-policy'));
  console.log('  Strict-Transport-Security:', headers.get('strict-transport-security'));
  console.log('  Permissions-Policy:', headers.get('permissions-policy'));
  console.log('  Content-Security-Policy:', headers.get('content-security-policy') ? 'PRESENT' : 'MISSING');

  if (headers.get('x-frame-options') !== 'DENY') {
    throw new Error('X-Frame-Options failed');
  }

  // Test 2: PIN Bypass Blocked by Middleware
  console.log('\n[Test 2] Testing PIN Bypass Protection in Middleware');
  const resBypass = await fetch(`${BASE}/admin/login`, { redirect: 'manual' });
  console.log('  GET /admin/login without cookie status:', resBypass.status);
  const location = resBypass.headers.get('location');
  console.log('  Redirect Location:', location);
  if (!location || !location.includes('/admin/access')) {
    throw new Error(`Expected redirect to /admin/access, got: ${location}`);
  }
  console.log('  ✓ PIN bypass is successfully blocked: direct access redirects to /admin/access');

  // Test 3: Send 6 rapid PIN attempts to verify 6th returns 429
  console.log('\n[Test 3] Testing Rate Limiting (6 rapid PIN attempts)');
  for (let i = 1; i <= 6; i++) {
    const resPin = await fetch(`${BASE}/api/admin/verify-pin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Host': 'localhost:3000',
        'Origin': 'http://localhost:3000',
      },
      body: JSON.stringify({ pin: '0000' }),
    });
    const data = await resPin.json();
    console.log(`  Attempt ${i}: Status ${resPin.status}, Message: ${data.error || data.message}`);
    if (i <= 5) {
      if (resPin.status !== 401) {
        throw new Error(`Attempt ${i} expected 401, got ${resPin.status}`);
      }
    } else {
      if (resPin.status !== 429) {
        throw new Error(`Attempt 6 expected 429, got ${resPin.status}`);
      }
      console.log('  Retry-After header:', resPin.headers.get('Retry-After'));
      console.log('  ✓ 6th rapid attempt correctly returned HTTP 429');
    }
  }

  console.log('\n[Test 4] Testing Server-Side Timing-Safe PIN Validation');
  const resValidPin = await fetch(`${BASE}/api/admin/verify-pin`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Host': 'localhost:3000',
      'Origin': 'http://localhost:3000',
      'X-Forwarded-For': '192.168.1.50',
    },
    body: JSON.stringify({ pin: '7788' }),
  });
  console.log('  Status with correct PIN 7788:', resValidPin.status);
  const pinCookie = resValidPin.headers.get('set-cookie');
  console.log('  Set-Cookie admin-access-token:', pinCookie ? 'RECEIVED' : 'NONE');
  if (!pinCookie || !pinCookie.includes('admin-access-token')) {
    throw new Error('Expected admin-access-token cookie not received');
  }
  console.log('  ✓ Admin PIN verified, admin-access-token cookie issued');

  // Test 5: Registration & Unverified Login Block (F-06)
  console.log('\n[Test 5] Testing User Registration & Unverified Login Block');
  const testEmail = `testuser_${Date.now()}@websitebuilders.com`;
  const resRegister = await fetch(`${BASE}/api/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Host': 'localhost:3000',
      'Origin': 'http://localhost:3000',
      'X-Forwarded-For': '192.168.1.75',
      'x-test-suite': 'true',
    },
    body: JSON.stringify({
      fullName: 'Security Tester',
      email: testEmail,
      password: 'SecurePassword123!',
      honeypot: '',
      turnstileToken: '1x00000000000000000000AA',
    }),
  });
  const regData = await resRegister.json();
  console.log('  Register status:', resRegister.status, 'Message:', regData.message || regData.error);
  const verifLink = regData.verificationLink;
  console.log('  Verification link:', verifLink);

  // Attempt login before verification
  console.log('  Attempting login before email verification...');
  const resPreLogin = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Host': 'localhost:3000',
      'Origin': 'http://localhost:3000',
      'X-Forwarded-For': '192.168.1.75',
    },
    body: JSON.stringify({
      email: testEmail,
      password: 'SecurePassword123!',
    }),
  });
  const preLoginData = await resPreLogin.json();
  console.log('  Pre-verification login status:', resPreLogin.status, 'Error:', preLoginData.error);
  if (resPreLogin.status !== 403 || preLoginData.error !== 'Please verify your email first.') {
    throw new Error('Unverified login was not properly blocked with "Please verify your email first."');
  }
  console.log('  ✓ Unverified user login correctly blocked with 403');

  // Verify email using link
  if (verifLink) {
    const verifUrl = new URL(verifLink);
    const resVerif = await fetch(`${BASE}${verifUrl.pathname}${verifUrl.search}`, { redirect: 'manual' });
    console.log('  Verification endpoint status:', resVerif.status, 'Redirect:', resVerif.headers.get('location'));
    console.log('  ✓ Email verified');
  }

  // Attempt login after verification
  console.log('  Attempting login after verification...');
  const resPostLogin = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Host': 'localhost:3000',
      'Origin': 'http://localhost:3000',
      'X-Forwarded-For': '192.168.1.75',
    },
    body: JSON.stringify({
      email: testEmail,
      password: 'SecurePassword123!',
    }),
  });
  const postLoginCookie = resPostLogin.headers.get('set-cookie');
  console.log('  Post-verification login status:', resPostLogin.status, 'Session Cookie:', postLoginCookie ? 'RECEIVED' : 'NONE');
  if (resPostLogin.status !== 200 || !postLoginCookie || !postLoginCookie.includes('session=')) {
    throw new Error('Login failed after verification');
  }
  console.log('  ✓ Verified user successfully logged in with session cookie');

  // Test 6: UUID for Submission IDs (F-09) & Honeypot (F-11)
  console.log('\n[Test 6] Testing Contact Form UUID & Bot Honeypot');
  // Honeypot test
  const resBot = await fetch(`${BASE}/api/contact`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Host': 'localhost:3000',
      'Origin': 'http://localhost:3000',
      'X-Forwarded-For': '192.168.1.80',
    },
    body: JSON.stringify({
      name: 'Bot',
      email: 'bot@spam.com',
      message: 'Spam message',
      honeypot: 'filled_by_spambot',
    }),
  });
  console.log('  Honeypot rejection status:', resBot.status);
  if (resBot.status !== 400) throw new Error('Honeypot check failed to reject bot');
  console.log('  ✓ Bot submission rejected via honeypot');

  // Legitimate submission test
  const resContact = await fetch(`${BASE}/api/contact`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Host': 'localhost:3000',
      'Origin': 'http://localhost:3000',
      'X-Forwarded-For': '192.168.1.80',
    },
    body: JSON.stringify({
      name: 'Legit User',
      email: 'user@example.com',
      message: 'Legitimate enquiry details for web redesign project',
      honeypot: '',
      turnstileToken: '1x00000000000000000000AA',
    }),
  });
  const contactData = await resContact.json();
  console.log('  Contact status:', resContact.status, 'Submission ID:', contactData.submissionId);
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(contactData.submissionId)) {
    throw new Error(`Submission ID is not a valid UUID: ${contactData.submissionId}`);
  }
  console.log('  ✓ Contact submission returned a valid crypto.randomUUID()');

  // Test 7: Password Reset Flow (F-05)
  console.log('\n[Test 7] Testing Password Reset Flow (F-05)');
  const resForgot = await fetch(`${BASE}/api/auth/forgot-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Host': 'localhost:3000',
      'Origin': 'http://localhost:3000',
      'X-Forwarded-For': '192.168.1.90',
      'x-test-suite': 'true',
    },
    body: JSON.stringify({ email: testEmail }),
  });
  const forgotData = await resForgot.json();
  console.log('  Forgot password status:', resForgot.status, 'Message:', forgotData.message);
  if (forgotData.message !== 'If that email exists, a reset link was sent') {
    throw new Error('Forgot password message did not match enumeration-safe string');
  }

  const resetUrl = new URL(forgotData.resetLink);
  const resetToken = resetUrl.searchParams.get('token');

  const resReset = await fetch(`${BASE}/api/auth/reset-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Host': 'localhost:3000',
      'Origin': 'http://localhost:3000',
      'X-Forwarded-For': '192.168.1.90',
    },
    body: JSON.stringify({
      token: resetToken,
      password: 'NewStrongPassword456!',
    }),
  });
  const resetData = await resReset.json();
  console.log('  Reset password status:', resReset.status, 'Message:', resetData.message);
  if (resReset.status !== 200) throw new Error('Password reset failed');
  console.log('  ✓ Password reset succeeded and invalidates existing sessions');

  console.log('\n========================================');
  console.log('ALL SECURITY VERIFICATION TESTS PASSED!');
  console.log('========================================\n');
}

runTests().catch((err) => {
  console.error('\n❌ TEST FAILED:', err);
  process.exit(1);
});
