import { NextResponse } from 'next/server';
import { staffStore } from '@/lib/staff-store';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    const updated = staffStore.updateFinding(id, body);
    if (!updated) {
      return NextResponse.json({ error: 'ממצא לא נמצא' }, { status: 404 });
    }

    return NextResponse.json({ success: true, finding: updated });
  } catch (error) {
    console.error('Error updating finding:', error);
    return NextResponse.json(
      { error: 'שגיאה בעדכון ממצא' },
      { status: 500 }
    );
  }
}
