const path = require('node:path')
const ROOT = path.resolve(__dirname, '../..')
const thresholds = require('./performance-thresholds.json')

module.exports = {
  ci: {
    collect: {
      url: ['http://localhost:4173/'],
      startServerCommand: 'npm run preview -- --port 4173 --host',
      startServerReadyPattern: 'Local',
      numberOfRuns: 1,
      settings: { preset: 'desktop' },
    },
    assert: {
      assertions: {
        'categories:performance': ['warn', { minScore: thresholds.lighthouse.performance / 100 }],
        'categories:accessibility': ['warn', { minScore: thresholds.lighthouse.accessibility / 100 }],
        'categories:best-practices': ['warn', { minScore: thresholds.lighthouse.bestPractices / 100 }],
        'categories:seo': ['warn', { minScore: thresholds.lighthouse.seo / 100 }],
      },
    },
    upload: {
      target: 'filesystem',
      outputDir: path.join(ROOT, 'qa-automation/reports/output/lighthouse'),
    },
  },
}
