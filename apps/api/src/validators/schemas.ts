import { z } from 'zod'

export const PipelineInputSchema = z.object({
  prompt: z.string().min(10, 'Prompt must be at least 10 characters').max(2000),
  referenceUrls: z.array(z.string().url()).max(5).optional(),
})

export const ResearchOutputSchema = z.object({
  topicSummary: z.string().min(1),
  keyFindings: z
    .array(
      z.object({
        claim: z.string(),
        explanation: z.string(),
        citations: z.array(
          z.object({
            url: z.string(),
            domain: z.string(),
            title: z.string().optional(),
          })
        ),
        confidence: z.enum(['high', 'medium', 'low']),
      })
    )
    .min(1),
  statistics: z.array(
    z.object({
      stat: z.string(),
      source: z.string(),
    })
  ),
  controversies: z.array(z.string()),
  verifiedFactsSummary: z.string().min(1),
})

export const ScriptOutputSchema = z.object({
  hook: z.string().min(1),
  context: z.string().min(1),
  coreIdea: z.string().min(1),
  exampleEvidence: z.string().min(1),
  conclusion: z.string().min(1),
  callToAction: z.string().min(1),
  totalWordCount: z.number().positive(),
  estimatedDurationSeconds: z.number().positive(),
})

