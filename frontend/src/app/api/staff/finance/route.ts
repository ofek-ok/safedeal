import { NextResponse } from 'next/server';
import { staffStore } from '@/lib/staff-store';

export async function GET() {
  try {
    const data = staffStore.getFinance();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching finance:', error);
    return NextResponse.json(
      { error: 'שגיאה בשליפת נתוני כספים' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { type, date, category, description, amount } = body;

    if (!type || !date || !category || !description || !amount) {
      return NextResponse.json({ error: 'חסרים שדות חובה' }, { status: 400 });
    }

    const tx = staffStore.addFinance({
      type,
      date,
      category,
      description,
      amount: Number(amount),
    });

    return NextResponse.json({ success: true, transaction: tx });
  } catch (error) {
    console.error('Error adding transaction:', error);
    return NextResponse.json(
      { error: 'שגיאה בשמירת תנועה כספית' },
      { status: 500 }
    );
  }
}
