import { NextResponse } from 'next/server';
import { staffStore } from '@/lib/staff-store';

export async function GET() {
  try {
    const team = staffStore.getTeam();
    return NextResponse.json({ team });
  } catch (error) {
    console.error('Error fetching team:', error);
    return NextResponse.json(
      { error: 'שגיאה בשליפת רשימת הצוות' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const { email, role } = await req.json();
    if (!email) {
      return NextResponse.json({ error: 'חסרה כתובת דוא״ל' }, { status: 400 });
    }

    const member = staffStore.addTeamMember(email, role || 'member');
    return NextResponse.json({ success: true, member });
  } catch (error) {
    console.error('Error adding team member:', error);
    return NextResponse.json(
      { error: 'שגיאה בהוספת חבר צוות' },
      { status: 500 }
    );
  }
}
