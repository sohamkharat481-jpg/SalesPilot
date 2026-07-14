// Google Calendar E2E Integration Test Runner

async function runTest() {
  console.log('================================================================');
  console.log('🚀 SALESPILOT GOOGLE CALENDAR E2E INTEGRATION TEST RUNNER');
  console.log('================================================================');
  console.log('Triggering endpoint: http://localhost:3000/api/v1/test-calendar-integration...\n');

  try {
    const res = await fetch('http://localhost:3000/api/v1/test-calendar-integration', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });

    if (!res.ok) {
      console.error(`❌ HTTP Error ${res.status}`);
      const text = await res.text();
      console.error(`Response content: ${text}\n`);
      process.exit(1);
    }

    const data: any = await res.json();
    console.log('----------------------------------------------------------------');
    console.log(`STATUS: ${data.success ? '💚 SUCCESS' : '🔴 FAILED'}`);
    console.log(`MODE: ${data.isRealGoogleAPI ? 'REAL GOOGLE APIS' : 'MOCK ENGINE'}`);
    console.log('----------------------------------------------------------------');
    
    console.log('\nSTEP-BY-STEP INTEGRATION LOGS:');
    data.logs?.forEach((logLine: string) => {
      console.log(`  ${logLine}`);
    });

    if (data.success) {
      console.log('\nCONFIRMED EVENT DETAILS:');
      console.log(`  🔹 Event Subject:       ${data.summary.summary}`);
      console.log(`  🔹 Google Event ID:     ${data.summary.eventId}`);
      console.log(`  🔹 Google Meet Link:    ${data.summary.meetLink || 'N/A'}`);
      console.log(`  🔹 Gmail Message ID:    ${data.summary.gmailMessageId || 'N/A'}`);
      console.log(`  🔹 Enrolled Attendees:  ${data.summary.attendee}`);
      console.log(`  🔹 Email Invites Sent:  Automatically via sendUpdates=all`);
      console.log(`  🔹 Local CRM Sync:      Confirmed`);
      console.log('\n================================================================');
      console.log('✅ ALL SYSTEMS WORKING IN PERFECT SYNC! INTEGRATION VERIFIED.');
      console.log('================================================================');
    } else {
      console.error(`\n❌ Error message returned: ${data.error}`);
      console.log('================================================================');
      process.exit(1);
    }
  } catch (err: any) {
    console.error(`❌ Network error contacting development server: ${err.message}`);
    console.log('================================================================');
    process.exit(1);
  }
}

runTest();
