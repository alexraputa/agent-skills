---
title: Prefer Named Exports Outside Resolver Modules
impact: LOW
impactDescription: Clear module contracts without conflicting with Ember resolver conventions
tags: exports, modules, resolver, code-organization
---

## Prefer Named Exports Outside Resolver Modules

Use named exports for shared utility modules and template-tag component classes. For resolver-bound modules, requirements depend on resolver mode: classic `ember-resolver` expects module default exports across resolver types, while `ember-strict-application-resolver` convention globs typically enforce that for routes, services, and templates.

**Incorrect (default export in a shared utility module):**

```javascript
// app/utils/format-date.js
export default function formatDate(date) {
  return new Date(date).toLocaleDateString();
}
```

**Correct (named export in a shared utility module):**

```javascript
// app/utils/format-date.js
export function formatDate(date) {
  return new Date(date).toLocaleDateString();
}

// app/components/user-card.gjs
import { formatDate } from '../utils/format-date';
```

## Where Named Exports Are Preferred

Use named exports when the module is imported directly by other modules and is not resolved by Ember's file-based resolver.

```glimmer-js
// app/components/user-card.gjs
import Component from '@glimmer/component';

export class UserCard extends Component {
  <template>
    <div>{{@user.name}}</div>
  </template>
}
```

```javascript
// app/utils/validators.js
export function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function isPhoneNumber(value) {
  return /^\d{3}-\d{3}-\d{4}$/.test(value);
}
```

Benefits:

1. Explicit import contracts
2. Better refactor safety (symbol rename tracking)
3. Better tree-shaking for utility modules
4. Easier multi-export module organization

## Where Default Exports Are Expected

Use default exports for modules consumed by Ember's resolver according to the active resolver mode.
With classic `ember-resolver`, this applies broadly (routes, services, controllers, helpers, modifiers, templates, adapters, serializers).
With `ember-strict-application-resolver` in the common `import.meta.glob` setup, this convention requirement applies to routes, services, and templates.

**Service:**

```javascript
// app/services/auth.js
import Service from '@ember/service';

export default class AuthService extends Service {
  // ...
}
```

**Route:**

```javascript
// app/routes/dashboard.js
import Route from '@ember/routing/route';
import { service } from '@ember/service';

export default class DashboardRoute extends Route {
  @service store;

  model() {
    return this.store.findAll('dashboard-item');
  }
}
```

**Modifier (`ember-resolver` only):**

```javascript
// app/modifiers/focus.js
import { modifier } from 'ember-modifier';

export default modifier((element) => {
  element.focus();
});
```

**Template:**

```glimmer-js
// app/templates/dashboard.gjs
<template>
  <h1>Dashboard</h1>
</template>
```

```glimmer-ts
// app/templates/dashboard.gts
import type { TOC } from '@ember/component/template-only';

interface Signature {
  Args: {
    model: unknown;
  };
}

export default <template>
  <h1>Dashboard</h1>
</template> satisfies TOC<Signature>;
```

Template-tag files must resolve via a module default export in convention-based and `import.meta.glob` flows.
For `app/templates/*.gjs`, the default export is implicit after compilation.

## Strict Resolver Nuance

With `ember-strict-application-resolver`, you can register explicit module values in `App.modules`:

```ts
modules = {
  './services/manual': { default: ManualService },
  './services/manual-shorthand': ManualService,
};
```

In that explicit shorthand case, a direct value works without a default-exported module object.

## Rule of Thumb

1. Classic `ember-resolver`: resolver modules should resolve via module default exports.
2. Strict resolver via `import.meta.glob` (common setup): enforce module default export resolution for routes, services, and templates.
3. Strict resolver explicit `modules` entries may use direct shorthand values where appropriate.
4. Plain shared modules (`app/utils`, shared constants, reusable pure functions): prefer named exports.
5. Template-tag components (`.gjs`/`.gts`): follow the component file-conventions rule and use named class exports.

## References

- [ES Modules Best Practices](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules)
- [ember-strict-application-resolver](https://github.com/ember-cli/ember-strict-application-resolver)
- [ember-resolver](https://github.com/ember-cli/ember-resolver)
