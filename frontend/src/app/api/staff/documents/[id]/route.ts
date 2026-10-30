import { NextResponse } from 'next/server';
import { staffStore, UPLOAD_DIR } from '@/lib/staff-store';
import fs from 'fs/promises';
import path from 'path';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Find document across all cases
    let foundDoc: any = null;
    for (const c of staffStore.getCases()) {
      const d = c.documents.find((doc) => doc.id === id);
      if (d) {
        foundDoc = d;
        break;
      }
    }

    if (!foundDoc) {
      return NextResponse.json({ error: 'מסמך לא נמצא' }, { status: 404 });
    }

    const filePath = foundDoc.filePath || path.join(UPLOAD_DIR, foundDoc.filename);
    const fileBuffer = await fs.readFile(filePath);

    const headers = new Headers();
    headers.set('Content-Disposition', `attachment; filename="${encodeURIComponent(foundDoc.originalName)}"`);
    headers.set('Content-Type', 'application/octet-stream');

    return new NextResponse(fileBuffer, { status: 200, headers });
  } catch (error) {
    console.error('Error downloading document:', error);
    return NextResponse.json(
      { error: 'שגיאה בהורדת המסמך' },
      { status: 500 }
    );
  }
}
