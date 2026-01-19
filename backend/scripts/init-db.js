import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { Pool } = pg;

async function initializeDatabase() {
  console.log('🚀 Initializing BRD Database...\n');

  // First connect without database to create it if needed
  const adminPool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: 'postgres', // Connect to default postgres database
  });

  try {
    // Check if database exists
    const dbName = process.env.DB_NAME || 'brd_database';
    const checkResult = await adminPool.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      [dbName]
    );

    if (checkResult.rows.length === 0) {
      console.log(`📦 Creating database "${dbName}"...`);
      await adminPool.query(`CREATE DATABASE ${dbName}`);
      console.log(`✅ Database "${dbName}" created!\n`);
    } else {
      console.log(`✅ Database "${dbName}" already exists.\n`);
    }
  } catch (error) {
    if (error.code === '42P04') {
      console.log('✅ Database already exists.\n');
    } else {
      console.error('❌ Error checking/creating database:', error.message);
    }
  } finally {
    await adminPool.end();
  }

  // Now connect to the actual database and run schema
  const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'brd_database',
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  });

  try {
    // Read and execute schema
    const schemaPath = path.join(__dirname, '..', 'db', 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf-8');

    console.log('📋 Running schema...');
    await pool.query(schema);
    console.log('✅ Schema applied successfully!\n');

    // Verify tables were created
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);

    console.log('📊 Tables created:');
    tablesResult.rows.forEach(row => {
      console.log(`   • ${row.table_name}`);
    });

    // Count users
    const usersCount = await pool.query('SELECT COUNT(*) FROM users');
    console.log(`\n👥 Users in database: ${usersCount.rows[0].count}`);

    console.log('\n✅ Database initialization complete!');
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('You can now start the server with: npm start');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error) {
    console.error('❌ Error applying schema:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

initializeDatabase();
