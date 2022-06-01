<script>
	export let id;
	export let text;
	export let icon;
	import { createEventDispatcher } from "svelte";

	const dispatch = createEventDispatcher();

	function clickHandler(e) {
		dispatch("clickEvent", {
			menu: e,
		});
	}
</script>

<div
	on:click={clickHandler(`${id}`)}
	class="cursor-pointer my-2 flex items-center font-sans text-white uppercase align-middle transition-all duration-500 ease-in-out hover:ml-4 hover:text-gray-300"
>
	<i class={icon} />
	<p class="ml-2 text-xl">{text}</p>
</div>
