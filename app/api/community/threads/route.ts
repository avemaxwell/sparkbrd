import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const categorySlug = searchParams.get('category');

    let query = supabase
      .from('community_threads')
      .select('*, community_categories!inner(slug, name), community_replies(count)')
      .order('created_at', { ascending: false });

    if (categorySlug) {
      query = query.eq('community_categories.slug', categorySlug);
    }

    const { data: threads, error } = await query;
    if (error) throw error;

    const shaped = (threads ?? []).map((t: any) => ({
      id: t.id,
      title: t.title,
      body: t.body,
      actor_name: t.actor_name,
      actor_avatar: t.actor_avatar,
      created_at: t.created_at,
      category: t.community_categories,
      reply_count: t.community_replies?.[0]?.count ?? 0,
    }));

    return NextResponse.json({ threads: shaped });
  } catch (err) {
    console.error('GET /api/community/threads error:', err);
    return NextResponse.json({ error: 'Failed to fetch threads' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { category_id, title, body } = await request.json();
    if (!category_id) return NextResponse.json({ error: 'category_id is required' }, { status: 400 });
    if (!title?.trim() || title.trim().length > 200) {
      return NextResponse.json({ error: 'Title is required and must be under 200 characters' }, { status: 400 });
    }
    if (!body?.trim() || body.trim().length > 5000) {
      return NextResponse.json({ error: 'Body is required and must be under 5000 characters' }, { status: 400 });
    }

    const { data: profile } = await supabase.from('profiles').select('name, avatar_url').eq('id', user.id).single();

    const { data: thread, error } = await supabase
      .from('community_threads')
      .insert({
        category_id,
        user_id: user.id,
        actor_name: profile?.name ?? null,
        actor_avatar: profile?.avatar_url ?? null,
        title: title.trim(),
        body: body.trim(),
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ thread });
  } catch (err) {
    console.error('POST /api/community/threads error:', err);
    return NextResponse.json({ error: 'Failed to create thread' }, { status: 500 });
  }
}
