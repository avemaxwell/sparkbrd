import { NextResponse } from 'next/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';

// Issues a short-lived signed URL for a paid resource's attachment, after
// verifying the requester is the owner or has a recorded purchase. Free
// resources never hit this route — their attachments use plain public URLs
// from the `resource-attachments` bucket, unchanged.
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const path = searchParams.get('path');
    if (!path) return NextResponse.json({ error: 'Missing path' }, { status: 400 });

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: resource } = await supabase
      .from('resources')
      .select('id, owner_id, price_cents, attachments')
      .eq('id', id)
      .single();

    if (!resource) return NextResponse.json({ error: 'Resource not found' }, { status: 404 });

    // The path must actually belong to this resource's attachment list —
    // otherwise an authenticated user could sign a URL for any object path.
    const attachments = (resource.attachments ?? []) as { name: string; url: string }[];
    const belongsToResource = attachments.some((a) => a.url === path);
    if (!belongsToResource) return NextResponse.json({ error: 'File not found on this resource' }, { status: 404 });

    const isOwner = resource.owner_id === user.id;
    if (!isOwner) {
      const { data: purchase } = await supabase
        .from('purchases')
        .select('id')
        .eq('resource_id', id)
        .eq('buyer_id', user.id)
        .maybeSingle();
      if (!purchase) return NextResponse.json({ error: 'Purchase required' }, { status: 403 });
    }

    const serviceClient = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const { data: signed, error: signError } = await serviceClient.storage
      .from('resource-attachments-paid')
      .createSignedUrl(path, 60);

    if (signError || !signed) return NextResponse.json({ error: 'Could not generate download link' }, { status: 500 });

    return NextResponse.json({ url: signed.signedUrl });
  } catch (error: any) {
    console.error('Resource download error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
