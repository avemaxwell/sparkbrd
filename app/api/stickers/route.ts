import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

const CATEGORIES = ['doodles', 'mid century', 'arrows', 'lines', 'shapes', 'flowers + leaves'];

export async function GET() {
  try {
    const supabase = createAdminClient();
    const result: Record<string, { name: string; url: string }[]> = {};

    await Promise.all(
      CATEGORIES.map(async (category) => {
        try {
          // Try without sortBy first — Supabase can behave oddly with
          // folder names that contain spaces when sortBy is specified.
          const { data, error } = await supabase.storage
            .from('stickers')
            .list(category, { limit: 200 });

          if (error) {
            console.error(`[stickers] list error for '${category}':`, error);
            result[category] = [];
            return;
          }

          if (!data || data.length === 0) {
            result[category] = [];
            return;
          }

          const files = data.filter(
            f => !f.name.startsWith('.') && f.name !== '.emptyFolderPlaceholder'
          );

          result[category] = files.map(f => {
            // Build path and ensure spaces are properly encoded in the URL
            const path = `${category}/${f.name}`;
            const { data: urlData } = supabase.storage.from('stickers').getPublicUrl(path);
            // Encode any spaces that getPublicUrl might leave unencoded
            const publicUrl = urlData.publicUrl.replace(/ /g, '%20');
            return {
              name: f.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '),
              url: publicUrl,
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
