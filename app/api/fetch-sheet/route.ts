import { NextRequest, NextResponse } from 'next/server';

// Convert pubhtml URL to CSV export URL
function convertToCSVUrl(url: string): string {
    let csvUrl = url.trim();

    // If already a CSV URL, return as is
    if (csvUrl.includes('output=csv')) {
        return csvUrl;
    }

    // Convert pubhtml to CSV
    if (csvUrl.includes('/pubhtml')) {
        csvUrl = csvUrl.replace('/pubhtml', '/pub?output=csv');
    } else if (csvUrl.includes('/pub?')) {
        if (!csvUrl.includes('output=')) {
            csvUrl += '&output=csv';
        } else {
            csvUrl = csvUrl.replace(/output=\w+/, 'output=csv');
        }
    } else if (csvUrl.includes('/pub')) {
        csvUrl = csvUrl.replace('/pub', '/pub?output=csv');
    } else if (csvUrl.includes('/edit')) {
        csvUrl = csvUrl.replace('/edit', '/export?format=csv');
    }

    return csvUrl;
}

export async function POST(request: NextRequest) {
    try {
        const { url } = await request.json();

        if (!url) {
            return NextResponse.json(
                { error: 'URL is required' },
                { status: 400 }
            );
        }

        const csvUrl = convertToCSVUrl(url);
        console.log('Fetching from URL:', csvUrl);

        const response = await fetch(csvUrl, {
            headers: {
                'Accept': 'text/csv,text/plain,*/*',
            },
            cache: 'no-store',
        });

        if (!response.ok) {
            return NextResponse.json(
                { error: `Failed to fetch: HTTP ${response.status}` },
                { status: response.status }
            );
        }

        const csvText = await response.text();

        // Check if we got HTML instead of CSV
        if (csvText.includes('<!DOCTYPE html>') || csvText.includes('<html')) {
            return NextResponse.json(
                { error: 'Google Sheets returned HTML instead of CSV. Make sure the sheet is published to the web as CSV.' },
                { status: 400 }
            );
        }

        return NextResponse.json({ data: csvText });

    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to fetch from Google Sheets' },
            { status: 500 }
        );
    }
}
