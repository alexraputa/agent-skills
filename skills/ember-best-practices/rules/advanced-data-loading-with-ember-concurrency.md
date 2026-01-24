---
title: Use Ember Concurrency Correctly - User Concurrency Not Data Loading
impact: HIGH
impactDescription: Prevents infinite render loops and improves performance
tags: ember-concurrency, tasks, data-loading, anti-pattern
---

## Use Ember Concurrency Correctly - User Concurrency Not Data Loading

ember-concurrency is designed for **user-initiated concurrency patterns** (debouncing, throttling, preventing double-clicks), not data loading. Use task return values, don't set tracked state inside tasks.

**Incorrect (using ember-concurrency for data loading with tracked state):**

```glimmer-js
// app/components/user-profile.gjs
import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { task } from 'ember-concurrency';

class UserProfile extends Component {
  @tracked userData = null;
  @tracked error = null;
  
  // WRONG: Setting tracked state inside task
  loadUserTask = task(async () => {
    try {
      const response = await fetch(`/api/users/${this.args.userId}`);
      this.userData = await response.json(); // Anti-pattern!
    } catch (e) {
      this.error = e; // Anti-pattern!
    }
  });

  <template>
    {{#if this.loadUserTask.isRunning}}
      Loading...
    {{else if this.userData}}
      <h1>{{this.userData.name}}</h1>
    {{/if}}
  </template>
}
```

**Why This Is Wrong:**
- Setting tracked state during render can cause infinite render loops
- ember-concurrency adds overhead unnecessary for simple data loading
- Makes component state harder to reason about
- Can trigger multiple re-renders

**Correct (use getPromiseState from warp-drive/reactiveweb for data loading):**

```glimmer-js
// app/components/user-profile.gjs
import Component from '@glimmer/component';
import { cached } from '@glimmer/tracking';
import { getPromiseState } from '@warp-drive/reactiveweb';

class UserProfile extends Component {
  @cached
  get userData() {
    const promise = fetch(`/api/users/${this.args.userId}`)
      .then(r => r.json());
    return getPromiseState(promise);
  }

  <template>
    {{#if this.userData.isPending}}
      <div>Loading...</div>
    {{else if this.userData.isRejected}}
      <div>Error: {{this.userData.error.message}}</div>
    {{else if this.userData.isFulfilled}}
      <h1>{{this.userData.value.name}}</h1>
    {{/if}}
  </template>
}
```

**Correct (use ember-concurrency for USER input, return values not tracked state):**

```glimmer-js
// app/components/search.gjs
import Component from '@glimmer/component';
import { restartableTask, timeout } from 'ember-concurrency';

class Search extends Component {
  // CORRECT: For user-initiated search with debouncing
  // Return the value, don't set tracked state
  searchTask = restartableTask(async (query) => {
    await timeout(300); // Debounce user typing
    const response = await fetch(`/api/search?q=${query}`);
    return response.json(); // Return, don't set tracked state
  });

  <template>
    <input 
      type="search"
      {{on "input" (fn this.searchTask.perform (pick "target.value"))}}
    />
    
    {{#if this.searchTask.isRunning}}
      <div class="loading">Searching...</div>
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

**Good Use Cases for ember-concurrency:**

1. **User input debouncing** - prevent API spam from typing
2. **Form submission** - prevent double-click submits with `dropTask`
3. **Autocomplete** - restart previous searches as user types
4. **Polling** - user-controlled refresh intervals
5. **Multi-step wizards** - sequential async operations

```glimmer-js
// app/components/form-submit.gjs
import Component from '@glimmer/component';
import { dropTask } from 'ember-concurrency';

class FormSubmit extends Component {
  // dropTask prevents double-submit - perfect for user actions
  submitTask = dropTask(async (formData) => {
    const response = await fetch('/api/save', {
      method: 'POST',
      body: JSON.stringify(formData)
    });
    return response.json();
  });

  <template>
    <button 
      {{on "click" (fn this.submitTask.perform @formData)}}
      disabled={{this.submitTask.isRunning}}
    >
      {{#if this.submitTask.isRunning}}
        Saving...
      {{else}}
        Save
      {{/if}}
    </button>
  </template>
}
```

**Bad Use Cases for ember-concurrency:**

1. ❌ **Loading data on component init** - use `getPromiseState` instead
2. ❌ **Route model hooks** - just return promises directly
3. ❌ **Simple API calls** - async/await is sufficient
4. ❌ **Setting tracked state inside tasks** - causes render loops

**Key Principles:**

- **Use task return values** - read from `task.last.value`, don't set tracked state
- **User-initiated only** - ember-concurrency is for handling user concurrency
- **Data loading** - use `getPromiseState` from warp-drive/reactiveweb
- **Avoid side effects** - don't modify component state inside tasks read during render

**Migration from tracked state pattern:**

```glimmer-js
// BEFORE (anti-pattern)
class Bad extends Component {
  @tracked data = null;
  
  fetchTask = task(async () => {
    this.data = await fetch('/api/data').then(r => r.json());
  });
}

// AFTER (correct)
class Good extends Component {
  fetchTask = restartableTask(async () => {
    return fetch('/api/data').then(r => r.json());
  });
  
  // Or better yet, for non-user-initiated loading:
  @cached
  get data() {
    return getPromiseState(fetch('/api/data').then(r => r.json()));
  }
}
```

ember-concurrency is a powerful tool for **user concurrency patterns**. For data loading, use `getPromiseState` instead.

Reference: 
- [ember-concurrency](https://ember-concurrency.com/)
- [warp-drive/reactiveweb](https://github.com/emberjs/data/tree/main/packages/reactiveweb)
