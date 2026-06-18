import postgres from 'postgres';

const connectionString = "postgresql://postgres:SgnMcKAtbVFToFNw@db.vdixgjdjqgzyauxtpbid.supabase.co:5432/postgres";
const client = postgres(connectionString, { prepare: false, ssl: 'require' });

async function main() {
  try {
    await client`
      CREATE TABLE IF NOT EXISTS in_app_notifications (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        agency_id uuid NOT NULL,
        space_id uuid,
        recipient_id uuid NOT NULL,
        actor_id uuid,
        type text NOT NULL,
        title text NOT NULL,
        content text,
        link text,
        is_read boolean DEFAULT false,
        created_at timestamp with time zone DEFAULT now()
      )
    `;
    console.log("Table in_app_notifications created successfully!");
  } catch (err) {
    console.error("Failed to create table:", err);
  } finally {
    process.exit();
  }
}

main();

main();
