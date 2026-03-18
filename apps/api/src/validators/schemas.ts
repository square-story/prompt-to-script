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

export const AvatarDetailSchema = z.object({
  placement: z.string(),
  size: z.string(),
  gestureHint: z.string(),
  eyeContact: z.boolean(),
  backgroundType: z.string().nullable(),
  backgroundColor: z.string().nullable(),
})

export const BrollDetailSchema = z.object({
  source: z.string(),
  searchQuery: z.string(),
  searchKeywords: z.array(z.string()),
  visualDescription: z.string(),
  mood: z.string(),
  colorGrade: z.string(),
  aspectRatio: z.string(),
  durationSeconds: z.number(),
  loopable: z.boolean(),
  fallbackSources: z.array(z.string()),
  infographicData: z
    .object({
      type: z.string(),
      title: z.string(),
      data: z.any(),
    })
    .nullable(),
})

export const TextOverlayDetailSchema = z.object({
  text: z.string(),
  position: z.string(),
  style: z.string(),
  animateIn: z.string(),
  durationSeconds: z.number(),
  highlightWords: z.array(z.string()),
})

export const VideoSceneSchema = z.object({
  sceneNumber: z.number(),
  sceneType: z.string(),
  section: z.string(),
  startTimeSeconds: z.number(),
  endTimeSeconds: z.number(),
  durationSeconds: z.number(),
  spokenLines: z.string(),
  wordCount: z.number(),
  avatar: AvatarDetailSchema.nullable(),
  broll: BrollDetailSchema.nullable(),
  textOverlays: z.array(TextOverlayDetailSchema),
  transitionOut: z.string(),
  directorNote: z.string(),
})

export const PostProductionDetailSchema = z.object({
  backgroundMusicMood: z.string(),
  backgroundMusicVolume: z.number(),
  captionsEnabled: z.boolean(),
  captionStyle: z.string(),
  colorGradePreset: z.string(),
  aspectRatio: z.string(),
})

export const VideoScriptSchema = z.object({
  title: z.string(),
  topic: z.string(),
  targetPlatform: z.string(),
  totalDurationSeconds: z.number(),
  totalWordCount: z.number(),
  sceneCount: z.number(),
  scenes: z.array(VideoSceneSchema),
  postProduction: PostProductionDetailSchema,
})

