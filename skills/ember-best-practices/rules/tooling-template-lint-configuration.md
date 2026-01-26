---
title: Configure ember-template-lint for Code Quality
impact: MEDIUM
impactDescription: Catches common errors and enforces best practices
tags: linting, code-quality, tooling, best-practices
---

## Configure ember-template-lint for Code Quality

Use `ember-template-lint` to catch common template errors and enforce best practices. Proper configuration prevents bugs, improves accessibility, and maintains code consistency.

### Installation

ember-template-lint comes pre-installed with new Ember apps. If needed:

```bash
npm install --save-dev ember-template-lint
```

### Basic Configuration

Create or update `.template-lintrc.js` in your project root:

```javascript
// .template-lintrc.js
'use strict';

module.exports = {
  extends: 'recommended',
  
  rules: {
    // Your custom rule overrides
  }
};
```

### Recommended Rules for Modern Ember

```javascript
// .template-lintrc.js
'use strict';

module.exports = {
  extends: 'recommended',
  
  rules: {
    // Require angle bracket component invocation
    'no-curly-component-invocation': {
      allow: ['liquid-if', 'liquid-outlet'] // Allow specific addons
    },
    
    // Require quotes around {{on}} and {{fn}} helpers
    'require-input-label': 'error',
    
    // Accessibility rules
    'no-positive-tabindex': 'error',
    'require-valid-alt-text': 'error',
    'no-invalid-interactive': 'error',
    'no-nested-interactive': 'error',
    
    // Component invocation
    'no-invalid-meta': 'error',
    'no-args-paths': 'error',
    
    // Prevent common mistakes
    'no-duplicate-attributes': 'error',
    'no-inline-styles': 'error',
    'no-triple-curlies': 'warn',
    'no-unbound': 'error',
    
    // Code style
    'quotes': 'double',
    'self-closing-void-elements': 'error',
    'block-indentation': 2,
    'linebreak-style': 'unix',
    'eol-last': 'always',
    'no-trailing-spaces': 'error',
    
    // Strict mode / gjs best practices
    'no-implicit-this': 'error',
    'no-action': 'error', // Prefer {{on}} modifier
  },
  
  overrides: [
    {
      // More lenient rules for tests
      files: ['tests/**/*-test.{js,gjs,ts,gts}'],
      rules: {
        'no-inline-styles': 'off',
      }
    }
  ]
};
```

### Accessibility-First Configuration

For apps prioritizing accessibility:

```javascript
// .template-lintrc.js
'use strict';

module.exports = {
  extends: ['recommended', 'a11y'],
  
  rules: {
    // WCAG 2.1 Level AA compliance
    'require-input-label': {
      severity: 'error',
      labelComponents: ['FormLabel', 'CustomLabel'],
      labelComponentProperty: 'for'
    },
    'no-positive-tabindex': 'error',
    'require-valid-alt-text': 'error',
    'no-invalid-interactive': 'error',
    'no-nested-interactive': 'error',
    'no-invalid-role': 'error',
    'no-redundant-role': 'error',
    
    // Link accessibility
    'link-href-attributes': 'error',
    'no-invalid-link-text': 'error',
    
    // Interactive elements
    'no-abstract-roles': 'error',
    'no-accesskey-attribute': 'error',
    
    // Language
    'require-lang-attribute': 'error',
  }
};
```

### Strict Mode / Modern Ember Configuration

For projects using strict mode and modern patterns:

```javascript
// .template-lintrc.js
'use strict';

module.exports = {
  extends: 'recommended',
  
  rules: {
    // Enforce strict mode patterns
    'no-implicit-this': {
      allow: [] // Require explicit this. or @ for all property access
    },
    
    // Prefer modern syntax
    'no-curly-component-invocation': 'error',
    'no-action': 'error', // Use {{on}} instead
    'no-action-modifiers': 'error', // Use {{on}} instead of {{action}}
    
    // No legacy patterns
    'no-partial': 'error',
    'no-attrs-in-components': 'error',
    
    // Enforce named blocks
    'require-has-block-helper': 'error',
  }
};
```

### Custom Rules for Your Team

