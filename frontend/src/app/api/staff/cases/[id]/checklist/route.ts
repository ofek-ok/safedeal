import { NextResponse } from 'next/server';
import { staffStore } from '@/lib/staff-store';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { itemKey, completed } = await req.json();

    if (!itemKey) {
      return NextResponse.json({ error: 'חסר מזהה משימה' }, { status: 400 });
    }

    const updated = staffStore.updateChecklist(id, itemKey, Boolean(completed));
    if (!updated) {
      return NextResponse.json({ error: 'תיק לא נמצא' }, { status: 404 });
    }

    return NextResponse.json({ success: true, checklist: updated.checklist });
  } catch (error) {
    console.error('Error updating checklist:', error);
    return NextResponse.json(
      { error: 'שגיאה בעדכון צ׳קליסט' },
      { status: 500 }
    );
  }
}
