---
title: Use tracked-built-ins for Reactive Collections
impact: HIGH
impactDescription: Enables reactive arrays, maps, and sets
tags: reactivity, tracked, collections, advanced, tracked-built-ins
---

## Use tracked-built-ins for Reactive Collections

Use `tracked-built-ins` to make arrays, Maps, Sets, and other built-in JavaScript objects reactive in Ember. Standard JavaScript collections don't trigger Ember's reactivity system when mutated—tracked-built-ins solves this.

**The Problem:**
Standard arrays, Maps, and Sets are not reactive in Ember when you mutate them. Changes won't trigger template updates.

**The Solution:**
Use `tracked-built-ins` to create reactive versions of these data structures.

### Installation

```bash
npm install tracked-built-ins
```

### Reactive Arrays

**Incorrect (non-reactive array):**

```glimmer-js
// app/components/todo-list.gjs
import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';

export default class TodoList extends Component {
  @tracked todos = []; // ❌ Array mutations (push, splice, etc.) won't trigger updates

  @action
  addTodo(text) {
    // This won't trigger a re-render!
    this.todos.push({ id: Date.now(), text });
  }
  
  @action
  removeTodo(id) {
    // This also won't trigger a re-render!
    const index = this.todos.findIndex(t => t.id === id);
    this.todos.splice(index, 1);
  }

  <template>
    <ul>
      {{#each this.todos as |todo|}}
        <li>
          {{todo.text}}
          <button {{on "click" (fn this.removeTodo todo.id)}}>Remove</button>
        </li>
      {{/each}}
    </ul>
    <button {{on "click" (fn this.addTodo "New todo")}}>Add</button>
  </template>
}
```

**Correct (reactive array with tracked-built-ins):**

```glimmer-js
// app/components/todo-list.gjs
import Component from '@glimmer/component';
import { action } from '@ember/object';
import { TrackedArray } from 'tracked-built-ins';

export default class TodoList extends Component {
  todos = new TrackedArray([]); // ✅ Mutations are reactive

  @action
  addTodo(text) {
    // Now this triggers re-render!
    this.todos.push({ id: Date.now(), text });
  }
  
  @action
  removeTodo(id) {
    // This also triggers re-render!
    const index = this.todos.findIndex(t => t.id === id);
    this.todos.splice(index, 1);
  }

  <template>
    <ul>
      {{#each this.todos as |todo|}}
        <li>
          {{todo.text}}
          <button {{on "click" (fn this.removeTodo todo.id)}}>Remove</button>
        </li>
      {{/each}}
    </ul>
    <button {{on "click" (fn this.addTodo "New todo")}}>Add</button>
  </template>
}
```

### Reactive Maps

Maps are useful for key-value stores with non-string keys:

```glimmer-js
// app/components/user-cache.gjs
import Component from '@glimmer/component';
import { action } from '@ember/object';
import { TrackedMap } from 'tracked-built-ins';

export default class UserCache extends Component {
  userCache = new TrackedMap(); // key: userId, value: userData
  
  @action
  cacheUser(userId, userData) {
    this.userCache.set(userId, userData);
  }
  
  @action
  clearUser(userId) {
    this.userCache.delete(userId);
  }
  
  get cachedUsers() {
    return Array.from(this.userCache.values());
  }

  <template>
    <ul>
      {{#each this.cachedUsers as |user|}}
        <li>{{user.name}}</li>
      {{/each}}
    </ul>
    <p>Cache size: {{this.userCache.size}}</p>
  </template>
}
```

### Reactive Sets

Sets are useful for unique collections:

```glimmer-js
// app/components/tag-selector.gjs
import Component from '@glimmer/component';
import { action } from '@ember/object';
import { TrackedSet } from 'tracked-built-ins';

export default class TagSelector extends Component {
  selectedTags = new TrackedSet();
  
  @action
  toggleTag(tag) {
    if (this.selectedTags.has(tag)) {
      this.selectedTags.delete(tag);
    } else {
      this.selectedTags.add(tag);
    }
  }
  
  get selectedCount() {
    return this.selectedTags.size;
  }

  <template>
    <div>
      {{#each @availableTags as |tag|}}
        <label>
          <input
            type="checkbox"
            checked={{this.selectedTags.has tag}}
            {{on "change" (fn this.toggleTag tag)}}
          />
          {{tag}}
        </label>
      {{/each}}
    </div>
    <p>Selected: {{this.selectedCount}} tags</p>
  </template>
}
```

