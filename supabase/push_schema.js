const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

async function run() {
  console.log('🚀 Starting MariaDB Database Migration Pushing...');

  // 1. Load and parse .env.local file
  let dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    const envPath = path.join(__dirname, '../.env.local');
    if (fs.existsSync(envPath)) {
      console.log('🔍 Reading connection details from .env.local...');
      const envContent = fs.readFileSync(envPath, 'utf8');
      const match = envContent.match(/^DATABASE_URL=(.*)$/m);
      if (match && match[1]) {
        dbUrl = match[1].trim();
      }
    }
  }

  if (!dbUrl) {
    console.error('❌ Error: DATABASE_URL not found in environment or .env.local');
    process.exit(1);
  }

  console.log(`🔗 Target Connection String: ${dbUrl.replace(/:[^:@/]+@/, ':****@')}`);

  // 2. Parse connection URL
  // Format: mysql://user:password@host:port/database
  const urlRegex = /^mysql:\/\/([^:]+):([^@]+)@([^:/]+)(?::(\d+))?\/(.+)$/;
  const parsed = dbUrl.match(urlRegex);

  if (!parsed) {
    console.error('❌ Error: Invalid DATABASE_URL format. Expected: mysql://user:password@host:port/database');
    process.exit(1);
  }

  const [_, user, password, host, portStr, database] = parsed;
  const port = portStr ? parseInt(portStr, 10) : 3306;

  console.log(`📡 Connecting to MariaDB Host: ${host}:${port} as User: ${user}...`);

  let connection;
  try {
    // Connect to MariaDB instance without selecting the database (in case it does not exist)
    connection = await mysql.createConnection({
      host,
      port,
      user,
      password,
      multipleStatements: true // Allow multi-statement execution if needed
    });
    console.log('✅ Connected to MariaDB server successfully.');

    // 3. Create target database if it doesn't exist
    console.log(`⚙️  Ensuring database "${database}" exists...`);
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${database}\` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
    console.log(`✅ Database "${database}" is ready.`);

    // Switch to target database
    await connection.changeUser({ database });
    console.log(`📁 Switched context to database "${database}".`);

    // 4. Read schema SQL file
    const schemaPath = path.join(__dirname, 'mariadb_schema.sql');
    if (!fs.existsSync(schemaPath)) {
      console.error(`❌ Error: Schema file not found at ${schemaPath}`);
      process.exit(1);
    }
    
    console.log('📖 Reading "mariadb_schema.sql"...');
    const sqlContent = fs.readFileSync(schemaPath, 'utf8');

    // Clean SQL comments first, then split by semicolon
    const cleanLines = sqlContent.split('\n').map(line => {
      const idx = line.indexOf('--');
      return idx !== -1 ? line.substring(0, idx) : line;
    });
    const cleanedSql = cleanLines.join('\n').replace(/\/\*[\s\S]*?\*\//g, '');

    const queries = cleanedSql
      .split(';')
      .map(q => q.trim())
      .filter(q => q.length > 0);

    console.log(`⚡ Executing ${queries.length} schema statements...`);

    for (let i = 0; i < queries.length; i++) {
      const query = queries[i];
      const snippet = query.split('\n')[0].trim();
      console.log(`   [${i + 1}/${queries.length}] Executing: ${snippet.slice(0, 60)}${snippet.length > 60 ? '...' : ''}`);
      try {
        await connection.query(query);
      } catch (err) {
        console.error(`❌ Error executing statement #${i + 1}:`);
        console.error(query);
        throw err;
      }
    }

    console.log('🎉 Database migration completed successfully! All tables created.');

  } catch (error) {
    console.error('❌ Migration failed due to an error:');
    console.error(error.message);
    if (error.code) {
      console.error(`Error Code: ${error.code}`);
    }
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🚪 Connection closed.');
    }
  }
}

run();
