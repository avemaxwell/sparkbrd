import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

const CATEGORIES = ['doodles', 'mid century', 'arrows', 'lines', 'shapes', 'flowers + leaves'];

export async function GET() {
  try {
    const supabase = createAdminClient();

    // List the bucket root first so we get the exact folder names as Supabase
    // stores them (handles any encoding differences for names with spaces).
    const { data: rootFolders, error: rootError } = await supabase.storage
      .from('stickers')
      .list('', { limit: 50 });

    if (rootError) {
      console.error('[stickers] root list error:', rootError);
    }

    // Build a lookup: our category name → exact Supabase folder name
    const folderMap: Record<string, string> = {};
    for (const cat of CATEGORIES) {
      const match = rootFolders?.find(
        f => f.name.toLowerCase() === cat.toLowerCase()
      );
      folderMap[cat] = match?.name ?? cat; // fall back to our string if not found
    }

    const result: Record<string, { name: string; url: string }[]> = {};

    await Promise.all(
      CATEGORIES.map(async (category) => {
        const folderName = folderMap[category];
        try {
          const { data, error } = await supabase.storage
            .from('stickers')
            .list(folderName, { limit: 200 });

          if (error) {
            console.error(`[stickers] list error for '${category}' (folder: '${folderName}'):`, error);
            result[category] = [];
            return;
          }

          const files = (data ?? []).filter(
            f => !f.name.startsWith('.') && f.name !== '.emptyFolderPlaceholder'
          );

          result[category] = files.map(f => {
            const { data: urlData } = supabase.storage
              .from('stickers')
              .getPublicUrl(`${folderName}/${f.name}`);
            return {
              name: f.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '),
              url: urlData.publicUrl,
            };
          });
        } catch (e) {
          console.error(`[stickers] exception for '${category}':`, e);
          result[category] = [];
        }
      })
    );

    return NextResponse.json({ categories: result });
  } catch (err) {
    console.error('GET /api/stickers error:', err);
    return NextResponse.json({ error: 'Failed to load stickers' }, { status: 500 });
  }
}
