import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

// Folder names in the stickers bucket — add more here as the library grows
const CATEGORIES = ['doodles', 'arrows', 'lines', 'shapes', 'flowers + leaves'];

export async function GET() {
  try {
    const supabase = createAdminClient();

    const result: Record<string, { name: string; url: string }[]> = {};

    await Promise.all(
      CATEGORIES.map(async (category) => {
        const { data, error } = await supabase.storage.from('stickers').list(category, {
          limit: 200,
          sortBy: { column: 'name', order: 'asc' },
        });

        if (error || !data) { result[category] = []; return; }

        result[category] = data
          .filter(f => !f.name.startsWith('.') && f.name !== '.emptyFolderPlaceholder')
          .map(f => ({
            name: f.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '),
            url: supabase.storage.from('stickers').getPublicUrl(`${category}/${f.name}`).data.publicUrl,
          }));
      })
    );

    return NextResponse.json({ categories: result });
  } catch (err) {
    console.error('GET /api/stickers error:', err);
    return NextResponse.json({ error: 'Failed to load stickers' }, { status: 500 });
  }
}
