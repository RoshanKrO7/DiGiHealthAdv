// Script to set up the Supabase database tables and buckets
const { setupSupabaseTables } = require('../utils/setupSupabaseTables');
const { createExecuteSqlFunction, insertSampleData, createStorageBuckets } = require('../utils/setupSupabaseTablesExtended');

// Create healthrecords table
const createHealthRecordsTable = `
CREATE TABLE IF NOT EXISTS healthrecords (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  document_url TEXT NOT NULL,
  document_name TEXT NOT NULL,
  document_type TEXT NOT NULL,
  ai_summary TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE healthrecords ENABLE ROW LEVEL SECURITY;

-- Policy for users to view their own records
CREATE POLICY "Users can view their own health records"
  ON healthrecords FOR SELECT
  USING (auth.uid() = user_id);

-- Policy for users to insert their own records
CREATE POLICY "Users can insert their own health records"
  ON healthrecords FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy for users to update their own records
CREATE POLICY "Users can update their own health records"
  ON healthrecords FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy for users to delete their own records
CREATE POLICY "Users can delete their own health records"
  ON healthrecords FOR DELETE
  USING (auth.uid() = user_id);
`;

// Create storage bucket for health reports
const createHealthReportsBucket = `
-- Create the health-reports bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('health-reports', 'health-reports', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies
CREATE POLICY "Users can upload their own health reports"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'health-reports' AND
    auth.uid() = (storage.foldername(name))[1]::uuid
  );

CREATE POLICY "Users can view their own health reports"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'health-reports' AND
    auth.uid() = (storage.foldername(name))[1]::uuid
  );

CREATE POLICY "Users can update their own health reports"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'health-reports' AND
    auth.uid() = (storage.foldername(name))[1]::uuid
  );

CREATE POLICY "Users can delete their own health reports"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'health-reports' AND
    auth.uid() = (storage.foldername(name))[1]::uuid
  );
`;

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

    // Create healthrecords table
    await supabase.rpc('exec_sql', { sql: createHealthRecordsTable });
    console.log('Health records table created successfully');

    // Create health-reports bucket and policies
    await supabase.rpc('exec_sql', { sql: createHealthReportsBucket });
    console.log('Health reports bucket and policies created successfully');

    console.log('Database setup completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error during database setup:', error);
    process.exit(1);
  }
}

main(); 