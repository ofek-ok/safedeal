import { NextResponse } from 'next/server';
import { staffStore } from '@/lib/staff-store';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const c = staffStore.getCase(id);
    if (!c) {
      return NextResponse.json({ error: 'תיק לא נמצא' }, { status: 404 });
    }

    return NextResponse.json({
      case: c,
      intakeData: c.intakeData,
      documents: c.documents,
      checklist: c.checklist,
      findings: c.findings,
      activity: c.activity,
      report: c.report,
    });
  } catch (error) {
    console.error('Error fetching single staff case:', error);
    return NextResponse.json(
      { error: 'שגיאה בשליפת פרטי התיק' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    const updated = staffStore.updateCase(id, body);
    if (!updated) {
      return NextResponse.json({ error: 'תיק לא נמצא' }, { status: 404 });
    }

    return NextResponse.json({ success: true, case: updated });
  } catch (error) {
    console.error('Error updating staff case:', error);
    return NextResponse.json(
      { error: 'שגיאה בעדכון התיק' },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const report = staffStore.createReportVersion(id, body?.actorName, body?.overrides);
    if (!report) {
      return NextResponse.json({ error: 'תיק לא נמצא' }, { status: 404 });
    }

    return NextResponse.json({ success: true, report });
  } catch (error) {
    console.error('Error creating report version:', error);
    return NextResponse.json(
      { error: 'שגיאה ביצירת גרסת דוח' },
      { status: 500 }
    );
  }
}
