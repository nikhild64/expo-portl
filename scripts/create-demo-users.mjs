import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error('Missing EXPO_PUBLIC_SUPABASE_URL in .env');
}

if (!serviceRoleKey) {
  throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY in .env');
}

const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const SOCIETY_ID = '11111111-1111-1111-1111-111111111111';
const DEMO_PASSWORD = 'Portl@123';

const users = [
  {
    email: 'resident@portl.demo',
    password: DEMO_PASSWORD,
    full_name: 'Rohan Sharma',
    role: 'resident',
    flat: 'A-402',
  },
  {
    email: 'guard@portl.demo',
    password: DEMO_PASSWORD,
    full_name: 'Vikram Singh',
    role: 'guard',
    flat: null,
  },
  {
    email: 'admin@portl.demo',
    password: DEMO_PASSWORD,
    full_name: 'Anita Kapoor',
    role: 'admin',
    flat: null,
  },
];

const must = (label, result) => {
  if (result.error) {
    throw new Error(`${label}: ${result.error.message}`);
  }

  return result.data;
};

const listAllUsers = async () => {
  const usersByEmail = new Map();
  let page = 1;

  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({
      page,
      perPage: 1000,
    });

    if (error) throw new Error(`listUsers: ${error.message}`);

    for (const user of data.users) {
      if (user.email) usersByEmail.set(user.email, user);
    }

    if (data.users.length < 1000) break;
    page += 1;
  }

  return usersByEmail;
};

const ensureDemoUsers = async () => {
  const existingUsers = await listAllUsers();
  const ids = {};

  for (const user of users) {
    let authUser = existingUsers.get(user.email);

    if (!authUser) {
      const created = await admin.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true,
        user_metadata: {
          full_name: user.full_name,
        },
      });

      if (created.error) {
        throw new Error(`createUser ${user.email}: ${created.error.message}`);
      }

      authUser = created.data.user;
    }

    ids[user.role] = authUser.id;

    must(
      `upsert profile ${user.email}`,
      await admin.from('profiles').upsert(
        {
          id: authUser.id,
          society_id: SOCIETY_ID,
          full_name: user.full_name,
          role: user.role,
          status: 'active',
        },
        { onConflict: 'id' },
      ),
    );

    if (user.flat) {
      const flat = must(
        `lookup flat ${user.flat}`,
        await admin
          .from('flats')
          .select('id')
          .eq('number', user.flat)
          .single(),
      );

      must(
        `upsert flat resident ${user.email}`,
        await admin.from('flat_residents').upsert(
          {
            flat_id: flat.id,
            profile_id: authUser.id,
            is_owner: true,
            is_head: true,
          },
          { onConflict: 'flat_id,profile_id' },
        ),
      );
    }

    console.log('ready', user.email);
  }

  return ids;
};

