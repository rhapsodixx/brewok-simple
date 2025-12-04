# Claude Code Instructions

You are a senior TypeScript engineer assisting with a full-stack project. Follow these standards to ensure consistent, high-quality code across the team.

## Project Stack

- **Frontend**: SvelteKit (LTS)
- **UI Components**: shadcn-svelte
- **Styling**: Tailwind CSS
- **Backend**: Node.js (LTS)
- **Database**: PostgreSQL via Supabase
- **Testing**: Jest & @testing-library/svelte
- **Analytics & Error Tracking**: PostHog
- **Version Control**: GitHub
- **Style Guide**: [Google TypeScript Style Guide](https://google.github.io/styleguide/tsguide.html)

## Core Principles

### 1. Problem-Solving Approach

#### Diagnose, Don't Guess

When encountering bugs or failing tests:

- Explain possible causes step-by-step
- Verify assumptions about inputs, state, and code paths before proposing solutions
- Use extended reasoning for complex problems

#### Workflow for Complex Tasks

1. **Plan First**: Output a clear approach or outline before coding
2. **Incremental Development**: Implement in logical chunks, verifying each step
3. **Seek Confirmation**: Pause for approval after presenting plans or major design decisions
4. **Adapt**: If a solution isn't working, backtrack and consider alternatives

### 2. Error Handling & Reliability

#### Required Practices

✅ **DO:**

- Wrap async operations in try/catch blocks
- Return user-friendly error messages or safe fallback values
- Log critical failures with context (avoid excessive logging in production)
- Fail fast on invalid input rather than proceeding with bad assumptions
- Track exceptions in PostHog for monitoring and debugging

❌ **DON'T:**

- Never swallow exceptions silently—always throw or log errors

#### Example

```typescript
import posthog from "posthog-js";

async function fetchUserProfile(userId: string): Promise<UserProfile> {
  if (!userId || typeof userId !== "string") {
    const error = new Error("Invalid userId provided");
    posthog.capture("error", {
      error_type: "validation_error",
      function: "fetchUserProfile",
      details: "Invalid userId",
    });
    throw error;
  }

  try {
    const profile = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (!profile.data) {
      throw new Error(`Profile not found for user ${userId}`);
    }

    return profile.data;
  } catch (error) {
    // PostHog automatically captures exceptions
    posthog.capture("$exception", {
      $exception_type: error.name,
      $exception_message: error.message,
      $exception_personURL: posthog.get_session_replay_url(),
      userId,
    });
    throw new Error("Unable to retrieve user profile");
  }
}
```

### 3. Clean Code Standards

#### Function Guidelines

- Keep functions **≤ 50 lines**
- One clear purpose per function (Single Responsibility Principle)
- Use descriptive names: `calculateInvoiceTotal` not `doCalc`
- Avoid generic names like `tmp`, `data`, `handleStuff`

#### Code Organization

- **DRY**: Extract duplicate logic into shared functions
- **Comments**: Explain non-obvious logic; remove debug code and commented-out sections
- **Modularity**: Break complex logic into smaller, testable units

### 4. Security Requirements

#### Authentication & Data Protection

- Hash passwords with bcrypt (never store plaintext)
- Implement rate limiting for authentication endpoints
- Validate session tokens and refresh tokens properly

#### Input Validation

- Validate all user inputs and external API data
- Check email formats, string lengths, numeric ranges, etc.
- Never trust client-side validation alone

#### Database Security

- Use parameterized queries or ORM methods (prevent SQL injection)
- Never concatenate user input into SQL queries
- Apply row-level security (RLS) policies in Supabase

#### Frontend Security

- Sanitize HTML/user content before rendering (use DOMPurify for rich content)
- Implement CSRF protection for state-changing operations
- Use SvelteKit's built-in XSS protections

#### Dependency Management

- Avoid `eval()` and dynamic code execution
- Regularly audit dependencies for vulnerabilities
- Prefer built-in solutions over risky third-party packages

### 5. Edge Case Handling

Always consider and handle:

- **Empty/null inputs**: Empty arrays, missing fields, undefined values
- **Boundary values**: Zero, negative numbers, extremely large values, empty strings
- **Invalid states**: End date before start date, negative quantities
- **Concurrency**: Multiple users editing the same resource
- **Network failures**: Timeouts, partial responses, retries

**Note**: Flag unhandled edge cases with TODO comments when immediate handling isn't feasible.

### 6. Testing Requirements

#### Every new feature must include tests

- Unit tests for business logic
- Integration tests for API endpoints
- Component tests for UI logic
- Test edge cases and error conditions

#### Jest Test Structure

```typescript
// Example test structure
describe("calculateInvoiceTotal", () => {
  it("should calculate total with tax", () => {
    expect(calculateInvoiceTotal(100, 0.1)).toBe(110);
  });

  it("should handle zero amount", () => {
    expect(calculateInvoiceTotal(0, 0.1)).toBe(0);
  });

  it("should throw on negative amount", () => {
    expect(() => calculateInvoiceTotal(-10, 0.1)).toThrow();
  });
});
```

#### Svelte Component Testing

```typescript
import { render, fireEvent } from "@testing-library/svelte";
import Counter from "./Counter.svelte";

test("it increments the count", async () => {
  const { getByText } = render(Counter);
  const button = getByText("0");
  await fireEvent.click(button);
  expect(getByText("1")).toBeInTheDocument();
});
```

## PostHog Integration

### Analytics & Error Tracking Setup

PostHog provides both product analytics and error tracking in a unified platform. This enables you to:

- Track user behavior and product metrics
- Capture and monitor exceptions
- Connect errors to user data and session replays
- Analyze how errors impact conversion and retention

#### Installation

```bash
npm install posthog-js
```

#### Client-Side Initialization (SvelteKit)

```typescript
// src/lib/posthog.ts
import posthog from "posthog-js";
import { browser } from "$app/environment";

export const initPostHog = () => {
  if (browser) {
    posthog.init(import.meta.env.VITE_PUBLIC_POSTHOG_KEY, {
      api_host:
        import.meta.env.VITE_PUBLIC_POSTHOG_HOST || "https://app.posthog.com",
      capture_pageview: false, // We'll handle this manually
      capture_pageleave: true,
      autocapture: true, // Automatically capture clicks, form submissions, etc.
      session_recording: {
        recordCrossOriginIframes: false,
      },
    });
  }
  return posthog;
};
```

```svelte
<!-- src/routes/+layout.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { initPostHog } from '$lib/posthog';
  import posthog from 'posthog-js';

  onMount(() => {
    initPostHog();
  });

  // Track page views
  $: if ($page.url.pathname && typeof window !== 'undefined') {
    posthog.capture('$pageview');
  }
</script>

<slot />
```

#### Server-Side Setup (Node.js)

```typescript
// src/lib/server/posthog.ts
import { PostHog } from "posthog-node";

export const posthogServer = new PostHog(process.env.POSTHOG_API_KEY, {
  host: process.env.POSTHOG_HOST || "https://app.posthog.com",
});

// Graceful shutdown
process.on("SIGTERM", async () => {
  await posthogServer.shutdown();
});
```

### Error Tracking Best Practices

#### Automatic Exception Capture

PostHog automatically captures unhandled exceptions when initialized. Enhance this with custom context:

```typescript
// Global error handler (src/lib/errorHandler.ts)
import posthog from "posthog-js";

export function setupErrorTracking() {
  if (typeof window !== "undefined") {
    window.addEventListener("error", (event) => {
      posthog.capture("$exception", {
        $exception_type: event.error?.name || "Error",
        $exception_message: event.error?.message || event.message,
        $exception_stack: event.error?.stack,
        $exception_personURL: posthog.get_session_replay_url(),
      });
    });

    window.addEventListener("unhandledrejection", (event) => {
      posthog.capture("$exception", {
        $exception_type: "UnhandledPromiseRejection",
        $exception_message: event.reason?.message || String(event.reason),
        $exception_stack: event.reason?.stack,
        $exception_personURL: posthog.get_session_replay_url(),
      });
    });
  }
}
```

#### Manual Exception Tracking

For handled errors that you want to track:

```typescript
try {
  await riskyOperation();
} catch (error) {
  // Track the error with context
  posthog.capture("$exception", {
    $exception_type: error.name,
    $exception_message: error.message,
    $exception_stack: error.stack,
    operation: "riskyOperation",
    user_id: userId,
    $exception_personURL: posthog.get_session_replay_url(),
  });

  // Still handle the error appropriately
  throw new Error("Operation failed");
}
```

### Product Analytics Best Practices

#### Event Tracking

Track key user actions and business events:

```typescript
// Track custom events
posthog.capture("user_signed_up", {
  signup_method: "email",
  plan: "free",
});

posthog.capture("purchase_completed", {
  amount: 99.99,
  currency: "USD",
  product_id: "prod_123",
});

posthog.capture("feature_used", {
  feature_name: "export_data",
  format: "csv",
});
```

#### User Identification

Identify users to track their journey:

```typescript
// After successful authentication
posthog.identify(
  user.id, // Unique user ID
  {
    email: user.email,
    name: user.name,
    plan: user.subscription_plan,
    created_at: user.created_at,
  }
);

// Reset on logout
posthog.reset();
```

#### Group Analytics (B2B)

Track organization-level analytics:

```typescript
// Associate user with organization
posthog.group("company", company.id, {
  name: company.name,
  plan: company.plan,
  employee_count: company.employee_count,
  industry: company.industry,
});
```

#### Feature Flags Integration

Use PostHog feature flags for controlled rollouts:

```typescript
// Check if feature is enabled
const isNewUIEnabled = posthog.isFeatureEnabled("new-ui-redesign");

if (isNewUIEnabled) {
  // Show new UI
}

// With variants
const variant = posthog.getFeatureFlag("checkout-flow");
if (variant === "test") {
  // Show test variant
}
```

#### Funnel Tracking Example

```typescript
// Track conversion funnel
posthog.capture("funnel_viewed_pricing");
posthog.capture("funnel_clicked_signup");
posthog.capture("funnel_entered_email");
posthog.capture("funnel_completed_signup");
```

### Session Replay Integration

Session replays automatically link to error events, providing visual context for debugging:

```typescript
// Get replay URL programmatically
const replayUrl = posthog.get_session_replay_url();

// Include in error reports
console.error("Error occurred", { replayUrl });
```

### Performance Monitoring

Track performance metrics:

```typescript
// Track API response times
const startTime = performance.now();
try {
  await apiCall();
  const duration = performance.now() - startTime;

  posthog.capture("api_call_completed", {
    endpoint: "/api/users",
    duration_ms: duration,
    status: "success",
  });
} catch (error) {
  posthog.capture("api_call_failed", {
    endpoint: "/api/users",
    duration_ms: performance.now() - startTime,
    error: error.message,
  });
}
```

### Privacy & Compliance

PostHog supports GDPR and privacy requirements:

```typescript
// Opt users out of tracking
posthog.opt_out_capturing();

// Opt users back in
posthog.opt_in_capturing();

// Check opt-out status
const hasOptedOut = posthog.has_opted_out_capturing();
```

### Dashboard & Alerting

- Create dashboards in PostHog UI to monitor key metrics
- Set up alerts for error rate spikes
- Use correlation analysis to find error patterns
- Link errors to user cohorts for targeted fixes

## shadcn-svelte UI Components

### Overview

[shadcn-svelte](https://shadcn-svelte.com/) is a collection of re-usable components built using Svelte, Tailwind CSS, and bits-ui. Unlike traditional component libraries, shadcn-svelte components are copied directly into your project, giving you full control and ownership of the code.

### Installation & Setup

#### Initial Setup

```bash
# Initialize shadcn-svelte in your project
npx shadcn-svelte@latest init
```

This will:

- Install necessary dependencies (Tailwind CSS, bits-ui, etc.)
- Set up your `tailwind.config.js` and `app.postcss`
- Create a `components.json` configuration file
- Set up path aliases in `svelte.config.js`

#### Adding Components

```bash
# Add specific components
npx shadcn-svelte@latest add button
npx shadcn-svelte@latest add card
npx shadcn-svelte@latest add dialog
npx shadcn-svelte@latest add form

# Add multiple components at once
npx shadcn-svelte@latest add button card dialog form
```

Components are added to `src/lib/components/ui/` by default.

### Component Philosophy

#### Own Your Components

- **Full Control**: Components are copied into your codebase, not imported from a package
- **Customizable**: Modify components directly to match your design requirements
- **No Lock-in**: Update, extend, or replace components as needed
- **Type-Safe**: Full TypeScript support with proper type definitions

#### When to Use shadcn-svelte Components

✅ **DO use shadcn-svelte for:**

- Common UI patterns (buttons, inputs, dialogs, cards)
- Form components with validation
- Data display (tables, badges, avatars)
- Navigation components (dropdowns, tabs, menus)
- Feedback components (alerts, toasts, progress)

❌ **DON'T use shadcn-svelte for:**

- Highly custom, domain-specific components
- Simple one-off UI elements that don't need the abstraction
- Components where you need complete control from scratch

### Best Practices

#### 1. Maintain Component Consistency

**Good Practice**: Use shadcn-svelte components consistently across your app

```svelte
<script lang="ts">
  import { Button } from "$lib/components/ui/button";
  import { Input } from "$lib/components/ui/input";
  import { Label } from "$lib/components/ui/label";
</script>

<form>
  <div class="space-y-2">
    <Label for="email">Email</Label>
    <Input id="email" type="email" placeholder="Enter your email" />
  </div>
  <Button type="submit">Submit</Button>
</form>
```

#### 2. Customize Through Variants

shadcn-svelte components use class-variance-authority (CVA) for styling variants:

```svelte
<script lang="ts">
  import { Button } from "$lib/components/ui/button";
</script>

<!-- Default variant -->
<Button>Default</Button>

<!-- Different variants -->
<Button variant="destructive">Delete</Button>
<Button variant="outline">Cancel</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="link">Link</Button>

<!-- Different sizes -->
<Button size="sm">Small</Button>
<Button size="default">Default</Button>
<Button size="lg">Large</Button>
<Button size="icon">
  <Icon />
</Button>
```

#### 3. Extend Components When Needed

Create wrapper components for common patterns:

```svelte
<!-- src/lib/components/LoadingButton.svelte -->
<script lang="ts">
  import { Button } from "$lib/components/ui/button";
  import { Loader2 } from "lucide-svelte";

  export let loading = false;
  export let variant: "default" | "destructive" | "outline" = "default";
  export let disabled = false;
</script>

<Button {variant} disabled={loading || disabled} {...$$restProps}>
  {#if loading}
    <Loader2 class="mr-2 h-4 w-4 animate-spin" />
  {/if}
  <slot />
</Button>
```

Usage:

```svelte
<script lang="ts">
  import LoadingButton from "$lib/components/LoadingButton.svelte";

  let isSubmitting = false;

  async function handleSubmit() {
    isSubmitting = true;
    try {
      await submitForm();
    } finally {
      isSubmitting = false;
    }
  }
</script>

<LoadingButton loading={isSubmitting} on:click={handleSubmit}>
  Submit
</LoadingButton>
```

#### 4. Form Handling with shadcn-svelte

Combine shadcn-svelte components with form validation:

```svelte
<script lang="ts">
  import { Button } from "$lib/components/ui/button";
  import { Input } from "$lib/components/ui/input";
  import { Label } from "$lib/components/ui/label";
  import { Alert, AlertDescription } from "$lib/components/ui/alert";

  let email = "";
  let password = "";
  let error = "";

  async function handleSubmit() {
    error = "";

    if (!email || !password) {
      error = "All fields are required";
      return;
    }

    try {
      // Your submit logic
      await login(email, password);
    } catch (e) {
      error = e.message;
    }
  }
</script>

<form on:submit|preventDefault={handleSubmit} class="space-y-4">
  {#if error}
    <Alert variant="destructive">
      <AlertDescription>{error}</AlertDescription>
    </Alert>
  {/if}

  <div class="space-y-2">
    <Label for="email">Email</Label>
    <Input
      id="email"
      type="email"
      bind:value={email}
      required
    />
  </div>

  <div class="space-y-2">
    <Label for="password">Password</Label>
    <Input
      id="password"
      type="password"
      bind:value={password}
      required
    />
  </div>

  <Button type="submit" class="w-full">
    Sign In
  </Button>
</form>
```

#### 5. Dialog and Modal Patterns

```svelte
<script lang="ts">
  import { Button } from "$lib/components/ui/button";
  import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "$lib/components/ui/dialog";

  let open = false;

  function handleConfirm() {
    // Your confirmation logic
    open = false;
  }
</script>

<Dialog bind:open>
  <DialogTrigger asChild let:builder>
    <Button builders={[builder]}>Open Dialog</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Are you sure?</DialogTitle>
      <DialogDescription>
        This action cannot be undone.
      </DialogDescription>
    </DialogHeader>
    <div class="flex justify-end gap-2">
      <Button variant="outline" on:click={() => open = false}>
        Cancel
      </Button>
      <Button variant="destructive" on:click={handleConfirm}>
        Confirm
      </Button>
    </div>
  </DialogContent>
</Dialog>
```

#### 6. Data Display with Tables

```svelte
<script lang="ts">
  import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "$lib/components/ui/table";
  import { Badge } from "$lib/components/ui/badge";

  export let users: User[];
</script>

<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Name</TableHead>
      <TableHead>Email</TableHead>
      <TableHead>Status</TableHead>
      <TableHead>Actions</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {#each users as user (user.id)}
      <TableRow>
        <TableCell class="font-medium">{user.name}</TableCell>
        <TableCell>{user.email}</TableCell>
        <TableCell>
          <Badge variant={user.isActive ? "default" : "secondary"}>
            {user.isActive ? "Active" : "Inactive"}
          </Badge>
        </TableCell>
        <TableCell>
          <Button variant="ghost" size="sm">Edit</Button>
        </TableCell>
      </TableRow>
    {/each}
  </TableBody>
</Table>
```

#### 7. Toast Notifications

```typescript
// src/lib/stores/toast.ts
import { writable } from "svelte/store";

export type ToastType = "default" | "success" | "error" | "warning";

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

function createToastStore() {
  const { subscribe, update } = writable<Toast[]>([]);

  return {
    subscribe,
    show: (message: string, type: ToastType = "default") => {
      const id = crypto.randomUUID();
      update((toasts) => [...toasts, { id, message, type }]);

      setTimeout(() => {
        update((toasts) => toasts.filter((t) => t.id !== id));
      }, 5000);
    },
    remove: (id: string) => {
      update((toasts) => toasts.filter((t) => t.id !== id));
    },
  };
}

export const toast = createToastStore();
```

```svelte
<!-- src/lib/components/Toaster.svelte -->
<script lang="ts">
  import { toast } from "$lib/stores/toast";
  import { Alert, AlertDescription } from "$lib/components/ui/alert";
  import { fly } from "svelte/transition";
</script>

<div class="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
  {#each $toast as item (item.id)}
    <div transition:fly={{ y: 20, duration: 300 }}>
      <Alert variant={item.type === 'error' ? 'destructive' : 'default'}>
        <AlertDescription>{item.message}</AlertDescription>
      </Alert>
    </div>
  {/each}
</div>
```

### Theming and Customization

#### Tailwind Configuration

shadcn-svelte uses CSS variables for theming. Configure in `src/app.postcss`:

```css
@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --primary: 222.2 47.4% 11.2%;
    --primary-foreground: 210 40% 98%;
    /* ... other theme variables */
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --primary: 210 40% 98%;
    --primary-foreground: 222.2 47.4% 11.2%;
    /* ... other theme variables */
  }
}
```

#### Dark Mode Support

```svelte
<script lang="ts">
  import { onMount } from 'svelte';

  let theme = $state('light');

  onMount(() => {
    // Load saved theme preference
    theme = localStorage.getItem('theme') || 'light';
    document.documentElement.classList.toggle('dark', theme === 'dark');
  });

  function toggleTheme() {
    theme = theme === 'light' ? 'dark' : 'light';
    localStorage.setItem('theme', theme);
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }
</script>

<Button variant="ghost" size="icon" on:click={toggleTheme}>
  {#if theme === 'light'}
    <Moon class="h-5 w-5" />
  {:else}
    <Sun class="h-5 w-5" />
  {/if}
</Button>
```

### Accessibility Best Practices

shadcn-svelte components are built with accessibility in mind using bits-ui primitives:

✅ **Built-in Accessibility Features:**

- Proper ARIA attributes
- Keyboard navigation support
- Focus management
- Screen reader compatibility

**Always ensure:**

- Form inputs have associated labels
- Buttons have descriptive text or aria-labels
- Interactive elements are keyboard accessible
- Color contrast meets WCAG standards

### Common Component Patterns

#### Loading States

```svelte
<script lang="ts">
  import { Skeleton } from "$lib/components/ui/skeleton";

  export let loading = false;
  export let data: User[];
</script>

{#if loading}
  <div class="space-y-2">
    <Skeleton class="h-12 w-full" />
    <Skeleton class="h-12 w-full" />
    <Skeleton class="h-12 w-full" />
  </div>
{:else}
  <!-- Your content -->
{/if}
```

#### Error States

```svelte
<script lang="ts">
  import { Alert, AlertDescription, AlertTitle } from "$lib/components/ui/alert";
  import { AlertCircle } from "lucide-svelte";

  export let error: string | null = null;
</script>

{#if error}
  <Alert variant="destructive">
    <AlertCircle class="h-4 w-4" />
    <AlertTitle>Error</AlertTitle>
    <AlertDescription>{error}</AlertDescription>
  </Alert>
{/if}
```

### Component Testing

Test shadcn-svelte components like any other Svelte component:

```typescript
import { render, fireEvent } from "@testing-library/svelte";
import { Button } from "$lib/components/ui/button";

describe("Button", () => {
  it("renders and handles clicks", async () => {
    const { getByRole } = render(Button, { props: { children: "Click me" } });
    const button = getByRole("button");

    let clicked = false;
    button.addEventListener("click", () => {
      clicked = true;
    });

    await fireEvent.click(button);
    expect(clicked).toBe(true);
  });

  it("applies variant classes", () => {
    const { getByRole } = render(Button, {
      props: { variant: "destructive", children: "Delete" },
    });
    const button = getByRole("button");

    expect(button.className).toContain("destructive");
  });
});
```

### Available Components

shadcn-svelte provides a comprehensive set of components:

**Forms & Inputs:**

- Button, Input, Textarea, Checkbox, Radio Group
- Select, Combobox, Date Picker
- Form, Label, Switch, Slider

**Layout & Navigation:**

- Card, Separator, Tabs, Accordion
- Sheet, Dialog, Drawer, Popover
- Dropdown Menu, Context Menu, Menubar
- Navigation Menu, Breadcrumb

**Data Display:**

- Table, Badge, Avatar
- Progress, Skeleton
- Tooltip, Hover Card

**Feedback:**

- Alert, Alert Dialog, Toast
- Sonner (toast notifications)

**Utility:**

- Aspect Ratio, Scroll Area
- Resizable, Collapsible

Refer to [shadcn-svelte documentation](https://shadcn-svelte.com/docs/components) for complete component API and examples.

## SvelteKit Best Practices

### Project Structure

Follow SvelteKit's recommended directory structure with shadcn-svelte:

```
/src
├── /lib
│   ├── /components
│   │   ├── /ui              # shadcn-svelte components
│   │   │   ├── button.svelte
│   │   │   ├── card.svelte
│   │   │   ├── dialog.svelte
│   │   ├── Header.svelte    # Custom components
│   │   ├── Footer.svelte
│   │   ├── UserProfile.svelte
│   ├── /stores              # Svelte stores
│   │   ├── userStore.ts
│   │   ├── themeStore.ts
│   │   ├── toast.ts
│   ├── /services            # API and utility services
│   │   ├── apiService.ts
│   │   ├── userUtils.ts
│   ├── /types               # TypeScript type definitions
│   │   ├── user.ts
│   │   ├── api.ts
│   ├── posthog.ts           # PostHog initialization
│   ├── errorHandler.ts      # Global error handling
│   ├── utils.ts             # Utility functions
├── /routes                  # File-based routing
│   ├── +page.svelte
│   ├── +layout.svelte
│   ├── /profile
│   │   ├── +page.svelte
│   │   ├── +page.server.ts
├── app.html
├── app.postcss              # Tailwind CSS imports
```

**Key Points:**

- Use `$lib` alias for imports: `import { Button } from '$lib/components/ui/button'`
- Keep shadcn-svelte components in `$lib/components/ui/`
- Create custom components in `$lib/components/` (not in `/ui`)
- Keep routes clean; move complex logic to `$lib`

### Component Best Practices

#### 1. Compose with shadcn-svelte Components

**Good Practice**: Build features using shadcn-svelte primitives

```svelte
<!-- UserCard.svelte -->
<script lang="ts">
  import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "$lib/components/ui/card";
  import { Button } from "$lib/components/ui/button";
  import { Badge } from "$lib/components/ui/badge";

  export let user: User;
</script>

<Card>
  <CardHeader>
    <CardTitle>{user.name}</CardTitle>
    <CardDescription>{user.email}</CardDescription>
  </CardHeader>
  <CardContent>
    <p class="text-sm text-muted-foreground">{user.bio}</p>
    <div class="mt-2 flex gap-2">
      <Badge>{user.role}</Badge>
      <Badge variant={user.isActive ? "default" : "secondary"}>
        {user.isActive ? "Active" : "Inactive"}
      </Badge>
    </div>
  </CardContent>
  <CardFooter>
    <Button variant="outline" class="w-full">View Profile</Button>
  </CardFooter>
</Card>
```

#### 2. Use Descriptive Names

**Bad:**

```svelte
<script lang="ts">
  let a = "John Doe";
  function f() {
    console.log(a);
  }
</script>
```

**Good:**

```svelte
<script lang="ts">
  let username = "John Doe";
  function displayUsername() {
    console.log(username);
  }
</script>
```

#### 3. Limit Complex Logic in Components

**Bad:**

```svelte
<script lang="ts">
  export let userData: UserData;
  let fullName = userData.firstName + " " + userData.lastName;
  // ... complex computations
</script>
```

**Good:**

```typescript
// $lib/services/userUtils.ts
export function getFullName(user: UserData): string {
  return `${user.firstName} ${user.lastName}`;
}
```

```svelte
<script lang="ts">
  import { getFullName } from '$lib/services/userUtils';
  export let userData: UserData;
  let fullName = getFullName(userData);
</script>
```

### Store Management

#### Avoid Overloading Stores

**Bad Practice**: Single store for everything

```typescript
// ❌ DON'T: Overloaded store
export const globalStore = writable({
  user: null,
  theme: "light",
  notifications: [],
  cartItems: [],
});
```

**Best Practice**: Segment into focused stores

```typescript
// ✅ DO: Separate, focused stores
export const userStore = writable<User | null>(null);
export const themeStore = writable<"light" | "dark">("light");
export const notificationStore = writable<Notification[]>([]);
export const cartStore = writable<CartItem[]>([]);
```

**Benefits:**

- Better performance (reduced unnecessary reactivity)
- Easier maintenance and debugging
- Clear single responsibility per store

**Tips:**

- Use `setContext` and `getContext` for component-local state
- Create custom stores with methods for complex state logic
- Keep stores TypeScript-typed for safety

```typescript
// Custom store example
function createUserStore() {
  const { subscribe, set, update } = writable<User | null>(null);

  return {
    subscribe,
    login: (user: User) => {
      set(user);
      posthog.identify(user.id, {
        email: user.email,
        name: user.name,
      });
    },
    logout: () => {
      set(null);
      posthog.reset();
    },
    updateProfile: (updates: Partial<User>) =>
      update((user) => (user ? { ...user, ...updates } : null)),
  };
}

export const userStore = createUserStore();
```

### Reactivity Optimization

#### Use Reactive Statements Wisely

**Bad**: Non-reactive computation

```svelte
<script lang="ts">
  let count = 0;
  let double = count * 2; // Won't update when count changes
</script>
```

**Good**: Reactive statement

```svelte
<script lang="ts">
  let count = 0;
  $: double = count * 2; // Automatically updates
</script>
```

**Advanced Reactivity:**

```svelte
<script lang="ts">
  let items: Item[] = [];

  // React to complex computations
  $: totalPrice = items.reduce((sum, item) => sum + item.price, 0);

  // React with side effects
  $: if (totalPrice > 1000) {
    posthog.capture('high_value_cart', { total: totalPrice });
  }

  // React to multiple dependencies
  $: fullAddress = `${street}, ${city}, ${zipCode}`;
</script>
```

### Animations and Transitions

Use Svelte's built-in animation system with shadcn-svelte components:

```svelte
<script lang="ts">
  import { flip } from 'svelte/animate';
  import { fade, slide } from 'svelte/transition';
  import { quintOut } from 'svelte/easing';
  import { Card, CardContent } from '$lib/components/ui/card';

  let items: Item[] = [/* ... */];
</script>

<div class="space-y-4">
  {#each items as item (item.id)}
    <div
      in:fade={{ duration: 300 }}
      out:slide={{ duration: 300, easing: quintOut }}
      animate:flip={{ duration: 500 }}
    >
      <Card>
        <CardContent class="p-4">
          {item.name}
        </CardContent>
      </Card>
    </div>
  {/each}
</div>
```

### Official Documentation References

Follow official documentation:

- **SvelteKit**: https://kit.svelte.dev/docs
- **shadcn-svelte**: https://shadcn-svelte.com/docs
- **bits-ui**: https://bits-ui.com/ (underlying primitives)
- **Tailwind CSS**: https://tailwindcss.com/docs
- **SvelteKit Auth**: https://svelte.dev/docs/kit/auth
- **SvelteKit Performance**: https://svelte.dev/docs/kit/performance
- **SvelteKit Accessibility**: https://svelte.dev/docs/kit/accessibility
- **SvelteKit SEO**: https://svelte.dev/docs/kit/seo
- **SvelteKit Routing**: https://kit.svelte.dev/docs/routing
- **SvelteKit Loading Data**: https://kit.svelte.dev/docs/load

### Key SvelteKit Guidelines

- Use `+page.server.ts` for server-side data loading
- Implement proper form actions with progressive enhancement
- Optimize images with `<enhanced:img>`
- Follow semantic HTML and ARIA practices
- Configure meta tags for SEO in `+page.ts` or `+page.server.ts`
- Use `$app/navigation` for programmatic routing
- Leverage `$app/stores` for page, navigation, and updated stores

## Tailwind CSS with shadcn-svelte

### Utility-First Styling

shadcn-svelte is built on Tailwind CSS. Use utility classes for custom styling:

```svelte
<script lang="ts">
  import { Card, CardContent, CardHeader, CardTitle } from "$lib/components/ui/card";
</script>

<Card class="max-w-md mx-auto">
  <CardHeader class="bg-gradient-to-r from-blue-500 to-purple-600">
    <CardTitle class="text-white">Welcome</CardTitle>
  </CardHeader>
  <CardContent class="p-6">
    <p class="text-muted-foreground">This is a custom styled card.</p>
  </CardContent>
</Card>
```

### cn() Utility Function

shadcn-svelte includes a `cn()` utility for conditional classes:

```typescript
// src/lib/utils.ts
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

Usage:

```svelte
<script lang="ts">
  import { cn } from "$lib/utils";
  import { Button } from "$lib/components/ui/button";

  export let isActive = false;
</script>

<Button class={cn("w-full", isActive && "bg-green-500")}>
  {isActive ? "Active" : "Inactive"}
</Button>
```

### Responsive Design

Use Tailwind's responsive prefixes with shadcn-svelte:

```svelte
<Card class="w-full md:w-1/2 lg:w-1/3">
  <CardContent class="p-4 md:p-6 lg:p-8">
    <h2 class="text-lg md:text-xl lg:text-2xl">Responsive Card</h2>
  </CardContent>
</Card>
```

### Custom Tailwind Configuration

Extend Tailwind configuration for project-specific needs:

```javascript
// tailwind.config.js
import { fontFamily } from "tailwindcss/defaultTheme";

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: ["./src/**/*.{html,js,svelte,ts}"],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        // ... other color definitions
      },
      fontFamily: {
        sans: ["Inter", ...fontFamily.sans],
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--bits-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--bits-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [],
};
```

## Staying Current

### Keep Dependencies Updated

- Regularly check for SvelteKit, shadcn-svelte, and Tailwind updates
- Review release notes:
  - https://github.com/sveltejs/svelte
  - https://github.com/huntabyte/shadcn-svelte
  - https://tailwindcss.com/blog
- Use tools like Dependabot for automated dependency updates
- Test thoroughly after major version upgrades

**Benefits:**

- Performance improvements
- New features and capabilities
- Security patches
- Bug fixes
- Early adoption of deprecation warnings

### Community Engagement

- Join Svelte Discord: https://svelte.dev/chat
- Follow r/sveltejs on Reddit
- Participate in Svelte Summit conferences
- Read Svelte blog posts and newsletters
- Check shadcn-svelte GitHub discussions
- Share knowledge and learn from community solutions

## Code Review Checklist

Before submitting code, verify:

- [ ] Follows Google TypeScript style guide
- [ ] Uses TypeScript for type safety
- [ ] Includes comprehensive error handling
- [ ] Has tests with >80% coverage
- [ ] Handles identified edge cases
- [ ] Uses descriptive names and minimal comments
- [ ] No security vulnerabilities (validated inputs, parameterized queries)
- [ ] Functions are concise (<50 lines)
- [ ] No duplicate code
- [ ] Logs errors appropriately (not excessively)
- [ ] Fails fast on invalid input
- [ ] Components are focused and reusable
- [ ] Stores are segmented and not overloaded
- [ ] Reactive statements are used appropriately
- [ ] Complex logic is extracted to utility functions
- [ ] Follows SvelteKit project structure conventions
- [ ] Uses shadcn-svelte components where appropriate
- [ ] Custom components don't duplicate shadcn-svelte functionality
- [ ] Tailwind classes are used consistently
- [ ] Dark mode support is implemented where needed
- [ ] Components are accessible (ARIA, keyboard navigation)
- [ ] PostHog events are tracked for key user actions
- [ ] Errors are captured with appropriate context

## Claude Code Usage Instructions

When working with this codebase:

1. **Always read this file first** before making significant changes
2. **Apply these standards** to all code generation and refactoring tasks
3. **Use TypeScript** for all new code (never plain JavaScript)
4. **Follow SvelteKit conventions** for file structure and routing
5. **Use shadcn-svelte components** for UI elements before creating custom ones
6. **Create focused components** with single responsibilities
7. **Keep stores organized** and avoid overloading them
8. **Write tests** for all new features and bug fixes
9. **Optimize reactivity** by using `$:` statements appropriately
10. **Extract complex logic** to utility functions in `$lib/services`
11. **Use Tailwind CSS** for styling with the `cn()` utility for conditional classes
12. **Ensure accessibility** in all UI components
13. **Track analytics** with PostHog for user actions and events
14. **Capture errors** with PostHog for monitoring and debugging
15. **Validate security** aspects for any user-facing or data-handling code
16. **Ask for clarification** if project requirements conflict with these standards

## Quick Reference

### Import Patterns

```typescript
// Use $lib alias
import { Button } from "$lib/components/ui/button";
import { Card, CardContent } from "$lib/components/ui/card";
import { userStore } from "$lib/stores/userStore";
import { getFullName } from "$lib/services/userUtils";
import { cn } from "$lib/utils";
import posthog from "$lib/posthog";

// SvelteKit imports
import { goto } from "$app/navigation";
import { page } from "$app/stores";

// Icon imports (lucide-svelte)
import { Menu, X, User, Settings } from "lucide-svelte";
```

### Component Props with TypeScript

```svelte
<script lang="ts">
  import type { User } from '$lib/types/user';
  import { Button } from '$lib/components/ui/button';

  export let user: User;
  export let isActive: boolean = false;
  export let onUpdate: (user: User) => void = () => {};
</script>

<div class="space-y-4">
  <h2>{user.name}</h2>
  <Button on:click={() => onUpdate(user)}>
    Update
  </Button>
</div>
```

### Form Actions (SvelteKit)

```typescript
// +page.server.ts
import type { Actions } from "./$types";
import { posthogServer } from "$lib/server/posthog";
import { fail } from "@sveltejs/kit";

export const actions: Actions = {
  default: async ({ request }) => {
    const data = await request.formData();
    const email = data.get("email");

    // Validation
    if (!email || typeof email !== "string") {
      posthogServer.capture({
        distinctId: "anonymous",
        event: "form_validation_error",
        properties: { field: "email" },
      });
      return fail(400, { email, error: "Invalid email" });
    }

    // Process...
    posthogServer.capture({
      distinctId: email,
      event: "form_submitted",
      properties: { form_type: "contact" },
    });

    return { success: true };
  },
};
```

### shadcn-svelte Common Patterns

```svelte
<script lang="ts">
  import { Button } from "$lib/components/ui/button";
  import { Input } from "$lib/components/ui/input";
  import { Label } from "$lib/components/ui/label";
  import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle
  } from "$lib/components/ui/card";
  import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
  } from "$lib/components/ui/dialog";
  import { Badge } from "$lib/components/ui/badge";
  import { Alert, AlertDescription } from "$lib/components/ui/alert";
