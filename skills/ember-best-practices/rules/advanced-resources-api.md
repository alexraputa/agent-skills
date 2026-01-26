---
title: Use Resources API for Declarative Data Management
impact: MEDIUM-HIGH
impactDescription: Better lifecycle management and composability
tags: resources, lifecycle, data-management, advanced, ember-resources
---

## Use Resources API for Declarative Data Management

Use `ember-resources` for declarative data management with automatic cleanup. Resources provide a composable way to manage stateful data, async operations, and side effects with built-in lifecycle management.

**Key Benefits:**
- Automatic cleanup and teardown
- Reactive to tracked data changes
- Composable across components
- Better testability than lifecycle hooks

### When to Use Resources

Use resources for:
- Data that needs automatic cleanup (subscriptions, timers, event listeners)
- Async data fetching with dependency tracking
- Derived state that depends on tracked properties
- Complex stateful logic that should be reusable

**Incorrect (manual lifecycle management):**

```glimmer-js
// app/components/clock.gjs
import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { registerDestructor } from '@ember/destroyable';

export default class Clock extends Component {
  @tracked currentTime = new Date();
  intervalId = null;

  constructor() {
    super(...arguments);
    this.intervalId = setInterval(() => {
      this.currentTime = new Date();
    }, 1000);
    
    registerDestructor(this, () => {
      clearInterval(this.intervalId);
    });
  }

  <template>
    <div>{{this.currentTime}}</div>
  </template>
}
```

**Correct (using resources):**

```bash
npm install ember-resources
```

```javascript
// app/resources/clock.js
import { Resource } from 'ember-resources';
import { tracked } from '@glimmer/tracking';

export class Clock extends Resource {
  @tracked currentTime = new Date();
  
  setup() {
    this.intervalId = setInterval(() => {
      this.currentTime = new Date();
    }, 1000);
  }
  
  teardown() {
    clearInterval(this.intervalId);
  }
}
```

```glimmer-js
// app/components/clock.gjs
import { Clock } from '../resources/clock';

<template>
  {{#let (Clock) as |clock|}}
    <div>{{clock.currentTime}}</div>
  {{/let}}
</template>
```

### Function-based Resources (Preferred for Simple Cases)

For simpler scenarios, use the function-based `resource` helper:

```javascript
// app/utils/interval.js
import { resource } from 'ember-resources';
import { tracked } from '@glimmer/tracking';

export const interval = resource(({ on }) => {
  let state = new (class {
    @tracked time = new Date();
  })();
  
  let timer = setInterval(() => {
    state.time = new Date();
  }, 1000);
  
  on.cleanup(() => clearInterval(timer));
  
  return state;
});
```

```glimmer-js
// app/components/clock.gjs
import { interval } from '../utils/interval';

<template>
  <div>{{(interval).time}}</div>
</template>
```

### Resources with Arguments

Resources can react to changing arguments:

```javascript
// app/resources/user-data.js
import { resource, resourceFactory } from 'ember-resources';

export const UserData = resourceFactory((userId) => {
  return resource(({ on }) => {
    let state = new (class {
      @tracked user = null;
      @tracked isLoading = true;
      @tracked error = null;
    })();
    
    let abortController = new AbortController();
    
    fetch(`/api/users/${userId}`, { signal: abortController.signal })
      .then(r => r.json())
      .then(user => {
        state.user = user;
        state.isLoading = false;
      })
      .catch(error => {
        // Ignore abort errors
        if (error.name !== 'AbortError') {
          state.error = error;
          state.isLoading = false;
        }
      });
    
    // Cancel fetch if resource is torn down
    on.cleanup(() => abortController.abort());
    
    return state;
  });
});
```

```glimmer-js
// app/components/user-profile.gjs
import { UserData } from '../resources/user-data';

<template>
  {{#let (UserData @userId) as |data|}}
    {{#if data.isLoading}}
      Loading...
    {{else if data.error}}
      Error: {{data.error.message}}
    {{else}}
      <h1>{{data.user.name}}</h1>
      <p>{{data.user.email}}</p>
    {{/if}}
  {{/let}}
</template>
```

### Combining with Services

Resources work well with services for shared logic:

```javascript
// app/services/websocket.js
import Service from '@ember/service';
import { tracked } from '@glimmer/tracking';

export default class WebsocketService extends Service {
  @tracked connection = null;
  
  subscribe(channel, callback) {
    // Implementation
    return () => this.unsubscribe(channel, callback);
  }
}
```

```javascript
// app/resources/websocket-subscription.js
import { resource, resourceFactory } from 'ember-resources';
import { service } from '@ember/service';

export const WebsocketSubscription = resourceFactory((channel, callback) => {
  return resource(({ use, on }) => {
    let websocket = use(service('websocket'));
    let unsubscribe = websocket.subscribe(channel, callback);
    
    on.cleanup(unsubscribe);
  });
});
```

```glimmer-js
// app/components/live-data.gjs
import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { WebsocketSubscription } from '../resources/websocket-subscription';

export default class LiveData extends Component {
  @tracked messages = [];
  
  @action
  handleMessage(message) {
    this.messages = [...this.messages, message];
  }
  
  subscription = WebsocketSubscription('updates', this.handleMessage);
  
  <template>
    <ul>
      {{#each this.messages as |msg|}}
        <li>{{msg.text}}</li>
      {{/each}}
    </ul>
  </template>
}
```

### Best Practices

1. **Use function-based resources** for simple stateful logic
2. **Use class-based Resources** when you need complex state or methods
3. **Always cleanup** side effects in `teardown()` or `on.cleanup()`
4. **Keep resources focused** - one responsibility per resource
5. **Test resources independently** - they're just classes/functions

Resources provide better patterns than lifecycle hooks (`did-insert`, `will-destroy`) and should be preferred for any stateful or async logic.

**References:**
- [ember-resources Documentation](https://github.com/NullVoxPopuli/ember-resources)
- [Resources RFC](https://github.com/emberjs/rfcs/blob/master/text/0567-ember-resources.md)
- [Ember Destroyables](https://api.emberjs.com/ember/release/modules/@ember%2Fdestroyable)
