import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteSingleFile } from 'vite-plugin-singlefile'

// Base path comes from the repository name in GitHub Actions (GITHUB_REPOSITORY).
const repo = process.env.GITHUB_REPOSITORY?.split('/')[1]
const single = process.env.SINGLE === '1'

export default defineConfig({
  base: single ? './' : repo && !repo.endsWith('.github.io') ? `/${repo}/` : '/',
  plugins: [react(), ...(single ? [viteSingleFile()] : [])],
})
