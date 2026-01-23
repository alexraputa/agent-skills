---
title: Use Embroider Static Mode
impact: CRITICAL
impactDescription: 40-60% build time reduction, better tree-shaking
tags: bundle, embroider, build-performance, tree-shaking
---

## Use Embroider Static Mode

Enable Embroider's static analysis features to get better tree-shaking, faster builds, and smaller bundles.

**Incorrect (classic build pipeline):**

```javascript
// ember-cli-build.js
const EmberApp = require('ember-cli/lib/broccoli/ember-app');

module.exports = function (defaults) {
  const app = new EmberApp(defaults, {});
  return app.toTree();
};
```

**Correct (Embroider with Vite and static optimizations):**

```javascript
// ember-cli-build.js
const EmberApp = require('ember-cli/lib/broccoli/ember-app');

module.exports = async function (defaults) {
  const app = new EmberApp(defaults, {
    'ember-cli-babel': {
      enableTypeScriptTransform: true,
    },
  });

  const { Vite } = require('@embroider/vite');
  return require('@embroider/compat').compatBuild(app, Vite, {
    staticAddonTestSupportTrees: true,
    staticAddonTrees: true,
    staticHelpers: true,
    staticModifiers: true,
    staticComponents: true,
    staticEmberSource: true,
    skipBabel: [
      {
        package: 'qunit',
      },
    ],
  });
};
```

Enabling static flags allows Embroider to analyze your app at build time, eliminating unused code and improving performance.

Reference: [Embroider Options](https://github.com/embroider-build/embroider#options)
