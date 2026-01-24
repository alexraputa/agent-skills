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
