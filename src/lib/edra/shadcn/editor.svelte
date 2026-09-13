<script lang="ts">
	import TiptapContent from '../tiptap/components/TiptapContent.svelte';
	import './editor.css';
	import mermaid from 'mermaid';
	import {
		MathBlock,
		Link,
		MathInline,
		TableColMenu,
		TableRowMenu
	} from './components/menu/index.js';
	import { cn } from "$lib/utils.js";

	interface Props {
		class?: string;
	}
	const { class: className = '' }: Props = $props();

	// fuss: theme comes from the app's own .dark toggle, not mode-watcher
	mermaid.initialize({
		startOnLoad: false,
		theme: typeof document !== 'undefined' && document.querySelector('.dark') ? 'dark' : 'default',
		securityLevel: 'loose',
		fontFamily: 'inherit'
	});
</script>

<Link />
<MathBlock />
<MathInline />
<TableColMenu />
<TableRowMenu />
<TiptapContent class={cn('relative', className)} />
