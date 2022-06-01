<script>
	export let text;
	import { fade } from "svelte/transition";
	import { createEventDispatcher } from "svelte";
	import { LocaleSettings } from "../../stores";
	const dispatch = createEventDispatcher();

	function modalHandler(e) {
		dispatch("modalEvent", {
			option: e,
		});
	}
</script>

<div
	transition:fade
	class="fixed w-screen h-screen flex justify-center items-center top-0 left-0 bg-gray-700/75"
>
	<div class="bg-gray-900 px-10 py-5 uppercase text-white shadow-md rounded-md">
		<div class="flex flex-row items-center">
			<i class="fas fa-exclamation-triangle mr-2 text-blue-600" />
			<h3 class="font-bold text-lg">{$LocaleSettings.confirmationText}</h3>
		</div>
		<p>{`${text}`}</p>
		<div class="flex justify-around">
			<button
				class="py-1 px-4 mt-5 bg-gray-700 border-0 rounded font-sans uppercase transition-all duration-300 ease-in-out hover:shadow-lg hover:bg-green-800"
				on:click={() => modalHandler("confirm")}
				>{$LocaleSettings.confirmOption}</button
			>

			<button
				class="py-1 px-4 mt-5 bg-gray-700 border-0 rounded font-sans uppercase transition-all duration-300 ease-in-out hover:shadow-lg hover:bg-red-800"
				on:click={() => modalHandler("cancel")}
				>{$LocaleSettings.cancelOption}</button
			>
		</div>
	</div>
</div>
