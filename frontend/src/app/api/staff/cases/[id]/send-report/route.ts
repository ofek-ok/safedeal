import { NextResponse } from 'next/server';
import { staffStore } from '@/lib/staff-store';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const sent = staffStore.sendReport(id);
    if (!sent) {
      return NextResponse.json({ error: 'תיק לא נמצא' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'דוח נשלח בהצלחה ללקוח' });
  } catch (error) {
    console.error('Error sending report:', error);
    return NextResponse.json(
      { error: 'שגיאה בשליחת הדוח' },
      { status: 500 }
    );
  }
}
