import { getSupabaseClient } from '../src/lib/supabase';

async function diagnose() {
  console.log('=== DIAGNOSING SUPABASE LEADS SCHEMA AND INSERTION ===');
  const client = getSupabaseClient();
  if (!client) {
    console.error('No Supabase client available!');
    return;
  }

  // 1. Check existing leads columns
  const { data: sample, error: sampleErr } = await client.from('leads').select('*').limit(1);
  if (sampleErr) {
    console.error('Error querying leads table:', sampleErr);
  } else {
    console.log('Sample lead columns in Supabase:', sample && sample.length > 0 ? Object.keys(sample[0]) : 'No rows, querying column metadata...');
  }

  // 2. Test inserting a lead with all fields that server.ts uses
  const testId = `test_lead_${Date.now()}`;
  const testOrgId = `org_diag_${Date.now()}`;
  const testUserId = `user_diag_${Date.now()}`;

  const testLeadPayload: any = {
    id: testId,
    organization_id: testOrgId,
    assigned_to: testUserId,
    user_id: testUserId,
    is_shared: false,
    first_name: 'Test',
    last_name: 'Lead',
    company: 'Test Company',
    email: 'test@example.com',
    phone: '+1234567890',
    website: 'https://example.com',
    status: 'NEW',
    source: 'Diagnostics',
    score: 85,
    notes: JSON.stringify({ notesList: [], timelineList: [] }),
    tags: ['Test', 'Diagnostic'],
    custom_fields: {
      title: 'Director',
      industry: 'Software',
      country: 'India'
    }
  };

  const validColumnsPayload: any = {
    id: testId,
    organization_id: testOrgId,
    first_name: 'Test',
    last_name: 'Lead',
    company: 'Test Company',
    email: 'test@example.com',
    phone: '+1234567890',
    website: 'https://example.com',
    status: 'NEW',
    source: 'Diagnostics',
    score: 85,
    notes: JSON.stringify({
      notesList: [],
      timelineList: [],
      assignedToId: testUserId,
      userId: testUserId,
      isShared: false
    }),
    tags: ['Test', 'Diagnostic'],
    custom_fields: {
      title: 'Director',
      assignedToId: testUserId,
      userId: testUserId,
      isShared: false,
      industry: 'Software',
      country: 'India'
    }
  };

  console.log('Attempting insert with schema-compliant payload:', validColumnsPayload);
  const { data: insData2, error: insErr2 } = await client.from('leads').insert(validColumnsPayload).select('*');
  if (insErr2) {
    console.error('❌ SECOND INSERT FAILED with error:', insErr2);
  } else {
    console.log('✅ SECOND INSERT SUCCEEDED! Inserted data in Supabase:', insData2);
  }

  // 3. Clean up
  await client.from('leads').delete().eq('id', testId);
  console.log('Cleaned up test record.');
}

diagnose().catch(err => console.error('Diagnose exception:', err));
