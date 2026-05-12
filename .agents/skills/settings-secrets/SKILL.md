---
name: settings-secrets
description: Configure app settings and secrets for Devvit apps. Use when adding configurable values, API keys, or per-installation settings.
---

# Settings & Secrets

> All code must follow the **Coding Principles** in AGENTS.md (functional, minimal, readable, modular).

## Available imports

```typescript
import { settings } from '@devvit/web/server'
```

## Reading settings

```typescript
const apiKey = await settings.get('api-key')
const maxAttempts = await settings.get('max-attempts')
```

## Testing with settings

```typescript
const test = createDevvitTest({
  settings: {
    'api-key': 'test-key',
    'max-attempts': '5',
  },
})
```

## Checklist before finishing
- [ ] Settings accessed via `settings.get()` on server only
- [ ] Test configuration includes all required settings
- [ ] No secrets hardcoded in source code
- [ ] `bun run test` passes with zero failures
