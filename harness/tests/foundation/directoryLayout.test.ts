import { existsSync } from 'node:fs'
import { join } from 'node:path'

describe('directory layout', () => {
  it('runs from a nested package root with repository docs above it', () => {
    const packageRoot = process.cwd()
    const repositoryRoot = join(packageRoot, '..')

    expect(existsSync(join(packageRoot, 'package.json'))).toBe(true)
    expect(existsSync(join(packageRoot, 'src'))).toBe(true)
    expect(existsSync(join(packageRoot, 'tests'))).toBe(true)
    expect(existsSync(join(packageRoot, 'personas', 'default.yaml'))).toBe(true)
    expect(existsSync(join(packageRoot, 'redteam', 'default.json'))).toBe(true)
    expect(existsSync(join(repositoryRoot, 'docs', 'superpowers'))).toBe(true)
    expect(existsSync(join(repositoryRoot, 'package.json'))).toBe(false)
    expect(existsSync(join(repositoryRoot, 'src'))).toBe(false)
    expect(existsSync(join(repositoryRoot, 'tests'))).toBe(false)
  })
})
