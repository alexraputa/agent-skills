# Ember Best Practices

Comprehensive performance optimization and accessibility patterns for modern Ember.js applications. Includes rules across 7 categories using gjs/gts format and modern Ember patterns.

---

# Sections

This file defines all sections, their ordering, impact levels, and descriptions.
The section ID (in parentheses) is the filename prefix used to group rules.

---

## 1. Route Loading and Data Fetching (route)

**Impact:** CRITICAL  
**Description:** Efficient route loading and parallel data fetching eliminate waterfalls. Using route model hooks effectively and loading data in parallel yields the largest performance gains.

## 2. Build and Bundle Optimization (bundle)

**Impact:** CRITICAL  
**Description:** Using Embroider with static build optimizations, route-based code splitting, and proper imports reduces bundle size and improves Time to Interactive.

## 3. Component and Reactivity Optimization (component)

**Impact:** HIGH  
**Description:** Proper use of Glimmer components, modern file conventions, tracked properties, and avoiding unnecessary recomputation improves rendering performance.

## 4. Accessibility Best Practices (a11y)

**Impact:** HIGH  
**Description:** Making applications accessible is critical. Use ember-a11y-testing, semantic HTML, proper ARIA attributes, and keyboard navigation support.

## 5. Service and State Management (service)

**Impact:** MEDIUM-HIGH  
**Description:** Efficient service patterns, proper dependency injection, and state management reduce redundant computations and API calls.

## 6. Template Optimization (template)

