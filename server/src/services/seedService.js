import { Lead } from '../models/Lead.js';
import { User } from '../models/User.js';

export const DEMO_USERS = [
  { name: 'Avery Admin', email: 'admin@demo-crm.example', role: 'admin' },
  { name: 'Sam Sales', email: 'sales@demo-crm.example', role: 'sales' },
  { name: 'Riley Reyes', email: 'riley@demo-crm.example', role: 'sales' },
];

// All names, companies, emails and phone numbers are fictional.
const LEADS = [
  ['Maya Thornton', 'Northwind Analytics', 'website', 'new', 'high', 18000],
  ['Jonah Pierce', 'Bluepeak Logistics', 'referral', 'contacted', 'medium', 9500],
  ['Priya Raman', 'Lumen Health Labs', 'linkedin', 'qualified', 'high', 42000],
  ['Carlos Mendes', 'Orchard & Vine Co.', 'website', 'won', 'medium', 12500],
  ['Hannah Okafor', 'Brightline Studios', 'other', 'lost', 'low', 3000],
  ['Ethan Caldwell', 'Ironbridge Manufacturing', 'referral', 'qualified', 'high', 65000],
  ['Sofia Lindqvist', 'Nordic Pixel', 'linkedin', 'new', 'medium', 7000],
  ['Marcus Bell', 'Summit Ridge Realty', 'website', 'contacted', 'low', 4500],
  ['Aiko Tanaka', 'Kumo Cloudworks', 'linkedin', 'won', 'high', 38000],
  ['Liam Gallagher', 'Greenfield Organics', 'referral', 'new', 'medium', 8800],
  ['Zara Haddad', 'Atlas Freight Partners', 'website', 'qualified', 'medium', 21000],
  ['Noah Fischer', 'Copperleaf Finance', 'other', 'contacted', 'high', 27500],
  ['Isabel Cruz', 'Harborview Dental', 'website', 'won', 'low', 5200],
  ['Oliver Grant', 'Quartz Security', 'linkedin', 'lost', 'medium', 14000],
  ['Amara Nwosu', 'Sunline Solar', 'referral', 'qualified', 'high', 56000],
  ['Daniel Kim', 'Pinecrest Academy', 'website', 'new', 'low', 2500],
  ['Grace Whitfield', 'Velvet Bean Coffee', 'other', 'contacted', 'medium', 6400],
  ['Mateo Rossi', 'Alpine Gear Outfitters', 'website', 'qualified', 'medium', 17500],
  ['Chloe Martin', 'Silverline Media', 'linkedin', 'won', 'high', 31000],
  ['Arjun Patel', 'Cobalt Robotics', 'referral', 'new', 'high', 48000],
  ['Emily Novak', 'Riverstone Legal', 'website', 'contacted', 'medium', 11000],
  ['Kwame Mensah', 'Baobab Ventures', 'linkedin', 'qualified', 'low', 9000],
  ['Lucy Harper', 'Willow Lane Interiors', 'other', 'lost', 'low', 3800],
  ['Felix Wagner', 'Hexa Data Systems', 'website', 'won', 'medium', 23000],
  ['Nina Petrova', 'Polar Star Travel', 'referral', 'new', 'medium', 7600],
  ['Samuel Osei', 'Granite Peak Construction', 'website', 'contacted', 'high', 52000],
  ['Olivia Brooks', 'Meadowbrook Farms', 'linkedin', 'qualified', 'medium', 13500],
  ['Hugo Laurent', 'Maison Lumière', 'other', 'new', 'low', 4200],
  ['Yara Costa', 'Tidewater Marine', 'website', 'won', 'high', 44000],
  ['Ben Archer', 'Redwood Fitness', 'referral', 'lost', 'medium', 6000],
  ['Leah Sato', 'Origami Learning', 'linkedin', 'contacted', 'low', 5000],
  ['Victor Hale', 'Keystone Insurance Group', 'website', 'qualified', 'high', 61000],
];

const NOTES = [
  'Requested a product demo next week.',
  'Budget approved for Q3; waiting on procurement.',
  'Met at the regional trade show.',
  'Interested in the annual plan with onboarding.',
  '',
];

function slug(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '');
}

export function buildDemoLeads(users) {
  const [admin, ...sales] = users;
  const owners = [admin, ...sales, ...sales];
  const day = 24 * 60 * 60 * 1000;
  return LEADS.map(([name, company, source, status, priority, estimatedValue], i) => {
    const owner = owners[i % owners.length];
    const [first, last] = name.split(' ');
    const createdAt = new Date(Date.now() - (LEADS.length - i) * 1.7 * day);
    return {
      name,
      company,
      email: `${slug(first)}.${slug(last)}@${slug(company).slice(0, 14)}.example`,
      phone: `+1 555-01${String(i).padStart(2, '0')}`,
      source,
      status,
      priority,
      estimatedValue,
      notes: NOTES[i % NOTES.length],
      assignedTo: owner._id,
      createdBy: owner.role === 'admin' ? owner._id : i % 2 ? owner._id : admin._id,
      createdAt,
      updatedAt: createdAt,
    };
  });
}

export async function seedDemoData({ password }) {
  await Promise.all([User.deleteMany({}), Lead.deleteMany({})]);
  const passwordHash = await User.hashPassword(password);
  const users = await User.insertMany(DEMO_USERS.map((u) => ({ ...u, passwordHash })));
  const leads = await Lead.insertMany(buildDemoLeads(users), { timestamps: false });
  return { users, leads };
}
