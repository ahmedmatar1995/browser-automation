import type { Stagehand } from '@browserbasehq/stagehand'

export async function openUrl({
  stagehand,
  url,
}: {
  stagehand: Stagehand
  url: string
}) {
  const pages = await stagehand.browser.context.pages()
  const page = pages[0] ?? (await stagehand.browser.context.newPage())

  if (!url) throw new Error('url to fetch not found')
  new URL(url)

  await page.goto(url, { waitUntil: 'load', timeout: 30_000 })

  return {
    title: await page.title(),
    url: page.url(),
  }
}
