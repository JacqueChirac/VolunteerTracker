import { neon } from '@neondatabase/serverless';
import { DATABASE_URL } from '$env/static/private';
const sql = neon(DATABASE_URL);
const users = await sql`SELECT * FROM users`;

export async function load() {
  const children = await sql`
    SELECT * FROM child_parent_links
  `;


  return {
    children
  };


  async function calcChild(childID: number){
    let parents = {};
    parents = await sql`SELECT * FROM child_parent_links WHERE child_id = {childID}`;
    console.log(parents);
  }
  
}