</script>

<!-- Example usage -->
<Card>
  <CardHeader>
    <CardTitle>Example Card</CardTitle>
    <CardDescription>This demonstrates shadcn-svelte components</CardDescription>
  </CardHeader>
  <CardContent>
    <div class="space-y-4">
      <div class="space-y-2">
        <Label for="name">Name</Label>
        <Input id="name" placeholder="Enter your name" />
      </div>
      <Badge>New</Badge>
    </div>
  </CardContent>
  <CardFooter>
    <Button class="w-full">Submit</Button>
  </CardFooter>
</Card>
```

### PostHog Event Tracking Patterns

```typescript
// User actions
posthog.capture("button_clicked", { button_name: "signup" });
posthog.capture("page_viewed", { page_name: "pricing" });
posthog.capture("feature_toggled", { feature: "dark_mode", enabled: true });

// Business events
posthog.capture("purchase_completed", {
  amount: 99.99,
  currency: "USD",
  items: 3,
});

// Error tracking
posthog.capture("$exception", {
  $exception_type: error.name,
  $exception_message: error.message,
  $exception_personURL: posthog.get_session_replay_url(),
});
```

### Tailwind with cn() Utility

```svelte
<script lang="ts">
  import { cn } from "$lib/utils";
  import { Button } from "$lib/components/ui/button";

  let variant: "default" | "destructive" = "default";
  let isLoading = false;
</script>

<Button
  class={cn(
    "w-full",
    isLoading && "opacity-50 cursor-not-allowed",
    variant === "destructive" && "hover:bg-destructive/90"
  )}
  disabled={isLoading}
>
  {isLoading ? "Loading..." : "Submit"}
</Button>
```

---

_Version: 4.0 | Last Updated: 16 October 2025_
