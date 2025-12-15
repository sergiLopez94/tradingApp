import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

/**
 * Load Testing with K6
 * Tests API performance between frontend and backend
 * 
 * Run with:
 * k6 run load-test.js
 * 
 * Run with options:
 * k6 run --vus 10 --duration 30s load-test.js
 */

// Custom metrics
const errorRate = new Rate('errors');

// Test configuration
export const options = {
  stages: [
    { duration: '30s', target: 20 },  // Ramp up to 20 users
    { duration: '1m', target: 20 },   // Stay at 20 users for 1 minute
    { duration: '20s', target: 0 },   // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests must complete below 500ms
    http_req_failed: ['rate<0.05'],   // Error rate must be below 5%
    errors: ['rate<0.1'],              // Custom error rate below 10%
  },
};

const BACKEND_URL = __ENV.BACKEND_URL || 'http://localhost:8080';
const TEST_CLIENT_ID = 'LOAD-TEST-001';

/**
 * Setup: Create test data before load testing
 */
export function setup() {
  console.log('Setting up test data...');
  
  // Create test portfolio file content
  const testData = `
**Depot:** ${TEST_CLIENT_ID}
**Datum:** 2024-01-15

| STK. / Nominale | Wertpapier | ISIN | Symbol | Art | Kurs | Wert (EUR) |
|-----------------|------------|------|--------|-----|------|-----------|
| 10.00 | Apple Inc. | US0378331005 | AAPL | Aktie | 150.00 | 1500.00 |
| 5.00 | Microsoft Corp. | US5949181045 | MSFT | Aktie | 300.00 | 1500.00 |
| 20.00 | Tesla Inc. | US88160R1014 | TSLA | Aktie | 250.00 | 5000.00 |
`;

  // Upload test data
  const formData = {
    file: http.file(testData, 'portfolio.md', 'text/markdown'),
  };

  const uploadResponse = http.post(`${BACKEND_URL}/api/upload`, formData);
  
  if (uploadResponse.status !== 200) {
    console.warn(`Setup warning: Upload failed with status ${uploadResponse.status}`);
  } else {
    console.log('Test data uploaded successfully');
  }

  return { clientId: TEST_CLIENT_ID };
}

/**
 * Main test scenario
 */
export default function(data) {
  // Test 1: GET /api/transactions/{clientId}
  testGetTransactions(data.clientId);
  sleep(1);

  // Test 2: GET /api/client/{clientId}
  testGetClient(data.clientId);
  sleep(1);

  // Test 3: POST /api/upload (simulate file upload)
  testFileUpload();
  sleep(2);
}

/**
 * Test GET transactions endpoint
 */
function testGetTransactions(clientId) {
  const response = http.get(`${BACKEND_URL}/api/transactions/${clientId}`, {
    tags: { name: 'GetTransactions' },
  });

  const checkResult = check(response, {
    'GET transactions status is 200': (r) => r.status === 200,
    'GET transactions response time < 200ms': (r) => r.timings.duration < 200,
    'GET transactions returns JSON': (r) => r.headers['Content-Type']?.includes('application/json'),
    'GET transactions returns array': (r) => {
      try {
        const body = JSON.parse(r.body);
        return Array.isArray(body);
      } catch (e) {
        return false;
      }
    },
  });

  errorRate.add(!checkResult);
}

/**
 * Test GET client endpoint
 */
function testGetClient(clientId) {
  const response = http.get(`${BACKEND_URL}/api/client/${clientId}`, {
    tags: { name: 'GetClient' },
  });

  const checkResult = check(response, {
    'GET client status is 200 or 404': (r) => r.status === 200 || r.status === 404,
    'GET client response time < 200ms': (r) => r.timings.duration < 200,
    'GET client returns JSON': (r) => r.headers['Content-Type']?.includes('application/json'),
  });

  errorRate.add(!checkResult);
}

/**
 * Test POST upload endpoint
 */
function testFileUpload() {
  const testClientId = `LOAD-${Date.now()}`;
  const portfolioData = `
**Depot:** ${testClientId}
**Datum:** 2024-01-15

| STK. / Nominale | Wertpapier | ISIN | Symbol | Art | Kurs | Wert (EUR) |
|-----------------|------------|------|--------|-----|------|-----------|
| 15.00 | Netflix Inc. | US64110L1061 | NFLX | Aktie | 400.00 | 6000.00 |
`;

  const formData = {
    file: http.file(portfolioData, 'portfolio.md', 'text/markdown'),
  };

  const response = http.post(`${BACKEND_URL}/api/upload`, formData, {
    tags: { name: 'PostUpload' },
  });

  const checkResult = check(response, {
    'POST upload status is 200': (r) => r.status === 200,
    'POST upload response time < 1000ms': (r) => r.timings.duration < 1000,
    'POST upload returns JSON': (r) => r.headers['Content-Type']?.includes('application/json'),
    'POST upload returns depot': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.depot !== undefined;
      } catch (e) {
        return false;
      }
    },
  });

  errorRate.add(!checkResult);
}

/**
 * Teardown: Clean up after tests
 */
export function teardown(data) {
  console.log('Load test completed');
  console.log(`Test client ID: ${data.clientId}`);
}

/**
 * Handle summary
 */
export function handleSummary(data) {
  return {
    'stdout': textSummary(data, { indent: ' ', enableColors: true }),
    'summary.json': JSON.stringify(data),
  };
}

function textSummary(data, options) {
  const indent = options?.indent || '';
  const enableColors = options?.enableColors || false;
  
  let summary = '\n';
  summary += `${indent}╔═══════════════════════════════════════════════════╗\n`;
  summary += `${indent}║        K6 Load Test Summary - Trading App        ║\n`;
  summary += `${indent}╚═══════════════════════════════════════════════════╝\n\n`;
  
  // Metrics
  const metrics = data.metrics;
  
  if (metrics.http_reqs) {
    summary += `${indent}Total Requests: ${metrics.http_reqs.values.count}\n`;
  }
  
  if (metrics.http_req_duration) {
    summary += `${indent}Response Time:\n`;
    summary += `${indent}  avg: ${metrics.http_req_duration.values.avg.toFixed(2)}ms\n`;
    summary += `${indent}  min: ${metrics.http_req_duration.values.min.toFixed(2)}ms\n`;
    summary += `${indent}  med: ${metrics.http_req_duration.values.med.toFixed(2)}ms\n`;
    summary += `${indent}  max: ${metrics.http_req_duration.values.max.toFixed(2)}ms\n`;
    summary += `${indent}  p(95): ${metrics.http_req_duration.values['p(95)'].toFixed(2)}ms\n`;
  }
  
  if (metrics.http_req_failed) {
    const failRate = (metrics.http_req_failed.values.rate * 100).toFixed(2);
    summary += `${indent}Failed Requests: ${failRate}%\n`;
  }
  
  if (metrics.errors) {
    const errorRate = (metrics.errors.values.rate * 100).toFixed(2);
    summary += `${indent}Error Rate: ${errorRate}%\n`;
  }
  
  summary += '\n';
  
  return summary;
}
