<script>
	export let unitData;
	export let sellDecrease;
	import Modal from "./modal.svelte";
	import { UnitSettings, UnitLocations, LocaleSettings } from "../../stores";

	let showModal = false;
	let unitPrice = 0;
	for (const type of $UnitLocations[unitData.location].types) {
		if (type.type == unitData.type) {
			unitData.rented
				? (unitPrice = type.rentPrice)
				: (unitPrice = type.buyPrice);
		}
	}

	function sellUnit(e) {
		showModal = true;
	}

	function openUnit(e) {
		fetch("https://doughStorage/openUnit", {
			method: "post",
			body: JSON.stringify({
				id: unitData.id,
			}),
		});
	}

	function confirmAction(e) {
		showModal = false;
		if (e.detail.option === "confirm") {
			fetch("https://doughStorage/sellUnit", {
				method: "post",
				body: JSON.stringify({
					id: unitData.id,
				}),
			});
		}
	}
</script>

{#if showModal}
	<Modal
		on:modalEvent={confirmAction}
		text={$LocaleSettings.cancelConfirmation}
	/>
{/if}

<div
	class="flex flex-col justify-around items-center rounded-lg shadow-lg text-white bg-gray-800 w-[300px]"
>
	<img
		class="w-1/2"
		src={$UnitSettings[unitData.type].image}
		alt={$UnitSettings[unitData.type].type}
	/>
	<div class="text-xl font-sans uppercase text-center">
		<p class="font-bold">
			{$UnitSettings[unitData.type].label} [{unitData.id}]
		</p>
		<p>{$LocaleSettings.totalWeight} {$UnitSettings[unitData.type].size}</p>
		<p>
			{#if unitData.rented}
				{$LocaleSettings.rentPrice} {unitPrice}
			{:else}
				{$LocaleSettings.sellPrice} {unitPrice * (1 - sellDecrease / 100)}
			{/if}
		</p>
		<button
			class="py-1 px-4 mt-5 bg-gray-700 border-0 rounded font-sans uppercase transition-all duration-300 ease-in-out hover:shadow-lg hover:bg-purple-800"
			on:click={openUnit(`${unitData.id}`)}>{$LocaleSettings.openUnit}</button
		>
		<button
			class="py-1 px-4 mt-5 bg-gray-700 border-0 rounded font-sans uppercase transition-all duration-300 ease-in-out hover:shadow-lg hover:bg-purple-800"
			on:click={sellUnit(`${unitData.id}`)}
		>
			{#if unitData.rented}
				{$LocaleSettings.cancelRent}
			{:else}
				{$LocaleSettings.sellUnit}
			{/if}
		</button>
	</div>
</div>
