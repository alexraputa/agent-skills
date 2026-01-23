---
title: Use Controlled Form Patterns
category: component
impact: high
---

# Use Controlled Form Patterns

Implement controlled components for form inputs that synchronize UI state with component state using reactive patterns and proper event handlers.

## Problem

Uncontrolled forms lose state synchronization, make validation difficult, and can cause unexpected behavior when form state needs to interact with other component logic.

**Incorrect:**
```javascript
// app/components/search-input.gjs
import Component from '@glimmer/component';

export default class SearchInput extends Component {
  // Uncontrolled - no sync between DOM and component state
  handleSubmit = (event) => {
    event.preventDefault();
    const value = event.target.querySelector('input').value;
    this.args.onSearch(value);
  };

  <template>
    <form {{on "submit" this.handleSubmit}}>
      <input type="text" placeholder="Search..." />
      <button type="submit">Search</button>
    </template>
  </template>
}
```

## Solution

Use `{{on "input"}}` or `{{on "change"}}` with tracked state to create controlled components that maintain a single source of truth.

**Correct:**
```javascript
// app/components/search-input.gjs
import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { on } from '@ember/modifier';

export default class SearchInput extends Component {
  @tracked query = '';

  updateQuery = (event) => {
    this.query = event.target.value;
    // Optional: Debounced search
    this.args.onInput?.(this.query);
  };

  handleSubmit = (event) => {
    event.preventDefault();
    this.args.onSearch(this.query);
  };

  <template>
    <form {{on "submit" this.handleSubmit}}>
      <input
        type="text"
        value={{this.query}}
        {{on "input" this.updateQuery}}
        placeholder="Search..."
      />
      <button type="submit" disabled={{not this.query}}>
        Search
      </button>
    </template>
  </template>
}
```

## Advanced: Controlled with External State

For forms controlled by parent components or services:

```javascript
// app/components/controlled-input.gjs
import Component from '@glimmer/component';
import { on } from '@ember/modifier';

export default class ControlledInput extends Component {
  // Value comes from @value argument
  // Changes reported via @onChange callback
  
  handleInput = (event) => {
    this.args.onChange(event.target.value);
  };

  <template>
    <input
      type={{@type}}
      value={{@value}}
      {{on "input" this.handleInput}}
      placeholder={{@placeholder}}
      ...attributes
    />
  </template>
}

// Usage in parent:
// <ControlledInput
//   @value={{this.email}}
//   @onChange={{this.updateEmail}}
//   @type="email"
//   @placeholder="Enter email"
// />
```

## Select/Checkbox Patterns

**Select (Controlled):**
```javascript
// app/components/controlled-select.gjs
import Component from '@glimmer/component';
import { on } from '@ember/modifier';

export default class ControlledSelect extends Component {
  handleChange = (event) => {
    this.args.onChange(event.target.value);
  };

  <template>
    <select {{on "change" this.handleChange}} ...attributes>
      {{#each @options as |option|}}
        <option
          value={{option.value}}
          selected={{eq @value option.value}}
        >
          {{option.label}}
        </option>
      {{/each}}
    </select>
  </template>
}
```

**Checkbox (Controlled):**
```javascript
// app/components/controlled-checkbox.gjs
import Component from '@glimmer/component';
import { on } from '@ember/modifier';

export default class ControlledCheckbox extends Component {
  handleChange = (event) => {
    this.args.onChange(event.target.checked);
  };

  <template>
    <label>
      <input
        type="checkbox"
        checked={{@checked}}
        {{on "change" this.handleChange}}
        ...attributes
      />
      {{@label}}
    </label>
  </template>
}
```

## Form State Management

For complex forms, use a tracked object or Resources:

```javascript
// app/components/user-form.gjs
import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { TrackedObject } from 'tracked-built-ins';
import { on } from '@ember/modifier';

export default class UserForm extends Component {
  @tracked formData = new TrackedObject({
    name: '',
    email: '',
    role: 'user',
    notifications: false
  });

  @tracked errors = new TrackedObject({});

  updateField = (field) => (event) => {
    const value = event.target.type === 'checkbox' 
      ? event.target.checked 
      : event.target.value;
    
    this.formData[field] = value;
    // Clear error when user types
    delete this.errors[field];
  };

  validate() {
    const errors = {};
    if (!this.formData.name) errors.name = 'Name is required';
    if (!this.formData.email.includes('@')) errors.email = 'Invalid email';
    
    this.errors = new TrackedObject(errors);
    return Object.keys(errors).length === 0;
  }

  handleSubmit = (event) => {
    event.preventDefault();
    if (this.validate()) {
      this.args.onSubmit(this.formData);
    }
  };

  <template>
    <form {{on "submit" this.handleSubmit}}>
      <div class="field">
        <label for="name">Name</label>
        <input
          id="name"
          type="text"
          value={{this.formData.name}}
          {{on "input" (this.updateField "name")}}
        />
        {{#if this.errors.name}}
          <span class="error">{{this.errors.name}}</span>
        {{/if}}
      </div>

      <div class="field">
        <label for="email">Email</label>
        <input
          id="email"
          type="email"
          value={{this.formData.email}}
          {{on "input" (this.updateField "email")}}
        />
        {{#if this.errors.email}}
          <span class="error">{{this.errors.email}}</span>
        {{/if}}
      </div>

      <div class="field">
        <label>
          <input
            type="checkbox"
            checked={{this.formData.notifications}}
            {{on "change" (this.updateField "notifications")}}
          />
          Enable notifications
        </label>
      </div>

      <button type="submit">Save</button>
    </form>
  </template>
}
```

## Performance Impact

- **Controlled**: ~10-30% overhead for simple inputs (worth it for validation/state sync)
- **Uncontrolled**: Faster for simple forms but harder to maintain
- **TrackedObject**: ~5-10% overhead for complex forms, excellent for validation

## When to Use

- **Controlled**: When validation, formatting, or state synchronization is needed
- **Uncontrolled**: For simple submit-only forms with no intermediate state
- **TrackedObject**: For forms with 5+ fields or complex validation logic

## References

- [Ember Guides - Template Syntax](https://guides.emberjs.com/release/components/template-lifecycle-dom-and-modifiers/)
- [tracked-built-ins](https://github.com/tracked-tools/tracked-built-ins)
- [Glimmer Component Arguments](https://guides.emberjs.com/release/components/component-arguments-and-html-attributes/)
