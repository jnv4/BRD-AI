import pg from 'pg';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const DEFAULT_USERS = [
  { name: 'Shreya Tivrekar', email: 'pm@brd.com', password: 'pm123', role: 'Project Manager' },
  { name: 'Admin User', email: 'admin@brd.com', password: 'admin123', role: 'Admin' },
  { name: 'Business Owner', email: 'business@brd.com', password: 'business123', role: 'Business' },
  { name: 'CTO Executive', email: 'cto@brd.com', password: 'cto123', role: 'CTO' },
  { name: 'Engineering Lead', email: 'lead@brd.com', password: 'lead123', role: 'Team Lead' },
];

async function resetUsers() {
  console.log('🔄 Resetting users with correct password hashes...\n');

  const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'brd_database',
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  });

  try {
    // Delete existing users
    await pool.query('DELETE FROM users');
    console.log('✅ Cleared existing users');

    // Insert users with properly hashed passwords
    for (const user of DEFAULT_USERS) {
      const hashedPassword = await bcrypt.hash(user.password, 10);
      await pool.query(
        'INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4)',
        [user.name, user.email, hashedPassword, user.role]
      );
      console.log(`✅ Created user: ${user.email} (password: ${user.password})`);
    }

    console.log('\n✅ All users reset successfully!');
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('You can now login with these credentials:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    DEFAULT_USERS.forEach(u => {
      console.log(`  ${u.role.padEnd(16)} → ${u.email} / ${u.password}`);
    });
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

resetUsers();