```javascript
// .template-lintrc.js
'use strict';

module.exports = {
  extends: 'recommended',
  
  rules: {
    // Require data-test attributes for testing
    'require-valid-alt-text': {
      elements: ['img', 'object', 'area', 'input[type="image"]']
    },
    
    // Component naming conventions
    'no-capital-arguments': 'error', // @user not @User
    
    // No inline styles
    'no-inline-styles': {
      allowDynamicStyles: false
    },
    
    // Enforce specific attribute order
    'attribute-order': {
      order: [
        'class',
        'id',
        'role',
        'aria-*',
        'data-*',
        'type',
        'name',
        'value',
        'placeholder'
      ]
    }
  }
};
```

### IDE Integration

**VS Code:**

Install the extension:
```bash
code --install-extension emberjs.vscode-ember
```

Add to `.vscode/settings.json`:
```json
{
  "ember.lintOnSave": true,
  "ember.formatOnSave": true
}
```

### Running the Linter

**Check all templates:**
```bash
npm run lint:hbs
```

**Auto-fix issues:**
```bash
npm run lint:hbs -- --fix
```

**Check specific files:**
```bash
npx ember-template-lint app/components/**/*.{hbs,gjs,gts}
```

**In CI:**
```yaml
# .github/workflows/ci.yml
- name: Lint Templates
  run: npm run lint:hbs
```

### Custom Plugin for Project-Specific Rules

Create custom rules for your organization:

```javascript
// lib/template-lint-plugin/index.js
module.exports = {
  name: 'my-custom-rules',
  
  rules: {
    'require-data-test': require('./rules/require-data-test')
  },
  
  configurations: {
    recommended: {
      rules: {
        'require-data-test': 'error'
      }
    }
  }
};
```

Then use it:
```javascript
// .template-lintrc.js
module.exports = {
  plugins: ['./lib/template-lint-plugin'],
  extends: ['my-custom-rules:recommended']
};
```

### Disable Rules Locally

When you need to disable rules for specific cases:

```glimmer-js
{{! template-lint-disable no-inline-styles }}
<div style="color: {{@dynamicColor}};">
  Dynamic styling required here
</div>
{{! template-lint-enable no-inline-styles }}
```

Or disable for a single line:
```glimmer-js
{{! template-lint-disable-next-line no-inline-styles }}
<div style="color: red;">Emergency styling</div>
```

### Common Issues and Solutions

**Issue: Too many false positives**
```javascript
rules: {
  'no-implicit-this': {
    // Allow helpers that are commonly false positives
    allow: ['t', 'moment-format']
  }
}
```

**Issue: Legacy codebase with many violations**
```javascript
// Start with warnings, gradually make them errors
rules: {
  'no-curly-component-invocation': 'warn',
  'no-action': 'warn'
}
```

**Issue: Different rules for different directories**
```javascript
overrides: [
  {
    files: ['app/components/legacy/**/*.hbs'],
    rules: {
      'no-curly-component-invocation': 'off'
    }
  }
]
```

### Best Practices

1. **Start with 'recommended'** - It's well-tested and covers common issues
2. **Enable accessibility rules** - Catch a11y issues early
3. **Run in CI** - Prevent violations from being merged
4. **Auto-fix when possible** - Use `--fix` to maintain consistency
5. **Document exceptions** - When you disable rules, explain why
6. **Update regularly** - Keep ember-template-lint up to date
7. **Gradual migration** - Use warnings for legacy code, errors for new code

### Integration with Prettier

For consistent formatting, use with prettier:

```bash
npm install --save-dev ember-template-lint-plugin-prettier
```

```javascript
// .template-lintrc.js
module.exports = {
  extends: ['recommended', 'ember-template-lint-plugin-prettier:recommended']
};
```

ember-template-lint is essential for maintaining code quality in Ember applications. It catches bugs before runtime, enforces best practices, and ensures accessibility standards are met.

**References:**
- [ember-template-lint Documentation](https://github.com/ember-template-lint/ember-template-lint)
- [Available Rules](https://github.com/ember-template-lint/ember-template-lint/tree/master/docs/rule)
- [Ember Linting Guide](https://guides.emberjs.com/release/code-editors/linting/)
