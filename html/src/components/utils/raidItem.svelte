<script>
	export let importData;
	export let useName;
	import Modal from "./modal.svelte";
	import { LocaleSettings } from "../../stores";
	let showModal = false;

	function confirmAction(e) {
		showModal = false;
		if (e.detail.option === "confirm") {
			fetch("https://doughStorage/raidUnit", {
				method: "post",
				body: JSON.stringify({
					location: location,
					id: importData.id,
					owner: importData.owner,
				}),
			});
		}
	}

	function raidUnit(e) {
		showModal = true;
	}
</script>

{#if showModal}
	<Modal
		on:modalEvent={confirmAction}
		text={$LocaleSettings.raidConfirmation}
	/>
{/if}

<div class="bg-gray-800 w-full h-fit rounded flex flex-row p-3 shadow-md">
	<div
		class="uppercase text-white flex flex-row justify-between items-center w-full"
	>
		<p class="font-bold">
			{$LocaleSettings.storageNumber}
			<span class="font-normal">{importData.id}</span>
		</p>
		<p class="font-bold ml-10">
			{$LocaleSettings.ownerLabel}
			<span class="font-normal">
				{#if useName}
					{importData.owner}
				{:else}
					{importData.name}
				{/if}
			</span>
		</p>
		<button
			class="py-1 px-4 ml-10 bg-gray-700 border-0 rounded font-sans uppercase transition-all duration-300 ease-in-out hover:shadow-lg hover:bg-purple-800"
			on:click={raidUnit}
			>{$LocaleSettings.raidUnit}
		</button>
	</div>
</div>
