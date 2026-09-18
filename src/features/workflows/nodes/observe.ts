import type { Stagehand } from '@browserbasehq/stagehand'

export async function observe({
  stagehand,
  instructions,
}: {
  stagehand: Stagehand
  instructions: string
}) {
  const { data: results } = await stagehand.observe(instructions)

  const matches = results.map(({ selector, description }) => ({
    selector,
    description,
  }))

  return { matches }
}
