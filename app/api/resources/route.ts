import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const {
      title, subject, grade_band, resource_type,
      standards, materials, learning_targets, directions,
      photos, attachments, status,
    } = body;

    if (!title?.trim()) return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    if (!subject) return NextResponse.json({ error: 'Subject is required' }, { status: 400 });
    if (!grade_band) return NextResponse.json({ error: 'Grade level is required' }, { status: 400 });
    if (!resource_type) return NextResponse.json({ error: 'Resource type is required' }, { status: 400 });

    const { data: resource, error } = await supabase
      .from('resources')
      .insert({
        owner_id: user.id,
        title: title.trim(),
        subject,
        grade_band,
        resource_type,
        standards: standards ?? [],
        materials: materials ?? [],
        learning_targets: learning_targets ?? [],
        directions: directions ?? [],
        photos: photos ?? [],
        attachments: attachments ?? [],
        status: status === 'published' ? 'published' : 'draft',
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ resource });
  } catch (err) {
    console.error('POST /api/resources error:', err);
    return NextResponse.json({ error: 'Failed to save resource' }, { status: 500 });
  }
}
