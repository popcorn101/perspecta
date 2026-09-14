import { NextResponse } from 'next/server';
import { DEMO_CASES } from '@/lib/demo-data';

export const runtime = 'nodejs';

export async function GET() {
  return NextResponse.json({
    demos: DEMO_CASES,
    count: DEMO_CASES.length,
  });
}
