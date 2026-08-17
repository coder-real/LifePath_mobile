// Full end-to-end simulation of the LiFePath flow against the live Supabase
// backend, using the Supabase REST + Auth APIs. This validates the data layer
// and RLS policies exactly as the app exercises them.
const URL = 'https://qdyczaaeffygzwqszjwk.supabase.co';
const KEY = 'sb_publishable_I_mdeEinfgy9abBDnuGYQQ_wdsvYuZo';

const stamp = Date.now();
const MENTEE_EMAIL = `sim_mentee_${stamp}@example.com`;
const MENTOR_EMAIL = `sim_mentor_${stamp}@example.com`;
const PASS = 'SimPass123!';

let pass = 0, fail = 0;
function ok(name) { pass++; console.log(`  PASS  ${name}`); }
function bad(name, detail) { fail++; console.log(`  FAIL  ${name} :: ${detail}`); }

async function api(path, opts = {}) {
  const res = await fetch(URL + path, {
    ...opts,
    headers: { 'apikey': KEY, 'Content-Type': 'application/json', ...(opts.headers || {}) },
  });
  const text = await res.text();
  let json = null; try { json = JSON.parse(text); } catch {}
  return { status: res.status, json };
}

// Sign up a user; return session + user id.
async function signup(email, role, fullName) {
  const r = await api('/auth/v1/signup', {
    method: 'POST',
    headers: { Authorization: `Bearer ${KEY}` },
    body: JSON.stringify({
      email, password: PASS,
      data: { full_name: fullName, role },
    }),
  });
  return r;
}

async function getUser(token) {
  const r = await api('/auth/v1/user', { headers: { Authorization: `Bearer ${token}` } });
  return r;
}

// Authed REST call.
async function rest(token, path, opts = {}) {
  return api(path, { ...opts, headers: { Authorization: `Bearer ${token}`, ...(opts.headers || {}) } });
}

