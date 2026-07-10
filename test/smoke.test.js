const t = require('tap')
const fs = require('fs')
const path = require('path')

t.test('project structure', (t) => {
  const rootDir = path.join(__dirname, '..')
  t.ok(fs.existsSync(rootDir), 'project root exists')
  t.ok(fs.existsSync(path.join(rootDir, 'package.json')), 'package.json exists')
  t.ok(fs.existsSync(path.join(rootDir, 'lib')), 'lib directory exists')
  t.ok(fs.existsSync(path.join(rootDir, 'bin')), 'bin directory exists')
  t.end()
})

t.test('jmock module loads', (t) => {
  t.doesNotThrow(() => {
    require('../lib/jmock')
  }, 'jmock module loads without error')
  t.end()
})

t.test('config loads', (t) => {
  t.doesNotThrow(() => {
    require('../jmock.config')
  }, 'jmock.config loads without error')
  t.end()
})