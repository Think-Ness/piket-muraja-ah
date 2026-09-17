import { NextRequest, NextResponse } from 'next/server';
import { DataService } from '@/lib/data-service';
import { exportPiketDetailToWorkbook, workbookToBuffer } from '@/lib/excel/exporter';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const format = (searchParams.get('format') || 'xlsx').toLowerCase() as 'xlsx' | 'csv';

    const submissions = await DataService.getPiketSubmissions();
    const workbook = exportPiketDetailToWorkbook(submissions);
    const buffer = workbookToBuffer(workbook, format);

    const contentType =
      format === 'csv'
        ? 'text/csv; charset=utf-8'
        : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

    const fileName = `Detail-Piket-Murajaah-${new Date().toISOString().split('T')[0]}.${format}`;

    return new Response(buffer as any, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Gagal export data' }, { status: 500 });
  }
}
