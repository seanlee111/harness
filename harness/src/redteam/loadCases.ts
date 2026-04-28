import { readFile } from 'node:fs/promises'
import type { RedteamCase } from '../types/index.js'

export async function loadRedteamCases(filePath: string): Promise<RedteamCase[]> {
  const raw = await readFile(filePath, 'utf8')
  const parsed = JSON.parse(raw) as RedteamCase[]
  return parsed
}