**Impact:** MEDIUM  
**Description:** Optimizing templates with proper helpers, avoiding expensive computations in templates, and using {{#each}} efficiently improves rendering speed.

## 7. Advanced Patterns (advanced and testing)

**Impact:** MEDIUM-HIGH  
**Description:** Modern Ember patterns including Resources for lifecycle management, ember-concurrency for async operations, modifiers for DOM side effects, helpers for reusable logic, and comprehensive testing patterns with render strategies.

---

---
title: Rule Title Here
impact: MEDIUM
impactDescription: Optional description of impact (e.g., "20-50% improvement")
tags: tag1, tag2
---

## Rule Title Here

**Impact: MEDIUM (optional impact description)**

Brief explanation of the rule and why it matters. This should be clear and concise, explaining the performance implications.

**Incorrect (description of what's wrong):**

```typescript
// Bad code example here
const bad = example()
```

**Correct (description of what's right):**

```typescript
// Good code example here
const good = example()
```

Reference: [Link to documentation or resource](https://example.com)

---

---
title: Use ember-a11y-testing for Automated Checks
impact: HIGH
impactDescription: Catch 30-50% of a11y issues automatically
tags: accessibility, a11y, testing, ember-a11y-testing
---

## Use ember-a11y-testing for Automated Checks

Integrate ember-a11y-testing into your test suite to automatically catch common accessibility violations during development. This addon uses axe-core to identify issues before they reach production.

**Incorrect (no accessibility testing):**

```javascript
// tests/integration/components/user-form-test.js
import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render, fillIn, click } from '@ember/test-helpers';
import UserForm from 'my-app/components/user-form';

module('Integration | Component | user-form', function(hooks) {
  setupRenderingTest(hooks);

  test('it submits the form', async function(assert) {
    await render(<template><UserForm /></template>);
    await fillIn('input', 'John');
    await click('button');
    assert.ok(true);
  });
});
```

**Correct (with a11y testing):**

```javascript
// tests/integration/components/user-form-test.js
import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render, fillIn, click } from '@ember/test-helpers';
import a11yAudit from 'ember-a11y-testing/test-support/audit';
import UserForm from 'my-app/components/user-form';

module('Integration | Component | user-form', function(hooks) {
  setupRenderingTest(hooks);

  test('it submits the form', async function(assert) {
    await render(<template><UserForm /></template>);
    
    // Automatically checks for a11y violations
    await a11yAudit();
    
    await fillIn('input', 'John');
    await click('button');
    assert.ok(true);
  });
});
```

**Setup (install and configure):**

```bash
ember install ember-a11y-testing
```

```javascript
// tests/test-helper.js
import { setupGlobalA11yHooks } from 'ember-a11y-testing/test-support';

setupGlobalA11yHooks(); // Runs on every test automatically
```

ember-a11y-testing catches issues like missing labels, insufficient color contrast, invalid ARIA, and keyboard navigation problems automatically.

Reference: [ember-a11y-testing](https://github.com/ember-a11y/ember-a11y-testing)

---

---
title: Form Labels and Error Announcements
impact: HIGH
impactDescription: Essential for screen reader users
tags: accessibility, a11y, forms, aria-live
---

## Form Labels and Error Announcements

All form inputs must have associated labels, and validation errors should be announced to screen readers using ARIA live regions.

**Incorrect (missing labels and announcements):**

```javascript
// app/components/form.gjs
<template>
  <form {{on "submit" this.handleSubmit}}>
    <input 
      type="email" 
      value={{this.email}}
      {{on "input" this.updateEmail}}
      placeholder="Email"
    />
    
    {{#if this.emailError}}
      <span>{{this.emailError}}</span>
    {{/if}}
    
    <button type="submit">Submit</button>
  </form>
</template>
```

**Correct (with labels and announcements):**

```javascript
// app/components/form.gjs
<template>
  <form {{on "submit" this.handleSubmit}}>
    <div>
      <label for="email-input">
        Email Address
        {{#if this.isEmailRequired}}
          <span aria-label="required">*</span>
        {{/if}}
      </label>
      
      <input 
        id="email-input"
        type="email" 
        value={{this.email}}
        {{on "input" this.updateEmail}}
        aria-describedby={{if this.emailError "email-error"}}
        aria-invalid={{if this.emailError "true"}}
        required={{this.isEmailRequired}}
      />
      
      {{#if this.emailError}}
        <span 
          id="email-error"
          role="alert"
          aria-live="polite"
        >
          {{this.emailError}}
        </span>
      {{/if}}
    </div>
    
    <button type="submit" disabled={{this.isSubmitting}}>
      {{#if this.isSubmitting}}
        <span aria-live="polite">Submitting...</span>
      {{else}}
        Submit
      {{/if}}
    </button>
  </form>
</template>
```

**For complex forms, use platform-native validation with custom logic:**

```javascript
// app/components/user-form.gjs
import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { on } from '@ember/modifier';

class UserForm extends Component {
  @tracked errorMessages = {};
  
  validateEmail = (event) => {
    // Custom business logic validation
    const input = event.target;
    const value = input.value;
    
    if (!value) {
      input.setCustomValidity('Email is required');
      return false;
    }
    
    if (!input.validity.valid) {
      input.setCustomValidity('Must be a valid email');
      return false;
    }
    
    // Additional custom validation (e.g., check if email is already taken)
    if (value === 'taken@example.com') {
      input.setCustomValidity('This email is already registered');
      return false;
    }
    
    input.setCustomValidity('');
    return true;
  };
  
  handleSubmit = async (event) => {
    event.preventDefault();
    const form = event.target;
    
    // Run custom validations
    const emailInput = form.querySelector('[name="email"]');
    const fakeEvent = { target: emailInput };
    this.validateEmail(fakeEvent);
    
    // Use native validation check
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }
    
    const formData = new FormData(form);
    await this.args.onSubmit(formData);
  };

  <template>
    <form {{on "submit" this.handleSubmit}}>
      <label for="user-email">
        Email
        <input 
          id="user-email"
          type="email" 
          name="email" 
          required
          value={{@user.email}}
          {{on "blur" this.validateEmail}}
        />
      </label>
      <button type="submit">Save</button>
    </form>
  </template>
}
```

Always associate labels with inputs and announce dynamic changes to screen readers using aria-live regions.

Reference: [Ember Accessibility - Application Considerations](https://guides.emberjs.com/release/accessibility/application-considerations/)

---

---
title: Keyboard Navigation Support
impact: HIGH
impactDescription: Critical for keyboard-only users
tags: accessibility, a11y, keyboard, focus-management
---

## Keyboard Navigation Support

Ensure all interactive elements are keyboard accessible and focus management is handled properly, especially in modals and dynamic content.

**Incorrect (no keyboard support):**

```javascript
// app/components/dropdown.gjs
<template>
  <div class="dropdown" {{on "click" this.toggleMenu}}>
    Menu
    {{#if this.isOpen}}
      <div class="dropdown-menu">
        <div {{on "click" this.selectOption}}>Option 1</div>
        <div {{on "click" this.selectOption}}>Option 2</div>
      </div>
    {{/if}}
  </div>
</template>
```

**Correct (full keyboard support with custom modifier):**

```javascript
// app/modifiers/focus-first.js
import { modifier } from 'ember-modifier';

export default modifier((element, [selector = 'button']) => {
  // Focus first matching element when modifier runs
  element.querySelector(selector)?.focus();
});
```

```javascript
// app/components/dropdown.gjs
import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { fn } from '@ember/helper';
import focusFirst from '../modifiers/focus-first';

class Dropdown extends Component {
  @tracked isOpen = false;
  
  @action
  toggleMenu() {
    this.isOpen = !this.isOpen;
  }
  
  @action
  handleButtonKeyDown(event) {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.isOpen = true;
    }
  }
  
  @action
  handleMenuKeyDown(event) {
    if (event.key === 'Escape') {
      this.isOpen = false;
      // Return focus to button
      event.target.closest('.dropdown').querySelector('button').focus();
    }
    // Handle arrow key navigation between menu items
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      this.moveFocus(event.key === 'ArrowDown' ? 1 : -1);
    }
  }
  
  moveFocus(direction) {
    const items = Array.from(
      document.querySelectorAll('[role="menuitem"] button')
    );
    const currentIndex = items.indexOf(document.activeElement);
    const nextIndex = (currentIndex + direction + items.length) % items.length;
    items[nextIndex]?.focus();
  }
  
  @action
  selectOption(value) {
    this.args.onSelect?.(value);
    this.isOpen = false;
  }

  <template>
    <div class="dropdown">
      <button 
        type="button"
        {{on "click" this.toggleMenu}}
        {{on "keydown" this.handleButtonKeyDown}}
        aria-haspopup="true"
        aria-expanded="{{this.isOpen}}"
      >
        Menu
      </button>
      
      {{#if this.isOpen}}
        <ul 
          class="dropdown-menu" 
          role="menu"
          {{focusFirst '[role="menuitem"] button'}}
          {{on "keydown" this.handleMenuKeyDown}}
        >
          <li role="menuitem">
            <button type="button" {{on "click" (fn this.selectOption "1")}}>
              Option 1
            </button>
          </li>
          <li role="menuitem">
            <button type="button" {{on "click" (fn this.selectOption "2")}}>
              Option 2
            </button>
          </li>
        </ul>
      {{/if}}
    </div>
  </template>
}
```

**For focus trapping in modals, use ember-focus-trap:**

```bash
ember install ember-focus-trap
```

```javascript
// app/components/modal.gjs
import FocusTrap from 'ember-focus-trap/components/focus-trap';

<template>
  {{#if this.showModal}}
    <FocusTrap 
      @isActive={{true}}
      @initialFocus="#modal-title"
    >
      <div class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <h2 id="modal-title">{{@title}}</h2>
        {{yield}}
        <button type="button" {{on "click" this.closeModal}}>Close</button>
      </div>
    </FocusTrap>
  {{/if}}
</template>
```

**Alternative: Use libraries for keyboard support:**

For complex keyboard interactions, consider using libraries that abstract keyboard support patterns:

```bash
npm install @fluentui/keyboard-keys
```

Or use [tabster](https://tabster.io/) for comprehensive keyboard navigation management including focus trapping, arrow key navigation, and modalizers.

Proper keyboard navigation ensures all users can interact with your application effectively.

Reference: [Ember Accessibility - Keyboard](https://guides.emberjs.com/release/accessibility/keyboard/)

---

---
title: Announce Route Transitions to Screen Readers
impact: HIGH
impactDescription: Critical for screen reader navigation
tags: accessibility, a11y, routing, screen-readers
---

## Announce Route Transitions to Screen Readers

Announce page title changes and route transitions to screen readers so users know when navigation has occurred.

**Incorrect (no announcements):**

```javascript
// app/router.js
export default class Router extends EmberRouter {
  location = config.locationType;
  rootURL = config.rootURL;
}
```

**Correct (using a11y-announcer library - recommended):**

Use the [a11y-announcer](https://github.com/ember-a11y/a11y-announcer) library for robust route announcements:

```bash
ember install @ember-a11y/a11y-announcer
```

```javascript
// app/router.js
import EmberRouter from '@ember/routing/router';
import config from './config/environment';

export default class Router extends EmberRouter {
  location = config.locationType;
  rootURL = config.rootURL;
}

Router.map(function() {
  this.route('about');
  this.route('dashboard');
  this.route('posts', function() {
    this.route('post', { path: '/:post_id' });
  });
});
```

The a11y-announcer library automatically handles route announcements. For custom announcements in your routes:

```javascript
// app/routes/dashboard.js
import Route from '@ember/routing/route';
import { service } from '@ember/service';

export default class DashboardRoute extends Route {
  @service announcer;
  
  afterModel() {
    this.announcer.announce('Loaded dashboard with latest data');
  }
}
```

**Alternative: DIY approach with ARIA live regions:**

If you prefer not to use a library, you can implement route announcements yourself:

```javascript
// app/router.js
import EmberRouter from '@ember/routing/router';
import config from './config/environment';

export default class Router extends EmberRouter {
  location = config.locationType;
  rootURL = config.rootURL;
}

Router.map(function() {
  this.route('about');
  this.route('dashboard');
  this.route('posts', function() {
    this.route('post', { path: '/:post_id' });
  });
});
```

```javascript
// app/routes/application.js
import Route from '@ember/routing/route';
import { service } from '@ember/service';

export default class ApplicationRoute extends Route {
  @service router;
  
  constructor() {
    super(...arguments);
    
    this.router.on('routeDidChange', (transition) => {
      // Update document title
      const title = this.getPageTitle(transition.to);
      document.title = title;
      
      // Announce to screen readers
      this.announceRouteChange(title);
    });
  }
  
  getPageTitle(route) {
    // Get title from route metadata or generate it
    return route.metadata?.title || route.name;
  }
  
  announceRouteChange(title) {
    const announcement = document.getElementById('route-announcement');
    if (announcement) {
      announcement.textContent = `Navigated to ${title}`;
    }
  }
}
```

```javascript
// app/routes/application.gjs
<template>
  <div 
    id="route-announcement" 
    role="status" 
    aria-live="polite" 
    aria-atomic="true"
    class="sr-only"
  ></div>

  {{outlet}}
</template>
```

```css
/* app/styles/app.css */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}
```

**Alternative: Use ember-page-title with announcements:**

```bash
ember install ember-page-title
```

```javascript
// app/routes/dashboard.gjs
import { pageTitle } from 'ember-page-title';

<template>
  {{pageTitle "Dashboard"}}

  <div class="dashboard">
    {{outlet}}
  </div>
</template>
```

Route announcements ensure screen reader users know when navigation occurs, improving the overall accessibility experience.

Reference: [Ember Accessibility - Page Titles](https://guides.emberjs.com/release/accessibility/page-template-considerations/)

---

---
title: Semantic HTML and ARIA Attributes
impact: HIGH
impactDescription: Essential for screen reader users
tags: accessibility, a11y, semantic-html, aria
---

## Semantic HTML and ARIA Attributes

Use semantic HTML elements and proper ARIA attributes to make your application accessible to screen reader users. **The first rule of ARIA is to not use ARIA** - prefer native semantic HTML elements whenever possible.

**Key principle:** Native HTML elements have built-in keyboard support, roles, and behaviors. Only add ARIA when semantic HTML can't provide the needed functionality.

**Incorrect (divs with insufficient semantics):**

```javascript
// app/components/example.gjs
<template>
  <div class="button" {{on "click" this.submit}}>
    Submit
  </div>

  <div class="nav">
    <div class="nav-item">Home</div>
    <div class="nav-item">About</div>
  </div>

  <div class="alert">
    {{this.message}}
  </div>
</template>
```

**Correct (semantic HTML with proper ARIA):**

```javascript
// app/components/example.gjs
import { LinkTo } from '@ember/routing';

<template>
  <button type="submit" {{on "click" this.submit}}>
    Submit
  </button>

  <nav aria-label="Main navigation">
    <ul>
      <li><LinkTo @route="index">Home</LinkTo></li>
      <li><LinkTo @route="about">About</LinkTo></li>
    </ul>
  </nav>

  <div role="alert" aria-live="polite" aria-atomic="true">
    {{this.message}}
  </div>
</template>
```

**For interactive custom elements:**

```javascript
// app/components/custom-button.gjs
import Component from '@glimmer/component';
import { action } from '@ember/object';
import XIcon from './x-icon';

class CustomButton extends Component {
  @action
  handleKeyDown(event) {
    // Support Enter and Space keys for keyboard users
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.handleClick();
    }
  }
  
  @action
  handleClick() {
    this.args.onClick?.();
  }

  <template>
    <div 
      role="button" 
      tabindex="0"
      {{on "click" this.handleClick}}
      {{on "keydown" this.handleKeyDown}}
      aria-label="Close dialog"
    >
      <XIcon />
    </div>
  </template>
}
```

Always use native semantic elements when possible. When creating custom interactive elements, ensure they're keyboard accessible and have proper ARIA attributes.

**References:**
- [ARIA Authoring Practices Guide (W3C)](https://www.w3.org/WAI/ARIA/apg/)
- [Using ARIA (W3C)](https://www.w3.org/TR/using-aria/)
- [ARIA in HTML (WHATWG)](https://html.spec.whatwg.org/multipage/aria.html#aria)
- [Ember Accessibility Guide](https://guides.emberjs.com/release/accessibility/)

---

---
title: Use Ember Concurrency for Task Management
impact: HIGH
impactDescription: Better async control and cancelation
tags: ember-concurrency, tasks, async, cancelation
---

## Use Ember Concurrency for Task Management

Use ember-concurrency for managing async operations with automatic cancelation, derived state, and better control flow.

**Incorrect (manual async handling):**

```javascript
// app/components/search.gjs
import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';

class Search extends Component {
  @tracked results = [];
  @tracked isSearching = false;
  @tracked error = null;
  currentRequest = null;
  
  @action
  async search(query) {
    // Cancel previous request
    if (this.currentRequest) {
      this.currentRequest.abort();
    }
    
    this.isSearching = true;
    this.error = null;
    
    const controller = new AbortController();
    this.currentRequest = controller;
    
    try {
      const response = await fetch(`/api/search?q=${query}`, {
        signal: controller.signal
      });
      this.results = await response.json();
    } catch (e) {
      if (e.name !== 'AbortError') {
        this.error = e.message;
      }
    } finally {
      this.isSearching = false;
    }
  }

  <template>
    <input {{on "input" this.search}} />
    {{#if this.isSearching}}Loading...{{/if}}
    {{#if this.error}}Error: {{this.error}}{{/if}}
  </template>
}
```

**Correct (using ember-concurrency):**

```javascript
// app/components/search.gjs
import Component from '@glimmer/component';
import { task, restartableTask } from 'ember-concurrency';

class Search extends Component {
  searchTask = restartableTask(async (query) => {
    const response = await fetch(`/api/search?q=${query}`);
    return response.json();
  });

  <template>
    <input {{on "input" this.searchTask.perform}} />
    
    {{#if this.searchTask.isRunning}}
      <div class="loading">Loading...</div>
    {{/if}}
    
    {{#if this.searchTask.last.isSuccessful}}
      <ul>
        {{#each this.searchTask.last.value as |result|}}
          <li>{{result.name}}</li>
        {{/each}}
      </ul>
    {{/if}}
    
    {{#if this.searchTask.last.isError}}
      <div class="error">{{this.searchTask.last.error.message}}</div>
    {{/if}}
  </template>
}
```

**With debouncing and timeout:**

```javascript
// app/components/autocomplete.gjs
import Component from '@glimmer/component';
import { restartableTask, timeout } from 'ember-concurrency';

class Autocomplete extends Component {
  searchTask = restartableTask(async (query) => {
    // Debounce
    await timeout(300);
    
    const response = await fetch(`/api/autocomplete?q=${query}`);
    return response.json();
  });

  <template>
    <input 
      type="search"
      {{on "input" this.searchTask.perform}}
      placeholder="Search..."
    />
    
    {{#if this.searchTask.isRunning}}
      <div class="spinner"></div>
    {{/if}}
    
    {{#if this.searchTask.lastSuccessful}}
      <ul class="suggestions">
        {{#each this.searchTask.lastSuccessful.value as |item|}}
          <li>{{item.title}}</li>
        {{/each}}
      </ul>
    {{/if}}
  </template>
}
```

**Task modifiers for different concurrency patterns:**

```javascript
import { task, dropTask, enqueueTask } from 'ember-concurrency';

// restartableTask: cancels previous, starts new
// dropTask: ignores new if one is running
// enqueueTask: queues tasks sequentially

saveTask = dropTask(async (data) => {
  // Prevents double-submit
  await fetch('/api/save', {
    method: 'POST',
    body: JSON.stringify(data)
  });
});
```

ember-concurrency provides automatic cancelation, derived state (isRunning, isIdle), and better async patterns without manual tracking.

Reference: [ember-concurrency](https://ember-concurrency.com/)

---

---
title: Use Helper Functions for Reusable Logic
impact: LOW-MEDIUM
impactDescription: Better code reuse and testability
tags: helpers, templates, reusability, advanced
---

## Use Helper Functions for Reusable Logic

Extract reusable template logic into helper functions that can be tested independently and used across templates.

**Incorrect (logic duplicated in components):**

```javascript
// app/components/user-card.js
class UserCard extends Component {
  get formattedDate() {
    const date = new Date(this.args.user.createdAt);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  }
}

// app/components/post-card.js - same logic duplicated!
class PostCard extends Component {
  get formattedDate() {
    // Same implementation...
  }
}
```

**Correct (reusable helper - co-located with component):**

```javascript
// app/components/post-list/format-relative-date.js
// Co-locate with the component that uses it for better organization

export function formatRelativeDate(date) {
  const dateObj = new Date(date);
  const now = new Date();
  const diffMs = now - dateObj;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  return dateObj.toLocaleDateString();
}
```

**Alternative (shared helper in utils):**

```javascript
// app/utils/helpers/format-relative-date.js
// Use utils/ directory for helpers shared across many components

export function formatRelativeDate(date) {
  const dateObj = new Date(date);
  const now = new Date();
  const diffMs = now - dateObj;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  return dateObj.toLocaleDateString();
}
```

**Note**: The `app/helpers/` directory has a smaller role in modern Ember. Prefer co-locating helpers with components for better modularity, or use `app/utils/` for truly shared helpers.

```javascript
// app/components/user-card.gjs
import { formatRelativeDate } from '../helpers/format-relative-date';

<template>
  <p>Joined: {{formatRelativeDate @user.createdAt}}</p>
</template>
```

```javascript
// app/components/post-card.gjs
import { formatRelativeDate } from '../helpers/format-relative-date';

<template>
  <p>Posted: {{formatRelativeDate @post.createdAt}}</p>
</template>
```

**For helpers with state, use class-based helpers:**

```javascript
// app/utils/helpers/format-currency.js
export class FormatCurrencyHelper {
  constructor(owner) {
    this.intl = owner.lookup('service:intl');
  }
  
  compute(amount, { currency = 'USD' } = {}) {
    return this.intl.formatNumber(amount, {
      style: 'currency',
      currency
    });
  }
}
```

**Common helpers to create:**
- Date/time formatting
- Number formatting
- String manipulation
- Array operations
- Conditional logic

Helpers promote code reuse, are easier to test, and keep components focused on behavior.

Reference: [Ember Helpers](https://guides.emberjs.com/release/components/helper-functions/)

---

---
title: Use Modifiers for DOM Side Effects
impact: LOW-MEDIUM
impactDescription: Better separation of concerns
tags: modifiers, dom, lifecycle, advanced
---

## Use Modifiers for DOM Side Effects

Use modifiers (element modifiers) to handle DOM side effects and lifecycle events in a reusable, composable way.

**Incorrect (manual DOM manipulation in component):**

```javascript
// app/components/chart.gjs
import Component from '@glimmer/component';

class Chart extends Component {
  chartInstance = null;
  
  constructor() {
    super(...arguments);
    // Can't access element here - element doesn't exist yet!
  }
  
  willDestroy() {
    super.willDestroy(...arguments);
    this.chartInstance?.destroy();
  }

  <template>
    <canvas id="chart-canvas"></canvas>
    {{! Manual setup is error-prone and not reusable }}
  </template>
}
```

**Correct (function modifier - preferred for simple side effects):**

```javascript
// app/modifiers/chart.js
import { modifier } from 'ember-modifier';

export default modifier((element, [config]) => {
  // Initialize chart
  const chartInstance = new Chart(element, config);
  
  // Return cleanup function
  return () => {
    chartInstance.destroy();
  };
});
```

**Also correct (class-based modifier for complex state):**

```javascript
// app/modifiers/chart.js
import Modifier from 'ember-modifier';
import { registerDestructor } from '@ember/destroyable';

export default class ChartModifier extends Modifier {
  chartInstance = null;

  modify(element, [config]) {
    // Cleanup previous instance if config changed
    if (this.chartInstance) {
      this.chartInstance.destroy();
    }
    
    this.chartInstance = new Chart(element, config);
    
    // Register cleanup
    registerDestructor(this, () => {
      this.chartInstance?.destroy();
    });
  }
}
```

```javascript
// app/components/chart.gjs
import chart from '../modifiers/chart';

<template>
  <canvas {{chart @config}}></canvas>
</template>
```

**Use function modifiers** for simple side effects. Use class-based modifiers only when you need complex state management.

**For commonly needed modifiers, use ember-modifier helpers:**

```javascript
// app/modifiers/autofocus.js
import { modifier } from 'ember-modifier';

export default modifier((element) => {
  element.focus();
});
```

```javascript
// app/components/input-field.gjs
import autofocus from '../modifiers/autofocus';

<template>
  <input {{autofocus}} type="text" />
</template>
```

**Use ember-resize-observer-modifier for resize handling:**

```bash
ember install ember-resize-observer-modifier
```

```javascript
// app/components/resizable.gjs
import onResize from 'ember-resize-observer-modifier';

<template>
  <div {{on-resize this.handleResize}}>
    Content that responds to size changes
  </div>
</template>
```

Modifiers provide a clean, reusable way to manage DOM side effects without coupling to specific components.

Reference: [Ember Modifiers](https://guides.emberjs.com/release/components/template-lifecycle-dom-and-modifiers/)

---

---
title: Use Resources for Declarative Data Management
impact: HIGH
impactDescription: Better lifecycle management and reactivity
tags: resources, lifecycle, data-management, declarative
---

## Use Resources for Declarative Data Management

Use the Resources pattern for declarative data management with automatic cleanup and lifecycle management instead of manual imperative code.

**Incorrect (manual lifecycle management):**

```javascript
// app/components/live-data.gjs
import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';

class LiveData extends Component {
  @tracked data = null;
  intervalId = null;
  
  constructor() {
    super(...arguments);
    this.fetchData();
    this.intervalId = setInterval(() => this.fetchData(), 5000);
  }
  
  async fetchData() {
    const response = await fetch('/api/data');
    this.data = await response.json();
  }
  
  willDestroy() {
    super.willDestroy(...arguments);
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  <template>
    <div>{{this.data}}</div>
  </template>
}
```

**Correct (using Modifiers with registerDestructor - preferred pattern):**

```javascript
// app/modifiers/poll-data.js
import { modifier } from 'ember-modifier';
import { registerDestructor } from '@ember/destroyable';

export default modifier((element, [callback, interval = 5000]) => {
  const pollInterval = setInterval(callback, interval);
  
  // Automatic cleanup
  registerDestructor(element, () => clearInterval(pollInterval));
});
```

```javascript
// app/components/live-data.gjs
import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import pollData from '../modifiers/poll-data';

class LiveData extends Component {
  @tracked data = null;
  
  @action
  async fetchData() {
    const response = await fetch('/api/data');
    this.data = await response.json();
  }

  <template>
    <div {{pollData this.fetchData 5000}}>
      {{this.data}}
    </div>
  </template>
}
```

**Alternative: Using Tracked Properties with Effects**

```javascript
// app/components/user-profile.gjs
import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { registerDestructor } from '@ember/destroyable';

class UserProfile extends Component {
  @tracked userData = null;
  @tracked error = null;
  
  constructor(owner, args) {
    super(owner, args);
    
    const controller = new AbortController();
    
    // Register cleanup
    registerDestructor(this, () => controller.abort());
    
    this.loadUser(controller.signal);
  }
  
  async loadUser(signal) {
    try {
      const response = await fetch(`/api/users/${this.args.userId}`, { signal });
      this.userData = await response.json();
    } catch (e) {
      if (e.name !== 'AbortError') {
        this.error = e;
      }
    }
  }

  <template>
    {{#if this.error}}
      <div>Error: {{this.error.message}}</div>
    {{else if this.userData}}
      <h1>{{this.userData.name}}</h1>
    {{/if}}
  </template>
}
```

Resources and modifiers with `registerDestructor` provide automatic cleanup, prevent memory leaks, and offer better composition patterns.

Reference: [Ember Destroyables](https://api.emberjs.com/ember/release/modules/@ember%2Fdestroyable)

---

---
title: Avoid Importing Entire Addon Namespaces
impact: CRITICAL
impactDescription: 200-500ms import cost reduction
tags: bundle, imports, tree-shaking, performance
---

## Avoid Importing Entire Addon Namespaces

Import specific utilities and components directly rather than entire addon namespaces to enable better tree-shaking and reduce bundle size.

**Incorrect (imports entire namespace):**

```javascript
import { tracked } from '@glimmer/tracking';
import Component from '@glimmer/component';
import { action } from '@ember/object';
// OK - these are already optimized

// But avoid this pattern with utility libraries:
import * as lodash from 'lodash';
import * as moment from 'moment';

class My extends Component {
  someMethod() {
    return lodash.debounce(this.handler, 300);
  }
}
```

**Correct (direct imports):**

```javascript
import { tracked } from '@glimmer/tracking';
import Component from '@glimmer/component';
import { action } from '@ember/object';
import debounce from 'lodash/debounce';
import dayjs from 'dayjs'; // moment alternative, smaller

class My extends Component {
  someMethod() {
    return debounce(this.handler, 300);
  }
}
```

**Even better (use Ember utilities when available):**

```javascript
import { tracked } from '@glimmer/tracking';
import Component from '@glimmer/component';
import { action } from '@ember/object';
import { debounce } from '@ember/runloop';

class My extends Component {
  someMethod() {
    return debounce(this, this.handler, 300);
  }
}
```

Direct imports and using built-in Ember utilities reduce bundle size by avoiding unused code.

---

---
title: Use Embroider Build Pipeline
impact: CRITICAL
impactDescription: Modern build system with better performance
tags: bundle, embroider, build-performance, vite
---

## Use Embroider Build Pipeline

Use Embroider, Ember's modern build pipeline, with Vite for faster builds, better tree-shaking, and smaller bundles.

**Incorrect (classic build pipeline):**

```javascript
// ember-cli-build.js
const EmberApp = require('ember-cli/lib/broccoli/ember-app');

module.exports = function (defaults) {
  const app = new EmberApp(defaults, {});
  return app.toTree();
};
```

**Correct (Embroider with Vite):**

```javascript
// ember-cli-build.js
const EmberApp = require('ember-cli/lib/broccoli/ember-app');
const { compatBuild } = require('@embroider/compat');

module.exports = async function (defaults) {
  const { buildOnce } = await import('@embroider/vite');
  
  let app = new EmberApp(defaults, {
    // Add options here
  });

  return compatBuild(app, buildOnce);
};
```

**For stricter static analysis (optimized mode):**

```javascript
// ember-cli-build.js
const EmberApp = require('ember-cli/lib/broccoli/ember-app');
const { compatBuild } = require('@embroider/compat');

module.exports = async function (defaults) {
  const { buildOnce } = await import('@embroider/vite');
  
  let app = new EmberApp(defaults, {
    // Add options here
  });

  return compatBuild(app, buildOnce, {
    // Enable static analysis for better tree-shaking
    staticAddonTestSupportTrees: true,
    staticAddonTrees: true,
    staticHelpers: true,
    staticModifiers: true,
    staticComponents: true,
  });
};
```

Embroider provides a modern build pipeline with Vite that offers faster builds and better optimization compared to the classic Ember CLI build system.

Reference: [Embroider Documentation](https://github.com/embroider-build/embroider)

---

---
title: Lazy Load Heavy Dependencies
impact: CRITICAL
impactDescription: 30-50% initial bundle reduction
tags: bundle, lazy-loading, dynamic-imports, performance
---

## Lazy Load Heavy Dependencies

Use dynamic imports to load heavy libraries only when needed, reducing initial bundle size.

**Incorrect (loaded upfront):**

```javascript
import Component from '@glimmer/component';
import Chart from 'chart.js/auto'; // 300KB library loaded immediately
import hljs from 'highlight.js'; // 500KB library loaded immediately

class Dashboard extends Component {
  get showChart() {
    return this.args.hasData;
  }
}
```

**Correct (lazy loaded with error/loading state handling):**

```javascript
import Component from '@glimmer/component';
import { getPromiseState } from 'reactiveweb/promise';

class Dashboard extends Component {
  // Use getPromiseState to model promise state for error/loading handling
  chartLoader = getPromiseState(async () => {
    const { default: Chart } = await import('chart.js/auto');
    return Chart;
  });
  
  highlighterLoader = getPromiseState(async () => {
    const { default: hljs } = await import('highlight.js');
    return hljs;
  });

  loadChart = () => {
    // Triggers lazy load, handles loading/error states automatically
    return this.chartLoader.value;
  };

  highlightCode = (code) => {
    const hljs = this.highlighterLoader.value;
    if (hljs) {
      return hljs.highlightAuto(code);
    }
    return code;
  };

  <template>
    {{#if this.chartLoader.isLoading}}
      <p>Loading chart library...</p>
    {{else if this.chartLoader.isError}}
      <p>Error loading chart: {{this.chartLoader.error.message}}</p>
    {{else if this.chartLoader.isResolved}}
      <canvas {{on "click" this.loadChart}}></canvas>
    {{/if}}
  </template>
}
```

**Note**: Always model promise state (loading/error/resolved) using `getPromiseState` from `reactiveweb/promise` to handle slow networks and errors properly.

**Alternative (use template helper for components):**

```javascript
// app/helpers/ensure-loaded.js
import { helper } from '@ember/component/helper';

export default helper(async function ensureLoaded([modulePath]) {
  const module = await import(modulePath);
  return module.default;
});
```

Dynamic imports reduce initial bundle size by 30-50%, improving Time to Interactive.

---

---
title: Validate Component Arguments
impact: MEDIUM
impactDescription: Better error messages and type safety
tags: components, validation, arguments, typescript
---

## Validate Component Arguments

Validate component arguments for better error messages, documentation, and type safety.

**Incorrect (no argument validation):**

```javascript
// app/components/user-card.gjs
import Component from '@glimmer/component';

class UserCard extends Component {
  <template>
    <div class="user-card">
      <h3>{{@user.name}}</h3>
      <p>{{@user.email}}</p>
    </div>
  </template>
}
```

**Correct (with TypeScript signature):**

```typescript
// app/components/user-card.gts
import Component from '@glimmer/component';

interface UserCardSignature {
  Args: {
    user: {
      name: string;
      email: string;
      avatarUrl?: string;
    };
    onEdit?: (user: UserCardSignature['Args']['user']) => void;
  };
  Blocks: {
    default: [];
  };
  Element: HTMLDivElement;
}

class UserCard extends Component<UserCardSignature> {
  <template>
    <div class="user-card" ...attributes>
      <h3>{{@user.name}}</h3>
      <p>{{@user.email}}</p>
      
      {{#if @user.avatarUrl}}
        <img src={{@user.avatarUrl}} alt={{@user.name}} />
      {{/if}}
      
      {{#if @onEdit}}
        <button {{on "click" (fn @onEdit @user)}}>Edit</button>
      {{/if}}
      
      {{yield}}
    </div>
  </template>
}
```

**Runtime validation with assertions (using getters):**

```javascript
// app/components/data-table.gjs
import Component from '@glimmer/component';
import { assert } from '@ember/debug';

class DataTable extends Component {
  // Use getters so validation runs on each access and catches arg changes
  get columns() {
    assert(
      'DataTable requires @columns argument',
      this.args.columns && Array.isArray(this.args.columns)
    );
    
    assert(
      '@columns must be an array of objects with "key" and "label" properties',
      this.args.columns.every(col => col.key && col.label)
    );
    
    return this.args.columns;
  }
  
  get rows() {
    assert(
      'DataTable requires @rows argument',
      this.args.rows && Array.isArray(this.args.rows)
    );
    
    return this.args.rows;
  }

  <template>
    <table class="data-table">
      <thead>
        <tr>
          {{#each this.columns as |column|}}
            <th>{{column.label}}</th>
          {{/each}}
        </tr>
      </thead>
      <tbody>
        {{#each this.rows as |row|}}
          <tr>
            {{#each this.columns as |column|}}
              <td>{{get row column.key}}</td>
            {{/each}}
          </tr>
        {{/each}}
      </tbody>
    </table>
  </template>
}
```

**Template-only component with TypeScript:**

```typescript
// app/components/icon.gts
import type { TOC } from '@ember/component/template-only';

interface IconSignature {
  Args: {
    name: string;
    size?: 'small' | 'medium' | 'large';
  };
  Element: HTMLSpanElement;
}

const Icon: TOC<IconSignature> = <template>
  <span 
    class="icon icon-{{@name}} icon-{{if @size @size "medium"}}"
    ...attributes
  ></span>
</template>;

export default Icon;
```

**Documentation with JSDoc:**

```javascript
// app/components/modal.gjs
import Component from '@glimmer/component';

/**
 * Modal dialog component
 * 
 * @param {Object} args
 * @param {boolean} args.isOpen - Controls modal visibility
 * @param {() => void} args.onClose - Called when modal should close
 * @param {string} [args.title] - Optional modal title
 * @param {string} [args.size='medium'] - Modal size: 'small', 'medium', 'large'
 */
class Modal extends Component {
  <template>
    {{#if @isOpen}}
      <div class="modal modal-{{if @size @size "medium"}}">
        {{#if @title}}
          <h2>{{@title}}</h2>
        {{/if}}
        {{yield}}
        <button {{on "click" @onClose}}>Close</button>
      </div>
    {{/if}}
  </template>
}
```

Argument validation provides better error messages during development, serves as documentation, and enables better IDE support.

Reference: [TypeScript in Ember](https://guides.emberjs.com/release/typescript/)

---

---
title: Avoid Constructors in Components
impact: HIGH
impactDescription: Simpler initialization and better testability
tags: components, constructors, initialization, anti-pattern
---

## Avoid Constructors in Components

Modern Ember components rarely need constructors. Use class fields, @service decorators, and resources for initialization instead.

**Incorrect (using constructor):**

```javascript
// app/components/user-profile.gjs
import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { service } from '@ember/service';

class UserProfile extends Component {
  constructor() {
    super(...arguments);
    
    // Anti-pattern: Manual service lookup
    this.store = this.owner.lookup('service:store');
    this.router = this.owner.lookup('service:router');
    
    // Anti-pattern: Imperative initialization
    this.data = null;
    this.isLoading = false;
    this.error = null;
    
    // Anti-pattern: Side effects in constructor
    this.loadUserData();
  }
  
  async loadUserData() {
    this.isLoading = true;
    try {
      this.data = await this.store.request({ 
        url: `/users/${this.args.userId}` 
      });
    } catch (e) {
      this.error = e;
    } finally {
      this.isLoading = false;
    }
  }

  <template>
    {{#if this.isLoading}}
      <div>Loading...</div>
    {{else if this.error}}
      <div>Error: {{this.error.message}}</div>
    {{else if this.data}}
      <h1>{{this.data.name}}</h1>
    {{/if}}
  </template>
}
```

**Correct (declarative with class fields and resources):**

```javascript
// app/components/user-profile.gjs
import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { service } from '@ember/service';
import { resource, use } from 'ember-resources';

class UserProfile extends Component {
  // Declarative service injection - no constructor needed
  @service store;
  @service router;
  
  // Tracked state as class fields
  @tracked error = null;
  
  // Declarative data loading with automatic cleanup
  @use userData = resource(({ on }) => {
    const controller = new AbortController();
    on.cleanup(() => controller.abort());
    
    return this.store.request({ 
      url: `/users/${this.args.userId}`,
      signal: controller.signal
    }).catch(e => {
      this.error = e;
      return null;
    });
  });

  <template>
    {{#if this.userData.isLoading}}
      <div>Loading...</div>
    {{else if this.error}}
      <div>Error: {{this.error.message}}</div>
    {{else if this.userData.value}}
      <h1>{{this.userData.value.name}}</h1>
    {{/if}}
  </template>
}
```

**When You Might Need a Constructor:**

Very rarely, you might need a constructor for truly exceptional cases. Even then, use modern patterns:

```javascript
// app/components/complex-setup.gjs
import Component from '@glimmer/component';
import { service } from '@ember/service';
import { tracked } from '@glimmer/tracking';

class ComplexSetup extends Component {
  @service store;
  
  @tracked state = null;
  
  constructor(owner, args) {
    super(owner, args);
    
    // Only if you absolutely must do something that can't be done with class fields
    // Even then, prefer resources or modifiers
    if (this.args.legacyInitMode) {
      this.initializeLegacyMode();
    }
  }
  
  initializeLegacyMode() {
    // Rare edge case initialization
  }

  <template>
    <!-- template -->
  </template>
}
```

**Why Avoid Constructors:**

1. **Service Injection**: Use `@service` decorator instead of `owner.lookup()`
2. **Testability**: Class fields are easier to mock and test
3. **Clarity**: Declarative class fields show state at a glance
4. **Side Effects**: Resources and modifiers handle side effects better
5. **Memory Leaks**: Resources auto-cleanup; constructor code doesn't
6. **Reactivity**: Class fields integrate better with tracking
7. **Initialization Order**: No need to worry about super() call timing
8. **Argument Validation**: Constructor validation runs only once; use getters to catch arg changes

**Modern Alternatives:**

| Old Pattern | Modern Alternative |
|-------------|-------------------|
| `constructor() { this.store = owner.lookup('service:store') }` | `@service store;` |
| `constructor() { this.data = null; }` | `@tracked data = null;` |
| `constructor() { this.loadData(); }` | Use resource or modifier |
| `constructor() { this.interval = setInterval(...) }` | Use modifier with registerDestructor |
| `constructor() { this.subscription = ... }` | Use resource with cleanup |

**Performance Impact:**
- **Before**: Constructor runs on every instantiation, manual cleanup risk
- **After**: Class fields initialize efficiently, resources auto-cleanup

Constructors add complexity without benefit in modern Ember. Use declarative class fields and resources instead.

Reference: [Ember Octane Guide](https://guides.emberjs.com/release/upgrading/current-edition/), [ember-resources](https://github.com/NullVoxPopuli/ember-resources)

---

---
title: Avoid Legacy Lifecycle Hooks (did-insert, will-destroy, did-update)
impact: HIGH
impactDescription: Prevents memory leaks and enforces modern patterns
tags: components, lifecycle, anti-pattern, modifiers, derived-data
---

## Avoid Legacy Lifecycle Hooks

**Never use `{{did-insert}}`, `{{will-destroy}}`, or `{{did-update}}` in new code.** These legacy helpers create coupling between templates and component lifecycle, making code harder to test and maintain. Modern Ember provides better alternatives through derived data and custom modifiers.

### Why These Are Problematic

1. **Memory Leaks**: Easy to forget cleanup, especially with `did-insert`
2. **Tight Coupling**: Mixes template concerns with JavaScript logic
3. **Poor Testability**: Lifecycle hooks are harder to unit test
4. **Not Composable**: Can't be easily shared across components
5. **Deprecated Pattern**: Not recommended in modern Ember

### Alternative 1: Use Derived Data

For computed values or reactive transformations, use getters and `@cached`:

**❌ Incorrect (did-update):**

```javascript
// app/components/user-greeting.gjs
import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';

class UserGreeting extends Component {
  @tracked displayName = '';
  
  @action
  updateDisplayName() {
    // Runs on every render - inefficient and error-prone
    this.displayName = `${this.args.user.firstName} ${this.args.user.lastName}`;
  }

  <template>
    <div {{did-update this.updateDisplayName @user}}>
      Hello, {{this.displayName}}
    </div>
  </template>
}
```

**✅ Correct (derived data with getter):**

```javascript
// app/components/user-greeting.gjs
import Component from '@glimmer/component';

class UserGreeting extends Component {
  // Automatically reactive - updates when args change
  get displayName() {
    return `${this.args.user.firstName} ${this.args.user.lastName}`;
  }

  <template>
    <div>
      Hello, {{this.displayName}}
    </div>
  </template>
}
```

**✅ Even better (use @cached for expensive computations):**

```javascript
// app/components/user-stats.gjs
import Component from '@glimmer/component';
import { cached } from '@glimmer/tracking';

class UserStats extends Component {
  @cached
  get sortedPosts() {
    // Expensive computation only runs when @posts changes
    return [...this.args.posts].sort((a, b) => 
      b.createdAt - a.createdAt
    );
  }

  @cached
  get statistics() {
    return {
      total: this.args.posts.length,
      published: this.args.posts.filter(p => p.published).length,
      drafts: this.args.posts.filter(p => !p.published).length
    };
  }

  <template>
    <div>
      <p>Total: {{this.statistics.total}}</p>
      <p>Published: {{this.statistics.published}}</p>
      <p>Drafts: {{this.statistics.drafts}}</p>
      
      <ul>
        {{#each this.sortedPosts as |post|}}
          <li>{{post.title}}</li>
        {{/each}}
      </ul>
    </div>
  </template>
}
```

### Alternative 2: Use Custom Modifiers

For DOM side effects, element setup, or cleanup, use custom modifiers:

**❌ Incorrect (did-insert + will-destroy):**

```javascript
// app/components/chart.gjs
import Component from '@glimmer/component';
import { action } from '@ember/object';

class Chart extends Component {
  chartInstance = null;
  
  @action
  setupChart(element) {
    this.chartInstance = new Chart(element, this.args.config);
  }
  
  willDestroy() {
    super.willDestroy(...arguments);
    // Easy to forget cleanup!
    this.chartInstance?.destroy();
  }

  <template>
    <canvas {{did-insert this.setupChart}}></canvas>
  </template>
}
```

**✅ Correct (custom modifier with automatic cleanup):**

```javascript
// app/modifiers/chart.js
import { modifier } from 'ember-modifier';
import { registerDestructor } from '@ember/destroyable';

export default modifier((element, [config]) => {
  // Setup
  const chartInstance = new Chart(element, config);
  
  // Cleanup happens automatically
  registerDestructor(element, () => {
    chartInstance.destroy();
  });
});
```

```javascript
// app/components/chart.gjs
import chart from '../modifiers/chart';

<template>
  <canvas {{chart @config}}></canvas>
</template>
```

### Alternative 3: Use Resources for Lifecycle Management

For complex state management with automatic cleanup, use `ember-resources`:

**❌ Incorrect (did-insert for data fetching):**

```javascript
// app/components/user-profile.gjs
import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';

class UserProfile extends Component {
  @tracked userData = null;
  @tracked loading = true;
  controller = new AbortController();
  
  @action
  async loadUser() {
    this.loading = true;
    try {
      const response = await fetch(`/api/users/${this.args.userId}`, {
        signal: this.controller.signal
      });
      this.userData = await response.json();
    } finally {
      this.loading = false;
    }
  }
  
  willDestroy() {
    super.willDestroy(...arguments);
    this.controller.abort(); // Easy to forget!
  }

  <template>
    <div {{did-insert this.loadUser}}>
      {{#if this.loading}}
        Loading...
      {{else}}
        {{this.userData.name}}
      {{/if}}
    </div>
  </template>
}
```

**✅ Correct (Resource with automatic cleanup):**

```javascript
// app/resources/user-data.js
import { Resource } from 'ember-resources';
import { tracked } from '@glimmer/tracking';

export default class UserDataResource extends Resource {
  @tracked data = null;
  @tracked loading = true;
  controller = new AbortController();
  
  modify(positional, named) {
    const [userId] = positional;
    this.loadUser(userId);
  }
  
  async loadUser(userId) {
    this.loading = true;
    try {
      const response = await fetch(`/api/users/${userId}`, {
        signal: this.controller.signal
      });
      this.data = await response.json();
    } finally {
      this.loading = false;
    }
  }
  
  willDestroy() {
    // Cleanup happens automatically
    this.controller.abort();
  }
}
```

```javascript
// app/components/user-profile.gjs
import Component from '@glimmer/component';
import UserDataResource from '../resources/user-data';

class UserProfile extends Component {
  userData = UserDataResource.from(this, () => [this.args.userId]);

  <template>
    {{#if this.userData.loading}}
      Loading...
    {{else}}
      {{this.userData.data.name}}
    {{/if}}
  </template>
}
```

### When to Use Each Alternative

| Use Case | Solution | Why |
|----------|----------|-----|
| Computed values | Getters + `@cached` | Reactive, efficient, no lifecycle needed |
| DOM manipulation | Custom modifiers | Encapsulated, reusable, automatic cleanup |
| Data fetching | Resources or ember-concurrency | Declarative, cancelable, automatic cleanup |
| Event listeners | `{{on}}` modifier | Built-in, automatic cleanup |
| Focus management | Custom modifier or ember-focus-trap | Proper lifecycle, accessibility |

### Migration Strategy

If you have existing code using these hooks:

1. **Identify the purpose**: What is the hook doing?
2. **Choose the right alternative**:
   - Deriving data? → Use getters/`@cached`
   - DOM setup/teardown? → Use a custom modifier
   - Complex async lifecycle? → Use a Resource
3. **Test thoroughly**: Ensure cleanup happens correctly
4. **Remove the legacy hook**: Delete `{{did-insert}}`, `{{will-destroy}}`, or `{{did-update}}`

### Performance Benefits

Modern alternatives provide better performance:

- **Getters**: Only compute when dependencies change
- **@cached**: Memoizes expensive computations
- **Modifiers**: Scoped to specific elements, composable
- **Resources**: Declarative lifecycle, easier to optimize

### Common Pitfalls to Avoid

❌ **Don't use `willDestroy()` for cleanup when a modifier would work**
❌ **Don't use `@action` + `did-insert` when a getter would suffice**
❌ **Don't manually track changes when `@cached` handles it automatically**
❌ **Don't forget `registerDestructor` in custom modifiers**

### Summary

Modern Ember provides superior alternatives to legacy lifecycle hooks:

- **Derived Data**: Use getters and `@cached` for reactive computations
- **DOM Side Effects**: Use custom modifiers with `registerDestructor`
- **Complex Lifecycle**: Use Resources from ember-resources
- **Better Code**: More testable, composable, and maintainable

**Never use `{{did-insert}}`, `{{will-destroy}}`, or `{{did-update}}` in new code.**

Reference: 
- [Ember Modifiers](https://github.com/ember-modifier/ember-modifier)
- [ember-resources](https://github.com/NullVoxPopuli/ember-resources)
- [Glimmer Tracking](https://guides.emberjs.com/release/in-depth-topics/autotracking-in-depth/)

---

---
title: Use @cached for Expensive Getters
impact: HIGH
impactDescription: 50-90% reduction in recomputation
tags: components, performance, caching, tracked
---

## Use @cached for Expensive Getters

Use `@cached` from `@glimmer/tracking` to memoize expensive computations that depend on tracked properties. The cached value is automatically invalidated when dependencies change.

**Incorrect (recomputes on every access):**

```javascript
import Component from '@glimmer/component';

class DataTable extends Component {
  get filteredAndSortedData() {
    // Expensive: runs on every access, even if nothing changed
    return this.args.data
      .filter(item => item.status === this.args.filter)
      .sort((a, b) => a[this.args.sortBy] - b[this.args.sortBy])
      .map(item => this.transformItem(item));
  }
}
```

**Correct (cached computation):**

```javascript
import Component from '@glimmer/component';
import { cached } from '@glimmer/tracking';

class DataTable extends Component {
  @cached
  get filteredAndSortedData() {
    // Computed once per unique combination of dependencies
    return this.args.data
      .filter(item => item.status === this.args.filter)
      .sort((a, b) => a[this.args.sortBy] - b[this.args.sortBy])
      .map(item => this.transformItem(item));
  }
  
  transformItem(item) {
    // Expensive transformation
    return { ...item, computed: this.expensiveCalculation(item) };
  }
}
```

`@cached` memoizes the getter result and only recomputes when tracked dependencies change, providing 50-90% reduction in unnecessary work.

Reference: [@cached decorator](https://guides.emberjs.com/release/in-depth-topics/autotracking-in-depth/#toc_caching)

---

---
title: Use Class Fields for Component Composition
impact: MEDIUM-HIGH
impactDescription: Better composition and initialization patterns
tags: components, class-fields, composition, initialization
---

## Use Class Fields for Component Composition

Use class fields for clean component composition, initialization, and dependency injection patterns.

**Incorrect (imperative initialization, scattered state):**

```javascript
// app/components/data-manager.gjs
import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { service } from '@ember/service';

class DataManager extends Component {
  @service store;
  @service router;
  
  // Scattered state management - hard to track relationships
  @tracked currentUser = null;
  @tracked isLoading = false;
  @tracked error = null;
  
  loadData = async () => {
    this.isLoading = true;
    try {
      this.currentUser = await this.store.request({ url: '/users/me' });
    } catch (e) {
      this.error = e;
    } finally {
      this.isLoading = false;
    }
  };

  <template>
    <div>{{this.currentUser.name}}</div>
  </template>
}
```

**Correct (class fields with proper patterns):**

```javascript
// app/components/data-manager.gjs
import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { service } from '@ember/service';
import { resource } from 'ember-resources';

class DataManager extends Component {
  // Service injection as class fields
  @service store;
  @service router;
  
  // Tracked state as class fields
  @tracked error = null;
  
  // Resource for data loading
  currentUser = resource(({ on }) => {
    const controller = new AbortController();
    on.cleanup(() => controller.abort());
    
    return this.store.request({ 
      url: '/users/me',
      signal: controller.signal 
    }).catch(e => {
      this.error = e;
      return null;
    });
  });

  <template>
    {{#if this.currentUser.value}}
      <div>{{this.currentUser.value.name}}</div>
    {{else if this.error}}
      <div class="error">{{this.error.message}}</div>
    {{/if}}
  </template>
}
```

**Composition through class field assignment:**

```javascript
// app/components/form-container.gjs
import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { TrackedObject } from 'tracked-built-ins';

class FormContainer extends Component {
  // Compose form state
  @tracked formData = new TrackedObject({
    firstName: '',
    lastName: '',
    email: '',
    preferences: {
      newsletter: false,
      notifications: true
    }
  });
  
  // Compose validation state
  @tracked errors = new TrackedObject({});
  
  // Compose UI state
  @tracked ui = new TrackedObject({
    isSubmitting: false,
    isDirty: false,
    showErrors: false
  });
  
  // Computed field based on composed state
  get isValid() {
    return Object.keys(this.errors).length === 0 && 
           this.formData.email && 
           this.formData.firstName;
  }
  
  get canSubmit() {
    return this.isValid && !this.ui.isSubmitting && this.ui.isDirty;
  }
  
  updateField = (field, value) => {
    this.formData[field] = value;
    this.ui.isDirty = true;
    this.validate(field, value);
  };
  
  validate(field, value) {
    if (field === 'email' && !value.includes('@')) {
      this.errors.email = 'Invalid email';
    } else {
      delete this.errors[field];
    }
  }

  <template>
    <form>
      <input 
        value={{this.formData.firstName}}
        {{on "input" (pick "target.value" (fn this.updateField "firstName"))}}
      />
      
      <button disabled={{not this.canSubmit}}>
        Submit
      </button>
    </form>
  </template>
}
```

**Mixin-like composition with class fields:**

```javascript
// app/utils/pagination-mixin.js
import { tracked } from '@glimmer/tracking';

export class PaginationState {
  @tracked page = 1;
  @tracked perPage = 20;
  
  get offset() {
    return (this.page - 1) * this.perPage;
  }
  
  nextPage = () => {
    this.page++;
  };
  
  prevPage = () => {
    if (this.page > 1) this.page--;
  };
  
  goToPage = (page) => {
    this.page = page;
  };
}
```

```javascript
// app/components/paginated-list.gjs
import Component from '@glimmer/component';
import { cached } from '@glimmer/tracking';
import { PaginationState } from '../utils/pagination-mixin';

class PaginatedList extends Component {
  // Compose pagination functionality
  pagination = new PaginationState();
  
  @cached
  get paginatedItems() {
    const start = this.pagination.offset;
    const end = start + this.pagination.perPage;
    return this.args.items.slice(start, end);
  }
  
  get totalPages() {
    return Math.ceil(this.args.items.length / this.pagination.perPage);
  }

  <template>
    <div class="list">
      {{#each this.paginatedItems as |item|}}
        <div>{{item.name}}</div>
      {{/each}}
      
      <div class="pagination">
        <button 
          {{on "click" this.pagination.prevPage}}
          disabled={{eq this.pagination.page 1}}
        >
          Previous
        </button>
        
        <span>Page {{this.pagination.page}} of {{this.totalPages}}</span>
        
        <button 
          {{on "click" this.pagination.nextPage}}
          disabled={{eq this.pagination.page this.totalPages}}
        >
          Next
        </button>
      </div>
    </div>
  </template>
}
```

**Shareable state objects:**

```javascript
// app/utils/selection-state.js
import { tracked } from '@glimmer/tracking';
import { TrackedSet } from 'tracked-built-ins';

export class SelectionState {
  @tracked selectedIds = new TrackedSet();
  
  get count() {
    return this.selectedIds.size;
  }
  
  get hasSelection() {
    return this.selectedIds.size > 0;
  }
  
  isSelected(id) {
    return this.selectedIds.has(id);
  }
  
  toggle = (id) => {
    if (this.selectedIds.has(id)) {
      this.selectedIds.delete(id);
    } else {
      this.selectedIds.add(id);
    }
  };
  
  selectAll = (items) => {
    items.forEach(item => this.selectedIds.add(item.id));
  };
  
  clear = () => {
    this.selectedIds.clear();
  };
}
```

```javascript
// app/components/selectable-list.gjs
import Component from '@glimmer/component';
import { SelectionState } from '../utils/selection-state';

class SelectableList extends Component {
  // Compose selection behavior
  selection = new SelectionState();
  
  get selectedItems() {
    return this.args.items.filter(item => 
      this.selection.isSelected(item.id)
    );
  }

  <template>
    <div class="toolbar">
      <button {{on "click" (fn this.selection.selectAll @items)}}>
        Select All
      </button>
      <button {{on "click" this.selection.clear}}>
        Clear
      </button>
      <span>{{this.selection.count}} selected</span>
    </div>
    
    <ul>
      {{#each @items as |item|}}
        <li class={{if (this.selection.isSelected item.id) "selected"}}>
          <input 
            type="checkbox"
            checked={{this.selection.isSelected item.id}}
            {{on "change" (fn this.selection.toggle item.id)}}
          />
          {{item.name}}
        </li>
      {{/each}}
    </ul>
    
    {{#if this.selection.hasSelection}}
      <div class="actions">
        <button>Delete {{this.selection.count}} items</button>
      </div>
    {{/if}}
  </template>
}
```

Class fields provide clean composition patterns, better initialization, and shareable state objects that can be tested independently.

Reference: [JavaScript Class Fields](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes/Public_class_fields)

---

---
title: Use Component Composition Patterns
impact: HIGH
impactDescription: Better code reuse and maintainability
tags: components, composition, yield, blocks, contextual-components
---

## Use Component Composition Patterns

Use component composition with yield blocks, named blocks, and contextual components for flexible, reusable UI patterns.

**Incorrect (monolithic component):**

```javascript
// app/components/user-card.gjs
import Component from '@glimmer/component';

class UserCard extends Component {
  <template>
    <div class="user-card">
      <div class="header">
        <img src={{@user.avatar}} alt={{@user.name}} />
        <h3>{{@user.name}}</h3>
        <p>{{@user.email}}</p>
      </div>
      
      {{#if @showActions}}
        <div class="actions">
          <button {{on "click" @onEdit}}>Edit</button>
          <button {{on "click" @onDelete}}>Delete</button>
        </div>
      {{/if}}
      
      {{#if @showStats}}
        <div class="stats">
          <span>Posts: {{@user.postCount}}</span>
          <span>Followers: {{@user.followers}}</span>
        </div>
      {{/if}}
    </div>
  </template>
}
```

**Correct (composable with named blocks):**

```javascript
// app/components/user-card.gjs
import Component from '@glimmer/component';

class UserCard extends Component {
  <template>
    <div class="user-card" ...attributes>
      {{#if (has-block "header")}}
        {{yield to="header"}}
      {{else}}
        <div class="header">
          <img src={{@user.avatar}} alt={{@user.name}} />
          <h3>{{@user.name}}</h3>
        </div>
      {{/if}}
      
      {{yield @user to="default"}}
      
      {{#if (has-block "actions")}}
        <div class="actions">
          {{yield @user to="actions"}}
        </div>
      {{/if}}
      
      {{#if (has-block "footer")}}
        <div class="footer">
          {{yield @user to="footer"}}
        </div>
      {{/if}}
    </div>
  </template>
}
```

**Usage with flexible composition:**

```javascript
// app/components/user-list.gjs
import UserCard from './user-card';

<template>
  {{#each @users as |user|}}
    <UserCard @user={{user}}>
      <:header>
        <div class="custom-header">
          <span class="badge">{{user.role}}</span>
          <h3>{{user.name}}</h3>
        </div>
      </:header>
      
      <:default as |u|>
        <p class="bio">{{u.bio}}</p>
        <p class="email">{{u.email}}</p>
      </:default>
      
      <:actions as |u|>
        <button {{on "click" (fn @onEdit u)}}>Edit</button>
        <button {{on "click" (fn @onDelete u)}}>Delete</button>
      </:actions>
      
      <:footer as |u|>
        <div class="stats">
          Posts: {{u.postCount}} | Followers: {{u.followers}}
        </div>
      </:footer>
    </UserCard>
  {{/each}}
</template>
```

**Contextual components pattern:**

```javascript
// app/components/data-table.gjs
import Component from '@glimmer/component';
import { hash } from '@ember/helper';

class HeaderCell extends Component {
  <template>
    <th class="sortable" {{on "click" @onSort}}>
      {{yield}}
      {{#if @sorted}}
        <span class="sort-icon">{{if @ascending "↑" "↓"}}</span>
      {{/if}}
    </th>
  </template>
}

class Row extends Component {
  <template>
    <tr class={{if @selected "selected"}}>
      {{yield}}
    </tr>
  </template>
}

class Cell extends Component {
  <template>
    <td>{{yield}}</td>
  </template>
}

class DataTable extends Component {
  <template>
    <table class="data-table">
      {{yield (hash
        Header=HeaderCell
        Row=Row
        Cell=Cell
      )}}
    </table>
  </template>
}
```

**Using contextual components:**

```javascript
// app/components/users-table.gjs
import DataTable from './data-table';

<template>
  <DataTable as |Table|>
    <thead>
      <tr>
        <Table.Header @onSort={{fn @onSort "name"}}>Name</Table.Header>
        <Table.Header @onSort={{fn @onSort "email"}}>Email</Table.Header>
        <Table.Header @onSort={{fn @onSort "role"}}>Role</Table.Header>
      </tr>
    </thead>
    <tbody>
      {{#each @users as |user|}}
        <Table.Row @selected={{eq @selectedId user.id}}>
          <Table.Cell>{{user.name}}</Table.Cell>
          <Table.Cell>{{user.email}}</Table.Cell>
          <Table.Cell>{{user.role}}</Table.Cell>
        </Table.Row>
      {{/each}}
    </tbody>
  </DataTable>
</template>
```

**Renderless component pattern:**

```javascript
// app/components/dropdown.gjs
import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { hash } from '@ember/helper';

class Dropdown extends Component {
  @tracked isOpen = false;
  
  @action
  toggle() {
    this.isOpen = !this.isOpen;
  }
  
  @action
  close() {
    this.isOpen = false;
  }

  <template>
    {{yield (hash
      isOpen=this.isOpen
      toggle=this.toggle
      close=this.close
    )}}
  </template>
}
```

```javascript
// Usage
import Dropdown from './dropdown';

<template>
  <Dropdown as |dd|>
    <button {{on "click" dd.toggle}}>
      Menu {{if dd.isOpen "▲" "▼"}}
    </button>
    
    {{#if dd.isOpen}}
      <ul class="dropdown-menu">
        <li><a href="#" {{on "click" dd.close}}>Profile</a></li>
        <li><a href="#" {{on "click" dd.close}}>Settings</a></li>
        <li><a href="#" {{on "click" dd.close}}>Logout</a></li>
      </ul>
    {{/if}}
  </Dropdown>
</template>
```

Component composition provides flexibility, reusability, and clean separation of concerns while maintaining type safety and clarity.

Reference: [Ember Components - Block Parameters](https://guides.emberjs.com/release/components/block-content/)

---

---
title: Use Native Forms with Platform Validation
category: component
impact: high
---

# Use Native Forms with Platform Validation

Rely on native `<form>` elements and the browser's Constraint Validation API instead of reinventing form handling with JavaScript. The platform is really good at forms.

## Problem

Over-engineering forms with JavaScript when native browser features provide validation, accessibility, and UX patterns for free.

**Incorrect (Too much JavaScript):**
```javascript
// app/components/signup-form.gjs
import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';

class SignupForm extends Component {
  @tracked email = '';
  @tracked emailError = '';
  
  validateEmail = () => {
    // ❌ Reinventing email validation
    if (!this.email.includes('@')) {
      this.emailError = 'Invalid email';
    }
  };

  handleSubmit = (event) => {
    event.preventDefault();
    if (this.emailError) return;
    // Submit logic
  };

  <template>
    <div>
      <input
        type="text"
        value={{this.email}}
        {{on "input" this.updateEmail}}
        {{on "blur" this.validateEmail}}
      />
      {{#if this.emailError}}
        <span class="error">{{this.emailError}}</span>
      {{/if}}
      <button type="button" {{on "click" this.handleSubmit}}>Submit</button>
    </div>
  </template>
}
```

## Solution: Let the Platform Do the Work

Use native `<form>` with proper input types and browser validation:

**Correct (Native form with platform validation):**
```javascript
// app/components/signup-form.gjs
import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { on } from '@ember/modifier';

class SignupForm extends Component {
  @tracked validationErrors = null;

  handleSubmit = (event) => {
    event.preventDefault();
    const form = event.target;
    
    // ✅ Use native checkValidity()
    if (!form.checkValidity()) {
      // Show native validation messages
      form.reportValidity();
      return;
    }

    // ✅ Use FormData API - no tracked state needed!
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);
    
    this.args.onSubmit(data);
  };

  <template>
    <form {{on "submit" this.handleSubmit}}>
      {{! ✅ Browser handles validation automatically }}
      <input
        type="email"
        name="email"
        required
        placeholder="email@example.com"
      />
      
      <input
        type="password"
        name="password"
        required
        minlength="8"
        placeholder="Min 8 characters"
      />
      
      <button type="submit">Sign Up</button>
    </form>
  </template>
}
```

**Performance: -15KB** (no validation libraries needed)
**Accessibility: +100%** (native form semantics and error announcements)
**Code: -50%** (let the platform handle it)

## Custom Validation Messages with Constraint Validation API

Access and display native validation state in your component:

```javascript
// app/components/validated-form.gjs
import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { on } from '@ember/modifier';

class ValidatedForm extends Component {
  @tracked errors = new Map();

  handleInput = (event) => {
    const input = event.target;
    
    // ✅ Access Constraint Validation API
    if (!input.validity.valid) {
      this.errors.set(input.name, input.validationMessage);
    } else {
      this.errors.delete(input.name);
    }
  };

  handleSubmit = (event) => {
    event.preventDefault();
    const form = event.target;
    
    if (!form.checkValidity()) {
      // Trigger native validation UI
      form.reportValidity();
      return;
    }

    const formData = new FormData(form);
    this.args.onSubmit(Object.fromEntries(formData));
  };

  <template>
    <form {{on "submit" this.handleSubmit}}>
      <div>
        <label for="email">Email</label>
        <input
          id="email"
          type="email"
          name="email"
          required
          {{on "input" this.handleInput}}
        />
        {{#if (this.errors.get "email")}}
          <span class="error" role="alert">
            {{this.errors.get "email"}}
          </span>
        {{/if}}
      </div>

      <div>
        <label for="age">Age</label>
        <input
          id="age"
          type="number"
          name="age"
          min="18"
          max="120"
          required
          {{on "input" this.handleInput}}
        />
        {{#if (this.errors.get "age")}}
          <span class="error" role="alert">
            {{this.errors.get "age"}}
          </span>
        {{/if}}
      </div>

      <button type="submit">Submit</button>
    </form>
  </template>
}
```

## Constraint Validation API Properties

The browser provides rich validation state via `input.validity`:

```javascript
handleInput = (event) => {
  const input = event.target;
  const validity = input.validity;
  
  // Check specific validation states:
  if (validity.valueMissing) {
    // required field is empty
  }
  if (validity.typeMismatch) {
    // type="email" but value isn't email format
  }
  if (validity.tooShort || validity.tooLong) {
    // minlength/maxlength violated
  }
  if (validity.rangeUnderflow || validity.rangeOverflow) {
    // min/max violated
  }
  if (validity.patternMismatch) {
    // pattern attribute not matched
  }
  
  // Or use the aggregated validationMessage:
  if (!validity.valid) {
    this.showError(input.name, input.validationMessage);
  }
};
```

## Custom Validation with setCustomValidity

For business logic validation beyond HTML5 constraints:

```javascript
// app/components/password-match-form.gjs
import Component from '@glimmer/component';
import { on } from '@ember/modifier';

class PasswordMatchForm extends Component {
  validatePasswordMatch = (event) => {
    const form = event.target.form;
    const password = form.querySelector('[name="password"]');
    const confirm = form.querySelector('[name="confirm"]');
    
    // ✅ Use setCustomValidity for custom validation
    if (password.value !== confirm.value) {
      confirm.setCustomValidity('Passwords must match');
    } else {
      confirm.setCustomValidity(''); // Clear custom error
    }
  };

  handleSubmit = (event) => {
    event.preventDefault();
    const form = event.target;
    
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const formData = new FormData(form);
    this.args.onSubmit(Object.fromEntries(formData));
  };

  <template>
    <form {{on "submit" this.handleSubmit}}>
      <input
        type="password"
        name="password"
        required
        minlength="8"
        placeholder="Password"
      />
      
      <input
        type="password"
        name="confirm"
        required
        placeholder="Confirm password"
        {{on "input" this.validatePasswordMatch}}
      />
      
      <button type="submit">Create Account</button>
    </form>
  </template>
}
```

## When You Need Controlled State

Use controlled patterns when you need real-time interactivity that isn't form submission:

```javascript
// app/components/live-search.gjs - Controlled state needed for instant search
import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { on } from '@ember/modifier';

class LiveSearch extends Component {
  @tracked query = '';

  updateQuery = (event) => {
    this.query = event.target.value;
    // Instant search as user types
    this.args.onSearch?.(this.query);
  };

  <template>
    {{! Controlled state justified - need instant feedback }}
    <input
      type="search"
      value={{this.query}}
      {{on "input" this.updateQuery}}
      placeholder="Search..."
    />
    {{#if this.query}}
      <p>Searching for: {{this.query}}</p>
    {{/if}}
  </template>
}
```

**Use controlled state when you need:**
- Real-time validation display as user types
- Character counters
- Live search/filtering
- Multi-step forms where state drives UI
- Form state that affects other components

**Use native forms when:**
- Simple submit-and-validate workflows
- Standard HTML5 validation is sufficient
- You want browser-native UX and accessibility
- Simpler code and less JavaScript is better

## References

- [MDN: Constraint Validation API](https://developer.mozilla.org/en-US/docs/Web/API/Constraint_validation)
- [MDN: FormData](https://developer.mozilla.org/en-US/docs/Web/API/FormData)
- [MDN: Form Validation](https://developer.mozilla.org/en-US/docs/Learn/Forms/Form_validation)
- [Ember Guides: Event Handling](https://guides.emberjs.com/release/components/component-state-and-actions/)

---

# Component File Naming and Export Conventions

## Rule

Follow modern Ember component file conventions: use kebab-case filenames, match class names to file names (in PascalCase), and avoid `export default` in .gjs/.gts files.

## Incorrect

```javascript
// app/components/user-card.gjs - WRONG: Component suffix
import Component from '@glimmer/component';

export default class UserCardComponent extends Component {
  <template>
    <div class="user-card">
      {{@name}}
    </div>
  </template>
}
```

```javascript
// app/components/UserProfile.gjs - WRONG: PascalCase filename
import Component from '@glimmer/component';

export default class UserProfile extends Component {
  <template>
    <div class="profile">
      {{@name}}
    </div>
  </template>
}
```

## Correct

```javascript
// app/components/user-card.gjs - CORRECT: kebab-case filename, no Component suffix, no default export
import Component from '@glimmer/component';

class UserCard extends Component {
  <template>
    <div class="user-card">
      {{@name}}
    </div>
  </template>
}
```

```javascript
// app/components/user-profile.gjs - CORRECT: All conventions followed
import Component from '@glimmer/component';
import { service } from '@ember/service';

class UserProfile extends Component {
  @service session;
  
  <template>
    <div class="profile">
      <h1>{{@name}}</h1>
      {{#if this.session.isAuthenticated}}
        <button>Edit Profile</button>
      {{/if}}
    </div>
  </template>
}
```

## Why

**Filename conventions:**
- Kebab-case filenames (`user-card.gjs`, not `UserCard.gjs`) follow web component standards and Ember conventions
- Predictable: component name maps directly to filename (UserCard → user-card.gjs)
- Avoids filesystem case-sensitivity issues across platforms

**Class naming:**
- No "Component" suffix - it's redundant (extends Component already declares the type)
- PascalCase class name matches the capitalized component invocation: `<UserCard />`
- Cleaner code: `UserCard` vs `UserCardComponent`

**No default export:**
- Modern .gjs/.gts files don't need `export default`
- The template compiler automatically exports the component
- Simpler syntax, less boilerplate
- Consistent with strict-mode semantics

## Naming Pattern Reference

| Filename | Class Name | Template Invocation |
|----------|-----------|---------------------|
| `user-card.gjs` | `class UserCard` | `<UserCard />` |
| `loading-spinner.gjs` | `class LoadingSpinner` | `<LoadingSpinner />` |
| `nav-bar.gjs` | `class NavBar` | `<NavBar />` |
| `todo-list.gjs` | `class TodoList` | `<TodoList />` |
| `search-input.gjs` | `class SearchInput` | `<SearchInput />` |

**Conversion rule:** 
- Filename: all lowercase, words separated by hyphens
- Class: PascalCase, same words, no hyphens
- `user-card.gjs` → `class UserCard`

## Special Cases

**Template-only components:**

```javascript
// app/components/simple-card.gjs - Template-only, no class needed
<template>
  <div class="card">
    {{yield}}
  </div>
</template>
```

**Components in subdirectories:**

```javascript
// app/components/ui/button.gjs
import Component from '@glimmer/component';

class Button extends Component {
  <template>
    <button type="button">
      {{yield}}
    </button>
  </template>
}

// Usage: <Ui::Button />
```

**Nested namespaces:**

```javascript
// app/components/admin/user/profile-card.gjs
import Component from '@glimmer/component';

class ProfileCard extends Component {
  <template>
    <div class="admin-profile">
      {{@user.name}}
    </div>
  </template>
}

// Usage: <Admin::User::ProfileCard />
```

## Impact

**Positive:**
- ⚡️ Cleaner, more maintainable code
- 🎯 Predictable mapping between files and classes
- 🌐 Follows web standards (kebab-case)
- 📦 Smaller bundle size (less export overhead)
- 🚀 Better alignment with modern Ember/Glimmer

**Negative:**
- None - this is the modern standard

## Metrics

- **Code clarity**: +30% (shorter, clearer names)
- **Bundle size**: -5-10 bytes per component (no export overhead)
- **Developer experience**: Improved (predictable naming)

## References

- [Ember Components Guide](https://guides.emberjs.com/release/components/)
- [Glimmer Components](https://github.com/glimmerjs/glimmer.js)
- [Template Tag Format RFC](https://github.com/emberjs/rfcs/pull/779)
- [Strict Mode Semantics](https://github.com/emberjs/rfcs/blob/master/text/0496-handlebars-strict-mode.md)

## Related Rules

- component-use-glimmer.md - Modern Glimmer component patterns
- component-strict-mode.md - Template-only components and strict mode
- route-templates.md - Route file naming conventions

---

---
title: Prevent Memory Leaks in Components
impact: HIGH
impactDescription: Avoid memory leaks and resource exhaustion
tags: memory, cleanup, lifecycle, performance
---

## Prevent Memory Leaks in Components

Properly clean up event listeners, timers, and subscriptions to prevent memory leaks.

**Incorrect (no cleanup):**

```javascript
// app/components/live-clock.gjs
import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';

class LiveClock extends Component {
  @tracked time = new Date();
  
  constructor() {
    super(...arguments);
    
    // Memory leak: interval never cleared
    setInterval(() => {
      this.time = new Date();
    }, 1000);
  }

  <template>
    <div>{{this.time}}</div>
  </template>
}
```

**Correct (proper cleanup with registerDestructor):**

```javascript
// app/components/live-clock.gjs
import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { registerDestructor } from '@ember/destroyable';

class LiveClock extends Component {
  @tracked time = new Date();
  
  constructor() {
    super(...arguments);
    
    const intervalId = setInterval(() => {
      this.time = new Date();
    }, 1000);
    
    // Proper cleanup
    registerDestructor(this, () => {
      clearInterval(intervalId);
    });
  }

  <template>
    <div>{{this.time}}</div>
  </template>
}
```

**Event listener cleanup:**

```javascript
// app/components/window-size.gjs
import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { registerDestructor } from '@ember/destroyable';

class WindowSize extends Component {
  @tracked width = window.innerWidth;
  @tracked height = window.innerHeight;
  
  constructor() {
    super(...arguments);
    
    const handleResize = () => {
      this.width = window.innerWidth;
      this.height = window.innerHeight;
    };
    
    window.addEventListener('resize', handleResize);
    
    registerDestructor(this, () => {
      window.removeEventListener('resize', handleResize);
    });
  }

  <template>
    <div>Window: {{this.width}} x {{this.height}}</div>
  </template>
}
```

**Using modifiers for automatic cleanup:**

```javascript
// app/modifiers/window-listener.js
import { modifier } from 'ember-modifier';

export default modifier((element, [eventName, handler]) => {
  window.addEventListener(eventName, handler);
  
  // Automatic cleanup when element is removed
  return () => {
    window.removeEventListener(eventName, handler);
  };
});
```

```javascript
// app/components/resize-aware.gjs
import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import windowListener from '../modifiers/window-listener';

class ResizeAware extends Component {
  @tracked size = { width: 0, height: 0 };
  
  handleResize = () => {
    this.size = {
      width: window.innerWidth,
      height: window.innerHeight
    };
  }

  <template>
    <div {{windowListener "resize" this.handleResize}}>
      {{this.size.width}} x {{this.size.height}}
    </div>
  </template>
}
```

**Abort controller for fetch requests:**

```javascript
// app/components/data-loader.gjs
import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { registerDestructor } from '@ember/destroyable';

class DataLoader extends Component {
  @tracked data = null;
  abortController = new AbortController();
  
  constructor() {
    super(...arguments);
    
    this.loadData();
    
    registerDestructor(this, () => {
      this.abortController.abort();
    });
  }
  
  async loadData() {
    try {
      const response = await fetch('/api/data', {
        signal: this.abortController.signal
      });
      this.data = await response.json();
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Failed to load data:', error);
      }
    }
  }

  <template>
    {{#if this.data}}
      <div>{{this.data.content}}</div>
    {{/if}}
  </template>
}
```

**Using ember-resources for automatic cleanup:**

```javascript
// app/components/websocket-data.gjs
import Component from '@glimmer/component';
import { resource } from 'ember-resources';

class WebsocketData extends Component {
  messages = resource(({ on }) => {
    const messages = [];
    const ws = new WebSocket('wss://example.com/socket');
    
    ws.onmessage = (event) => {
      messages.push(event.data);
    };
    
    // Automatic cleanup
    on.cleanup(() => {
      ws.close();
    });
    
    return messages;
  });

  <template>
    {{#each this.messages.value as |message|}}
      <div>{{message}}</div>
    {{/each}}
  </template>
}
```

Always clean up timers, event listeners, subscriptions, and pending requests to prevent memory leaks and performance degradation.

Reference: [Ember Destroyable](https://api.emberjs.com/ember/release/modules/@ember%2Fdestroyable)

---

---
title: Avoid Unnecessary Tracking
impact: HIGH
impactDescription: 20-40% fewer invalidations
tags: components, tracked, performance, reactivity
---

## Avoid Unnecessary Tracking

Only mark properties as `@tracked` if they need to trigger re-renders when changed. Overusing `@tracked` causes unnecessary invalidations and re-renders.

**Incorrect (everything tracked):**

```javascript
import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';

class Form extends Component {
  @tracked firstName = ''; // Used in template ✓
  @tracked lastName = '';  // Used in template ✓
  @tracked _formId = Date.now(); // Internal, never rendered ✗
  @tracked _validationCache = new Map(); // Internal state ✗
  
  @action
  validate() {
    this._validationCache.set('firstName', this.firstName.length > 0);
    // Unnecessary re-render triggered
  }
}
```

**Correct (selective tracking):**

```javascript
import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';

class Form extends Component {
  @tracked firstName = ''; // Rendered in template
  @tracked lastName = '';  // Rendered in template
  @tracked isValid = false; // Rendered status
  
  _formId = Date.now(); // Not tracked - internal only
  _validationCache = new Map(); // Not tracked - internal state
  
  @action
  validate() {
    this._validationCache.set('firstName', this.firstName.length > 0);
    this.isValid = this._validationCache.get('firstName');
    // Only re-renders when isValid changes
  }
}
```

Only track properties that directly affect the template or other tracked getters to minimize unnecessary re-renders.

---

---
title: Use {{on}} Modifier for Event Handling
impact: MEDIUM
impactDescription: Better memory management and clarity
tags: events, modifiers, on, performance
---

## Use {{on}} Modifier for Event Handling

Use the `{{on}}` modifier for event handling instead of traditional action handlers for better memory management and clearer code.

**Incorrect (traditional action attribute):**

```javascript
// app/components/button.gjs
import Component from '@glimmer/component';
import { action } from '@ember/object';

class Button extends Component {
  @action
  handleClick() {
    this.args.onClick?.();
  }

  <template>
    <button onclick={{this.handleClick}}>
      {{@label}}
    </button>
  </template>
}
```

**Correct (using {{on}} modifier):**

```javascript
// app/components/button.gjs
import Component from '@glimmer/component';
import { on } from '@ember/modifier';

class Button extends Component {
  handleClick = () => {
    this.args.onClick?.();
  }

  <template>
    <button {{on "click" this.handleClick}}>
      {{@label}}
    </button>
  </template>
}
```

**With event options:**

```javascript
// app/components/scroll-tracker.gjs
import Component from '@glimmer/component';
import { on } from '@ember/modifier';

class ScrollTracker extends Component {
  handleScroll = (event) => {
    console.log('Scroll position:', event.target.scrollTop);
  }

  <template>
    <div 
      class="scrollable"
      {{on "scroll" this.handleScroll passive=true}}
    >
      {{yield}}
    </div>
  </template>
}
```

**Multiple event handlers:**

```javascript
// app/components/input-field.gjs
import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { on } from '@ember/modifier';

class InputField extends Component {
  @tracked isFocused = false;
  
  handleFocus = () => {
    this.isFocused = true;
  }
  
  handleBlur = () => {
    this.isFocused = false;
  }
  
  handleInput = (event) => {
    this.args.onInput?.(event.target.value);
  }

  <template>
    <input
      type="text"
      class={{if this.isFocused "focused"}}
      {{on "focus" this.handleFocus}}
      {{on "blur" this.handleBlur}}
      {{on "input" this.handleInput}}
      value={{@value}}
    />
  </template>
}
```

**Using fn helper for arguments:**

```javascript
// app/components/item-list.gjs
import { fn } from '@ember/helper';
import { on } from '@ember/modifier';

<template>
  <ul>
    {{#each @items as |item|}}
      <li>
        {{item.name}}
        <button {{on "click" (fn @onDelete item.id)}}>
          Delete
        </button>
      </li>
    {{/each}}
  </ul>
</template>
```

The `{{on}}` modifier properly cleans up event listeners, supports event options (passive, capture, once), and makes event handling more explicit.

Reference: [Ember Modifiers - on](https://guides.emberjs.com/release/components/template-lifecycle-dom-and-modifiers/#toc_event-handlers)

---

---
title: Build Reactive Chains with Dependent Getters
impact: HIGH
impactDescription: Clear data flow and automatic reactivity
tags: reactivity, getters, tracked, derived-state, composition
---

## Build Reactive Chains with Dependent Getters

Create reactive chains where getters depend on other getters or tracked properties for clear, maintainable data derivation.

**Incorrect (imperative updates):**

```javascript
// app/components/shopping-cart.gjs
import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';

class ShoppingCart extends Component {
  @tracked items = [];
  @tracked subtotal = 0;
  @tracked tax = 0;
  @tracked shipping = 0;
  @tracked total = 0;
  
  @action
  addItem(item) {
    this.items = [...this.items, item];
    this.recalculate();
  }
  
  @action
  removeItem(index) {
    this.items = this.items.filter((_, i) => i !== index);
    this.recalculate();
  }
  
  recalculate() {
    this.subtotal = this.items.reduce((sum, item) => sum + item.price, 0);
    this.tax = this.subtotal * 0.08;
    this.shipping = this.subtotal > 50 ? 0 : 5.99;
    this.total = this.subtotal + this.tax + this.shipping;
  }

  <template>
    <div class="cart">
      <div>Subtotal: ${{this.subtotal}}</div>
      <div>Tax: ${{this.tax}}</div>
      <div>Shipping: ${{this.shipping}}</div>
      <div>Total: ${{this.total}}</div>
    </div>
  </template>
}
```

**Correct (reactive getter chains):**

```javascript
// app/components/shopping-cart.gjs
import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { TrackedArray } from 'tracked-built-ins';

class ShoppingCart extends Component {
  @tracked items = new TrackedArray([]);
  
  // Base calculation
  get subtotal() {
    return this.items.reduce((sum, item) => sum + item.price, 0);
  }
  
  // Depends on subtotal
  get tax() {
    return this.subtotal * 0.08;
  }
  
  // Depends on subtotal
  get shipping() {
    return this.subtotal > 50 ? 0 : 5.99;
  }
  
  // Depends on subtotal, tax, and shipping
  get total() {
    return this.subtotal + this.tax + this.shipping;
  }
  
  // Derived from total
  get formattedTotal() {
    return `$${this.total.toFixed(2)}`;
  }
  
  // Multiple dependencies
  get discount() {
    if (this.items.length >= 5) return this.subtotal * 0.1;
    if (this.subtotal > 100) return this.subtotal * 0.05;
    return 0;
  }
  
  // Depends on total and discount
  get finalTotal() {
    return this.total - this.discount;
  }
  
  @action
  addItem(item) {
    this.items.push(item);
    // All getters automatically update!
  }
  
  @action
  removeItem(index) {
    this.items.splice(index, 1);
    // All getters automatically update!
  }

  <template>
    <div class="cart">
      <div>Items: {{this.items.length}}</div>
      <div>Subtotal: ${{this.subtotal.toFixed 2}}</div>
      <div>Tax: ${{this.tax.toFixed 2}}</div>
      <div>Shipping: ${{this.shipping.toFixed 2}}</div>
      {{#if this.discount}}
        <div class="discount">Discount: -${{this.discount.toFixed 2}}</div>
      {{/if}}
      <div class="total">Total: {{this.formattedTotal}}</div>
    </div>
  </template>
}
```

**Complex reactive chains with @cached:**

```javascript
// app/components/data-analysis.gjs
import Component from '@glimmer/component';
import { cached } from '@glimmer/tracking';

class DataAnalysis extends Component {
  // Base data
  get rawData() {
    return this.args.data || [];
  }
  
  // Level 1: Filter
  @cached
  get validData() {
    return this.rawData.filter(item => item.value != null);
  }
  
  // Level 2: Transform (depends on validData)
  @cached
  get normalizedData() {
    const max = Math.max(...this.validData.map(d => d.value));
    return this.validData.map(item => ({
      ...item,
      normalized: item.value / max
    }));
  }
  
  // Level 2: Statistics (depends on validData)
  @cached
  get statistics() {
    const values = this.validData.map(d => d.value);
    const sum = values.reduce((a, b) => a + b, 0);
    const mean = sum / values.length;
    const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
    
    return {
      count: values.length,
      sum,
      mean,
      stdDev: Math.sqrt(variance),
      min: Math.min(...values),
      max: Math.max(...values)
    };
  }
  
  // Level 3: Depends on normalizedData and statistics
  @cached
  get outliers() {
    const threshold = this.statistics.mean + (2 * this.statistics.stdDev);
    return this.normalizedData.filter(item => item.value > threshold);
  }
  
  // Level 3: Depends on statistics
  get qualityScore() {
    const validRatio = this.validData.length / this.rawData.length;
    const outlierRatio = this.outliers.length / this.validData.length;
    return (validRatio * 0.7) + ((1 - outlierRatio) * 0.3);
  }

  <template>
    <div class="analysis">
      <h3>Data Quality: {{this.qualityScore.toFixed 2}}</h3>
      <div>Valid: {{this.validData.length}} / {{this.rawData.length}}</div>
      <div>Mean: {{this.statistics.mean.toFixed 2}}</div>
      <div>Std Dev: {{this.statistics.stdDev.toFixed 2}}</div>
      <div>Outliers: {{this.outliers.length}}</div>
    </div>
  </template>
}
```

**Combining multiple tracked sources:**

```javascript
// app/components/filtered-list.gjs
import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { cached } from '@glimmer/tracking';

class FilteredList extends Component {
  @tracked searchTerm = '';
  @tracked selectedCategory = 'all';
  @tracked sortDirection = 'asc';
  
  // Depends on args.items and searchTerm
  @cached
  get searchFiltered() {
    if (!this.searchTerm) return this.args.items;
    
    const term = this.searchTerm.toLowerCase();
    return this.args.items.filter(item => 
      item.name.toLowerCase().includes(term) ||
      item.description?.toLowerCase().includes(term)
    );
  }
  
  // Depends on searchFiltered and selectedCategory
  @cached
  get categoryFiltered() {
    if (this.selectedCategory === 'all') return this.searchFiltered;
    
    return this.searchFiltered.filter(item => 
      item.category === this.selectedCategory
    );
  }
  
  // Depends on categoryFiltered and sortDirection
  @cached
  get sorted() {
    const items = [...this.categoryFiltered];
    const direction = this.sortDirection === 'asc' ? 1 : -1;
    
    return items.sort((a, b) => 
      direction * a.name.localeCompare(b.name)
    );
  }
  
  // Final result
  get items() {
    return this.sorted;
  }
  
  // Metadata derived from chain
  get resultsCount() {
    return this.items.length;
  }
  
  get hasFilters() {
    return this.searchTerm || this.selectedCategory !== 'all';
  }

  <template>
    <div class="filtered-list">
      <input 
        type="search"
        value={{this.searchTerm}}
        {{on "input" (pick "target.value" (set this "searchTerm"))}}
      />
      
      <select 
        value={{this.selectedCategory}}
        {{on "change" (pick "target.value" (set this "selectedCategory"))}}
      >
        <option value="all">All Categories</option>
        {{#each @categories as |cat|}}
          <option value={{cat}}>{{cat}}</option>
        {{/each}}
      </select>
      
      <p>Showing {{this.resultsCount}} results</p>
      
      {{#each this.items as |item|}}
        <div>{{item.name}}</div>
      {{/each}}
    </div>
  </template>
}
```

Reactive getter chains provide automatic updates, clear data dependencies, and better performance through intelligent caching with @cached.

Reference: [Glimmer Tracking](https://guides.emberjs.com/release/in-depth-topics/autotracking-in-depth/)

---

---
title: Use Strict Mode and Template-Only Components
impact: HIGH
impactDescription: Better type safety and simpler components
tags: strict-mode, template-only, components, gjs
---

## Use Strict Mode and Template-Only Components

Use strict mode and template-only components for simpler, safer code with better tooling support.

**Incorrect (JavaScript component for simple templates):**

```javascript
// app/components/user-card.gjs
import Component from '@glimmer/component';

class UserCard extends Component {
  <template>
    <div class="user-card">
      <h3>{{@user.name}}</h3>
      <p>{{@user.email}}</p>
    </div>
  </template>
}
```

**Correct (template-only component):**

```javascript
// app/components/user-card.gjs
<template>
  <div class="user-card">
    <h3>{{@user.name}}</h3>
    <p>{{@user.email}}</p>
  </div>
</template>
```

**With TypeScript for better type safety:**

```typescript
// app/components/user-card.gts
import type { TOC } from '@ember/component/template-only';

interface UserCardSignature {
  Args: {
    user: {
      name: string;
      email: string;
    };
  };
}

const UserCard: TOC<UserCardSignature> = <template>
  <div class="user-card">
    <h3>{{@user.name}}</h3>
    <p>{{@user.email}}</p>
  </div>
</template>;

export default UserCard;
```

**Enable strict mode in your app:**

```javascript
// ember-cli-build.js
'use strict';

const EmberApp = require('ember-cli/lib/broccoli/ember-app');

module.exports = function (defaults) {
  const app = new EmberApp(defaults, {
    'ember-cli-babel': {
      enableTypeScriptTransform: true,
    },
  });

  return app.toTree();
};
```

Template-only components are lighter, more performant, and easier to understand. Strict mode provides better error messages and prevents common mistakes.

Reference: [Ember Strict Mode](https://guides.emberjs.com/release/upgrading/current-edition/templates/)

---

---
title: Use Tracked Toolbox for Complex State
impact: HIGH
impactDescription: Cleaner state management
tags: components, tracked, state-management, performance
---

## Use Tracked Toolbox for Complex State

For complex state patterns like maps, sets, and arrays that need fine-grained reactivity, use tracked-toolbox utilities instead of marking entire structures as @tracked.

**Incorrect (tracking entire structures):**

```javascript
import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';

class TodoList extends Component {
  @tracked items = []; // Entire array replaced on every change
  
  addItem = (item) => {
    // Creates new array, invalidates all consumers
    this.items = [...this.items, item];
  };
  
  removeItem = (index) => {
    // Creates new array again
    this.items = this.items.filter((_, i) => i !== index);
  };
}
```

**Correct (using tracked-toolbox):**

```javascript
import Component from '@glimmer/component';
import { TrackedArray } from 'tracked-built-ins';

class TodoList extends Component {
  items = new TrackedArray([]);
  
  // Use arrow functions for methods used in templates (no @action needed)
  addItem = (item) => {
    // Efficiently adds to tracked array
    this.items.push(item);
  };
  
  removeItem = (index) => {
    // Efficiently removes from tracked array
    this.items.splice(index, 1);
  };
}
```

**Also useful for Maps and Sets:**

```javascript
import { TrackedMap, TrackedSet } from 'tracked-built-ins';

class Cache extends Component {
  cache = new TrackedMap(); // Fine-grained reactivity per key
  selected = new TrackedSet(); // Fine-grained reactivity per item
}
```

tracked-built-ins provides fine-grained reactivity and better performance than replacing entire structures.

Reference: [tracked-built-ins](https://github.com/tracked-tools/tracked-built-ins)

---

---
title: Use Glimmer Components Over Classic Components
impact: HIGH
impactDescription: 30-50% faster rendering
tags: components, glimmer, performance, reactivity
---

## Use Glimmer Components Over Classic Components

Glimmer components are lighter, faster, and have a simpler lifecycle than classic Ember components. They don't have two-way bindings or element lifecycle hooks, making them more predictable and performant.

**Incorrect (classic component):**

```javascript
// app/components/user-card.js
import Component from '@ember/component';
import { computed } from '@ember/object';

export default Component.extend({
  tagName: 'div',
  classNames: ['user-card'],
  
  fullName: computed('user.{firstName,lastName}', function() {
    return `${this.user.firstName} ${this.user.lastName}`;
  }),
  
  didInsertElement() {
    this._super(...arguments);
    // Complex lifecycle management
  }
});
```

**Correct (Glimmer component):**

```javascript
// app/components/user-card.gjs
import Component from '@glimmer/component';

class UserCard extends Component {
  get fullName() {
    return `${this.args.user.firstName} ${this.args.user.lastName}`;
  }

  <template>
    <div class="user-card">
      <h3>{{this.fullName}}</h3>
      <p>{{@user.email}}</p>
    </div>
  </template>
}
```

Glimmer components are 30-50% faster, have cleaner APIs, and integrate better with tracked properties.

Reference: [Glimmer Components](https://guides.emberjs.com/release/components/component-state-and-actions/)

---

---
title: No Default Exports (Except Route Templates)
impact: LOW
impactDescription: Better tree-shaking and consistency
tags: exports, modules, code-organization
---

## No Default Exports (Except Route Templates)

Use named exports instead of default exports for better tree-shaking, explicit imports, and easier refactoring. The only exception is route template files.

**Incorrect (default exports):**

```javascript
// app/components/user-card.gjs
import Component from '@glimmer/component';

export default class UserCard extends Component {
  <template>
    <div>{{@user.name}}</div>
  </template>
}
```

**Correct (named exports):**

```javascript
// app/components/user-card.gjs
import Component from '@glimmer/component';

export class UserCard extends Component {
  <template>
    <div>{{@user.name}}</div>
  </template>
}
```

**Why Named Exports:**

1. **Explicit Imports**: Clear what you're importing
2. **Better Tree-shaking**: Bundlers can remove unused exports
3. **Easier Refactoring**: Rename refactoring works better
4. **No Name Confusion**: Import name must match export name
5. **Multiple Exports**: Can export multiple items from one file

**For Helpers:**

```javascript
// ❌ Wrong - default export
// app/utils/format-date.js
export default function formatDate(date) {
  return new Date(date).toLocaleDateString();
}

// ✅ Correct - named export
// app/utils/format-date.js
export function formatDate(date) {
  return new Date(date).toLocaleDateString();
}
```

**For Services:**

```javascript
// ❌ Wrong - default export
// app/services/auth.js
import Service from '@ember/service';

export default class AuthService extends Service {
  // ...
}

// ✅ Correct - named export
// app/services/auth.js
import Service from '@ember/service';

export class AuthService extends Service {
  // ...
}
```

**For Modifiers:**

```javascript
// ❌ Wrong - default export
// app/modifiers/auto-focus.js
import { modifier } from 'ember-modifier';

export default modifier((element) => {
  element.focus();
});

// ✅ Correct - named export
// app/modifiers/auto-focus.js
import { modifier } from 'ember-modifier';

export const autoFocus = modifier((element) => {
  element.focus();
});
```

**Exception: Route Templates**

Route templates are the ONLY place where default exports are used in modern Ember:

```javascript
// ✅ Correct - default export for route template
// app/routes/dashboard.gjs
import Route from '@ember/routing/route';

export default class DashboardRoute extends Route {
  model() {
    return this.store.findAll('dashboard-item');
  }
}

<template>
  <div class="dashboard">
    {{#each this.model as |item|}}
      <DashboardCard @item={{item}} />
    {{/each}}
  </template>
</template>
```

This is because Ember's router expects a default export from route files.

**Multiple Exports from One File:**

```javascript
// app/utils/validators.js
export function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function isPhoneNumber(value) {
  return /^\d{3}-\d{3}-\d{4}$/.test(value);
}

export function isZipCode(value) {
  return /^\d{5}(-\d{4})?$/.test(value);
}

// Import specific validators
import { isEmail, isPhoneNumber } from '../utils/validators';
```

**Import Comparison:**

```javascript
// Default export - can rename arbitrarily
import MyComponent from './my-component'; // Can name it anything
import WhateverIWant from './my-component'; // Still works!

// Named export - explicit and consistent
import { MyComponent } from './my-component'; // Must use exact name
import { MyComponent as MyComp } from './my-component'; // Rename explicitly if needed
```

**Benefits for Tree-shaking:**

```javascript
// app/utils/string-utils.js
export function capitalize(text) { /* ... */ }
export function lowercase(text) { /* ... */ }
export function uppercase(text) { /* ... */ }

// Only imports what's used - unused exports can be removed
import { capitalize } from './utils/string-utils';
// capitalize is bundled, lowercase and uppercase are tree-shaken
```

Use named exports everywhere except route template files for better maintainability and optimization.

Reference: [ES Modules Best Practices](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules)

---

---
title: Use Built-in Helpers Effectively
category: template
impact: medium
---

# Use Built-in Helpers Effectively

Leverage Ember's built-in helpers to write cleaner templates and avoid creating unnecessary custom helpers for common operations.

## Problem

Reinventing common functionality with custom helpers adds maintenance burden and bundle size when built-in helpers already provide the needed functionality.

**Incorrect:**
```javascript
// app/helpers/is-equal.js - Unnecessary custom helper
import { helper } from '@ember/component/helper';

export default helper(function isEqual([a, b]) {
  return a === b;
});

// app/components/user-badge.gjs
import isEqual from '../helpers/is-equal';

class UserBadge extends Component {
  <template>
    {{#if (isEqual @user.role "admin")}}
      <span class="badge">Admin</span>
    {{/if}}
  </template>
}
```

## Solution

Use built-in helpers that ship with Ember:

**Correct:**
```javascript
// app/components/user-badge.gjs
import Component from '@glimmer/component';
import { eq } from '@ember/helper';

class UserBadge extends Component {
  <template>
    {{! Built-in eq helper }}
    {{#if (eq @user.role "admin")}}
      <span class="badge">Admin</span>
    {{/if}}
  </template>
}
```

## Comparison Helpers

```javascript
// app/components/comparison-examples.gjs
import Component from '@glimmer/component';
import { eq, not, and, or, lt, lte, gt, gte } from '@ember/helper';

class ComparisonExamples extends Component {
  <template>
    {{! Equality }}
    {{#if (eq @status "active")}}Active{{/if}}
    
    {{! Negation }}
    {{#if (not @isDeleted)}}Visible{{/if}}
    
    {{! Logical AND }}
    {{#if (and @isPremium @hasAccess)}}Premium Content{{/if}}
    
    {{! Logical OR }}
    {{#if (or @isAdmin @isModerator)}}Moderation Tools{{/if}}
    
    {{! Comparisons }}
    {{#if (gt @score 100)}}High Score!{{/if}}
    {{#if (lte @attempts 3)}}Try again{{/if}}
  </template>
}
```

## Array and Object Helpers

```javascript
// app/components/collection-helpers.gjs
import Component from '@glimmer/component';
import { array, hash } from '@ember/helper';
import { get } from '@ember/helper';

class CollectionHelpers extends Component {
  <template>
    {{! Create array inline }}
    {{#each (array "apple" "banana" "cherry") as |fruit|}}
      <li>{{fruit}}</li>
    {{/each}}
    
    {{! Create object inline }}
    {{#let (hash name="John" age=30 active=true) as |user|}}
      <p>{{user.name}} is {{user.age}} years old</p>
    {{/let}}
    
    {{! Dynamic property access }}
    <p>{{get @user @propertyName}}</p>
  </template>
}
```

## String Helpers

```javascript
// app/components/string-helpers.gjs
import Component from '@glimmer/component';
import { concat } from '@ember/helper';

class StringHelpers extends Component {
  <template>
    {{! Concatenate strings }}
    <p class={{concat "user-" @user.id "-card"}}>
      {{concat @user.firstName " " @user.lastName}}
    </p>
    
    {{! With dynamic values }}
    <img 
      src={{concat "/images/" @category "/" @filename ".jpg"}}
      alt={{concat "Image of " @title}}
    />
  </template>
}
```

## Action Helpers (fn)

```javascript
// app/components/action-helpers.gjs
import Component from '@glimmer/component';
import { fn } from '@ember/helper';
import { on } from '@ember/modifier';

class ActionHelpers extends Component {
  updateValue = (field, event) => {
    this.args.onChange(field, event.target.value);
  };

  deleteItem = (id) => {
    this.args.onDelete(id);
  };

  <template>
    {{! Partial application with fn }}
    <input
      {{on "input" (fn this.updateValue "email")}}
    />
    
    {{#each @items as |item|}}
      <li>
        {{item.name}}
        <button {{on "click" (fn this.deleteItem item.id)}}>
          Delete
        </button>
      </li>
    {{/each}}
  </template>
}
```

## Conditional Helpers (if/unless)

```javascript
// app/components/conditional-inline.gjs
import Component from '@glimmer/component';
import { if as ifHelper } from '@ember/helper';

class ConditionalInline extends Component {
  <template>
    {{! Ternary-like behavior }}
    <span class={{ifHelper @isActive "active" "inactive"}}>
      {{@user.name}}
    </span>
    
    {{! Conditional attribute }}
    <button disabled={{ifHelper @isProcessing true}}>
      {{ifHelper @isProcessing "Processing..." "Submit"}}
    </button>
    
    {{! With default value }}
    <p>{{ifHelper @description @description "No description provided"}}</p>
  </template>
}
```

## Practical Combinations

**Dynamic Classes:**
```javascript
// app/components/dynamic-classes.gjs
import Component from '@glimmer/component';
import { concat, if as ifHelper, and } from '@ember/helper';

class DynamicClasses extends Component {
  <template>
    <div class={{concat
      "card "
      (ifHelper @isPremium "premium ")
      (ifHelper (and @isNew (not @isRead)) "unread ")
      @customClass
    }}>
      <h3>{{@title}}</h3>
    </div>
  </template>
}
```

**List Filtering:**
```javascript
// app/components/filtered-list.gjs
import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { cached } from '@glimmer/tracking';

class FilteredList extends Component {
  @tracked filter = 'all';

  @cached
  get filteredItems() {
    if (this.filter === 'all') return this.args.items;
    return this.args.items.filter(item => item.status === this.filter);
  }

  <template>
    <select {{on "change" (fn (mut this.filter) target.value)}}>
      {{#each (array "all" "active" "pending" "completed") as |option|}}
        <option 
          value={{option}} 
          selected={{eq this.filter option}}
        >
          {{option}}
        </option>
      {{/each}}
    </select>

    {{#each this.filteredItems as |item|}}
      <div class={{concat "item " item.status}}>
        {{item.name}}
      </div>
    {{/each}}
  </template>
}
```

## Complex Example

```javascript
// app/components/user-profile-card.gjs
import Component from '@glimmer/component';
import { 
  eq, not, and, or, if as ifHelper, 
  concat, hash, array, fn, get 
} from '@ember/helper';
import { on } from '@ember/modifier';

class UserProfileCard extends Component {
  updateField = (field, value) => {
    this.args.onUpdate(field, value);
  };

  <template>
    <div class={{concat
      "profile-card "
      (ifHelper @user.isPremium "premium ")
      (ifHelper (and @user.isOnline (not @user.isAway)) "online ")
    }}>
      <h2>{{concat @user.firstName " " @user.lastName}}</h2>
      
      {{#if (or (eq @user.role "admin") (eq @user.role "moderator"))}}
        <span class="badge">
          {{get (hash 
            admin="Administrator" 
            moderator="Moderator"
          ) @user.role}}
        </span>
      {{/if}}
      
      {{#if (and @canEdit (not @user.locked))}}
        <div class="actions">
          {{#each (array "profile" "settings" "privacy") as |section|}}
            <button {{on "click" (fn this.updateField "activeSection" section)}}>
              Edit {{section}}
            </button>
          {{/each}}
        </div>
      {{/if}}
      
      <p class={{ifHelper @user.verified "verified" "unverified"}}>
        {{ifHelper @user.bio @user.bio "No bio provided"}}
      </p>
    </div>
  </template>
}
```

## Performance Impact

- **Built-in helpers**: ~0% overhead (compiled into efficient bytecode)
- **Custom helpers**: 5-15% overhead per helper call
- **Inline logic**: Cleaner templates, better tree-shaking

## When to Use

- **Built-ins**: For all common operations (equality, logic, arrays, strings)
- **Custom helpers**: Only for domain-specific logic not covered by built-ins
- **Component logic**: For complex operations that need @cached or multiple dependencies

## Complete Built-in Helper Reference

**Comparison:**
- `eq` - Equality (===)
- `not` - Negation (!)
- `and` - Logical AND
- `or` - Logical OR
- `lt`, `lte`, `gt`, `gte` - Numeric comparisons

**Collections:**
- `array` - Create array inline
- `hash` - Create object inline
- `get` - Dynamic property access

**Strings:**
- `concat` - Concatenate strings

**Actions:**
- `fn` - Partial application / bind arguments

**Conditionals:**
- `if` - Ternary-like conditional value

**Forms:**
- `mut` - Create settable binding (use sparingly)

## References

- [Ember Built-in Helpers](https://guides.emberjs.com/release/templates/built-in-helpers/)
- [Template Helpers API](https://api.emberjs.com/ember/release/modules/@ember%2Fhelper)
- [fn Helper Guide](https://guides.emberjs.com/release/components/helper-functions/)

---

---
title: Compose Helpers for Reusable Logic
impact: MEDIUM-HIGH
impactDescription: Better code reuse and testability
tags: helpers, composition, functions, pipes, reusability
---

## Compose Helpers for Reusable Logic

Compose helpers to create reusable, testable logic that can be combined in templates and components.

**Incorrect (logic duplicated in templates):**

```javascript
// app/components/user-profile.gjs
<template>
  <div class="profile">
    <h1>{{uppercase (truncate @user.name 20)}}</h1>
    
    {{#if (and @user.isActive (not @user.isDeleted))}}
      <span class="status">Active</span>
    {{/if}}
    
    <p>{{lowercase @user.email}}</p>
    
    {{#if (gt @user.posts.length 0)}}
      <span>Posts: {{@user.posts.length}}</span>
    {{/if}}
  </div>
</template>
```

**Correct (composed helpers):**

```javascript
// app/helpers/display-name.js
export function displayName(name, { maxLength = 20 } = {}) {
  if (!name) return '';
  
  const truncated = name.length > maxLength 
    ? name.slice(0, maxLength) + '...'
    : name;
    
  return truncated.toUpperCase();
}
```

```javascript
// app/helpers/is-visible-user.js
export function isVisibleUser(user) {
  return user && user.isActive && !user.isDeleted;
}
```

```javascript
// app/helpers/format-email.js
export function formatEmail(email) {
  return email?.toLowerCase() || '';
}
```

```javascript
// app/components/user-profile.gjs
import { displayName } from '../helpers/display-name';
import { isVisibleUser } from '../helpers/is-visible-user';
import { formatEmail } from '../helpers/format-email';

<template>
  <div class="profile">
    <h1>{{displayName @user.name}}</h1>
    
    {{#if (isVisibleUser @user)}}
      <span class="status">Active</span>
    {{/if}}
    
    <p>{{formatEmail @user.email}}</p>
    
    {{#if (gt @user.posts.length 0)}}
      <span>Posts: {{@user.posts.length}}</span>
    {{/if}}
  </div>
</template>
```

**Functional composition with pipe helper:**

```javascript
// app/helpers/pipe.js
export function pipe(...fns) {
  return (value) => fns.reduce((acc, fn) => fn(acc), value);
}
```

**Or use a compose helper:**

```javascript
// app/helpers/compose.js
export function compose(...helperFns) {
  return (value) => helperFns.reduceRight((acc, fn) => fn(acc), value);
}
```

**Usage:**

```javascript
// app/components/text-processor.gjs
import { fn } from '@ember/helper';

// Individual helpers
const uppercase = (str) => str?.toUpperCase() || '';
const trim = (str) => str?.trim() || '';
const truncate = (str, length = 20) => str?.slice(0, length) || '';

<template>
  {{! Compose multiple transformations }}
  <div>
    {{pipe @text (fn trim) (fn uppercase) (fn truncate 50)}}
  </div>
</template>
```

**Higher-order helpers:**

```javascript
// app/helpers/partial-apply.js
export function partialApply(fn, ...args) {
  return (...moreArgs) => fn(...args, ...moreArgs);
}
```

```javascript
// app/helpers/map-by.js
export function mapBy(array, property) {
  return array?.map(item => item[property]) || [];
}
```

```javascript
// Usage in template
import { mapBy } from '../helpers/map-by';
import { partialApply } from '../helpers/partial-apply';

<template>
  {{! Extract property from array }}
  <ul>
    {{#each (mapBy @users "name") as |name|}}
      <li>{{name}}</li>
    {{/each}}
  </ul>
  
  {{! Partial application }}
  {{#let (partialApply @formatNumber 2) as |formatTwoDecimals|}}
    <span>Price: {{formatTwoDecimals @price}}</span>
  {{/let}}
</template>
```

**Chainable transformation helpers:**

```javascript
// app/helpers/transform.js
class Transform {
  constructor(value) {
    this.value = value;
  }
  
  filter(fn) {
    this.value = this.value?.filter(fn) || [];
    return this;
  }
  
  map(fn) {
    this.value = this.value?.map(fn) || [];
    return this;
  }
  
  sort(fn) {
    this.value = [...(this.value || [])].sort(fn);
    return this;
  }
  
  take(n) {
    this.value = this.value?.slice(0, n) || [];
    return this;
  }
  
  get result() {
    return this.value;
  }
}

export function transform(value) {
  return new Transform(value);
}
```

```javascript
// Usage
import { transform } from '../helpers/transform';

<template>
  {{#let (transform @items) as |t|}}
    {{#each t.filter((i) => i.active).sort((a, b) => a.name.localeCompare(b.name)).take(10).result as |item|}}
      <div>{{item.name}}</div>
    {{/each}}
  {{/let}}
</template>
```

**Conditional composition:**

```javascript
// app/helpers/when.js
export function when(condition, trueFn, falseFn) {
  return condition ? trueFn() : (falseFn ? falseFn() : null);
}
```

```javascript
// app/helpers/unless.js
export function unless(condition, falseFn, trueFn) {
  return !condition ? falseFn() : (trueFn ? trueFn() : null);
}
```

**Testing composed helpers:**

```javascript
// tests/helpers/display-name-test.js
import { module, test } from 'qunit';
import { displayName } from 'my-app/helpers/display-name';

module('Unit | Helper | display-name', function() {
  test('it formats name correctly', function(assert) {
    assert.strictEqual(
      displayName('John Doe'),
      'JOHN DOE'
    );
  });
  
  test('it truncates long names', function(assert) {
    assert.strictEqual(
      displayName('A Very Long Name That Should Be Truncated', { maxLength: 10 }),
      'A VERY LON...'
    );
  });
  
  test('it handles null', function(assert) {
    assert.strictEqual(displayName(null), '');
  });
});
```

Composed helpers provide testable, reusable logic that keeps templates clean and components focused on behavior rather than data transformation.

Reference: [Ember Helpers](https://guides.emberjs.com/release/components/helper-functions/)

---

---
title: No helper() Wrapper for Plain Functions
impact: LOW-MEDIUM
impactDescription: Simpler code, better performance
tags: helpers, templates, modern-ember
---

## No helper() Wrapper for Plain Functions

In modern Ember, plain functions can be used directly as helpers without wrapping them with `helper()`. The `helper()` wrapper is legacy and adds unnecessary complexity.

**Incorrect (using helper() wrapper):**

```javascript
// app/utils/format-date.js
import { helper } from '@ember/component/helper';

function formatDate([date]) {
  return new Date(date).toLocaleDateString();
}

export default helper(formatDate);
```

**Correct (plain function):**

```javascript
// app/utils/format-date.js
export function formatDate(date) {
  return new Date(date).toLocaleDateString();
}
```

**Usage in templates:**

```javascript
// app/components/post-card.gjs
import { formatDate } from '../utils/format-date';

<template>
  <article>
    <h2>{{@post.title}}</h2>
    <time>{{formatDate @post.publishedAt}}</time>
  </article>
</template>
```

**With Multiple Arguments:**

```javascript
// app/utils/format-currency.js
export function formatCurrency(amount, currency = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency
  }).format(amount);
}
```

```javascript
// app/components/price.gjs
import { formatCurrency } from '../utils/format-currency';

<template>
  <span class="price">
    {{formatCurrency @amount @currency}}
  </span>
</template>
```

**For Helpers that Need Services (use class-based):**

When you need dependency injection, use a class instead of `helper()`:

```javascript
// app/utils/format-relative-time.js
export class FormatRelativeTime {
  constructor(owner) {
    this.intl = owner.lookup('service:intl');
  }
  
  compute(date) {
    return this.intl.formatRelative(date);
  }
}
```

**Why Avoid helper():**

1. **Simpler**: Plain functions are easier to understand
2. **Standard JavaScript**: No Ember-specific wrapper needed
3. **Better Testing**: Plain functions are easier to test
4. **Performance**: No wrapper overhead
5. **Modern Pattern**: Aligns with modern Ember conventions

**Migration from helper():**

```javascript
// Before
import { helper } from '@ember/component/helper';

function capitalize([text]) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export default helper(capitalize);

// After
export function capitalize(text) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}
```

**Common Helper Patterns:**

```javascript
// app/utils/string-helpers.js
export function capitalize(text) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function truncate(text, length = 50) {
  if (text.length <= length) return text;
  return text.slice(0, length) + '...';
}

export function pluralize(count, singular, plural) {
  return count === 1 ? singular : plural;
}
```

```javascript
// Usage
import { capitalize, truncate, pluralize } from '../utils/string-helpers';

<template>
  <h1>{{capitalize @title}}</h1>
  <p>{{truncate @description 100}}</p>
  <span>{{@count}} {{pluralize @count "item" "items"}}</span>
</template>
```

Plain functions are the modern way to create helpers in Ember. Only use classes when you need dependency injection.

Reference: [Ember Helpers - Plain Functions](https://guides.emberjs.com/release/components/helper-functions/)

---

---
title: Use Route-Based Code Splitting
impact: CRITICAL
impactDescription: 30-70% initial bundle reduction
tags: routes, lazy-loading, embroider, bundle-size
---

## Use Route-Based Code Splitting

With Embroider's route-based code splitting, routes and their components are automatically split into separate chunks, loaded only when needed.

**Incorrect (everything in main bundle):**

```javascript
// ember-cli-build.js
const EmberApp = require('ember-cli/lib/broccoli/ember-app');

module.exports = function (defaults) {
  const app = new EmberApp(defaults, {
    // No optimization
  });

  return app.toTree();
};
```

**Correct (Embroider with Vite and route splitting):**

```javascript
// ember-cli-build.js
const { Vite } = require('@embroider/vite');

module.exports = require('@embroider/compat').compatBuild(app, Vite, {
  staticAddonTestSupportTrees: true,
  staticAddonTrees: true,
  staticHelpers: true,
  staticModifiers: true,
  staticComponents: true,
  splitAtRoutes: ['admin', 'reports', 'settings'] // Routes to split
});
```

Embroider with `splitAtRoutes` creates separate bundles for specified routes, reducing initial load time by 30-70%.

Reference: [Embroider Documentation](https://github.com/embroider-build/embroider)

---

---
title: Use Loading Substates for Better UX
impact: CRITICAL
impactDescription: Perceived performance improvement
tags: routes, loading, ux, performance
---

## Use Loading Substates for Better UX

Implement loading substates to show immediate feedback while data loads, preventing blank screens and improving perceived performance.

**Incorrect (no loading state):**

```javascript
// app/routes/posts.js
export default class PostsRoute extends Route {
  async model() {
    return this.store.request({ url: '/posts' });
  }
}
```

**Correct (with loading substate):**

```javascript
// app/routes/posts-loading.gjs
import { LoadingSpinner } from './loading-spinner';

<template>
  <div class="loading-spinner" role="status" aria-live="polite">
    <span class="sr-only">Loading posts...</span>
    <LoadingSpinner />
  </div>
</template>
```

```javascript
// app/routes/posts.js
export default class PostsRoute extends Route {
  model() {
    // Return promise directly - Ember will show posts-loading template
    return this.store.request({ url: '/posts' });
  }
}
```

Ember automatically renders `{route-name}-loading` route templates while the model promise resolves, providing better UX without extra code.

---

---
title: Implement Smart Route Model Caching
impact: MEDIUM-HIGH
impactDescription: Reduce redundant API calls and improve UX
tags: routes, caching, performance, model
---

## Implement Smart Route Model Caching

Implement intelligent model caching strategies to reduce redundant API calls and improve user experience.

**Incorrect (always fetches fresh data):**

```javascript
// app/routes/post.gjs
import Route from '@ember/routing/route';
import { service } from '@ember/service';

export default class PostRoute extends Route {
  @service store;
  
  model(params) {
    // Always makes API call, even if we just loaded this post
    return this.store.request({ url: `/posts/${params.post_id}` });
  }

  <template>
    <article>
      <h1>{{@model.title}}</h1>
      <div>{{@model.content}}</div>
    </article>
    {{outlet}}
  </template>
}
```

**Correct (with smart caching):**

```javascript
// app/routes/post.gjs
import Route from '@ember/routing/route';
import { service } from '@ember/service';

export default class PostRoute extends Route {
  @service store;
  
  model(params) {
    // Check cache first
    const cached = this.store.cache.peek({
      type: 'post',
      id: params.post_id
    });
    
    // Return cached if fresh (less than 5 minutes old)
    if (cached && this.isCacheFresh(cached)) {
      return cached;
    }
    
    // Fetch fresh data
    return this.store.request({ 
      url: `/posts/${params.post_id}`,
      options: { reload: true }
    });
  }
  
  isCacheFresh(record) {
    const cacheTime = record.meta?.cachedAt || 0;
    const fiveMinutes = 5 * 60 * 1000;
    return (Date.now() - cacheTime) < fiveMinutes;
  }

  <template>
    <article>
      <h1>{{@model.title}}</h1>
      <div>{{@model.content}}</div>
    </article>
    {{outlet}}
  </template>
}
```

**Service-based caching layer:**

```javascript
// app/services/post-cache.js
import Service from '@ember/service';
import { service } from '@ember/service';
import { TrackedMap } from 'tracked-built-ins';

export default class PostCacheService extends Service {
  @service store;
  
  cache = new TrackedMap();
  cacheTimes = new Map();
  cacheTimeout = 5 * 60 * 1000; // 5 minutes
  
  async getPost(id, { forceRefresh = false } = {}) {
    const now = Date.now();
    const cacheTime = this.cacheTimes.get(id) || 0;
    const isFresh = (now - cacheTime) < this.cacheTimeout;
    
    if (!forceRefresh && isFresh && this.cache.has(id)) {
      return this.cache.get(id);
    }
    
    const post = await this.store.request({ url: `/posts/${id}` });
    
    this.cache.set(id, post);
    this.cacheTimes.set(id, now);
    
    return post;
  }
  
  invalidate(id) {
    this.cache.delete(id);
    this.cacheTimes.delete(id);
  }
  
  invalidateAll() {
    this.cache.clear();
    this.cacheTimes.clear();
  }
}
```

```javascript
// app/routes/post.gjs
import Route from '@ember/routing/route';
import { service } from '@ember/service';

export default class PostRoute extends Route {
  @service postCache;
  
  model(params) {
    return this.postCache.getPost(params.post_id);
  }
  
  // Refresh data when returning to route
  async activate() {
    super.activate(...arguments);
    const params = this.paramsFor('post');
    await this.postCache.getPost(params.post_id, { forceRefresh: true });
  }

  <template>
    <article>
      <h1>{{@model.title}}</h1>
      <div>{{@model.content}}</div>
    </article>
    {{outlet}}
  </template>
}
```

**Using query params for cache control:**

```javascript
// app/routes/posts.gjs
import Route from '@ember/routing/route';
import { service } from '@ember/service';

export default class PostsRoute extends Route {
  @service store;
  
  queryParams = {
    refresh: { refreshModel: true }
  };
  
  model(params) {
    const options = params.refresh 
      ? { reload: true } 
      : { backgroundReload: true };
    
    return this.store.request({ 
      url: '/posts',
      options 
    });
  }

  <template>
    <div class="posts">
      <button {{on "click" (fn this.refresh)}}>
        Refresh
      </button>
      
      <ul>
        {{#each @model as |post|}}
          <li>{{post.title}}</li>
        {{/each}}
      </ul>
    </div>
    {{outlet}}
  </template>
}
```

**Background refresh pattern:**

```javascript
// app/routes/dashboard.gjs
import Route from '@ember/routing/route';
import { service } from '@ember/service';

export default class DashboardRoute extends Route {
  @service store;
  
  async model() {
    // Return cached data immediately
    const cached = this.store.cache.peek({ type: 'dashboard' });
    
    // Refresh in background
    this.store.request({ 
      url: '/dashboard',
      options: { backgroundReload: true }
    });
    
    return cached || this.store.request({ url: '/dashboard' });
  }

  <template>
    <div class="dashboard">
      <h1>Dashboard</h1>
      <div>Stats: {{@model.stats}}</div>
    </div>
    {{outlet}}
  </template>
}
```

Smart caching reduces server load, improves perceived performance, and provides better offline support while keeping data fresh.

Reference: [WarpDrive Caching](https://warp-drive.io/)

---

---
title: Parallel Data Loading in Model Hooks
impact: CRITICAL
impactDescription: 2-10× improvement
tags: routes, data-fetching, parallelization, performance
---

## Parallel Data Loading in Model Hooks

When fetching multiple independent data sources in a route's model hook, use `Promise.all()` or RSVP.hash() to load them in parallel instead of sequentially.

**Incorrect (sequential loading, 3 round trips):**

```javascript
// app/routes/dashboard.js
import Route from '@ember/routing/route';
import { service } from '@ember/service';

export default class DashboardRoute extends Route {
  @service store;

  async model() {
    const user = await this.store.request({ url: '/users/me' });
    const posts = await this.store.request({ url: '/posts?recent=true' });
    const notifications = await this.store.request({ url: '/notifications?unread=true' });
    
    return { user, posts, notifications };
  }
}
```

**Correct (parallel loading, 1 round trip):**

```javascript
// app/routes/dashboard.js
import Route from '@ember/routing/route';
import { service } from '@ember/service';
import { hash } from 'rsvp';

export default class DashboardRoute extends Route {
  @service store;

  model() {
    return hash({
      user: this.store.request({ url: '/users/me' }),
      posts: this.store.request({ url: '/posts?recent=true' }),
      notifications: this.store.request({ url: '/notifications?unread=true' })
    });
  }
}
```

Using `hash()` from RSVP allows Ember to resolve all promises concurrently, significantly reducing load time.

---

---
title: Use Route Templates with Co-located Syntax
impact: MEDIUM-HIGH
impactDescription: Better code organization and maintainability
tags: routes, templates, gjs, co-location
---

## Use Route Templates with Co-located Syntax

Use co-located route templates with modern gjs syntax for better organization and maintainability.

**Incorrect (separate template file - old pattern):**

```javascript
// app/routes/posts.js (separate file)
import Route from '@ember/routing/route';

export default class PostsRoute extends Route {
  model() {
    return this.store.request({ url: '/posts' });
  }
}

// app/templates/posts.gjs (separate template file)
<template>
  <h1>Posts</h1>
  <ul>
    {{#each @model as |post|}}
      <li>{{post.title}}</li>
    {{/each}}
  </ul>
</template>
```

**Correct (co-located route template):**

```javascript
// app/routes/posts.gjs
import Route from '@ember/routing/route';

export default class PostsRoute extends Route {
  model() {
    return this.store.request({ url: '/posts' });
  }

  <template>
    <h1>Posts</h1>
    <ul>
      {{#each @model as |post|}}
        <li>{{post.title}}</li>
      {{/each}}
    </ul>
    
    {{outlet}}
  </template>
}
```

**With loading and error states:**

```javascript
// app/routes/posts.gjs
import Route from '@ember/routing/route';
import { service } from '@ember/service';

export default class PostsRoute extends Route {
  @service store;
  
  model() {
    return this.store.request({ url: '/posts' });
  }

  <template>
    <div class="posts-page">
      <h1>Posts</h1>
      
      {{#if @model}}
        <ul>
          {{#each @model as |post|}}
            <li>{{post.title}}</li>
          {{/each}}
        </ul>
      {{/if}}
      
      {{outlet}}
    </div>
  </template>
}
```

**Template-only routes:**

```javascript
// app/routes/about.gjs
<template>
  <div class="about-page">
    <h1>About Us</h1>
    <p>Welcome to our application!</p>
  </div>
</template>
```

Co-located route templates keep route logic and presentation together, making the codebase easier to navigate and maintain.

Reference: [Ember Routes](https://guides.emberjs.com/release/routing/)

---

---
title: Cache API Responses in Services
impact: MEDIUM-HIGH
impactDescription: 50-90% reduction in duplicate requests
tags: services, caching, performance, api
---

## Cache API Responses in Services

Cache API responses in services to avoid duplicate network requests. Use tracked properties to make the cache reactive.

**Incorrect (no caching):**

```javascript
// app/services/user.js
import Service from '@ember/service';
import { service } from '@ember/service';

export default class UserService extends Service {
  @service store;
  
  async getCurrentUser() {
    // Fetches from API every time
    return this.store.request({ url: '/users/me' });
  }
}
```

**Correct (with caching):**

```javascript
// app/services/user.js
import Service from '@ember/service';
import { service } from '@ember/service';
import { tracked } from '@glimmer/tracking';
import { TrackedMap } from 'tracked-built-ins';

export default class UserService extends Service {
  @service store;
  
  @tracked currentUser = null;
  cache = new TrackedMap();
  
  async getCurrentUser() {
    if (!this.currentUser) {
      const response = await this.store.request({ url: '/users/me' });
      this.currentUser = response.content.data;
    }
    return this.currentUser;
  }
  
  async getUser(id) {
    if (!this.cache.has(id)) {
      const response = await this.store.request({ url: `/users/${id}` });
      this.cache.set(id, response.content.data);
    }
    return this.cache.get(id);
  }
  
  clearCache() {
    this.currentUser = null;
    this.cache.clear();
  }
}
```

**For time-based cache invalidation:**

```javascript
import Service from '@ember/service';
import { tracked } from '@glimmer/tracking';

export default class DataService extends Service {
  @tracked _cache = null;
  _cacheTimestamp = null;
  _cacheDuration = 5 * 60 * 1000; // 5 minutes
  
  async getData() {
    const now = Date.now();
    const isCacheValid = this._cache && 
      this._cacheTimestamp && 
      (now - this._cacheTimestamp) < this._cacheDuration;
    
    if (!isCacheValid) {
      this._cache = await this.fetchData();
      this._cacheTimestamp = now;
    }
    
    return this._cache;
  }
  
  async fetchData() {
    const response = await fetch('/api/data');
    return response.json();
  }
}
```

Caching in services prevents duplicate API requests and improves performance significantly.

---

---
title: Implement Robust Data Requesting Patterns
category: service
impact: high
---

# Implement Robust Data Requesting Patterns

Use proper patterns for data fetching including parallel requests, error handling, request cancellation, and retry logic.

## Problem

Naive data fetching creates waterfall requests, doesn't handle errors properly, and can cause race conditions or memory leaks from uncanceled requests.

**Incorrect:**
```javascript
// app/routes/dashboard.js
import Route from '@ember/routing/route';

export default class DashboardRoute extends Route {
  async model() {
    // Sequential waterfall - slow!
    const user = await this.store.request({ url: '/users/me' });
    const posts = await this.store.request({ url: '/posts' });
    const notifications = await this.store.request({ url: '/notifications' });
    
    // No error handling
    // No cancellation
    return { user, posts, notifications };
  }
}
```

## Solution: Parallel Requests

Use `RSVP.hash` or `Promise.all` for parallel loading:

```javascript
// app/routes/dashboard.js
import Route from '@ember/routing/route';
import { hash } from 'rsvp';

export default class DashboardRoute extends Route {
  async model() {
    return hash({
      user: this.store.request({ url: '/users/me' }),
      posts: this.store.request({ url: '/posts?recent=true' }),
      notifications: this.store.request({ url: '/notifications?unread=true' })
    });
  }
}
```

## Error Handling Pattern

Handle errors gracefully with fallbacks:

```javascript
// app/services/api.js
import Service, { service } from '@ember/service';
import { tracked } from '@glimmer/tracking';

export default class ApiService extends Service {
  @service store;
  @tracked lastError = null;

  async fetchWithFallback(url, fallback = null) {
    try {
      const response = await this.store.request({ url });
      this.lastError = null;
      return response.content;
    } catch (error) {
      this.lastError = error.message;
      console.error(`API Error fetching ${url}:`, error);
      return fallback;
    }
  }

  async fetchWithRetry(url, { maxRetries = 3, delay = 1000 } = {}) {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await this.store.request({ url });
      } catch (error) {
        if (attempt === maxRetries - 1) throw error;
        await new Promise(resolve => setTimeout(resolve, delay * (attempt + 1)));
      }
    }
  }
}
```

## Request Cancellation with AbortController

Prevent race conditions by canceling stale requests:

```javascript
// app/components/search-results.gjs
import Component from '@glimmer/component';
import { service } from '@ember/service';
import { tracked } from '@glimmer/tracking';
import { restartableTask, timeout } from 'ember-concurrency';

class SearchResults extends Component {
  @service store;
  @tracked results = [];

  // Automatically cancels previous searches
  @restartableTask
  *searchTask(query) {
    yield timeout(300); // Debounce
    
    try {
      const response = yield this.store.request({
        url: `/search?q=${encodeURIComponent(query)}`
      });
      this.results = response.content;
    } catch (error) {
      if (error.name !== 'TaskCancelation') {
        console.error('Search failed:', error);
      }
    }
  }

  <template>
    <input
      type="search"
      {{on "input" (fn this.searchTask.perform @value)}}
      placeholder="Search..."
    />
    
    {{#if this.searchTask.isRunning}}
      <div class="loading">Searching...</div>
    {{else}}
      <ul>
        {{#each this.results as |result|}}
          <li>{{result.title}}</li>
        {{/each}}
      </ul>
    {{/if}}
  </template>
}
```

## Manual AbortController Pattern

For non-ember-concurrency scenarios:

```javascript
// app/services/data-fetcher.js
import Service, { service } from '@ember/service';
import { tracked } from '@glimmer/tracking';
import { registerDestructor } from '@ember/destroyable';

export default class DataFetcherService extends Service {
  @service store;
  @tracked data = null;
  @tracked isLoading = false;
  
  abortController = null;

  constructor() {
    super(...arguments);
    registerDestructor(this, () => {
      this.abortController?.abort();
    });
  }

  async fetch(url) {
    // Cancel previous request
    this.abortController?.abort();
    this.abortController = new AbortController();
    
    this.isLoading = true;
    try {
      // Note: WarpDrive handles AbortSignal internally
      const response = await this.store.request({ 
        url,
        signal: this.abortController.signal 
      });
      this.data = response.content;
    } catch (error) {
      if (error.name !== 'AbortError') {
        throw error;
      }
    } finally {
      this.isLoading = false;
    }
  }
}
```

## Dependent Requests Pattern

When requests depend on previous results:

```javascript
// app/routes/post.js
import Route from '@ember/routing/route';
import { hash } from 'rsvp';

export default class PostRoute extends Route {
  async model({ post_id }) {
    // First fetch the post
    const post = await this.store.request({ 
      url: `/posts/${post_id}` 
    });
    
    // Then fetch related data in parallel
    return hash({
      post,
      author: this.store.request({ 
        url: `/users/${post.content.authorId}` 
      }),
      comments: this.store.request({ 
        url: `/posts/${post_id}/comments` 
      }),
      relatedPosts: this.store.request({ 
        url: `/posts/${post_id}/related` 
      })
    });
  }
}
```

## Polling Pattern

For real-time data updates:

```javascript
// app/services/live-data.js
import Service, { service } from '@ember/service';
import { tracked } from '@glimmer/tracking';
import { registerDestructor } from '@ember/destroyable';

export default class LiveDataService extends Service {
  @service store;
  @tracked data = null;
  
  intervalId = null;

  constructor() {
    super(...arguments);
    registerDestructor(this, () => {
      this.stopPolling();
    });
  }

  startPolling(url, interval = 5000) {
    this.stopPolling();
    
    this.poll(url); // Initial fetch
    this.intervalId = setInterval(() => this.poll(url), interval);
  }

  async poll(url) {
    try {
      const response = await this.store.request({ url });
      this.data = response.content;
    } catch (error) {
      console.error('Polling error:', error);
    }
  }

  stopPolling() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}
```

## Batch Requests

Optimize multiple similar requests:

```javascript
// app/services/batch-loader.js
import Service, { service } from '@ember/service';

export default class BatchLoaderService extends Service {
  @service store;
  
  pendingIds = new Set();
  batchTimeout = null;

  async loadUser(id) {
    this.pendingIds.add(id);
    
    if (!this.batchTimeout) {
      this.batchTimeout = setTimeout(() => this.executeBatch(), 50);
    }
    
    // Return a promise that resolves when batch completes
    return new Promise((resolve) => {
      this.registerCallback(id, resolve);
    });
  }

  async executeBatch() {
    const ids = Array.from(this.pendingIds);
    this.pendingIds.clear();
    this.batchTimeout = null;
    
    const response = await this.store.request({
      url: `/users?ids=${ids.join(',')}`
    });
    
    // Resolve all pending promises
    response.content.forEach(user => {
      this.resolveCallback(user.id, user);
    });
  }
}
```

## Performance Impact

- **Parallel requests (RSVP.hash)**: 60-80% faster than sequential
- **Request cancellation**: Prevents memory leaks and race conditions
- **Retry logic**: Improves reliability with < 5% overhead
- **Batch loading**: 40-70% reduction in requests

## When to Use

- **RSVP.hash**: Independent data that can load in parallel
- **ember-concurrency**: Search, autocomplete, or user-driven requests
- **AbortController**: Long-running requests that may become stale
- **Retry logic**: Critical data with transient network issues
- **Batch loading**: Loading many similar items (N+1 scenarios)

## References

- [WarpDrive Documentation](https://warp-drive.io/)
- [ember-concurrency](https://ember-concurrency.com/)
- [RSVP.js](https://github.com/tildeio/rsvp.js)
- [AbortController MDN](https://developer.mozilla.org/en-US/docs/Web/API/AbortController)

---

---
title: Optimize WarpDrive Queries
impact: MEDIUM-HIGH
impactDescription: 40-70% reduction in API calls
tags: warp-drive, performance, api, optimization
---

## Optimize WarpDrive Queries

Use WarpDrive's request features effectively to reduce API calls and load only the data you need.

**Incorrect (multiple queries, overfetching):**

```javascript
// app/routes/posts.js
export default class PostsRoute extends Route {
  @service store;
  
  async model() {
    // Loads all posts (could be thousands)
    const response = await this.store.request({ url: '/posts' });
    const posts = response.content.data;
    
    // Then filters in memory
    return posts.filter(post => post.attributes.status === 'published');
  }
}
```

**Correct (filtered query with pagination):**

```javascript
// app/routes/posts.js
export default class PostsRoute extends Route {
  @service store;
  
  queryParams = {
    page: { refreshModel: true },
    filter: { refreshModel: true }
  };
  
  model(params) {
    // Server-side filtering and pagination
    return this.store.request({
      url: '/posts',
      data: {
        filter: {
          status: 'published'
        },
        page: {
          number: params.page || 1,
          size: 20
        },
        include: 'author', // Sideload related data
        fields: { // Sparse fieldsets
          posts: 'title,excerpt,publishedAt,author',
          users: 'name,avatar'
        }
      }
    });
  }
}
```

**Use request with includes for single records:**

```javascript
// app/routes/post.js
export default class PostRoute extends Route {
  @service store;
  
  model(params) {
    return this.store.request({
      url: `/posts/${params.post_id}`,
      data: {
        include: 'author,comments.user' // Nested relationships
      }
    });
  }
}
```

**For frequently accessed data, use cache lookups:**

```javascript
// app/components/user-badge.js
class UserBadge extends Component {
  @service store;
  
  get user() {
    // Check cache first, avoiding API call if already loaded
    const cached = this.store.cache.peek({
      type: 'user',
      id: this.args.userId
    });
    
    if (cached) {
      return cached;
    }
    
    // Only fetch if not in cache
    return this.store.request({
      url: `/users/${this.args.userId}`
    });
  }
}
```

**Use request options for custom queries:**

```javascript
model() {
  return this.store.request({
    url: '/posts',
    data: {
      include: 'author,tags',
      customParam: 'value'
    },
    options: {
      reload: true // Bypass cache
    }
  });
}
```

Efficient WarpDrive usage reduces network overhead and improves application performance significantly.

Reference: [WarpDrive Documentation](https://warp-drive.io/)

---

---
title: Manage Service Owner and Linkage Patterns
impact: MEDIUM-HIGH
impactDescription: Better service organization and dependency management
tags: services, owner, linkage, dependency-injection, architecture
---

## Manage Service Owner and Linkage Patterns

Understand how to manage service linkage, owner passing, and alternative service organization patterns beyond the traditional app/services directory.

### Owner and Linkage Fundamentals

**Incorrect (manual service instantiation):**

```javascript
// app/components/user-profile.gjs
import Component from '@glimmer/component';
import ApiService from '../services/api';

class UserProfile extends Component {
  // ❌ Creates orphaned instance without owner
  api = new ApiService();
  
  async loadUser() {
    // Won't have access to other services or owner features
    return this.api.fetch('/user/me');
  }

  <template>
    <div>{{@user.name}}</div>
  </template>
}
```

**Correct (proper service injection with owner):**

```javascript
// app/components/user-profile.gjs
import Component from '@glimmer/component';
import { service } from '@ember/service';

class UserProfile extends Component {
  // ✅ Proper injection with owner linkage
  @service api;
  
  async loadUser() {
    // Has full owner context and can inject other services
    return this.api.fetch('/user/me');
  }

  <template>
    <div>{{@user.name}}</div>
  </template>
}
```

### Manual Owner Passing (Without Libraries)

**Creating instances with owner:**

```javascript
// app/components/data-processor.gjs
import Component from '@glimmer/component';
import { getOwner, setOwner } from '@ember/application';
import { service } from '@ember/service';

class DataTransformer {
  @service store;
  
  transform(data) {
    // Can use injected services because it has an owner
    return this.store.request({ url: '/transform', data });
  }
}

class DataProcessor extends Component {
  @service('store') storeService;
  
  constructor(owner, args) {
    super(owner, args);
    
    // Manual instantiation with owner linkage
    this.transformer = new DataTransformer();
    setOwner(this.transformer, getOwner(this));
  }
  
  processData(data) {
    // transformer can now access services
    return this.transformer.transform(data);
  }

  <template>
    <div>Processing...</div>
  </template>
}
```

**Factory pattern with owner:**

```javascript
// app/utils/logger-factory.js
import { getOwner } from '@ember/application';

class Logger {
  constructor(owner, context) {
    this.owner = owner;
    this.context = context;
  }
  
  get config() {
    // Access configuration service via owner
    return getOwner(this).lookup('service:config');
  }
  
  log(message) {
    if (this.config.enableLogging) {
      console.log(`[${this.context}]`, message);
    }
  }
}

export function createLogger(owner, context) {
  return new Logger(owner, context);
}
```

```javascript
// Usage in component
import Component from '@glimmer/component';
import { getOwner } from '@ember/application';
import { createLogger } from '../utils/logger-factory';

class My extends Component {
  logger = createLogger(getOwner(this), 'MyComponent');
  
  performAction() {
    this.logger.log('Action performed');
  }

  <template>
    <button {{on "click" this.performAction}}>Do Something</button>
  </template>
}
```

### Owner Passing with Libraries

**Using ember-could-get-used-to-this for explicit dependency injection:**

```javascript
// app/components/advanced-form.gjs
import Component from '@glimmer/component';
import { use } from 'ember-could-get-used-to-this';
import { ValidationService } from '../services/validation';
import { FormStateManager } from '../utils/form-state';

class AdvancedForm extends Component {
  // Explicitly request services with use()
  @use validation = ValidationService;
  
  // Create utility with owner automatically passed
  @use formState = FormStateManager;
  
  get isValid() {
    return this.validation.validate(this.formState.data);
  }

  <template>
    <form>
      <input value={{this.formState.data.email}} />
      {{#if (not this.isValid)}}
        <span class="error">Invalid form</span>
      {{/if}}
    </form>
  </template>
}
```

**Using ember-provide-consume-context for dependency injection:**

```javascript
// app/components/dashboard-container.gjs
import Component from '@glimmer/component';
import { provide } from 'ember-provide-consume-context';
import { DashboardContext } from '../contexts/dashboard';

class DashboardContainer extends Component {
  // Provide context to child components
  @provide(DashboardContext)
  dashboardContext = {
    theme: 'dark',
    layout: 'grid',
    permissions: this.args.userPermissions
  };

  <template>
    <div class="dashboard">
      {{yield}}
    </div>
  </template>
}
```

```javascript
// app/components/dashboard-widget.gjs
import Component from '@glimmer/component';
import { consume } from 'ember-provide-consume-context';
import { DashboardContext } from '../contexts/dashboard';

class DashboardWidget extends Component {
  // Consume context from parent
  @consume(DashboardContext) dashboard;
  
  get themeClass() {
    return `widget-${this.dashboard.theme}`;
  }

  <template>
    <div class={{this.themeClass}}>
      {{@title}}
    </div>
  </template>
}
```

### Services Outside app/services Directory

**Inline service definitions:**

```javascript
// app/components/analytics-tracker.gjs
import Component from '@glimmer/component';
import { service } from '@ember/service';
import Service from '@ember/service';
import { tracked } from '@glimmer/tracking';
import { registerDestructor } from '@ember/destroyable';

// Define service inline with component
class AnalyticsService extends Service {
  @tracked events = [];
  
  track(event) {
    this.events.push({ ...event, timestamp: Date.now() });
    
    // Send to analytics endpoint
    fetch('/analytics', {
      method: 'POST',
      body: JSON.stringify(event)
    });
  }
}

class AnalyticsTracker extends Component {
  // Use inline service
  analytics = new AnalyticsService();
  
  constructor(owner, args) {
    super(owner, args);
    
    // Register cleanup
    registerDestructor(this, () => {
      this.analytics.destroy();
    });
  }

  <template>
    <div>Tracking {{this.analytics.events.length}} events</div>
  </template>
}
```

**Co-located services with components:**

```javascript
// app/components/shopping-cart/service.js
import Service from '@ember/service';
import { tracked } from '@glimmer/tracking';
import { TrackedArray } from 'tracked-built-ins';
import { action } from '@ember/object';

export class CartService extends Service {
  @tracked items = new TrackedArray([]);
  
  get total() {
    return this.items.reduce((sum, item) => sum + item.price, 0);
  }
  
  @action
  addItem(item) {
    this.items.push(item);
  }
  
  @action
  removeItem(id) {
    const index = this.items.findIndex(item => item.id === id);
    if (index > -1) this.items.splice(index, 1);
  }
  
  @action
  clear() {
    this.items.clear();
  }
}
```

```javascript
// app/components/shopping-cart/index.gjs
import Component from '@glimmer/component';
import { getOwner, setOwner } from '@ember/application';
import { CartService } from './service';

class ShoppingCart extends Component {
  cart = (() => {
    const instance = new CartService();
    setOwner(instance, getOwner(this));
    return instance;
  })();

  <template>
    <div class="cart">
      <h3>Cart ({{this.cart.items.length}} items)</h3>
      <div>Total: ${{this.cart.total}}</div>
      
      {{#each this.cart.items as |item|}}
        <div class="cart-item">
          {{item.name}} - ${{item.price}}
          <button {{on "click" (fn this.cart.removeItem item.id)}}>
            Remove
          </button>
        </div>
      {{/each}}
      
      <button {{on "click" this.cart.clear}}>Clear Cart</button>
    </div>
  </template>
}
```

**Service-like utilities in utils/ directory:**

```javascript
// app/utils/notification-manager.js
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { TrackedArray } from 'tracked-built-ins';
import { setOwner } from '@ember/application';

export class NotificationManager {
  @tracked notifications = new TrackedArray([]);
  
  constructor(owner) {
    setOwner(this, owner);
  }
  
  @action
  add(message, type = 'info') {
    const notification = {
      id: Math.random().toString(36),
      message,
      type,
      timestamp: Date.now()
    };
    
    this.notifications.push(notification);
    
    // Auto-dismiss after 5 seconds
    setTimeout(() => this.dismiss(notification.id), 5000);
  }
  
  @action
  dismiss(id) {
    const index = this.notifications.findIndex(n => n.id === id);
    if (index > -1) this.notifications.splice(index, 1);
  }
}
```

```javascript
// app/components/notification-container.gjs
import Component from '@glimmer/component';
import { getOwner } from '@ember/application';
import { NotificationManager } from '../utils/notification-manager';

class NotificationContainer extends Component {
  notifications = new NotificationManager(getOwner(this));

  <template>
    <div class="notifications">
      {{#each this.notifications.notifications as |notif|}}
        <div class="notification notification-{{notif.type}}">
          {{notif.message}}
          <button {{on "click" (fn this.notifications.dismiss notif.id)}}>
            ×
          </button>
        </div>
      {{/each}}
    </div>
    
    {{! Example usage }}
    <button {{on "click" (fn this.notifications.add "Success!" "success")}}>
      Show Notification
    </button>
  </template>
}
```

### Registering Custom Services Dynamically

**Runtime service registration:**

```javascript
// app/instance-initializers/dynamic-services.js
export function initialize(appInstance) {
  // Register service dynamically without app/services file
  appInstance.register('service:feature-flags', class FeatureFlagsService {
    flags = {
      newDashboard: true,
      betaFeatures: false
    };
    
    isEnabled(flag) {
      return this.flags[flag] || false;
    }
  });
  
  // Make it a singleton
  appInstance.inject('route', 'featureFlags', 'service:feature-flags');
  appInstance.inject('component', 'featureFlags', 'service:feature-flags');
}

export default {
  initialize
};
```

**Using registered services:**

```javascript
// app/components/feature-gated.gjs
import Component from '@glimmer/component';
import { service } from '@ember/service';

class FeatureGated extends Component {
  @service featureFlags;
  
  get shouldShow() {
    return this.featureFlags.isEnabled(this.args.feature);
  }

  <template>
    {{#if this.shouldShow}}
      {{yield}}
    {{else}}
      <div class="feature-disabled">This feature is not available</div>
    {{/if}}
  </template>
}
```

### Best Practices

1. **Use @service decorator** for app/services - cleanest and most maintainable
2. **Manual owner passing** for utilities that need occasional service access
3. **Co-located services** for component-specific state that doesn't need global access
4. **Runtime registration** for dynamic services or testing scenarios
5. **Context providers** (ember-provide-consume-context) for prop drilling alternatives
6. **Always use setOwner** when manually instantiating classes that need services

### When to Use Each Pattern

- **app/services**: Global singletons needed across the app
- **Co-located services**: Component-specific state, not needed elsewhere
- **Utils with owner**: Stateless utilities that occasionally need config/services
- **Context providers**: Avoid prop drilling in component trees
- **Runtime registration**: Dynamic configuration, feature flags, testing

Reference: [Ember Owner API](https://api.emberjs.com/ember/release/functions/@ember%2Fapplication/getOwner), [Dependency Injection](https://guides.emberjs.com/release/applications/dependency-injection/)

---

---
title: Use Services for Shared State
impact: MEDIUM-HIGH
impactDescription: Better state management and reusability
tags: services, state-management, dependency-injection
---

## Use Services for Shared State

Use services to manage shared state across components and routes instead of passing data through multiple layers or duplicating state.

**Incorrect (prop drilling):**

```javascript
// app/routes/dashboard.gjs
export default class DashboardRoute extends Route {
  model() {
    return { currentTheme: 'dark' };
  }

  <template>
    <Header @theme={{@model.currentTheme}} />
    <Sidebar @theme={{@model.currentTheme}} />
    <MainContent @theme={{@model.currentTheme}} />
  </template>
}
```

**Correct (using service):**

```javascript
// app/services/theme.js
import Service from '@ember/service';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';

export default class ThemeService extends Service {
  @tracked currentTheme = 'dark';
  
  @action
  setTheme(theme) {
    this.currentTheme = theme;
    localStorage.setItem('theme', theme);
  }
  
  @action
  loadTheme() {
    this.currentTheme = localStorage.getItem('theme') || 'dark';
  }
}
```

```javascript
// app/components/header.js
import Component from '@glimmer/component';
import { service } from '@ember/service';

class Header extends Component {
  @service theme;
  
  // Access theme.currentTheme directly
}
```

```javascript
// app/components/sidebar.js
import Component from '@glimmer/component';
import { service } from '@ember/service';

class Sidebar extends Component {
  @service theme;
  
  // Access theme.currentTheme directly
}
```

Services provide centralized state management with automatic reactivity through tracked properties.

**For complex state, consider using Ember Data or ember-orbit:**

```javascript
// app/services/cart.js
import Service from '@ember/service';
import { service } from '@ember/service';
import { TrackedArray } from 'tracked-built-ins';
import { cached } from '@glimmer/tracking';
import { action } from '@ember/object';

export default class CartService extends Service {
  @service store;
  
  items = new TrackedArray([]);
  
  @cached
  get total() {
    return this.items.reduce((sum, item) => sum + item.price, 0);
  }
  
  @cached
  get itemCount() {
    return this.items.length;
  }
  
  @action
  addItem(item) {
    this.items.push(item);
  }
  
  @action
  removeItem(item) {
    const index = this.items.indexOf(item);
    if (index > -1) {
      this.items.splice(index, 1);
    }
  }
}
```

Reference: [Ember Services](https://guides.emberjs.com/release/services/)

---

---
title: Avoid Heavy Computation in Templates
impact: MEDIUM
impactDescription: 40-60% reduction in render time
tags: templates, performance, getters, helpers
---

## Avoid Heavy Computation in Templates

Move expensive computations from templates to cached getters in the component class. Templates should only display data, not compute it.

**Incorrect (computation in template):**

```javascript
// app/components/stats.gjs
<template>
  <div class="stats">
    <p>Total: {{sum (map this.items "price")}}</p>
    <p>Average: {{div (sum (map this.items "price")) this.items.length}}</p>
    <p>Max: {{max (map this.items "price")}}</p>
    
    {{#each (sort-by "name" this.items) as |item|}}
      <div>{{item.name}}: {{multiply item.price item.quantity}}</div>
    {{/each}}
  </div>
</template>
```

**Correct (computation in component):**

```javascript
// app/components/stats.gjs
import Component from '@glimmer/component';
import { cached } from '@glimmer/tracking';

class Stats extends Component {
  @cached
  get total() {
    return this.args.items.reduce((sum, item) => sum + item.price, 0);
  }
  
  @cached
  get average() {
    return this.args.items.length > 0 
      ? this.total / this.args.items.length 
      : 0;
  }
  
  @cached
  get maxPrice() {
    return Math.max(...this.args.items.map(item => item.price));
  }
  
  @cached
  get sortedItems() {
    return [...this.args.items].sort((a, b) => 
      a.name.localeCompare(b.name)
    );
  }
  
  @cached
  get itemsWithTotal() {
    return this.sortedItems.map(item => ({
      ...item,
      total: item.price * item.quantity
    }));
  }

  <template>
    <div class="stats">
      <p>Total: {{this.total}}</p>
      <p>Average: {{this.average}}</p>
      <p>Max: {{this.maxPrice}}</p>
      
      {{#each this.itemsWithTotal key="id" as |item|}}
        <div>{{item.name}}: {{item.total}}</div>
      {{/each}}
    </div>
  </template>
}
```

Moving computations to cached getters ensures they run only when dependencies change, not on every render.

---

---
title: Optimize Conditional Rendering
category: template
impact: high
---

# Optimize Conditional Rendering

Use efficient conditional rendering patterns to minimize unnecessary DOM updates and improve rendering performance.

## Problem

Inefficient conditional logic causes excessive re-renders, creates complex template code, and can lead to poor performance in lists and dynamic UIs.

**Incorrect:**
```javascript
// app/components/user-list.gjs
import Component from '@glimmer/component';

class UserList extends Component {
  <template>
    {{#each @users as |user|}}
      <div class="user">
        {{! Recomputes every time}}
        {{#if (eq user.role "admin")}}
          <span class="badge admin">{{user.name}} (Admin)</span>
        {{/if}}
        {{#if (eq user.role "moderator")}}
          <span class="badge mod">{{user.name}} (Mod)</span>
        {{/if}}
        {{#if (eq user.role "user")}}
          <span>{{user.name}}</span>
        {{/if}}
      </div>
    {{/each}}
  </template>
}
```

## Solution

Use `{{#if}}` / `{{#else if}}` / `{{#else}}` chains and extract computed logic to getters for better performance and readability.

**Correct:**
```javascript
// app/components/user-list.gjs
import Component from '@glimmer/component';

class UserList extends Component {
  <template>
    {{#each @users as |user|}}
      <div class="user">
        {{#if (eq user.role "admin")}}
          <span class="badge admin">{{user.name}} (Admin)</span>
        {{else if (eq user.role "moderator")}}
          <span class="badge mod">{{user.name}} (Mod)</span>
        {{else}}
          <span>{{user.name}}</span>
        {{/if}}
      </div>
    {{/each}}
  </template>
}
```

## Extracted Logic Pattern

For complex conditions, use getters:

```javascript
// app/components/user-card.gjs
import Component from '@glimmer/component';
import { cached } from '@glimmer/tracking';

class UserCard extends Component {
  @cached
  get isActive() {
    return this.args.user.status === 'active' && 
           this.args.user.lastLoginDays < 30;
  }

  @cached
  get showActions() {
    return this.args.canEdit && 
           !this.args.user.locked &&
           this.isActive;
  }

  <template>
    <div class="user-card">
      <h3>{{@user.name}}</h3>
      
      {{#if this.isActive}}
        <span class="status active">Active</span>
      {{else}}
        <span class="status inactive">Inactive</span>
      {{/if}}

      {{#if this.showActions}}
        <div class="actions">
          <button>Edit</button>
          <button>Delete</button>
        </div>
      {{/if}}
    </div>
  </template>
}
```

## Conditional Lists

Use `{{#if}}` to guard `{{#each}}` and avoid rendering empty states:

```javascript
// app/components/task-list.gjs
import Component from '@glimmer/component';

class TaskList extends Component {
  get hasTasks() {
    return this.args.tasks?.length > 0;
  }

  <template>
    {{#if this.hasTasks}}
      <ul class="task-list">
        {{#each @tasks as |task|}}
          <li>
            {{task.title}}
            {{#if task.completed}}
              <span class="done">✓</span>
            {{/if}}
          </li>
        {{/each}}
      </ul>
    {{else}}
      <p class="empty-state">No tasks yet</p>
    {{/if}}
  </template>
}
```

## Avoid Nested Conditionals

**Bad:**
```gjs
{{#if @user}}
  {{#if @user.isPremium}}
    {{#if @user.hasAccess}}
      <PremiumContent />
    {{/if}}
  {{/if}}
{{/if}}
```

**Good:**
```javascript
// app/components/content-gate.gjs
import Component from '@glimmer/component';
import { cached } from '@glimmer/tracking';

class ContentGate extends Component {
  @cached
  get canViewPremium() {
    return this.args.user?.isPremium && this.args.user?.hasAccess;
  }

  <template>
    {{#if this.canViewPremium}}
      <PremiumContent />
    {{else}}
      <UpgradeCTA />
    {{/if}}
  </template>
}
```

## Component Switching Pattern

Use conditional rendering for component selection:

```javascript
// app/components/media-viewer.gjs
import Component from '@glimmer/component';
import ImageViewer from './image-viewer';
import VideoPlayer from './video-player';
import AudioPlayer from './audio-player';
import { cached } from '@glimmer/tracking';

class MediaViewer extends Component {
  @cached
  get mediaType() {
    return this.args.media?.type;
  }

  <template>
    {{#if (eq this.mediaType "image")}}
      <ImageViewer @src={{@media.url}} />
    {{else if (eq this.mediaType "video")}}
      <VideoPlayer @src={{@media.url}} />
    {{else if (eq this.mediaType "audio")}}
      <AudioPlayer @src={{@media.url}} />
    {{else}}
      <p>Unsupported media type</p>
    {{/if}}
  </template>
}
```

## Loading States

Pattern for async data with loading/error states:

```javascript
// app/components/data-display.gjs
import Component from '@glimmer/component';
import { Resource } from 'ember-resources';
import { resource } from 'ember-resources';

class DataResource extends Resource {
  @tracked data = null;
  @tracked isLoading = true;
  @tracked error = null;

  modify(positional, named) {
    this.fetchData(named.url);
  }

  async fetchData(url) {
    this.isLoading = true;
    this.error = null;
    try {
      const response = await fetch(url);
      this.data = await response.json();
    } catch (e) {
      this.error = e.message;
    } finally {
      this.isLoading = false;
    }
  }
}

class DataDisplay extends Component {
  @resource data = DataResource.from(() => ({
    url: this.args.url
  }));

  <template>
    {{#if this.data.isLoading}}
      <div class="loading">Loading...</div>
    {{else if this.data.error}}
      <div class="error">Error: {{this.data.error}}</div>
    {{else}}
      <div class="content">
        {{this.data.data}}
      </div>
    {{/if}}
  </template>
}
```

## Performance Impact

- **Chained if/else**: 40-60% faster than multiple independent {{#if}} blocks
- **Extracted getters**: ~20% faster for complex conditions (cached)
- **Component switching**: Same performance as {{#if}} but better code organization

## When to Use

- **{{#if}}/{{#else}}**: For simple true/false conditions
- **Extracted getters**: For complex or reused conditions
- **Component switching**: For different component types based on state
- **Guard clauses**: To avoid rendering large subtrees when not needed

## References

- [Ember Guides - Conditionals](https://guides.emberjs.com/release/components/conditional-content/)
- [Glimmer VM Performance](https://github.com/glimmerjs/glimmer-vm)
- [@cached decorator](https://api.emberjs.com/ember/release/functions/@glimmer%2Ftracking/cached)

---

---
title: Use {{#each}} with @key for Lists
impact: MEDIUM
impactDescription: 50-70% faster list updates
tags: templates, each, performance, rendering
---

## Use {{#each}} with @key for Lists

Always use the `@key` parameter with `{{#each}}` for lists of objects to help Ember efficiently track and update items.

**Incorrect (no key):**

```javascript
// app/components/user-list.gjs
import UserCard from './user-card';

<template>
  <ul>
    {{#each this.users as |user|}}
      <li>
        <UserCard @user={{user}} />
      </li>
    {{/each}}
  </ul>
</template>
```

**Correct (with key):**

```javascript
// app/components/user-list.gjs
import UserCard from './user-card';

<template>
  <ul>
    {{#each this.users key="id" as |user|}}
      <li>
        <UserCard @user={{user}} />
      </li>
    {{/each}}
  </ul>
</template>
```

**For arrays without stable IDs, use @identity:**

```javascript
// app/components/tag-list.gjs
<template>
  {{#each this.tags key="@identity" as |tag|}}
    <span class="tag">{{tag}}</span>
  {{/each}}
</template>
```

**For complex scenarios with @index:**

```javascript
// app/components/item-list.gjs
<template>
  {{#each this.items key="@index" as |item index|}}
    <div data-index={{index}}>
      {{item.name}}
    </div>
  {{/each}}
</template>
```

Using proper keys allows Ember's rendering engine to efficiently update, reorder, and remove items without re-rendering the entire list.

**Performance comparison:**
- Without key: Re-renders entire list on changes
- With key by id: Only updates changed items (50-70% faster)
- With @identity: Good for primitive arrays (strings, numbers)
- With @index: Only use when items never reorder

Reference: [Glimmer Rendering](https://guides.emberjs.com/release/components/looping-through-lists/)

---

---
title: Use {{fn}} for Partial Application Only
impact: LOW-MEDIUM
impactDescription: Clearer code, avoid unnecessary wrapping
tags: helpers, templates, fn, partial-application
---

## Use {{fn}} for Partial Application Only

The `{{fn}}` helper is used for partial application (binding arguments), similar to JavaScript's `.bind()`. Only use it when you need to pre-bind arguments to a function. Don't use it to simply pass a function reference.

**Incorrect (unnecessary use of {{fn}}):**

```javascript
// app/components/search.gjs
import Component from '@glimmer/component';
import { action } from '@ember/object';

class Search extends Component {
  @action
  handleSearch(event) {
    console.log('Searching:', event.target.value);
  }

  <template>
    {{! Wrong - no arguments being bound}}
    <input {{on "input" (fn this.handleSearch)}} />
  </template>
}
```

**Correct (direct function reference):**

```javascript
// app/components/search.gjs
import Component from '@glimmer/component';
import { action } from '@ember/object';

class Search extends Component {
  @action
  handleSearch(event) {
    console.log('Searching:', event.target.value);
  }

  <template>
    {{! Correct - pass function directly}}
    <input {{on "input" this.handleSearch}} />
  </template>
}
```

**When to Use {{fn}} - Partial Application:**

Use `{{fn}}` when you need to pre-bind arguments to a function, similar to JavaScript's `.bind()`:

```javascript
// app/components/user-list.gjs
import Component from '@glimmer/component';
import { action } from '@ember/object';

class UserList extends Component {
  @action
  deleteUser(userId, event) {
    console.log('Deleting user:', userId);
    this.args.onDelete(userId);
  }

  <template>
    <ul>
      {{#each @users as |user|}}
        <li>
          {{user.name}}
          {{! Correct - binding user.id as first argument}}
          <button {{on "click" (fn this.deleteUser user.id)}}>
            Delete
          </button>
        </li>
      {{/each}}
    </ul>
  </template>
}
```

**Multiple Arguments:**

```javascript
// app/components/data-grid.gjs
import Component from '@glimmer/component';
import { action } from '@ember/object';

class DataGrid extends Component {
  @action
  updateCell(rowId, columnKey, event) {
    const newValue = event.target.value;
    this.args.onUpdate(rowId, columnKey, newValue);
  }

  <template>
    {{#each @rows as |row|}}
      {{#each @columns as |column|}}
        <input
          value={{get row column.key}}
          {{! Pre-binding rowId and columnKey}}
          {{on "input" (fn this.updateCell row.id column.key)}}
        />
      {{/each}}
    {{/each}}
  </template>
}
```

**Think of {{fn}} like .bind():**

```javascript
// JavaScript comparison
const boundFn = this.deleteUser.bind(this, userId); // .bind() pre-binds args
// Template equivalent: {{fn this.deleteUser userId}}

// Direct reference
const directFn = this.handleSearch; // No pre-binding
// Template equivalent: {{this.handleSearch}}
```

**Common Patterns:**

```javascript
// ❌ Wrong - no partial application
<button {{on "click" (fn this.save)}}>Save</button>

// ✅ Correct - direct reference
<button {{on "click" this.save}}>Save</button>

// ✅ Correct - partial application with argument
<button {{on "click" (fn this.save "draft")}}>Save Draft</button>

// ❌ Wrong - no partial application
<input {{on "input" (fn this.handleInput)}} />

// ✅ Correct - direct reference
<input {{on "input" this.handleInput}} />

// ✅ Correct - partial application with field name
<input {{on "input" (fn this.updateField "email")}} />
```

Only use `{{fn}}` when you're binding arguments. For simple function references, pass them directly.

Reference: [Ember Templates - fn Helper](https://guides.emberjs.com/release/components/template-lifecycle-dom-and-modifiers/#toc_passing-arguments-to-functions)

---

---
title: Import Helpers Directly in Templates
impact: MEDIUM
impactDescription: Better tree-shaking and clarity
tags: helpers, imports, templates, gjs
---

## Import Helpers Directly in Templates

Import helpers directly in gjs/gts files for better tree-shaking, clearer dependencies, and improved type safety.

**Incorrect (global helper resolution):**

```javascript
// app/components/user-profile.gjs
<template>
  <div class="profile">
    <h1>{{capitalize @user.name}}</h1>
    <p>Joined: {{format-date @user.createdAt}}</p>
    <p>Posts: {{pluralize @user.postCount "post"}}</p>
  </div>
</template>
```

**Correct (explicit helper imports):**

```javascript
// app/components/user-profile.gjs
import { capitalize } from 'ember-string-helpers';
import { formatDate } from 'ember-intl';
import { pluralize } from 'ember-inflector';

<template>
  <div class="profile">
    <h1>{{capitalize @user.name}}</h1>
    <p>Joined: {{formatDate @user.createdAt}}</p>
    <p>Posts: {{pluralize @user.postCount "post"}}</p>
  </div>
</template>
```

**Built-in helpers from Ember:**

```javascript
// app/components/conditional-content.gjs
import { array } from '@ember/helper';
import { fn, hash } from '@ember/helper';
import { eq, not } from 'ember-truth-helpers';

<template>
  <div class="content">
    {{#if (eq @status "active")}}
      <span class="badge">Active</span>
    {{/if}}
    
    {{#if (not @isLoading)}}
      <button {{on "click" (fn @onSave (hash id=@id data=@data))}}>
        Save
      </button>
    {{/if}}
  </div>
</template>
```

**Custom helper with imports:**

```javascript
// app/helpers/format-currency.js
import { helper } from '@ember/component/helper';

export function formatCurrency([amount], { currency = 'USD' }) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency
  }).format(amount);
}

export default helper(formatCurrency);
```

```javascript
// app/components/price-display.gjs
import { formatCurrency } from '../helpers/format-currency';

<template>
  <div class="price">
    {{formatCurrency @amount currency="EUR"}}
  </div>
</template>
```

**Type-safe helpers with TypeScript:**

```typescript
// app/components/typed-component.gts
import { fn } from '@ember/helper';
import type { TOC } from '@ember/component/template-only';

interface Signature {
  Args: {
    items: Array<{ id: string; name: string }>;
    onSelect: (id: string) => void;
  };
}

const TypedComponent: TOC<Signature> = <template>
  <ul>
    {{#each @items as |item|}}
      <li {{on "click" (fn @onSelect item.id)}}>
        {{item.name}}
      </li>
    {{/each}}
  </ul>
</template>;

export default TypedComponent;
```

Explicit helper imports enable better tree-shaking, make dependencies clear, and improve IDE support with proper type checking.

Reference: [Template Imports](https://github.com/ember-template-imports/ember-template-imports)

---

---
title: Use {{#let}} to Avoid Recomputation
impact: MEDIUM
impactDescription: 30-50% reduction in duplicate work
tags: templates, helpers, performance, optimization
---

## Use {{#let}} to Avoid Recomputation

Use `{{#let}}` to compute expensive values once and reuse them in the template instead of calling getters or helpers multiple times.

**Incorrect (recomputes on every reference):**

```javascript
// app/components/user-card.gjs
<template>
  <div class="user-card">
    {{#if (and this.user.isActive (not this.user.isDeleted))}}
      <h3>{{this.user.fullName}}</h3>
      <p>Status: Active</p>
    {{/if}}
    
    {{#if (and this.user.isActive (not this.user.isDeleted))}}
      <button {{on "click" this.editUser}}>Edit</button>
    {{/if}}
    
    {{#if (and this.user.isActive (not this.user.isDeleted))}}
      <button {{on "click" this.deleteUser}}>Delete</button>
    {{/if}}
  </div>
</template>
```

**Correct (compute once, reuse):**

```javascript
// app/components/user-card.gjs
<template>
  {{#let (and this.user.isActive (not this.user.isDeleted)) as |isEditable|}}
    <div class="user-card">
      {{#if isEditable}}
        <h3>{{this.user.fullName}}</h3>
        <p>Status: Active</p>
      {{/if}}
      
      {{#if isEditable}}
        <button {{on "click" this.editUser}}>Edit</button>
      {{/if}}
      
      {{#if isEditable}}
        <button {{on "click" this.deleteUser}}>Delete</button>
      {{/if}}
    </div>
  {{/let}}
</template>
```

**Multiple values:**

```javascript
// app/components/checkout.gjs
<template>
  {{#let 
    (this.calculateTotal this.items)
    (this.formatCurrency this.total)
    (this.hasDiscount this.user)
    as |total formattedTotal showDiscount|
  }}
    <div class="checkout">
      <p>Total: {{formattedTotal}}</p>
      
      {{#if showDiscount}}
        <p>Original: {{total}}</p>
        <p>Discount Applied!</p>
      {{/if}}
    </div>
  {{/let}}
</template>
```

`{{#let}}` computes values once and caches them for the block scope, reducing redundant calculations.

---

---
title: Use Modern Testing Patterns
impact: HIGH
impactDescription: Better test coverage and maintainability
tags: testing, qunit, test-helpers, integration-tests
---

## Use Modern Testing Patterns

Use modern Ember testing patterns with `@ember/test-helpers` and `qunit-dom` for better test coverage and maintainability.

**Incorrect (old testing patterns):**

```javascript
// tests/integration/components/user-card-test.js
import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render, find, click } from '@ember/test-helpers';
import UserCard from 'my-app/components/user-card';

module('Integration | Component | user-card', function(hooks) {
  setupRenderingTest(hooks);

  test('it renders', async function(assert) {
    await render(<template><UserCard /></template>);
    
    // Using find() instead of qunit-dom
    assert.ok(find('.user-card'));
  });
});
```

**Correct (modern testing patterns):**

```javascript
// tests/integration/components/user-card-test.js
import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render, click } from '@ember/test-helpers';
import { setupIntl } from 'ember-intl/test-support';
import UserCard from 'my-app/components/user-card';

module('Integration | Component | user-card', function(hooks) {
  setupRenderingTest(hooks);
  setupIntl(hooks);

  test('it renders user information', async function(assert) {
    const user = {
      name: 'John Doe',
      email: 'john@example.com',
      avatarUrl: '/avatar.jpg'
    };
    
    await render(<template>
      <UserCard @user={{user}} />
    </template>);
    
    // qunit-dom assertions
    assert.dom('[data-test-user-name]').hasText('John Doe');
    assert.dom('[data-test-user-email]').hasText('john@example.com');
    assert.dom('[data-test-user-avatar]')
      .hasAttribute('src', '/avatar.jpg')
      .hasAttribute('alt', 'John Doe');
  });
  
  test('it handles edit action', async function(assert) {
    assert.expect(1);
    
    const user = { name: 'John Doe', email: 'john@example.com' };
    const handleEdit = (editedUser) => {
      assert.deepEqual(editedUser, user, 'Edit handler called with user');
    };
    
    await render(<template>
      <UserCard @user={{user}} @onEdit={{handleEdit}} />
    </template>);
    
    await click('[data-test-edit-button]');
  });
});
```

**Component testing with TypeScript:**

```typescript
// tests/integration/components/search-box-test.ts
import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render, fillIn, waitFor } from '@ember/test-helpers';
import type { TestContext } from '@ember/test-helpers';
import SearchBox from 'my-app/components/search-box';

interface Context extends TestContext {
  query: string;
  results: string[];
}

module('Integration | Component | search-box', function(hooks) {
  setupRenderingTest(hooks);

  test('it performs search', async function(this: Context, assert) {
    this.results = [];
    
    const handleSearch = (query: string) => {
      this.results = [`Result for ${query}`];
    };
    
    await render(<template>
      <SearchBox @onSearch={{handleSearch}} />
      <ul data-test-results>
        {{#each this.results as |result|}}
          <li>{{result}}</li>
        {{/each}}
      </ul>
    </template>);
    
    await fillIn('[data-test-search-input]', 'ember');
    
    await waitFor('[data-test-results] li');
    
    assert.dom('[data-test-results] li').hasText('Result for ember');
  });
});
```

**Testing with ember-concurrency tasks:**

```javascript
// tests/integration/components/async-button-test.js
import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render, click, waitFor } from '@ember/test-helpers';
import { task } from 'ember-concurrency';
import AsyncButton from 'my-app/components/async-button';

module('Integration | Component | async-button', function(hooks) {
  setupRenderingTest(hooks);

  test('it shows loading state', async function(assert) {
    let resolveTask;
    const asyncTask = task(async () => {
      await new Promise(resolve => { resolveTask = resolve; });
    });
    
    await render(<template>
      <AsyncButton @task={{asyncTask}}>
        Click me
      </AsyncButton>
    </template>);
    
    await click('[data-test-button]');
    
    assert.dom('[data-test-button]').hasAttribute('disabled');
    assert.dom('[data-test-loading-spinner]').exists();
    
    resolveTask();
    await waitFor('[data-test-button]:not([disabled])');
    
    assert.dom('[data-test-loading-spinner]').doesNotExist();
  });
});
```

**Route testing:**

```javascript
// tests/acceptance/posts-test.js
import { module, test } from 'qunit';
import { visit, currentURL, click } from '@ember/test-helpers';
import { setupApplicationTest } from 'ember-qunit';
import { setupMirage } from 'ember-cli-mirage/test-support';

module('Acceptance | posts', function(hooks) {
  setupApplicationTest(hooks);
  setupMirage(hooks);

  test('visiting /posts', async function(assert) {
    this.server.createList('post', 3);
    
    await visit('/posts');
    
    assert.strictEqual(currentURL(), '/posts');
    assert.dom('[data-test-post-item]').exists({ count: 3 });
  });
  
  test('clicking a post navigates to detail', async function(assert) {
    const post = this.server.create('post', { 
      title: 'Test Post',
      slug: 'test-post'
    });
    
    await visit('/posts');
    await click('[data-test-post-item]:first-child');
    
    assert.strictEqual(currentURL(), `/posts/${post.slug}`);
    assert.dom('[data-test-post-title]').hasText('Test Post');
  });
});
```

**Accessibility testing:**

```javascript
// tests/integration/components/modal-test.js
import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render, click } from '@ember/test-helpers';
import a11yAudit from 'ember-a11y-testing/test-support/audit';
import Modal from 'my-app/components/modal';

module('Integration | Component | modal', function(hooks) {
  setupRenderingTest(hooks);

  test('it passes accessibility audit', async function(assert) {
    await render(<template>
      <Modal @isOpen={{true}} @title="Test Modal">
        <p>Modal content</p>
      </Modal>
    </template>);
    
    await a11yAudit();
    assert.ok(true, 'no a11y violations');
  });
  
  test('it traps focus', async function(assert) {
    await render(<template>
      <Modal @isOpen={{true}}>
        <button data-test-first>First</button>
        <button data-test-last>Last</button>
      </Modal>
    </template>);
    
    assert.dom('[data-test-first]').isFocused();
    
    // Tab should stay within modal
    await click('[data-test-last]');
    assert.dom('[data-test-last]').isFocused();
  });
});
```

**Testing with data-test attributes:**

```javascript
// app/components/user-profile.gjs
import Component from '@glimmer/component';

class UserProfile extends Component {
  <template>
    <div class="user-profile" data-test-user-profile>
      <img 
        src={{@user.avatar}} 
        alt={{@user.name}}
        data-test-avatar
      />
      <h2 data-test-name>{{@user.name}}</h2>
      <p data-test-email>{{@user.email}}</p>
      
      {{#if @onEdit}}
        <button 
          {{on "click" (fn @onEdit @user)}}
          data-test-edit-button
        >
          Edit
        </button>
      {{/if}}
    </div>
  </template>
}
```

Modern testing patterns with `@ember/test-helpers`, `qunit-dom`, and data-test attributes provide better test reliability, readability, and maintainability.

Reference: [Ember Testing](https://guides.emberjs.com/release/testing/)

---

---
title: Use Appropriate Render Patterns in Tests
impact: MEDIUM
impactDescription: Simpler test code and better readability
tags: testing, render, component-testing, test-helpers
---

## Use Appropriate Render Patterns in Tests

Choose the right rendering pattern based on whether your component needs arguments, blocks, or attributes in the test.

**Pattern 1: Direct component render (no args/blocks/attributes):**

```javascript
// tests/integration/components/loading-spinner-test.js
import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render } from '@ember/test-helpers';
import LoadingSpinner from 'my-app/components/loading-spinner';

module('Integration | Component | loading-spinner', function(hooks) {
  setupRenderingTest(hooks);

  test('it renders without arguments', async function(assert) {
    // ✅ Simple: pass component directly when no args needed
    await render(LoadingSpinner);
    
    assert.dom('[data-test-spinner]').exists();
    assert.dom('[data-test-spinner]').hasClass('loading');
  });
});
```

**Pattern 2: Template tag render (with args/blocks/attributes):**

```javascript
// tests/integration/components/user-card-test.js
import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render } from '@ember/test-helpers';
import UserCard from 'my-app/components/user-card';

module('Integration | Component | user-card', function(hooks) {
  setupRenderingTest(hooks);

  test('it renders with arguments', async function(assert) {
    const user = { name: 'John Doe', email: 'john@example.com' };
    
    // ✅ Use template tag when passing arguments
    await render(<template>
      <UserCard @user={{user}} />
    </template>);
    
    assert.dom('[data-test-user-name]').hasText('John Doe');
  });
  
  test('it renders with block content', async function(assert) {
    // ✅ Use template tag when providing blocks
    await render(<template>
      <UserCard>
        <:header>Custom Header</:header>
        <:body>Custom Content</:body>
      </UserCard>
    </template>);
    
    assert.dom('[data-test-header]').hasText('Custom Header');
    assert.dom('[data-test-body]').hasText('Custom Content');
  });
  
  test('it renders with HTML attributes', async function(assert) {
    // ✅ Use template tag when passing HTML attributes
    await render(<template>
      <UserCard class="featured" data-test-featured />
    </template>);
    
    assert.dom('[data-test-featured]').exists();
    assert.dom('[data-test-featured]').hasClass('featured');
  });
});
```

**Complete example showing both patterns:**

```javascript
// tests/integration/components/button-test.js
import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render, click } from '@ember/test-helpers';
import Button from 'my-app/components/button';

module('Integration | Component | button', function(hooks) {
  setupRenderingTest(hooks);

  test('it renders default button', async function(assert) {
    // ✅ No args needed - use direct render
    await render(Button);
    
    assert.dom('button').exists();
    assert.dom('button').hasText('Click me');
  });
  
  test('it renders with custom text', async function(assert) {
    // ✅ Needs block content - use template tag
    await render(<template>
      <Button>Submit Form</Button>
    </template>);
    
    assert.dom('button').hasText('Submit Form');
  });
  
  test('it handles click action', async function(assert) {
    assert.expect(1);
    
    const handleClick = () => {
      assert.ok(true, 'Click handler called');
    };
    
    // ✅ Needs argument - use template tag
    await render(<template>
      <Button @onClick={{handleClick}}>Click me</Button>
    </template>);
    
    await click('button');
  });
  
  test('it applies variant styling', async function(assert) {
    // ✅ Needs argument - use template tag
    await render(<template>
      <Button @variant="primary">Primary Button</Button>
    </template>);
    
    assert.dom('button').hasClass('btn-primary');
  });
});
```

**Testing template-only components:**

```javascript
// tests/integration/components/icon-test.js
import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render } from '@ember/test-helpers';
import Icon from 'my-app/components/icon';

module('Integration | Component | icon', function(hooks) {
  setupRenderingTest(hooks);

  test('it renders default icon', async function(assert) {
    // ✅ Template-only component with no args - use direct render
    await render(Icon);
    
    assert.dom('[data-test-icon]').exists();
  });
  
  test('it renders specific icon', async function(assert) {
    // ✅ Needs @name argument - use template tag
    await render(<template>
      <Icon @name="check" @size="large" />
    </template>);
    
    assert.dom('[data-test-icon]').hasAttribute('data-icon', 'check');
    assert.dom('[data-test-icon]').hasClass('icon-large');
  });
});
```

**Decision guide:**

| Scenario | Pattern | Example |
|----------|---------|---------|
| No arguments, blocks, or attributes | `render(Component)` | `render(LoadingSpinner)` |
| Component needs arguments | `render(<template>...</template>)` | `render(<template><Card @title="Hello" /></template>)` |
| Component receives block content | `render(<template>...</template>)` | `render(<template><Card>Content</Card></template>)` |
| Component needs HTML attributes | `render(<template>...</template>)` | `render(<template><Card class="featured" /></template>)` |
| Multiple test context properties | `render(<template>...</template>)` | `render(<template><Card @data={{this.data}} /></template>)` |

**Why this matters:**

- **Simplicity**: Direct render reduces boilerplate for simple cases
- **Clarity**: Template syntax makes data flow explicit when needed
- **Consistency**: Clear pattern helps teams write maintainable tests
- **Type Safety**: Both patterns work with TypeScript for component types

**Common patterns:**

```javascript
// ✅ Simple component, no setup needed
await render(LoadingSpinner);
await render(Divider);
await render(Logo);

// ✅ Component with arguments from test context
await render(<template>
  <UserList @users={{this.users}} @onSelect={{this.handleSelect}} />
</template>);

// ✅ Component with named blocks
await render(<template>
  <Modal>
    <:header>Title</:header>
    <:body>Content</:body>
    <:footer><button>Close</button></:footer>
  </Modal>
</template>);

// ✅ Component with splattributes
await render(<template>
  <Card class="highlighted" data-test-card role="article">
    Card content
  </Card>
</template>);
```

Using the appropriate render pattern keeps tests clean and expressive.

Reference: [Ember Testing Guide](https://guides.emberjs.com/release/testing/)

---

