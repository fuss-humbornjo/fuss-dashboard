<script lang="ts">
import { Select as SelectPrimitive } from "bits-ui";
import { cn, type WithoutChild } from "$lib.js";

let {
  ref = $bindable(null),
  class: className,
  placeholder,
  ...restProps
}: WithoutChild<SelectPrimitive.ValueProps> = $props();
</script>

<SelectPrimitive.Value
  bind:ref
  data-slot="select-value"
  {placeholder}
  class={cn("line-clamp-1 flex items-center gap-1", className)}
  {...restProps}
/>
