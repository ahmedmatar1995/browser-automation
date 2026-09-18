import type { Stagehand } from '@browserbasehq/stagehand'
import { logger } from '@trigger.dev/sdk'

export async function agent({
  stagehand,
  instructions,
}: {
  stagehand: Stagehand
  instructions: string
}) {
  if (!instructions.trim()) {
    throw new Error('Agent instructions are required')
  }

  // Stagehand v4 has no agent()/execute() — this loop is what those did
  // internally. The model stays where the project already sets it:
  // Stagehand.create({ model }) in tasks/run-workflow.ts.
  const maxSteps = 20
  let lastMessage = ''

  for (let step = 1; step <= maxSteps; step++) {
    // LOOK — fresh page state before every action. Pages change after
    // each click, so never reuse an old observation.
    await stagehand.observe(`Elements needed for: ${instructions}`)

    // DO — exactly one next action, never the whole goal at once.
    const acted = await stagehand.act(
      `Toward this goal: ${instructions}. Do only the single next action (step ${step} of ${maxSteps}).`,
    )
    lastMessage = acted.data.message

    // CHECK — ask the page itself whether the goal is fully done.
    // extract() without a schema returns plain text (a custom zod schema
    // fails type-check: the repo's zod is newer than what Stagehand 4.1.0
    // accepts), so constrain the reply format and parse the first word.
    const check = await stagehand.extract(
      `Goal: ${instructions}. Reply with exactly YES if it is fully complete on this page right now, otherwise NO, then a dash and a one-line reason. Example: "NO - cart is still empty".`,
    )
    const verdict = check.data.extraction ?? ''
    if (/^\s*yes\b/i.test(verdict)) {
      break
    }
    logger.log(`agent step ${step}/${maxSteps}: ${verdict}`)
  }

  // Same page access the codebase already uses (open-url.ts pattern):
  // browser.context — awaited, with a fallback instead of a [0] crash.
  const pages = await stagehand.browser.context.pages()
  const page = pages[0] ?? (await stagehand.browser.context.newPage())

  return {
    success: lastMessage.length > 0,
    message: lastMessage,
    url: page.url(),
  }
}
