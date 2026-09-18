import type { Stagehand } from '@browserbasehq/stagehand'

export async function act({
  stagehand,
  instructions,
}: {
  stagehand: Stagehand
  instructions: string
}) {
  const result = await stagehand.act(instructions)
  const pages = await stagehand.browser.context.pages()
  const page = pages[0] ?? (await stagehand.browser.context.newPage())

  return {
    success: result.data.success,
    message: result.data.message,
    url: page.url(),
  }
}
