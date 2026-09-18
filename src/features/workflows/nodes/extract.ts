import type { Stagehand } from '@browserbasehq/stagehand'

export async function extract({
  stagehand,
  instructions,
}: {
  stagehand: Stagehand
  instructions: string
}) {
  const { data } = await stagehand.extract(instructions)

  return { extraction: data.extraction }
}
