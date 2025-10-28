import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@chess960/db';

export async function POST(request: NextRequest) {
  try {
    const { sql } = await request.json();
    
    if (!sql) {
      return NextResponse.json({ error: 'SQL query is required' }, { status: 400 });
    }

    console.log('🔧 Executing SQL:', sql);
    
    const result = await prisma.$executeRawUnsafe(sql);
    
    console.log('✅ SQL executed successfully:', result);

    return NextResponse.json({ 
      success: true, 
      result,
      message: 'SQL executed successfully!' 
    });
  } catch (error) {
    console.error('❌ Error executing SQL:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
