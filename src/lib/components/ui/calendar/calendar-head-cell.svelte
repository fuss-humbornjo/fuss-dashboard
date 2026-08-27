<script lang="ts">
import { Calendar as CalendarPrimitive } from "bits-ui";
import { cn } from "$lib.js";

let {
  ref = $bindable(null),
  class: className,
  ...restProps
}: CalendarPrimitive.HeadCellProps = $props();
</script>

<CalendarPrimitive.HeadCell
  bind:ref
  class={cn(
		"w-(--cell-size) rounded-md font-mono text-[0.6875rem] font-normal uppercase tracking-wider text-muted-foreground",
		className
	)}
  {...restProps}
/>
