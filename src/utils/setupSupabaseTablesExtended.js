const { supabase } = require('./supabaseClient');

// Initialize the Supabase client
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase credentials. Please check your .env file.');
}

/**
 * Create the execute_sql function in Supabase
 */
const createExecuteSqlFunction = async () => {
  try {
    const createFunctionSQL = `
      CREATE OR REPLACE FUNCTION execute_sql(sql text)
      RETURNS void AS $$
      BEGIN
        EXECUTE sql;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `;

    const { error } = await supabase.rpc('execute_sql', { sql: createFunctionSQL });
    if (error) {
      console.warn('Warning: Could not create execute_sql function. It might already exist.');
    }
  } catch (error) {
    console.warn('Warning: Error creating execute_sql function:', error.message);
  }
};

/**
 * Insert sample data into the diseases table
 */
const insertSampleData = async () => {
  try {
    console.log('Inserting sample data...');

    const diseases = [
      { name: 'Hypertension', category: 'Cardiovascular', description: 'High blood pressure condition' },
      { name: 'Diabetes', category: 'Endocrine', description: 'Blood sugar regulation disorder' },
      { name: 'Asthma', category: 'Respiratory', description: 'Chronic respiratory condition' },
      { name: 'Arthritis', category: 'Musculoskeletal', description: 'Joint inflammation condition' },
      { name: 'Depression', category: 'Mental Health', description: 'Mood disorder' },
      { name: 'Anxiety', category: 'Mental Health', description: 'Anxiety disorder' },
      { name: 'Migraine', category: 'Neurological', description: 'Severe headache condition' },
      { name: 'Allergies', category: 'Immunological', description: 'Immune system response' },
      { name: 'Hypothyroidism', category: 'Endocrine', description: 'Underactive thyroid condition' },
      { name: 'Hyperthyroidism', category: 'Endocrine', description: 'Overactive thyroid condition' }
    ];

    const { error } = await supabase.from('diseases').upsert(diseases);
    if (error) throw error;

    console.log('Sample data inserted successfully');
  } catch (error) {
    console.error('Error inserting sample data:', error);
    throw error;
  }
};

/**
 * Create storage buckets
 */
const createStorageBuckets = async () => {
  try {
    console.log('Creating storage buckets...');

    // First, enable storage
    const enableStorageSQL = `
      ALTER DATABASE postgres SET "app.settings.storage.enabled" TO 'true';
    `;
    await supabase.rpc('execute_sql', { sql: enableStorageSQL });

    // Create buckets
    const buckets = [
      'profile-pictures',
      'medical-reports',
      'health-reports',
      'chat-attachments',
      'support-attachments'
    ];

    for (const bucket of buckets) {
      try {
        const { error } = await supabase.storage.createBucket(bucket, { public: true });
        if (error && !error.message.includes('already exists')) {
          console.warn(`Warning creating bucket ${bucket}:`, error.message);
        }
      } catch (error) {
        console.warn(`Error creating bucket ${bucket}:`, error.message);
      }
    }

    // Create storage policies
    const createPoliciesSQL = `
      DO $$ 
      BEGIN
        CREATE POLICY "Allow public access to profile pictures"
        ON storage.objects FOR ALL
        USING (bucket_id = 'profile-pictures');
        
        CREATE POLICY "Allow public access to medical reports"
        ON storage.objects FOR ALL
        USING (bucket_id = 'medical-reports');
        
        CREATE POLICY "Allow public access to health reports"
        ON storage.objects FOR ALL
        USING (bucket_id = 'health-reports');
        
        CREATE POLICY "Allow public access to chat attachments"
        ON storage.objects FOR ALL
        USING (bucket_id = 'chat-attachments');
        
        CREATE POLICY "Allow public access to support attachments"
        ON storage.objects FOR ALL
        USING (bucket_id = 'support-attachments');
      EXCEPTION
        WHEN others THEN
          NULL;
      END $$;
    `;

    await supabase.rpc('execute_sql', { sql: createPoliciesSQL });
    console.log('Storage buckets and policies created successfully');
  } catch (error) {
    console.warn('Warning: Error setting up storage:', error.message);
  }
};

module.exports = {
  createExecuteSqlFunction,
  insertSampleData,
  createStorageBuckets
}; 