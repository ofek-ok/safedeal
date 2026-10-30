import { NextResponse } from 'next/server';
import { staffStore, UPLOAD_DIR } from '@/lib/staff-store';
import fs from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const documentType = (formData.get('documentType') as string) || 'אחר';
    const source = (formData.get('source') as string) || 'צוות SafeDeal';

    if (!file) {
      return NextResponse.json({ error: 'לא נבחר קובץ' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const ext = path.extname(file.name) || '.pdf';
    const uniqueFilename = `${randomUUID()}${ext}`;
    const filePath = path.join(UPLOAD_DIR, uniqueFilename);

    await fs.writeFile(filePath, buffer);

    const doc = staffStore.addDocument(id, {
      filename: uniqueFilename,
      originalName: file.name,
      documentType,
      source,
      size: file.size,
      filePath,
    });

    if (!doc) {
      return NextResponse.json({ error: 'תיק לא נמצא' }, { status: 404 });
    }

    return NextResponse.json({ success: true, document: doc });
  } catch (error) {
    console.error('Error uploading staff document:', error);
    return NextResponse.json(
      { error: 'שגיאה בהעלאת מסמך' },
      { status: 500 }
    );
  }
}
