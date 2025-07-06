import { Client } from 'pg';
import fs from 'fs';

async function runMigration() {
    const client = new Client({
        connectionString: 'postgresql://postgres.agylmvagkljnltdxvsdk:Unsc117!@aws-0-us-west-1.pooler.supabase.com:6543/postgres'
    });

    try {
        await client.connect();
        console.log('✅ Connected to Supabase database');

        // Read and execute the INSERT policies fix
        try {
            const insertPoliciesSQL = fs.readFileSync('add-insert-policies.sql', 'utf8');
            console.log('📝 Executing INSERT policies fix...');
            await client.query(insertPoliciesSQL);
            console.log('✅ INSERT policies added successfully');
        } catch (error) {
            console.log('⚠️ INSERT policies error (might already exist):', error.message);
        }

        // Read and execute the deletion functions SQL
        try {
            const sql = fs.readFileSync('create-deletion-functions.sql', 'utf8');
            console.log('📝 Executing deletion functions SQL...');
            await client.query(sql);
            console.log('✅ Deletion functions created successfully');
        } catch (error) {
            console.log('⚠️ Deletion functions error (might already exist):', error.message);
        }

        // Also run the RLS migration if it hasn't been run
        try {
            const rlsSQL = fs.readFileSync('fix-supabase-rls.sql', 'utf8');
            console.log('📝 Executing RLS migration...');
            await client.query(rlsSQL);
            console.log('✅ RLS migration completed successfully');
        } catch (rlsError) {
            console.log('⚠️ RLS migration error (might already be applied):', rlsError.message);
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await client.end();
    }
}

runMigration();
