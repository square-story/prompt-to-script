import { FactCheckDocument, HookVariant } from "@/types"

export function buildScriptUserPrompt(input: {
    topic: string
    selectedHook: HookVariant
    factCheck: FactCheckDocument
    memoryContext: string[]
}): string {
    return `
TOPIC: "${input.topic}"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SELECTED HOOK — use this verbatim in the "hook" field
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
"${input.selectedHook.text}"
Tone: ${input.selectedHook.toneDescriptor}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
VERIFIED FACTS BLOCK — only source of truth for all claims
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Summary: ${input.factCheck.factsBlockSummary}

Individual verified claims you may reference:
${input.factCheck.verifiedFacts.map((f, i) => `  ${i + 1}. "${f.claim}" [source: ${f.sources}]`).join('\n')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CONTEXT MEMORY — relevant past content from this creator
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${input.memoryContext.length > 0
            ? input.memoryContext.map((m, i) => `  ${i + 1}. ${m}`).join('\n')
            : '  No prior context available.'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
INSTRUCTIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. Write the full script following the 6-part structure in your instructions.
2. Every factual claim must trace back to the Verified Facts Block above.
3. The "hook" field must contain the selected hook text EXACTLY as shown.
4. Do not reference prior content that contradicts the verified facts.
5. wordCount = total words across all 6 fields combined.
6. estimatedDurationSeconds = wordCount divided by 2.5, rounded to
   the nearest whole number.

Return ONLY this JSON — nothing else:
{
  "hook": string,
  "context": string,
  "coreIdea": string,
  "exampleEvidence": string,
  "conclusion": string,
  "callToAction": string,
  "wordCount": number,
  "estimatedDurationSeconds": number
}
`.trim()
}