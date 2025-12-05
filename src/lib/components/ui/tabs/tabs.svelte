<script lang="ts">
	import { Tabs as TabsPrimitive } from 'bits-ui';

	export let value: string;
</script>

<TabsPrimitive.Root bind:value {...$$restProps}>
	<slot />
</TabsPrimitive.Root>