### Reactive Objects

For dynamic objects with unknown keys:

```glimmer-js
// app/components/form-data.gjs
import Component from '@glimmer/component';
import { action } from '@ember/object';
import { TrackedObject } from 'tracked-built-ins';

export default class FormData extends Component {
  formData = new TrackedObject({});
  
  @action
  updateField(fieldName, value) {
    this.formData[fieldName] = value;
  }
  
  @action
  clearField(fieldName) {
    delete this.formData[fieldName];
  }
  
  get fieldCount() {
    return Object.keys(this.formData).length;
  }

  <template>
    <div>
      <input
        placeholder="Field name"
        {{on "input" (fn this.updateField "dynamicField")}}
      />
      <p>Fields: {{this.fieldCount}}</p>
    </div>
  </template>
}
```

### WeakMaps and WeakSets

For memory-efficient caching with automatic cleanup:

```javascript
// app/components/component-cache.js
import Component from '@glimmer/component';
import { TrackedWeakMap } from 'tracked-built-ins';

export default class ComponentCache extends Component {
  // Automatically cleans up when objects are garbage collected
  cache = new TrackedWeakMap();
  
  getData(key) {
    if (!this.cache.has(key)) {
      this.cache.set(key, this.computeExpensiveData(key));
    }
    return this.cache.get(key);
  }
  
  computeExpensiveData(key) {
    // Expensive computation
    return { /* ... */ };
  }
}
```

### When to Use Each Type

| Type | Use Case |
|------|----------|
| `TrackedArray` | Ordered lists that need mutation methods (push, pop, splice, etc.) |
| `TrackedMap` | Key-value pairs with non-string keys or when you need `size` |
| `TrackedSet` | Unique values, membership testing |
| `TrackedObject` | Dynamic objects with unknown keys at compile time |
| `TrackedWeakMap` / `TrackedWeakSet` | Memory-sensitive caching that should auto-cleanup |

### Common Patterns

**Initialize with data:**

```javascript
import { TrackedArray, TrackedMap, TrackedSet } from 'tracked-built-ins';

// Array
const todos = new TrackedArray([
  { id: 1, text: 'First' },
  { id: 2, text: 'Second' }
]);

// Map
const userMap = new TrackedMap([
  [1, { name: 'Alice' }],
  [2, { name: 'Bob' }]
]);

// Set
const tags = new TrackedSet(['javascript', 'ember', 'web']);
```

**Convert to plain JavaScript:**

```javascript
// Array
const plainArray = [...trackedArray];
const plainArray2 = Array.from(trackedArray);

// Map
const plainObject = Object.fromEntries(trackedMap);

// Set
const plainArray3 = [...trackedSet];
```

**Functional array methods still work:**

```javascript
const todos = new TrackedArray([...]);

// All of these work and are reactive
const completed = todos.filter(t => t.done);
const titles = todos.map(t => t.title);
const allDone = todos.every(t => t.done);
const firstIncomplete = todos.find(t => !t.done);
```

### Alternative: Immutable Updates

If you prefer immutability, you can use regular `@tracked` with reassignment:

```javascript
import { tracked } from '@glimmer/tracking';

export default class TodoList extends Component {
  @tracked todos = [];
  
  @action
  addTodo(text) {
    // Reassignment is reactive
    this.todos = [...this.todos, { id: Date.now(), text }];
  }
  
  @action
  removeTodo(id) {
    // Reassignment is reactive
    this.todos = this.todos.filter(t => t.id !== id);
  }
}
```

**When to use each approach:**
- Use `tracked-built-ins` when you need mutable operations (better performance for large lists)
- Use immutable updates when you want simpler mental model or need history/undo

### Best Practices

1. **Don't mix approaches** - choose either tracked-built-ins or immutable updates
2. **Initialize in class field** - no need for constructor
3. **Use appropriate type** - Map for key-value, Set for unique values, Array for ordered lists
4. **Consider memory** - Use WeakMap/WeakSet for automatic cleanup
5. **Export from modules** if shared across components

tracked-built-ins provides the best of both worlds: mutable operations with full reactivity. It's especially valuable for large lists or frequent updates where immutable updates would be expensive.

**References:**
- [tracked-built-ins Documentation](https://github.com/tracked-tools/tracked-built-ins)
- [Ember Reactivity System](https://guides.emberjs.com/release/in-depth-topics/autotracking-in-depth/)
- [JavaScript Built-in Objects](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects)
