import { NextResponse } from 'next/server';
import { staffStore } from '@/lib/staff-store';

export async function GET() {
  try {
    const cases = staffStore.getCases();
    return NextResponse.json({ cases });
  } catch (error) {
    console.error('Error fetching staff cases:', error);
    return NextResponse.json(
      { error: 'שגיאה בשליפת רשימת התיקים' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const clientName =
      body.clientName ||
      body.personal?.fullName ||
      body.intakeData?.personal?.fullName ||
      'לקוח חדש';
    const clientEmail =
      body.clientEmail ||
      body.personal?.email ||
      body.intakeData?.personal?.email ||
      '';
    const clientPhone =
      body.clientPhone ||
      body.personal?.phone ||
      body.intakeData?.personal?.phone ||
      '';

    const location = body.location || body.intakeData?.location || {};
    const deal = body.deal || body.intakeData?.deal || {};

    const street = location.street || location.streetName || '';
    const house = location.houseNumber || '';
    const city = location.city || '';
    const block = location.block || '';
    const parcel = location.parcel || '';
    const subParcel = location.subParcel || '';

    const price = deal.askingPrice || deal.price || '';
    const assetType =
      deal.dealType === 'developer' || deal.dealType === 'new-developer'
        ? 'דירה חדשה מקבלן'
        : 'דירה יד שנייה';

    const intakeData = {
      personal: body.personal || body.intakeData?.personal || {},
      location,
      deal,
      documents: body.documentsList || body.intakeData?.documents || [],
    };

    const newCase = staffStore.createCase({
      clientName,
      clientEmail,
      clientPhone,
      assetType,
      street,
      house,
      city,
      block,
      parcel,
      subParcel,
      price,
      intakeData,
      documents: body.documents || [],
    });

    return NextResponse.json({
      success: true,
      case: newCase,
      caseNumber: newCase.caseNumber,
      id: newCase.id,
    });
  } catch (error) {
    console.error('Error creating staff case:', error);
    return NextResponse.json(
      { error: 'שגיאה ביצירת תיק חדש' },
      { status: 500 }
    );
  }
}
