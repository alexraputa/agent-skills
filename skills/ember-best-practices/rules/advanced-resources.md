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
