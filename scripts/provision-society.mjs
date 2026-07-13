import { createClient } from '@supabase/supabase-js';
import { existsSync, readFileSync } from 'node:fs';
import { createInterface } from 'node:readline/promises';
import { resolve } from 'node:path';
import { stdin as input, stdout as output } from 'node:process';

function loadEnvFile(path) {
  if (!existsSync(path)) return;

  const lines = readFileSync(path, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const match = trimmed.match(/^([\w.-]+)\s*=\s*(.*)$/);
    if (!match) continue;

    const [, key, rawValue] = match;
    if (process.env[key] !== undefined) continue;

    const value = rawValue.trim().replace(/^(['"])(.*)\1$/, '$2');
    process.env[key] = value;
  }
}

loadEnvFile(resolve(process.cwd(), '.env'));
loadEnvFile(resolve(process.cwd(), '.env.local'));

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

const rl = createInterface({ input, output });

const must = (label, result) => {
  if (result.error) {
    throw new Error(`${label}: ${result.error.message}`);
  }
  return result.data;
};

async function ask(label, { required = true, defaultValue = '' } = {}) {
  const hint = defaultValue ? ` [${defaultValue}]` : '';
  while (true) {
    const raw = (await rl.question(`${label}${hint}: `)).trim();
    const value = raw || defaultValue;

    if (!value && required) {
      console.log('  This field is required.');
      continue;
    }

    return value || null;
  }
}

async function readHidden(prompt) {
  if (!input.isTTY) {
    throw new Error('Password input requires an interactive terminal.');
  }

  output.write(prompt);

  input.setRawMode(true);
  input.resume();
  input.setEncoding('utf8');

  let password = '';

  return new Promise((resolve, reject) => {
    const cleanup = () => {
      input.setRawMode(false);
      input.pause();
      input.removeListener('data', onData);
    };

    const onData = (chunk) => {
      const chars = chunk.toString();

      for (const ch of chars) {
        if (ch === '\u0003') {
          cleanup();
          output.write('\n');
          reject(new Error('Cancelled'));
          return;
        }

        if (ch === '\r' || ch === '\n') {
          cleanup();
          output.write('\n');
          resolve(password);
          return;
        }

        if (ch === '\u007f' || ch === '\b') {
          if (password.length > 0) {
            password = password.slice(0, -1);
            output.write('\b \b');
          }
          continue;
        }

        if (ch < ' ' && ch !== '\t') continue;

        password += ch;
        output.write('*');
      }
    };

    input.on('data', onData);
  });
}

async function askPassword(label) {
  while (true) {
    rl.pause();
    let value;
    try {
      value = (await readHidden(`${label}: `)).trim();
    } finally {
      rl.resume();
    }

    if (value.length < 8) {
      console.log('  Password must be at least 8 characters.');
      continue;
    }

    return value;
  }
}

async function askYesNo(label, defaultYes = true) {
  const hint = defaultYes ? '[Y/n]' : '[y/N]';
  while (true) {
    const raw = (await rl.question(`${label} ${hint}: `)).trim().toLowerCase();
    if (!raw) return defaultYes;
    if (raw === 'y' || raw === 'yes') return true;
    if (raw === 'n' || raw === 'no') return false;
    console.log('  Please answer y or n.');
  }
}

function normalizeCode(code) {
  return code.trim().toUpperCase();
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function findAuthUserByEmail(email) {
  let page = 1;

  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw new Error(`listUsers: ${error.message}`);

    const match = data.users.find((user) => user.email?.toLowerCase() === email.toLowerCase());
    if (match) return match;

    if (data.users.length < 1000) return null;
    page += 1;
  }
}

async function collectInputs() {
  console.log('\nPortl — provision a new society\n');

  const name = await ask('Society name');
  const code = normalizeCode(await ask('Society code (residents use this to join)'));
  const address = await ask('Address', { required: false });
  const city = await ask('City', { required: false });

  console.log('\nSociety admin account\n');

  const adminName = await ask('Admin full name');
  const adminEmail = (await ask('Admin email')).toLowerCase();

  if (!isValidEmail(adminEmail)) {
    throw new Error('Invalid admin email address.');
  }

  const adminPassword = await askPassword('Admin password (min 8 chars)');

  return {
    society: { name, code, address, city },
    admin: { full_name: adminName, email: adminEmail, password: adminPassword },
  };
}

async function validateInputs({ society, admin: adminUser }) {
  const existingSociety = must(
    'lookup society code',
    await admin.from('societies').select('id, name, code').eq('code', society.code).maybeSingle(),
  );

  if (existingSociety) {
    throw new Error(`Society code "${society.code}" is already used by "${existingSociety.name}".`);
  }

  const existingAuthUser = await findAuthUserByEmail(adminUser.email);
  if (existingAuthUser) {
    throw new Error(`Auth user already exists for ${adminUser.email}. Use a different email.`);
  }
}

async function provision({ society, admin: adminUser }) {
  const createdSociety = must(
    'insert society',
    await admin
      .from('societies')
      .insert({
        name: society.name,
        code: society.code,
        address: society.address,
        city: society.city,
      })
      .select('id, name, code')
      .single(),
  );

  const createdAuth = await admin.auth.admin.createUser({
    email: adminUser.email,
    password: adminUser.password,
    email_confirm: true,
    user_metadata: {
      full_name: adminUser.full_name,
    },
  });

  if (createdAuth.error) {
    await admin.from('societies').delete().eq('id', createdSociety.id);
    throw new Error(`createUser: ${createdAuth.error.message}`);
  }

  const authUser = createdAuth.data.user;

  const profileResult = await admin.from('profiles').upsert(
    {
      id: authUser.id,
      society_id: createdSociety.id,
      full_name: adminUser.full_name,
      role: 'admin',
      status: 'active',
    },
    { onConflict: 'id' },
  );

  if (profileResult.error) {
    await admin.auth.admin.deleteUser(authUser.id);
    await admin.from('societies').delete().eq('id', createdSociety.id);
    throw new Error(`upsert profile: ${profileResult.error.message}`);
  }

  return {
    society: createdSociety,
    admin: {
      id: authUser.id,
      email: adminUser.email,
      full_name: adminUser.full_name,
    },
  };
}

function printSummary(result) {
  console.log('\nDone. Society provisioned.\n');
  console.log('Society');
  console.log(`  ID:   ${result.society.id}`);
  console.log(`  Name: ${result.society.name}`);
  console.log(`  Code: ${result.society.code}`);
  console.log('\nAdmin');
  console.log(`  ID:    ${result.admin.id}`);
  console.log(`  Name:  ${result.admin.full_name}`);
  console.log(`  Email: ${result.admin.email}`);
  console.log('\nNext steps');
  console.log('  1. Sign in to the app as the admin.');
  console.log('  2. Add towers and flats under Society in the admin app.');
  console.log('  3. Share the society code with residents so they can join.');
}

try {
  const inputs = await collectInputs();

  console.log('\nReview\n');
  console.log(`  Society: ${inputs.society.name} (${inputs.society.code})`);
  if (inputs.society.address) console.log(`  Address: ${inputs.society.address}`);
  if (inputs.society.city) console.log(`  City:    ${inputs.society.city}`);
  console.log(`  Admin:   ${inputs.admin.full_name} <${inputs.admin.email}>`);

  const confirmed = await askYesNo('\nCreate this society and admin?', true);
  if (!confirmed) {
    console.log('Cancelled.');
    process.exit(0);
  }

  await validateInputs(inputs);
  const result = await provision(inputs);
  printSummary(result);
} catch (error) {
  console.error(`\nFailed: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
} finally {
  rl.close();
}