const seedCommunityContent = async (ids) => {
  const now = Date.now();

  must(
    'upsert notices',
    await admin.from('notices').upsert(
      [
        {
          id: '41111111-1111-1111-1111-111111111111',
          society_id: SOCIETY_ID,
          category: 'event',
          title: 'Diwali celebration - Sat 7 PM',
          body: 'Community lawn decoration and dinner. Please RSVP by Thursday.',
          pinned: true,
          created_by: ids.admin,
        },
        {
          id: '42222222-2222-2222-2222-222222222222',
          society_id: SOCIETY_ID,
          category: 'maintenance',
          title: 'Water tank cleaning',
          body: 'Saturday 10 AM to 12 PM. Please store water in advance.',
          pinned: false,
          created_by: ids.admin,
        },
        {
          id: '43333333-3333-3333-3333-333333333333',
          society_id: SOCIETY_ID,
          category: 'maintenance',
          title: 'Elevator B under repair',
          body: 'Technician visit scheduled. Thank you for your patience.',
          pinned: false,
          created_by: ids.admin,
        },
        {
          id: '44444444-4444-4444-4444-444444444444',
          society_id: SOCIETY_ID,
          category: 'general',
          title: 'New security guard - Vikram',
          body: 'Please join us in welcoming Vikram to our community.',
          pinned: false,
          created_by: ids.admin,
        },
        {
          id: '45555555-5555-5555-5555-555555555555',
          society_id: SOCIETY_ID,
          category: 'financial',
          title: 'Maintenance dues for this month',
          body: 'Kindly pay before the 10th to avoid late fees.',
          pinned: false,
          created_by: ids.admin,
        },
      ],
      { onConflict: 'id' },
    ),
  );

  must(
    'upsert polls',
    await admin.from('polls').upsert(
      [
        {
          id: '51111111-1111-1111-1111-111111111111',
          society_id: SOCIETY_ID,
          category: 'amenities',
          question: 'Should we install EV charging in the basement parking?',
          options: [
            { label: 'Yes, install now' },
            { label: 'Yes, but wait 6 months' },
            { label: 'No, not needed' },
          ],
          allow_multiple: false,
          anonymous: true,
          show_results: true,
          quorum: 50,
          starts_at: new Date(now - 60 * 60 * 1000).toISOString(),
          ends_at: new Date(now + 3 * 24 * 60 * 60 * 1000).toISOString(),
          created_by: ids.admin,
        },
        {
          id: '52222222-2222-2222-2222-222222222222',
          society_id: SOCIETY_ID,
          category: 'rules',
          question: 'Preferred quiet hours for renovation work?',
          options: [
            { label: '1 PM to 3 PM' },
            { label: '2 PM to 4 PM' },
            { label: 'No quiet window needed' },
          ],
          allow_multiple: false,
          anonymous: true,
          show_results: true,
          quorum: 30,
          starts_at: new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString(),
          ends_at: new Date(now - 24 * 60 * 60 * 1000).toISOString(),
          created_by: ids.admin,
        },
      ],
      { onConflict: 'id' },
    ),
  );

  const flat = must(
    'lookup resident flat A-402',
    await admin.from('flats').select('id').eq('number', 'A-402').single(),
  );

  must(
    'upsert complaints',
    await admin.from('complaints').upsert(
      [
        {
          id: '61111111-1111-1111-1111-111111111111',
          society_id: SOCIETY_ID,
          flat_id: flat.id,
          raised_by: ids.resident,
          assigned_to: ids.admin,
          category: 'plumbing',
          title: 'Water leak from ceiling',
          description: 'Water is dripping from the kitchen ceiling and getting worse.',
          priority: 'urgent',
          status: 'in_progress',
        },
        {
          id: '62222222-2222-2222-2222-222222222222',
          society_id: SOCIETY_ID,
          flat_id: flat.id,
          raised_by: ids.resident,
          assigned_to: ids.admin,
          category: 'electrical',
          title: 'Corridor light not working',
          description: 'The fifth-floor corridor light is flickering constantly.',
          priority: 'medium',
          status: 'assigned',
        },
        {
          id: '63333333-3333-3333-3333-333333333333',
          society_id: SOCIETY_ID,
          flat_id: flat.id,
          raised_by: ids.resident,
          category: 'housekeeping',
          title: 'Garbage not picked up',
          description: 'The garbage bin has been full since yesterday.',
          priority: 'low',
          status: 'new',
        },
      ],
      { onConflict: 'id' },
    ),
  );

  must(
    'upsert visitor samples',
    await admin.from('visitors').upsert(
      [
        {
          id: '71111111-1111-1111-1111-111111111111',
          society_id: SOCIETY_ID,
          flat_id: flat.id,
          visitor_name: 'Amit Verma',
          visitor_phone: '+919800000201',
          type: 'guest',
          purpose: 'Dinner with Rohan',
          status: 'pending',
          guard_id: ids.guard,
        },
        {
          id: '72222222-2222-2222-2222-222222222222',
          society_id: SOCIETY_ID,
          flat_id: flat.id,
          visitor_name: 'FreshBasket Delivery',
          visitor_phone: '+919800000202',
          type: 'delivery',
          purpose: 'Grocery delivery',
          status: 'approved',
          guard_id: ids.guard,
          decided_by: ids.resident,
          decided_at: new Date(now - 20 * 60 * 1000).toISOString(),
        },
      ],
      { onConflict: 'id' },
    ),
  );
};

const ids = await ensureDemoUsers();
await seedCommunityContent(ids);

console.log('seed complete');
