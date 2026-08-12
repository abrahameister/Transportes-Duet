import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import pkg from 'pg';
const { Client } = pkg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runTests() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('ERROR: DATABASE_URL environment variable is required.');
    process.exit(1);
  }

  console.log('Connecting to database...');
  const client = new Client({ connectionString });
  
  try {
    await client.connect();
    console.log('Connected successfully. Looking for tests...');

    const files = await fs.readdir(__dirname);
    const testFiles = files.filter(f => f.endsWith('.test.sql')).sort();

    if (testFiles.length === 0) {
      console.log('No test files found (*.test.sql).');
      process.exit(0);
    }

    let allPassed = true;

    for (const file of testFiles) {
      console.log(`\n=== Running ${file} ===`);
      const filePath = path.join(__dirname, file);
      const sql = await fs.readFile(filePath, 'utf8');

      try {
        // Ejecutamos como Multi-query
        const result = await client.query(sql);
        
        // Analizamos los resultados que devuelve pgTAP en la llamada a finish() u otros selects
        let outputFound = false;
        if (Array.isArray(result)) {
          for (const res of result) {
            if (res.rows && res.rows.length > 0) {
              res.rows.forEach(row => {
                const values = Object.values(row);
                if (values.length === 1 && typeof values[0] === 'string' && (values[0].startsWith('ok') || values[0].startsWith('not ok') || values[0].startsWith('#'))) {
                  console.log(values[0]);
                  outputFound = true;
                  if (values[0].startsWith('not ok')) {
                    allPassed = false;
                  }
                }
              });
            }
          }
        }
        
        if (!outputFound) {
          console.log('Test executed (No raw TAP output detected, assuming PASS if no SQL errors).');
        }

      } catch (err) {
        console.error(`ERROR running ${file}:`, err.message);
        allPassed = false;
      }
    }

    if (allPassed) {
      console.log('\n✅ All database tests passed or executed without SQL errors.');
      process.exit(0);
    } else {
      console.error('\n❌ Some database tests failed.');
      process.exit(1);
    }

  } catch (err) {
    console.error('Database connection or execution failed:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runTests();
