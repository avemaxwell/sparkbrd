import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import mammoth from 'mammoth';
import { PDFParse } from 'pdf-parse';

// POST /api/resources/extract-text — multipart/form-data, field "file".
// Deterministic text extraction (no AI) for the "Upload an existing lesson
// plan" flow — see components/resources/LessonPlanUpload.tsx. The teacher
// reviews/edits the result before anything publishes; this never writes to
// the database itself.
const MAX_SIZE_BYTES = 10 * 1024 * 1024;

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const formData = await request.formData();
    const file = formData.get('file');
    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }
    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json({ error: 'File is too large (10MB max)' }, { status: 400 });
    }

    const name = file.name.toLowerCase();
    const buffer = Buffer.from(await file.arrayBuffer());

    let text = '';
    if (name.endsWith('.docx')) {
      const result = await mammoth.extractRawText({ buffer });
      text = result.value;
    } else if (name.endsWith('.pdf')) {
      const parser = new PDFParse({ data: new Uint8Array(buffer) });
      const result = await parser.getText();
      text = result.text;
      await parser.destroy();
    } else {
      return NextResponse.json({ error: 'Only .docx and .pdf files are supported' }, { status: 400 });
    }

    text = text.trim();
    if (text.length < 20) {
      return NextResponse.json({
        error: "Couldn't find readable text in that file — it may be a scanned image rather than real text. Try a different export, or paste the text in manually.",
      }, { status: 422 });
    }

    return NextResponse.json({ text });
  } catch (err) {
    console.error('POST /api/resources/extract-text error:', err);
    return NextResponse.json({ error: "Couldn't read that file. Please try again or paste the text manually." }, { status: 500 });
  }
}
