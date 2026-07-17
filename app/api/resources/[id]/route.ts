import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const { data: resource, error } = await supabase
      .from('resources')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !resource) return NextResponse.json({ error: 'Resource not found' }, { status: 404 });

    let owner = null;
    if (resource.owner_id) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('name, avatar_url')
        .eq('id', resource.owner_id)
        .maybeSingle();
      owner = profile;
    }

    return NextResponse.json({ resource: { ...resource, owner } });
  } catch (err) {
    console.error('GET /api/resources/[id] error:', err);
    return NextResponse.json({ error: 'Failed to fetch resource' }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const allowed = [
      'title', 'subject', 'grade_band', 'resource_type',
      'standards', 'materials', 'learning_targets', 'directions',
      'photos', 'attachments', 'status',
    ];
    const update: Record<string, unknown> = {};
    for (const key of allowed) {
      if (key in body) update[key] = body[key];
    }
    update.updated_at = new Date().toISOString();

    const { data: resource, error } = await supabase
      .from('resources')
      .update(update)
      .eq('id', id)
      .eq('owner_id', user.id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ resource });
  } catch (err) {
    console.error('PATCH /api/resources/[id] error:', err);
    return NextResponse.json({ error: 'Failed to update resource' }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { error } = await supabase.from('resources').delete().eq('id', id).eq('owner_id', user.id);
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('DELETE /api/resources/[id] error:', err);
    return NextResponse.json({ error: 'Failed to delete resource' }, { status: 500 });
  }
}
