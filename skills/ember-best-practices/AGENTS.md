# Ember.js Community - Ember.js Best Practices

**Version:** 1.0.0

**Organization:** Ember.js Community

**Date:** January 2026

**Last Updated:** January 2026


## Abstract

Comprehensive performance optimization and accessibility guide for Ember.js applications, designed for AI agents and LLMs. Contains 33 rules across 7 categories, prioritized by impact from critical (route loading optimization, build performance) to advanced patterns (Resources, ember-concurrency, modern testing). Each rule includes detailed explanations, real-world examples comparing incorrect vs. correct implementations, and specific impact metrics to guide automated refactoring and code generation. Uses WarpDrive for modern data management, includes accessibility best practices leveraging ember-a11y-testing and other OSS tools.


## Table of Contents

1. [Route Loading and Data Fetching](#route) - 5 rules
2. [Build and Bundle Optimization](#bundle) - 3 rules
3. [Component and Reactivity Optimization](#component) - 8 rules
4. [Accessibility Best Practices](#a11y) - 5 rules
5. [Service and State Management](#service) - 3 rules
6. [Template Optimization](#template) - 4 rules
7. [Advanced Patterns](#advanced) - 5 rules


---


## 1. Route Loading and Data Fetching

**Impact:** CRITICAL


Efficient route loading and parallel data fetching eliminate waterfalls. Using route model hooks effectively and loading data in parallel yields the largest performance gains.


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

**Correct (Embroider with route splitting):**

```javascript
// ember-cli-build.js
const { Webpack } = require('@embroider/webpack');

module.exports = require('@embroider/compat').compatBuild(app, Webpack, {
  staticAddonTestSupportTrees: true,
  staticAddonTrees: true,
  staticHelpers: true,
  staticModifiers: true,
  staticComponents: true,
  packagerOptions: {
    webpackConfig: {
      module: {
        rules: [
          {
            test: /\.css$/,
            use: ['style-loader', 'css-loader']
          }
        ]
      }
    }
  },
  splitAtRoutes: ['admin', 'reports', 'settings'] // Routes to split
});
```

Embroider with `splitAtRoutes` creates separate bundles for specified routes, reducing initial load time by 30-70%.

Reference: [Embroider Documentation](https://github.com/embroider-build/embroider)


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


## Parallel Data Loading in Model Hooks

When fetching multiple independent data sources in a route's model hook, use `Promise.all()` or RSVP.hash() to load them in parallel instead of sequentially.

**Incorrect (sequential loading, 3 round trips):**

```javascript
// app/routes/dashboard.js
import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';

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
import { inject as service } from '@ember/service';
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


## Use Route Templates with Co-located Syntax

Use co-located route templates with modern gjs syntax for better organization and maintainability.

**Incorrect (separate template file):**

```javascript
// app/routes/posts.js
import Route from '@ember/routing/route';

export default class PostsRoute extends Route {
  model() {
    return this.store.request({ url: '/posts' });
  }
}
```

```handlebars
{{! app/templates/posts.hbs }}
<h1>Posts</h1>
<ul>
  {{#each @model as |post|}}
    <li>{{post.title}}</li>
  {{/each}}
</ul>
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


## 2. Build and Bundle Optimization

**Impact:** CRITICAL


Using Embroider with static build optimizations, route-based code splitting, and proper imports reduces bundle size and improves Time to Interactive.


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

export default class MyComponent extends Component {
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

export default class MyComponent extends Component {
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

export default class MyComponent extends Component {
  someMethod() {
    return debounce(this, this.handler, 300);
  }
}
```

Direct imports and using built-in Ember utilities reduce bundle size by avoiding unused code.


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

**Correct (Embroider with static optimizations):**

```javascript
// ember-cli-build.js
const EmberApp = require('ember-cli/lib/broccoli/ember-app');

module.exports = async function (defaults) {
  const app = new EmberApp(defaults, {
    'ember-cli-babel': {
      enableTypeScriptTransform: true,
    },
  });

  const { Webpack } = require('@embroider/webpack');
  return require('@embroider/compat').compatBuild(app, Webpack, {
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


---


## Lazy Load Heavy Dependencies

Use dynamic imports to load heavy libraries only when needed, reducing initial bundle size.

**Incorrect (loaded upfront):**

```javascript
import Component from '@glimmer/component';
import Chart from 'chart.js/auto'; // 300KB library loaded immediately
import hljs from 'highlight.js'; // 500KB library loaded immediately

export default class DashboardComponent extends Component {
  get showChart() {
    return this.args.hasData;
  }
}
```

**Correct (lazy loaded when needed):**

```javascript
import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';

export default class DashboardComponent extends Component {
  @tracked ChartComponent = null;
  @tracked highlighter = null;

  @action
  async loadChart() {
    if (!this.ChartComponent) {
      const { default: Chart } = await import('chart.js/auto');
      this.ChartComponent = Chart;
    }
  }

  @action
  async highlightCode(code) {
    if (!this.highlighter) {
      const { default: hljs } = await import('highlight.js');
      this.highlighter = hljs;
    }
    return this.highlighter.highlightAuto(code);
  }
}
```

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


## 3. Component and Reactivity Optimization

**Impact:** HIGH


Proper use of Glimmer components, tracked properties, and avoiding unnecessary recomputation improves rendering performance.


## Validate Component Arguments

Validate component arguments for better error messages, documentation, and type safety.

**Incorrect (no argument validation):**

```javascript
// app/components/user-card.gjs
import Component from '@glimmer/component';

export default class UserCardComponent extends Component {
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

export default class UserCardComponent extends Component<UserCardSignature> {
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

**Runtime validation with assertions:**

```javascript
// app/components/data-table.gjs
import Component from '@glimmer/component';
import { assert } from '@ember/debug';

export default class DataTableComponent extends Component {
  constructor(owner, args) {
    super(owner, args);
    
    assert(
      'DataTable requires @columns argument',
      this.args.columns && Array.isArray(this.args.columns)
    );
    
    assert(
      'DataTable requires @rows argument',
      this.args.rows && Array.isArray(this.args.rows)
    );
    
    assert(
      '@columns must be an array of objects with "key" and "label" properties',
      this.args.columns.every(col => col.key && col.label)
    );
  }

  <template>
    <table class="data-table">
      <thead>
        <tr>
          {{#each @columns as |column|}}
            <th>{{column.label}}</th>
          {{/each}}
        </tr>
      </thead>
      <tbody>
        {{#each @rows as |row|}}
          <tr>
            {{#each @columns as |column|}}
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
export default class ModalComponent extends Component {
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


## Use @cached for Expensive Getters

Use `@cached` from `@glimmer/tracking` to memoize expensive computations that depend on tracked properties. The cached value is automatically invalidated when dependencies change.

**Incorrect (recomputes on every access):**

```javascript
import Component from '@glimmer/component';

export default class DataTableComponent extends Component {
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

export default class DataTableComponent extends Component {
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


## Prevent Memory Leaks in Components

Properly clean up event listeners, timers, and subscriptions to prevent memory leaks.

**Incorrect (no cleanup):**

```javascript
// app/components/live-clock.gjs
import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';

export default class LiveClockComponent extends Component {
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

export default class LiveClockComponent extends Component {
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

export default class WindowSizeComponent extends Component {
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

export default class ResizeAwareComponent extends Component {
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

export default class DataLoaderComponent extends Component {
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

export default class WebsocketDataComponent extends Component {
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


## Avoid Unnecessary Tracking

Only mark properties as `@tracked` if they need to trigger re-renders when changed. Overusing `@tracked` causes unnecessary invalidations and re-renders.

**Incorrect (everything tracked):**

```javascript
import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';

export default class FormComponent extends Component {
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

export default class FormComponent extends Component {
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


## Use {{on}} Modifier for Event Handling

Use the `{{on}}` modifier for event handling instead of traditional action handlers for better memory management and clearer code.

**Incorrect (traditional action attribute):**

```javascript
// app/components/button.gjs
import Component from '@glimmer/component';
import { action } from '@ember/object';

export default class ButtonComponent extends Component {
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

export default class ButtonComponent extends Component {
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

export default class ScrollTrackerComponent extends Component {
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

export default class InputFieldComponent extends Component {
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


## Use Strict Mode and Template-Only Components

Use strict mode and template-only components for simpler, safer code with better tooling support.

**Incorrect (JavaScript component for simple templates):**

```javascript
// app/components/user-card.gjs
import Component from '@glimmer/component';

export default class UserCardComponent extends Component {
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


## Use Tracked Toolbox for Complex State

For complex state patterns like maps, sets, and arrays that need fine-grained reactivity, use tracked-toolbox utilities instead of marking entire structures as @tracked.

**Incorrect (tracking entire structures):**

```javascript
import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';

export default class TodoListComponent extends Component {
  @tracked items = []; // Entire array replaced on every change
  
  @action
  addItem(item) {
    // Creates new array, invalidates all consumers
    this.items = [...this.items, item];
  }
  
  @action
  removeItem(index) {
    // Creates new array again
    this.items = this.items.filter((_, i) => i !== index);
  }
}
```

**Correct (using tracked-toolbox):**

```javascript
import Component from '@glimmer/component';
import { action } from '@ember/object';
import { TrackedArray } from 'tracked-built-ins';

export default class TodoListComponent extends Component {
  items = new TrackedArray([]);
  
  @action
  addItem(item) {
    // Efficiently adds to tracked array
    this.items.push(item);
  }
  
  @action
  removeItem(index) {
    // Efficiently removes from tracked array
    this.items.splice(index, 1);
  }
}
```

**Also useful for Maps and Sets:**

```javascript
import { TrackedMap, TrackedSet } from 'tracked-built-ins';

export default class CacheComponent extends Component {
  cache = new TrackedMap(); // Fine-grained reactivity per key
  selected = new TrackedSet(); // Fine-grained reactivity per item
}
```

tracked-built-ins provides fine-grained reactivity and better performance than replacing entire structures.

Reference: [tracked-built-ins](https://github.com/tracked-tools/tracked-built-ins)


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

export default class UserCardComponent extends Component {
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


## 4. Accessibility Best Practices

**Impact:** HIGH


Making applications accessible is critical. Use ember-a11y-testing, semantic HTML, proper ARIA attributes, and keyboard navigation support.


## Use ember-a11y-testing for Automated Checks

Integrate ember-a11y-testing into your test suite to automatically catch common accessibility violations during development. This addon uses axe-core to identify issues before they reach production.

**Incorrect (no accessibility testing):**

```javascript
// tests/integration/components/user-form-test.js
import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render, fillIn, click } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';

module('Integration | Component | user-form', function(hooks) {
  setupRenderingTest(hooks);

  test('it submits the form', async function(assert) {
    await render(hbs`<UserForm />`);
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
import { hbs } from 'ember-cli-htmlbars';
import a11yAudit from 'ember-a11y-testing/test-support/audit';

module('Integration | Component | user-form', function(hooks) {
  setupRenderingTest(hooks);

  test('it submits the form', async function(assert) {
    await render(hbs`<UserForm />`);
    
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
      <span class="error">{{this.emailError}}</span>
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
    <div class="form-group">
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
          class="error"
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

**For complex forms, use ember-changeset-validations:**

```javascript
import Component from '@glimmer/component';
import { action } from '@ember/object';
import { Changeset } from 'ember-changeset';
import lookupValidator from 'ember-changeset-validations';
import { validatePresence, validateFormat } from 'ember-changeset-validations/validators';

const UserValidations = {
  email: [
    validatePresence({ presence: true, message: 'Email is required' }),
    validateFormat({ type: 'email', message: 'Must be a valid email' })
  ]
};

export default class UserFormComponent extends Component {
  changeset = Changeset(this.args.user, lookupValidator(UserValidations), UserValidations);
  
  @action
  async handleSubmit(event) {
    event.preventDefault();
    await this.changeset.validate();
    
    if (this.changeset.isValid) {
      await this.args.onSubmit(this.changeset);
    }
  }
}
```

Always associate labels with inputs and announce dynamic changes to screen readers using aria-live regions.

Reference: [Ember Accessibility - Application Considerations](https://guides.emberjs.com/release/accessibility/application-considerations/)


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

**Correct (full keyboard support):**

```javascript
// app/components/dropdown.gjs
import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { fn } from '@ember/helper';

export default class DropdownComponent extends Component {
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
  
  @action
  focusFirstItem(element) {
    element.querySelector('[role="menuitem"] button')?.focus();
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
          {{did-insert this.focusFirstItem}}
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

Proper keyboard navigation ensures all users can interact with your application effectively.

Reference: [Ember Accessibility - Keyboard](https://guides.emberjs.com/release/accessibility/keyboard/)


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

**Correct (with route announcements using ember-a11y):**

```bash
ember install ember-a11y
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

```javascript
// app/routes/application.js
import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';

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


## Semantic HTML and ARIA Attributes

Use semantic HTML elements and proper ARIA attributes to make your application accessible to screen reader users. Prefer semantic elements over divs with ARIA roles.

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

export default class CustomButtonComponent extends Component {
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

Reference: [Ember Accessibility Guide](https://guides.emberjs.com/release/accessibility/)



---


## 5. Service and State Management

**Impact:** MEDIUM-HIGH


Efficient service patterns, proper dependency injection, and state management reduce redundant computations and API calls.


## Cache API Responses in Services

Cache API responses in services to avoid duplicate network requests. Use tracked properties to make the cache reactive.

**Incorrect (no caching):**

```javascript
// app/services/user.js
import Service from '@ember/service';
import { inject as service } from '@ember/service';

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
import { inject as service } from '@ember/service';
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
export default class UserBadgeComponent extends Component {
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
import { inject as service } from '@ember/service';

export default class HeaderComponent extends Component {
  @service theme;
  
  // Access theme.currentTheme directly
}
```

```javascript
// app/components/sidebar.js
import Component from '@glimmer/component';
import { inject as service } from '@ember/service';

export default class SidebarComponent extends Component {
  @service theme;
  
  // Access theme.currentTheme directly
}
```

Services provide centralized state management with automatic reactivity through tracked properties.

**For complex state, consider using Ember Data or ember-orbit:**

```javascript
// app/services/cart.js
import Service from '@ember/service';
import { inject as service } from '@ember/service';
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


## 6. Template Optimization

**Impact:** MEDIUM


Optimizing templates with proper helpers, avoiding expensive computations in templates, and using {{#each}} efficiently improves rendering speed.


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

export default class StatsComponent extends Component {
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


## 7. Advanced Patterns

**Impact:** MEDIUM-HIGH


Modern Ember patterns including Resources for lifecycle management, ember-concurrency for async operations, strict mode components, event handling with {{on}}, argument validation, memory leak prevention, route caching strategies, and comprehensive testing patterns.


## Use Ember Concurrency for Task Management

Use ember-concurrency for managing async operations with automatic cancelation, derived state, and better control flow.

**Incorrect (manual async handling):**

```javascript
// app/components/search.gjs
import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';

export default class SearchComponent extends Component {
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
    <input {{on "input" (fn this.search)}} />
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

export default class SearchComponent extends Component {
  searchTask = restartableTask(async (query) => {
    const response = await fetch(`/api/search?q=${query}`);
    return response.json();
  });

  <template>
    <input {{on "input" (fn this.searchTask.perform)}} />
    
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

export default class AutocompleteComponent extends Component {
  searchTask = restartableTask(async (query) => {
    // Debounce
    await timeout(300);
    
    const response = await fetch(`/api/autocomplete?q=${query}`);
    return response.json();
  });

  <template>
    <input 
      type="search"
      {{on "input" (fn this.searchTask.perform)}}
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


## Use Helper Functions for Reusable Logic

Extract reusable template logic into helper functions that can be tested independently and used across templates.

**Incorrect (logic duplicated in components):**

```javascript
// app/components/user-card.js
export default class UserCardComponent extends Component {
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
export default class PostCardComponent extends Component {
  get formattedDate() {
    // Same implementation...
  }
}
```

**Correct (reusable helper):**

```javascript
// app/helpers/format-relative-date.js
import { helper } from '@ember/component/helper';

function formatRelativeDate([date]) {
  const dateObj = new Date(date);
  const now = new Date();
  const diffMs = now - dateObj;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  return dateObj.toLocaleDateString();
}

export default helper(formatRelativeDate);
```

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
// app/helpers/format-currency.js
import Helper from '@ember/component/helper';
import { inject as service } from '@ember/service';

export default class FormatCurrencyHelper extends Helper {
  @service intl;
  
  compute([amount], { currency = 'USD' }) {
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


## Use Modifiers for DOM Side Effects

Use modifiers (element modifiers) to handle DOM side effects and lifecycle events in a reusable, composable way.

**Incorrect (component lifecycle hooks):**

```javascript
// app/components/chart.gjs
import Component from '@glimmer/component';
import { action } from '@ember/object';

export default class ChartComponent extends Component {
  chartInstance = null;
  
  @action
  setupChart(element) {
    this.chartInstance = new Chart(element, this.args.config);
  }
  
  willDestroy() {
    super.willDestroy(...arguments);
    this.chartInstance?.destroy();
  }

  <template>
    <canvas {{did-insert this.setupChart}}></canvas>
  </template>
}
```

**Correct (reusable modifier):**

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


## Use Resources for Declarative Data Management

Use ember-resources for declarative data management with automatic cleanup and lifecycle management instead of manual imperative code.

**Incorrect (manual lifecycle management):**

```javascript
// app/components/live-data.gjs
import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';

export default class LiveDataComponent extends Component {
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

**Correct (using Resources):**

```javascript
// app/components/live-data.gjs
import Component from '@glimmer/component';
import { resource } from 'ember-resources';

export default class LiveDataComponent extends Component {
  data = resource(({ on }) => {
    const poll = async () => {
      const response = await fetch('/api/data');
      return response.json();
    };
    
    const intervalId = setInterval(poll, 5000);
    
    // Automatic cleanup
    on.cleanup(() => clearInterval(intervalId));
    
    return poll();
  });

  <template>
    <div>{{this.data.value}}</div>
  </template>
}
```

**For tracked resources with arguments:**

```javascript
// app/components/user-profile.gjs
import Component from '@glimmer/component';
import { resource, resourceFactory } from 'ember-resources';

const UserData = resourceFactory((userId) => 
  resource(async ({ on }) => {
    const controller = new AbortController();
    
    on.cleanup(() => controller.abort());
    
    const response = await fetch(`/api/users/${userId}`, {
      signal: controller.signal
    });
    
    return response.json();
  })
);

export default class UserProfileComponent extends Component {
  userData = UserData(() => this.args.userId);

  <template>
    {{#if this.userData.value}}
      <h1>{{this.userData.value.name}}</h1>
    {{/if}}
  </template>
}
```

Resources provide automatic cleanup, prevent memory leaks, and offer better composition patterns.

Reference: [ember-resources](https://github.com/NullVoxPopuli/ember-resources)


---


## Use Modern Testing Patterns

Use modern Ember testing patterns with `@ember/test-helpers` and `qunit-dom` for better test coverage and maintainability.

**Incorrect (old testing patterns):**

```javascript
// tests/integration/components/user-card-test.js
import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render, find, click } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';

module('Integration | Component | user-card', function(hooks) {
  setupRenderingTest(hooks);

  test('it renders', async function(assert) {
    await render(hbs`<UserCard />`);
    
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

export default class UserProfileComponent extends Component {
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
