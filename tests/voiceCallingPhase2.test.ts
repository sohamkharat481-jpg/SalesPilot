import assert from 'node:assert';
import { LocalDB, isValidCallStateTransition } from '../src/database/localDb';
import { VoiceProviderAdapter } from '../src/server/voice/VoiceProviderAdapter';

async function runVoiceCallingPhase2Tests() {
  console.log('--- Starting Phase 2 Real Voice Provider Integration Tests ---');

  const localDb = LocalDB.getInstance();
  const voiceAdapter = new VoiceProviderAdapter();

  const orgA = 'org_tenant_voice_p2_a';
  const orgB = 'org_tenant_voice_p2_b';

  // Seed test leads in Org A and Org B
  localDb.saveLead({
    id: 'lead_p2_1',
    organizationId: orgA,
    name: 'Sarah Connor',
    company: 'Cyberdyne Systems',
    phone: '+15559876543',
    email: 'sarah@cyberdyne.com',
    status: 'NEW' as any,
    createdAt: new Date().toISOString()
  } as any);

  localDb.saveLead({
    id: 'lead_p2_org_b',
    organizationId: orgB,
    name: 'Org B Prospect',
    company: 'Org B Inc',
    phone: '+15550000000',
    email: 'prospect@orgb.com',
    status: 'NEW' as any,
    createdAt: new Date().toISOString()
  } as any);

  // 1. Test Provider Configuration Detection
  const isConfiguredOriginal = voiceAdapter.isConfigured();
  assert.strictEqual(typeof isConfiguredOriginal, 'boolean');

  // Test when no keys are present
  const originalKey = process.env.BLAND_API_KEY;
  delete process.env.BLAND_API_KEY;
  delete process.env.VAPI_API_KEY;
  delete process.env.TWILIO_ACCOUNT_SID;
  delete process.env.ELEVENLABS_API_KEY;
  delete process.env.VOICE_PROVIDER_API_KEY;

  const unconfiguredAdapter = new VoiceProviderAdapter();
  assert.strictEqual(unconfiguredAdapter.isConfigured(), false);
  assert.strictEqual(unconfiguredAdapter.name, 'None');

  const unconfiguredCallResult = await unconfiguredAdapter.createCall({
    callId: 'call_p2_unconf',
    organizationId: orgA,
    phoneNumber: '+15559876543',
    agentName: 'Astra',
    openingMessage: 'Hello',
    callObjective: 'Qualify'
  });
  assert.strictEqual(unconfiguredCallResult.success, false);
  assert.strictEqual(unconfiguredCallResult.error, 'Voice provider not configured');
  console.log('✓ Test 1 Passed: Real provider configuration detection and safe unconfigured response');

  // Restore API key for remaining tests
  process.env.BLAND_API_KEY = 'bland_test_key_phase2_12345';
  const configuredAdapter = new VoiceProviderAdapter();
  assert.strictEqual(configuredAdapter.isConfigured(), true);
  assert.strictEqual(configuredAdapter.name, 'Bland AI');
  console.log('✓ Test 2 Passed: Detected configured provider Bland AI');

  // 2. Test Call Creation and State Transitions
  const initialCall = localDb.saveVoiceCall({
    id: 'call_p2_state_101',
    organizationId: orgA,
    leadId: 'lead_p2_1',
    leadName: 'Sarah Connor',
    company: 'Cyberdyne Systems',
    phoneNumber: '+15559876543',
    status: 'QUEUED',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });
  assert.strictEqual(initialCall.status, 'QUEUED');

  // QUEUED -> DIALING (Valid)
  const dialingCall = localDb.updateVoiceCallStatus(initialCall.id, 'DIALING', orgA, { providerCallId: 'bland_call_ref_888' });
  assert.strictEqual(dialingCall?.status, 'DIALING');
  assert.strictEqual(dialingCall?.providerCallId, 'bland_call_ref_888');

  // DIALING -> RINGING (Valid)
  const ringingCall = localDb.updateVoiceCallStatus(initialCall.id, 'RINGING', orgA);
  assert.strictEqual(ringingCall?.status, 'RINGING');

  // RINGING -> IN_PROGRESS (Valid)
  const inProgressCall = localDb.updateVoiceCallStatus(initialCall.id, 'IN_PROGRESS', orgA);
  assert.strictEqual(inProgressCall?.status, 'IN_PROGRESS');

  // IN_PROGRESS -> COMPLETED (Valid)
  const completedCall = localDb.updateVoiceCallStatus(initialCall.id, 'COMPLETED', orgA, { durationSeconds: 95, summary: 'Lead interested in demo.' });
  assert.strictEqual(completedCall?.status, 'COMPLETED');
  assert.strictEqual(completedCall?.durationSeconds, 95);

  console.log('✓ Test 3 Passed: Valid call state transitions recorded');

  // 3. Test Invalid State Transition Rejection
  assert.strictEqual(isValidCallStateTransition('COMPLETED', 'DIALING'), false);
  assert.strictEqual(isValidCallStateTransition('FAILED', 'IN_PROGRESS'), false);
  assert.strictEqual(isValidCallStateTransition('CANCELLED', 'RINGING'), false);

  assert.throws(() => {
    localDb.updateVoiceCallStatus(initialCall.id, 'DIALING', orgA);
  }, /Invalid call state transition/);

  console.log('✓ Test 4 Passed: Invalid state transitions strictly rejected');

  // 4. Test Multi-Tenant Security & Isolation
  const callInOrgA = localDb.getVoiceCallById('call_p2_state_101', orgA);
  assert.ok(callInOrgA);

  const callInOrgB = localDb.getVoiceCallById('call_p2_state_101', orgB);
  assert.strictEqual(callInOrgB, undefined);

  const crossTenantUpdate = localDb.updateVoiceCallStatus('call_p2_state_101', 'COMPLETED', orgB);
  assert.strictEqual(crossTenantUpdate, undefined);

  console.log('✓ Test 5 Passed: Multi-tenant isolation enforced');

  // 5. Test Webhook Authentication & Payload Resolution
  process.env.BLAND_WEBHOOK_SECRET = 'secret_webhook_key_phase2';

  // Test webhook with missing / wrong secret
  const invalidWebhookResult = await configuredAdapter.handleWebhook({
    call_id: 'bland_call_ref_888',
    status: 'completed',
    secret: 'wrong_secret'
  }, {});
  assert.strictEqual(invalidWebhookResult.error, 'Webhook signature/secret verification failed');

  // Test webhook with correct secret
  const validWebhookResult = await configuredAdapter.handleWebhook({
    call_id: 'bland_call_ref_888',
    status: 'completed',
    corrected_duration: 110,
    concatenated_transcript: 'Agent: Hi Sarah, Astra calling. Sarah: Yes, let us book a call next Tuesday.',
    summary: 'Prospect requested meeting for next Tuesday.',
    secret: 'secret_webhook_key_phase2'
  }, {});

  assert.strictEqual(validWebhookResult.providerCallId, 'bland_call_ref_888');
  assert.strictEqual(validWebhookResult.status, 'COMPLETED');
  assert.strictEqual(validWebhookResult.durationSeconds, 110);
  assert.strictEqual(validWebhookResult.outcome, 'MEETING_REQUESTED');
  console.log('✓ Test 6 Passed: Webhook secret verification and outcome classification');

  // Clean up test env var
  delete process.env.BLAND_WEBHOOK_SECRET;

  // 6. Test CRM Activity & Appointment Creation
  const leadA = localDb.getLeadById('lead_p2_1', orgA);
  assert.ok(leadA);

  localDb.addLeadActivity({
    id: 'act_p2_10',
    leadId: leadA.id,
    organizationId: orgA,
    type: 'AI_VOICE_CALL',
    title: 'Real AI Voice Call Completed',
    description: 'Call duration 110s. Lead requested meeting.',
    timestamp: new Date().toISOString()
  });

  leadA.status = 'INTERESTED' as any;
  localDb.saveLead(leadA);

  const newAppointment = {
    id: 'appt_p2_booking_1',
    organizationId: orgA,
    leadId: leadA.id,
    leadName: leadA.name,
    company: leadA.company,
    email: leadA.email,
    title: 'Intro Call - Cyberdyne Systems',
    dateTime: '2026-09-29T14:00:00.000Z',
    durationMins: 30,
    status: 'SCHEDULED' as any,
    meetingLink: 'https://meet.google.com/salespilot-demo',
    notes: 'Booked via AI Voice Call.',
    createdAt: new Date().toISOString()
  };
  localDb.saveAppointment(newAppointment);

  const updatedLead = localDb.getLeadById('lead_p2_1', orgA);
  assert.strictEqual(updatedLead?.status, 'INTERESTED');

  const appts = localDb.getAppointmentsByLeadId('lead_p2_1');
  assert.ok(appts.some(a => a.id === 'appt_p2_booking_1'));

  console.log('✓ Test 7 Passed: CRM activity logging and meeting booking');

  // Restore original key
  if (originalKey) process.env.BLAND_API_KEY = originalKey;

  console.log('--- All Phase 2 Voice Calling Tests Passed Successfully ---');
  process.exit(0);
}

runVoiceCallingPhase2Tests().catch(err => {
  console.error('Phase 2 Test run failed:', err);
  process.exit(1);
});
