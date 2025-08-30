import { compileDSPyPrograms, getDSPyStatus } from '@/lib/services/chat/messageProcessor';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/admin/dspy - Get DSPy compilation status
 */
export async function GET() {
  try {
    const status = getDSPyStatus();
    return NextResponse.json({
      success: true,
      data: status
    });
  } catch (error) {
    console.error('Error getting DSPy status:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/dspy/compile - Trigger DSPy compilation
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { force } = body || {};

    // Optional: Add authentication/authorization checks here
    // if (!isAdmin(request)) {
    //   return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    // }

    const result = await compileDSPyPrograms();

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'DSPy compilation completed successfully',
        data: result
      });
    } else {
      return NextResponse.json({
        success: false,
        error: 'Compilation failed',
        messageKey: 'dspy.compilationFailed'
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error in DSPy compilation endpoint:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
