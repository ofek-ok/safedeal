import { NextResponse } from 'next/server';
import { staffStore } from '@/lib/staff-store';

export async function GET() {
  try {
    const tasks = staffStore.getCompliance();
    return NextResponse.json({ tasks });
  } catch (error) {
    console.error('Error fetching compliance tasks:', error);
    return NextResponse.json(
      { error: 'שגיאה בשליפת משימות ציות' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { id, status, note } = body;

    if (!id) {
      return NextResponse.json({ error: 'חסר מזהה משימה' }, { status: 400 });
    }

    const updated = staffStore.updateCompliance(id, { status, note });
    if (!updated) {
      return NextResponse.json({ error: 'משימה לא נמצאה' }, { status: 404 });
    }

    return NextResponse.json({ success: true, task: updated });
  } catch (error) {
    console.error('Error updating compliance task:', error);
    return NextResponse.json(
      { error: 'שגיאה בעדכון משימת ציות' },
      { status: 500 }
    );
  }
}
