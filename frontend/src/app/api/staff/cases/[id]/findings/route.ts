import { NextResponse } from 'next/server';
import { staffStore } from '@/lib/staff-store';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    const finding = staffStore.addFinding(
      id,
      {
        category: body.category || 'בדיקה משפטית וחדלות פירעון',
        title: body.title || 'ממצא חדש',
        note: body.note || '',
        severity: body.severity || 'נמוכה',
        source: body.source || 'בדיקת אנליסט',
        confidence: body.confidence ?? 95,
      },
      body.actorName || 'אנליסט SafeDeal'
    );

    if (!finding) {
      return NextResponse.json({ error: 'תיק לא נמצא' }, { status: 404 });
    }

    return NextResponse.json({ success: true, finding });
  } catch (error) {
    console.error('Error adding case finding:', error);
    return NextResponse.json(
      { error: 'שגיאה בהוספת ממצא' },
      { status: 500 }
    );
  }
}
