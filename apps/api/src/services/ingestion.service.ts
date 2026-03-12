import pdfParse from 'pdf-parse'
import * as cheerio from 'cheerio'
import { IngestedContent } from '@/types/index'
import { logger } from '@/utils/logger'

const truncate = (value: string, maxChars: number): string => {
  if (value.length <= maxChars) return value
  return value.slice(0, maxChars)
}

const hostnameFromUrl = (url: string): string => {
  try {
    return new URL(url).hostname
  } catch {
    return url
  }
}

class IngestionService {
  ingestPdf = async (fileBuffer: Buffer, filename: string): Promise<IngestedContent> => {
    const data = await pdfParse(fileBuffer)
    const content = truncate((data.text ?? '').trim(), 3000)
    return {
      sourceType: 'pdf',
      content,
      sourceLabel: filename,
    }
  }

  ingestUrl = async (url: string): Promise<IngestedContent> => {
    const res = await fetch(url, { method: 'GET' })
    if (!res.ok) {
      throw new Error(`Failed to fetch URL: ${url}`)
    }

    const html = await res.text()
    const $ = cheerio.load(html)
    const text = $('p, article, h1, h2, h3')
      .toArray()
      .map((el) => $(el).text())
      .join('\n')
      .replace(/\s+\n/g, '\n')
      .trim()

    return {
      sourceType: 'url',
      content: truncate(text, 3000),
      sourceLabel: hostnameFromUrl(url),
    }
  }

  ingestAll = async (
    prompt: string,
    pdfBuffer?: Buffer,
    pdfFilename?: string,
    urls?: string[]
  ): Promise<IngestedContent[]> => {
    const out: IngestedContent[] = [
      {
        sourceType: 'prompt',
        content: truncate(prompt.trim(), 3000),
        sourceLabel: 'prompt',
      },
    ]

    if (pdfBuffer && pdfFilename) {
      try {
        out.push(await this.ingestPdf(pdfBuffer, pdfFilename))
      } catch (err) {
        logger.warn({ err }, 'PDF ingestion failed; continuing')
      }
    }

    const uniqueUrls = Array.from(new Set((urls ?? []).filter(Boolean)))
    for (const url of uniqueUrls) {
      try {
        out.push(await this.ingestUrl(url))
      } catch (err) {
        logger.warn({ err, url }, 'URL ingestion failed; continuing')
      }
    }

    return out
  }
}

export const ingestionService = new IngestionService()

