import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require('pdf-parse');
import mammoth from 'mammoth';

export const runtime = 'nodejs';


// 5 MB upload limit
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') || '';

    // 1. URL Ingestion
    if (contentType.includes('application/json')) {
      const body = await req.json().catch(() => null);
      if (!body || typeof body.url !== 'string' || !body.url.trim()) {
        return NextResponse.json(
          { error: 'Invalid payload. A valid "url" string is required.' },
          { status: 400 }
        );
      }

      let parsedUrl: URL;
      try {
        parsedUrl = new URL(body.url.trim());
      } catch {
        return NextResponse.json(
          { error: 'Invalid URL format provided.' },
          { status: 400 }
        );
      }

      try {
        const response = await fetch(parsedUrl.toString(), {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 PERSPECTA/1.0',
            Accept:
              'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          },
          signal: AbortSignal.timeout(15000),
        });

        if (!response.ok) {
          return NextResponse.json(
            {
              error: `Failed to fetch URL. Upstream server responded with HTTP ${response.status} (${response.statusText}).`,
            },
            { status: 400 }
          );
        }

        const html = await response.text();
        const $ = cheerio.load(html);

        // Remove scripts, styles, navigation, footer, forms, and common advertisement blocks
        $(
          'script, style, noscript, iframe, svg, nav, footer, header, form, aside, [role="navigation"], [role="banner"], [role="complementary"], .ad, .advertisement, .ad-box, .cookie-banner, .social-share'
        ).remove();

        // Extract title
        let title =
          $('meta[property="og:title"]').attr('content') ||
          $('meta[name="twitter:title"]').attr('content') ||
          $('h1').first().text().trim() ||
          $('title').text().trim() ||
          '';

        title = title.replace(/\s+/g, ' ').trim();

        // Extract publisher
        let publisher =
          $('meta[property="og:site_name"]').attr('content') ||
          $('meta[name="publisher"]').attr('content') ||
          $('meta[name="author"]').attr('content') ||
          parsedUrl.hostname.replace(/^www\./, '') ||
          '';

        publisher = publisher.trim();

        // Extract article body content
        // Try editorial selectors first
        let mainContent = '';
        const articleEl = $('article, main, [role="main"], .article-body, .story-body, .entry-content');
        if (articleEl.length > 0) {
          const paragraphs: string[] = [];
          articleEl.find('p').each((_, el) => {
            const pText = $(el).text().trim();
            if (pText.length > 20) {
              paragraphs.push(pText);
            }
          });
          mainContent = paragraphs.join('\n\n');
        }

        // Fallback if no article tag or paragraphs found inside article tag
        if (!mainContent.trim()) {
          const paragraphs: string[] = [];
          $('p').each((_, el) => {
            const pText = $(el).text().trim();
            if (pText.length > 25) {
              paragraphs.push(pText);
            }
          });
          mainContent = paragraphs.join('\n\n');
        }

        // Clean text formatting
        mainContent = mainContent
          .replace(/\r\n/g, '\n')
          .replace(/[ \t]+/g, ' ')
          .replace(/\n{3,}/g, '\n\n')
          .trim();

        if (!mainContent || mainContent.length < 20) {
          return NextResponse.json(
            {
              error:
                'Could not extract readable article text from the provided URL. The page might be behind a paywall, require client JavaScript rendering, or contain minimal text.',
            },
            { status: 422 }
          );
        }

        return NextResponse.json({
          title: title || 'Untitled Article',
          publisher: publisher || parsedUrl.hostname,
          text: mainContent,
          source: parsedUrl.toString(),
        });
      } catch (err: any) {
        console.error('URL parse error:', err);
        return NextResponse.json(
          {
            error:
              err.name === 'TimeoutError'
                ? 'The URL request timed out after 15 seconds.'
                : `Failed to scrape source URL: ${err.message || 'Unknown network error'}`,
          },
          { status: 400 }
        );
      }
    }

    // 2. Multi-format Document Uploads (multipart/form-data)
    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('file');

      if (!file || typeof file === 'string' || !(file instanceof Blob)) {
        return NextResponse.json(
          { error: 'No file uploaded or invalid file form field.' },
          { status: 400 }
        );
      }

      if (file.size > MAX_FILE_SIZE_BYTES) {
        return NextResponse.json(
          {
            error: `File size exceeds the 5 MB limit (Uploaded: ${(
              file.size /
              (1024 * 1024)
            ).toFixed(2)} MB).`,
          },
          { status: 400 }
        );
      }

      const fileName = (file as File).name || 'document';
      const fileExt = fileName.includes('.')
        ? fileName.split('.').pop()?.toLowerCase() || ''
        : '';

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      let extractedText = '';

      if (fileExt === 'txt' || fileExt === 'md') {
        extractedText = buffer.toString('utf-8');
      } else if (fileExt === 'pdf') {
        try {
          const pdfData = await pdfParse(buffer);
          extractedText = pdfData.text || '';
        } catch (pdfErr: any) {
          console.error('PDF parsing error:', pdfErr);
          return NextResponse.json(
            { error: `Failed to parse PDF document: ${pdfErr.message || 'Corrupted or encrypted PDF'}` },
            { status: 400 }
          );
        }
      } else if (fileExt === 'docx') {
        try {
          const docxResult = await mammoth.extractRawText({ buffer });
          extractedText = docxResult.value || '';
        } catch (docxErr: any) {
          console.error('DOCX parsing error:', docxErr);
          return NextResponse.json(
            { error: `Failed to parse Word document (.docx): ${docxErr.message || 'Corrupted or unsupported document'}` },
            { status: 400 }
          );
        }
      } else {
        return NextResponse.json(
          {
            error: `Unsupported file format ".${fileExt}". Supported formats: .pdf, .docx, .txt, .md.`,
          },
          { status: 400 }
        );
      }

      // Clean extracted text
      extractedText = extractedText
        .replace(/\r\n/g, '\n')
        .replace(/[ \t]+/g, ' ')
        .replace(/\n{3,}/g, '\n\n')
        .trim();

      if (!extractedText || extractedText.length < 10) {
        return NextResponse.json(
          {
            error:
              'The uploaded document contains insufficient text or could not be decoded.',
          },
          { status: 422 }
        );
      }

      // Generate clean title from filename
      const title = fileName.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');

      return NextResponse.json({
        title: title || 'Uploaded Document',
        publisher: 'Document Upload',
        text: extractedText,
        source: fileName,
      });
    }

    return NextResponse.json(
      {
        error:
          'Unsupported Content-Type. Send application/json for URLs or multipart/form-data for file uploads.',
      },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('Fatal error in /api/parse-source:', error);
    return NextResponse.json(
      { error: `Internal server error during ingestion: ${error.message || 'Unknown error'}` },
      { status: 500 }
    );
  }
}
