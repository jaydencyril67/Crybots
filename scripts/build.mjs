import { spawnSync } from 'node:child_process'

const steps = [
  { name: 'TypeScript check', command: 'npx', args: ['tsc', '-b'] },
  { name: 'Vite build', command: 'npm', args: ['run', 'build:vite'] },
]

for (const step of steps) {
  console.log(`\n[build] ${step.name}...`)

  const result = spawnSync(step.command, step.args, {
    stdio: 'inherit',
    shell: false,
  })

  if (result.status !== 0) {
    console.error(`\n[build] ${step.name} failed with exit code ${result.status ?? 'unknown'}`)
    process.exit(result.status ?? 1)
  }

  console.log(`[build] ${step.name} passed`)
}

console.log('\n[build] Build completed successfully')
