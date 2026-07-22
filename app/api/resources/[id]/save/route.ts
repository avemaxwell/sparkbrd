import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

type Params = { params: Promise<{ id: string }> };

// POST /api/resources/[id]/save — save a resource into one of the caller's
// collections. Represented as a tacks row (resource_id set) rather than a
// parallel data shape, so it reuses MosaicBoard/BoardCanvas rendering,
// download, and delete flows without any new UI on the board side.
export async function POST(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { board_id } = await request.json();
    if (!board_id) return NextResponse.json({ error: 'board_id is required' }, { status: 400 });

    const { data: resource, error: resourceErr } = await supabase
      .from('resources')
      .select('id, title, photos, status, owner_id')
      .eq('id', id)
      .single();

    if (resourceErr || !resource) return NextResponse.json({ error: 'Resource not found' }, { status: 404 });
    if (resource.status !== 'published' && resource.owner_id !== user.id) {
      return NextResponse.json({ error: 'Resource not found' }, { status: 404 });
    }

    const { data: board } = await supabase
      .from('boards')
      .select('id, owner_id')
      .eq('id', board_id)
      .eq('owner_id', user.id)
      .maybeSingle();
    if (!board) return NextResponse.json({ error: 'Collection not found' }, { status: 404 });

    const { data: tack, error: insertErr } = await supabase
      .from('tacks')
      .insert({
        board_id,
        user_id: user.id,
        added_by: user.id,
        resource_id: resource.id,
        content_url: resource.photos?.[0] ?? '/shapes/quatrefoil-ink.png',
        title: resource.title,
        source: `/resources/${resource.id}`,
        pin_color: '#1A1A1A',
        position_x: 0,
        position_y: 0,
        width: 300,
        height: 300,
        rotation: 0,
        z_index: 1,
      })
      .select('id')
      .single();

    if (insertErr) throw insertErr;

    return NextResponse.json({ success: true, tack_id: tack.id });
  } catch (err) {
    console.error('POST /api/resources/[id]/save error:', err);
    return NextResponse.json({ error: 'Failed to save resource' }, { status: 500 });
  }
}
