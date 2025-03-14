// Script to set up the Supabase database tables and buckets
const { setupSupabaseTables } = require('../utils/setupSupabaseTables');
const { createExecuteSqlFunction, insertSampleData, createStorageBuckets } = require('../utils/setupSupabaseTablesExtended');

async function main() {
  try {
    console.log('Starting database setup...');

    // First, create the execute_sql function
    await createExecuteSqlFunction();

    // Then set up the tables
    await setupSupabaseTables();

    // Create storage buckets and policies
    await createStorageBuckets();

    // Finally, insert sample data
    await insertSampleData();

    console.log('Database setup completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error during database setup:', error);
    process.exit(1);
  }
}

main(); 