(async () => {
  console.log('=== 1. Sign up mentor + mentee ===');
  const mentorS = await signup(MENTOR_EMAIL, 'mentor', 'Sim Mentor');
  const menteeS = await signup(MENTEE_EMAIL, 'mentee', 'Sim Mentee');

  const mentorToken = mentorS.json?.access_token || null;
  const menteeToken = menteeS.json?.access_token || null;
  const mentorId = mentorS.json?.user?.id || null;
  const menteeId = menteeS.json?.user?.id || null;
  console.log('  mentor token:', mentorToken ? 'YES' : 'NO', '| mentor id:', mentorId);
  console.log('  mentee token:', menteeToken ? 'YES' : 'NO', '| mentee id:', menteeId);

  if (!mentorToken || !menteeToken) {
    console.log('\nSessions not returned from signup (email confirmation is likely ON).');
    console.log('To fully simulate I need confirmed sessions. Trying to read user anyway:');
    const m = await signup(MENTOR_EMAIL, 'mentor', 'Sim Mentor');
    console.log('  mentor signup resp:', JSON.stringify(m.json)?.slice(0, 200));
    process.exit(2);
  }

  ok('mentor signup returned session');
  ok('mentee signup returned session');

  // The DB trigger should have created profiles rows already.
  console.log('\n=== 2. Profiles auto-created by trigger? ===');
  const mProf = await rest(mentorToken, `/rest/v1/profiles?select=id,full_name,role&id=eq.${mentorId}`);
  const meProf = await rest(menteeToken, `/rest/v1/profiles?select=id,full_name,role&id=eq.${menteeId}`);
  mProf.status === 200 && mProf.json?.length === 1 ? ok('mentor profile row exists (trigger)') : bad('mentor profile row', JSON.stringify(mProf.json));
  meProf.status === 200 && meProf.json?.length === 1 ? ok('mentee profile row exists (trigger)') : bad('mentee profile row', JSON.stringify(meProf.json));

  console.log('\n=== 3. Mentor sets up mentor_profiles (upsert) ===');
  const mpUpsert = await rest(mentorToken, '/rest/v1/mentor_profiles', {
    method: 'POST',
    body: JSON.stringify({
      id: mentorId,
      headline: 'Senior Software Engineer',
      expertise: ['Web Development', 'Career Planning'],
      categories: ['Technology', 'Career Planning'],
      is_available: true,
    }),
    headers: { Prefer: 'resolution=merge-duplicates,return=representation' },
  });
  mpUpsert.status === 200 || mpUpsert.status === 201 ? ok('mentor_profiles upsert') : bad('mentor_profiles upsert', `${mpUpsert.status} ${JSON.stringify(mpUpsert.json)}`);

  console.log('\n=== 4. Mentee can READ mentor_profiles (search) ===');
  const search = await rest(menteeToken, `/rest/v1/mentor_profiles?select=id,headline,categories&is_available=eq.true&contains=categories=%7B%22Technology%22%7D`);
  search.status === 200 && search.json?.some(m => m.id === mentorId) ? ok('mentee can search & find the mentor') : bad('mentee search', `${search.status} ${JSON.stringify(search.json)}`);

  console.log('\n=== 5. Mentee sends mentorship request ===');
  const reqIns = await rest(menteeToken, '/rest/v1/mentorship_requests', {
    method: 'POST',
    body: JSON.stringify({ mentee_id: menteeId, mentor_id: mentorId, message: 'Hi, please mentor me in React!', status: 'pending' }),
    headers: { Prefer: 'return=representation' },
  });
  const requestId = reqIns.json?.[0]?.id;
  reqIns.status === 201 ? ok('request inserted') : bad('request insert', `${reqIns.status} ${JSON.stringify(reqIns.json)}`);

  // A mentee should NOT be able to accept their own request (RLS: update only for mentor).
  console.log('  (RLS check) mentee tries to accept own request → should be blocked');
  const badUpdate = await rest(menteeToken, `/rest/v1/mentorship_requests?id=eq.${requestId}`, {
    method: 'PATCH', body: JSON.stringify({ status: 'accepted' }),
  });
  badUpdate.status === 200 ? bad('mentee accept own request', 'was allowed (RLS hole!)') : ok('mentee cannot accept own request (blocked)');

  console.log('\n=== 6. Mentor sees + accepts request → creates conversation ===');
  const mentorView = await rest(mentorToken, `/rest/v1/mentorship_requests?select=id,mentee:profiles!mentee_id(full_name),message&mentor_id=eq.${mentorId}`);
  mentorView.status === 200 ? ok('mentor sees incoming request') : bad('mentor view', `${mentorView.status} ${JSON.stringify(mentorView.json)}`);

  const accept = await rest(mentorToken, `/rest/v1/mentorship_requests?id=eq.${requestId}`, {
    method: 'PATCH', body: JSON.stringify({ status: 'accepted' }),
  });
  accept.status === 200 ? ok('mentor accepts request') : bad('mentor accept', `${accept.status} ${JSON.stringify(accept.json)}`);

  const convIns = await rest(mentorToken, '/rest/v1/conversations', {
    method: 'POST',
    body: JSON.stringify({ mentorship_id: requestId }),
    headers: { Prefer: 'return=representation' },
  });
  const convId = convIns.json?.[0]?.id;
  convIns.status === 201 ? ok('conversation created on accept') : bad('conversation create', `${convIns.status} ${JSON.stringify(convIns.json)}`);

  console.log('\n=== 7. Both participants can read the conversation ===');
  const convRead = await rest(menteeToken, `/rest/v1/conversations?select=id&id=eq.${convId}`);
  convRead.status === 200 && convRead.json?.length === 1 ? ok('mentee can read conversation') : bad('mentee conv read', `${convRead.status} ${JSON.stringify(convRead.json)}`);

  console.log('\n=== 8. Chat: both send messages, both can read ===');
  const m1 = await rest(menteeToken, '/rest/v1/messages', { method: 'POST', body: JSON.stringify({ conversation_id: convId, sender_id: menteeId, content: 'Hello mentor!' }), headers: { Prefer: 'return=representation' } });
  m1.status === 201 ? ok('mentee sends message') : bad('mentee msg', `${m1.status} ${JSON.stringify(m1.json)}`);
  const m2 = await rest(mentorToken, '/rest/v1/messages', { method: 'POST', body: JSON.stringify({ conversation_id: convId, sender_id: mentorId, content: 'Hi! Happy to help.' }), headers: { Prefer: 'return=representation' } });
  m2.status === 201 ? ok('mentor sends message') : bad('mentor msg', `${m2.status} ${JSON.stringify(m2.json)}`);
  const msgs = await rest(menteeToken, `/rest/v1/messages?select=sender_id,content&conversation_id=eq.${convId}`);
  msgs.status === 200 && msgs.json?.length === 2 ? ok('mentee reads full thread (2 messages)') : bad('mentee thread read', `${msgs.status} ${JSON.stringify(msgs.json)}`);

  console.log('\n=== 9. RLS: outsider cannot read this conversation ===');
  const outsider = await signup(`outsider_${stamp}@example.com`, 'mentee', 'Outsider');
  const outsiderToken = outsider.json?.access_token || null;
  if (outsiderToken) {
    const oRead = await rest(outsiderToken, `/rest/v1/messages?select=id&conversation_id=eq.${convId}`);
    oRead.status === 200 && oRead.json?.length === 0 ? ok('outsider sees NO messages (RLS works)') : bad('outsider read', `${oRead.status} ${JSON.stringify(oRead.json)}`);
  } else {
    console.log('  SKIP outsider check (no session)');
  }

  console.log('\n=== 10. Goals + milestones ===');
  const goal = await rest(menteeToken, '/rest/v1/goals', { method: 'POST', body: JSON.stringify({ user_id: menteeId, title: 'Learn React basics', description: 'Complete tutorials', category: 'Technology', status: 'active' }), headers: { Prefer: 'return=representation' } });
  const goalId = goal.json?.[0]?.id;
  goal.status === 201 ? ok('goal created') : bad('goal create', `${goal.status} ${JSON.stringify(goal.json)}`);

  const ms1 = await rest(menteeToken, '/rest/v1/goal_milestones', { method: 'POST', body: JSON.stringify({ goal_id: goalId, title: 'Finish first tutorial', is_completed: false }), headers: { Prefer: 'return=representation' } });
  const ms2 = await rest(menteeToken, '/rest/v1/goal_milestones', { method: 'POST', body: JSON.stringify({ goal_id: goalId, title: 'Build a small app', is_completed: false }), headers: { Prefer: 'return=representation' } });
  const msId = ms1.json?.[0]?.id;
  ms1.status === 201 && ms2.status === 201 ? ok('two milestones created') : bad('milestones', `${ms1.status}/${ms2.status}`);

  const check = await rest(menteeToken, `/rest/v1/goal_milestones?id=eq.${msId}`, { method: 'PATCH', body: JSON.stringify({ is_completed: true, completed_at: new Date().toISOString() }) });
  check.status === 200 ? ok('milestone checked off') : bad('milestone check', `${check.status} ${JSON.stringify(check.json)}`);

  const goalProg = await rest(menteeToken, `/rest/v1/goals?select=id,title,status,milestones:goal_milestones(id,is_completed)&id=eq.${goalId}`);
  const g = goalProg.json?.[0];
  const done = g?.milestones?.filter(x => x.is_completed).length ?? 0;
  goalProg.status === 200 && g?.milestones?.length === 2 && done === 1 ? ok('goal progress = 1/2 completed') : bad('goal progress', JSON.stringify(g));

  console.log('\n=== 11. RLS: mentor cannot read mentee goals ===');
  const mentorGoalRead = await rest(mentorToken, `/rest/v1/goals?select=id&id=eq.${goalId}`);
  mentorGoalRead.status === 200 && mentorGoalRead.json?.length === 0 ? ok('mentor sees NO mentee goals (RLS works)') : bad('mentor goal read', `${mentorGoalRead.status} ${JSON.stringify(mentorGoalRead.json)}`);

  console.log('\n========================');
  console.log(`RESULT: ${pass} passed, ${fail} failed`);
  console.log('Mentor:', MENTOR_EMAIL, '| Mentee:', MENTEE_EMAIL);
  console.log('Test rows left in DB (conversation, messages, goals).');
  process.exit(fail > 0 ? 1 : 0);
})().catch(e => { console.error('SCRIPT ERROR:', e); process.exit(1); });
