#!/usr/bin/env tsx
/**
 * Test Gemini API directly
 * Run with: pnpm tsx scripts/test-gemini-api.ts
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message: string, color: keyof typeof colors = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testGeminiAPI() {
  log('\n╔════════════════════════════════════════════════════════════╗', 'cyan');
  log('║           Gemini API Direct Test                          ║', 'cyan');
  log('╚════════════════════════════════════════════════════════════╝\n', 'cyan');

  // Check API key
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  
  if (!apiKey) {
    log('✗ No API key found', 'red');
    log('  Set GEMINI_API_KEY or GOOGLE_API_KEY in .env', 'yellow');
    process.exit(1);
  }

  log(`✓ API key found: ${apiKey.substring(0, 10)}...`, 'green');
  log(`  Length: ${apiKey.length} characters`, 'blue');

  // Initialize client
  try {
    log('\nInitializing Gemini client...', 'cyan');
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    log('✓ Client initialized', 'green');

    // Test 1: Simple generation
    log('\n─────────────────────────────────────────────────────────────', 'cyan');
    log('Test 1: Simple Text Generation', 'cyan');
    log('─────────────────────────────────────────────────────────────\n', 'cyan');

    const start1 = Date.now();
    const result1 = await model.generateContent('Say hello in one sentence.');
    const duration1 = Date.now() - start1;
    const response1 = await result1.response;
    const text1 = response1.text();

    log(`✓ Generation successful (${duration1}ms)`, 'green');
    log(`Response: ${text1}`, 'blue');

    // Test 2: Lead scoring prompt
    log('\n─────────────────────────────────────────────────────────────', 'cyan');
    log('Test 2: Lead Scoring Prompt', 'cyan');
    log('─────────────────────────────────────────────────────────────\n', 'cyan');

    const leadScoringPrompt = `
You are a CRM lead scoring assistant. Score this lead from 0-100 and provide reasoning.

Lead Information:
- Name: John Doe
- Email: john@example.com
- Company: Acme Corp
- Source: Website
- Stage: NEW
- Days since creation: 5

Provide your response in this format:
Score: [0-100]
Qualification: [COLD/WARM/HOT]
Reasoning: [Brief explanation]
`;

    const start2 = Date.now();
    const result2 = await model.generateContent(leadScoringPrompt);
    const duration2 = Date.now() - start2;
    const response2 = await result2.response;
    const text2 = response2.text();

    log(`✓ Lead scoring successful (${duration2}ms)`, 'green');
    log(`Response:\n${text2}`, 'blue');

    // Test 3: Email generation prompt
    log('\n─────────────────────────────────────────────────────────────', 'cyan');
    log('Test 3: Email Generation Prompt', 'cyan');
    log('─────────────────────────────────────────────────────────────\n', 'cyan');

    const emailPrompt = `
Generate a professional follow-up email for this lead:

Lead: John Doe from Acme Corp
Context: Initial inquiry about our product
Tone: Professional and friendly

Provide:
Subject: [email subject]
Body: [email body]
`;

    const start3 = Date.now();
    const result3 = await model.generateContent(emailPrompt);
    const duration3 = Date.now() - start3;
    const response3 = await result3.response;
    const text3 = response3.text();

    log(`✓ Email generation successful (${duration3}ms)`, 'green');
    log(`Response:\n${text3}`, 'blue');

    // Summary
    log('\n═══════════════════════════════════════════════════════════', 'cyan');
    log('Test Summary', 'cyan');
    log('═══════════════════════════════════════════════════════════\n', 'cyan');

    log('✓ All tests passed!', 'green');
    log(`  Test 1: ${duration1}ms`, 'blue');
    log(`  Test 2: ${duration2}ms`, 'blue');
    log(`  Test 3: ${duration3}ms`, 'blue');
    log(`  Average: ${Math.round((duration1 + duration2 + duration3) / 3)}ms`, 'blue');

    log('\n🎉 Gemini API is working correctly!', 'green');
    log('   The agent system should work with this API key.', 'green');

  } catch (error: any) {
    log('\n✗ Test failed', 'red');
    log(`Error: ${error.message}`, 'red');
    
    if (error.message.includes('API key')) {
      log('\n💡 Troubleshooting:', 'yellow');
      log('  1. Verify your API key at: https://makersuite.google.com/app/apikey', 'yellow');
      log('  2. Make sure the key is active and not expired', 'yellow');
      log('  3. Check if you have API quota remaining', 'yellow');
    } else if (error.message.includes('quota') || error.message.includes('limit')) {
      log('\n💡 Troubleshooting:', 'yellow');
      log('  1. You may have exceeded your API quota', 'yellow');
      log('  2. Check your quota at: https://makersuite.google.com/', 'yellow');
      log('  3. Wait for quota to reset or upgrade your plan', 'yellow');
    } else if (error.message.includes('network') || error.message.includes('ECONNREFUSED')) {
      log('\n💡 Troubleshooting:', 'yellow');
      log('  1. Check your internet connection', 'yellow');
      log('  2. Verify you can access https://generativelanguage.googleapis.com', 'yellow');
      log('  3. Check if a firewall is blocking the connection', 'yellow');
    }

    console.error('\nFull error:', error);
    process.exit(1);
  }
}

testGeminiAPI().catch(console.error);
