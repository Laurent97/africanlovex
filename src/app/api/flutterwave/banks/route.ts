import { flutterwaveService } from '@/services/flutterwave.service';

/**
 * GET /api/flutterwave/banks
 * Get list of banks for a country
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const country = searchParams.get('country') || 'RW';

    const result = await flutterwaveService.getBanks(country);
    
    if (result.status === 'success') {
      return Response.json({
        success: true,
        data: result.data
      });
    } else {
      return Response.json({
        success: false,
        error: result.message
      }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Banks API error:', error);
    return Response.json({
      success: false,
      error: error.message || 'Failed to fetch banks'
    }, { status: 500 });
  }
}
