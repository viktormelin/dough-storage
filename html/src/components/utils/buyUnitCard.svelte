<script>
	export let unitData;
	export let location;
	import { UnitSettings, LocaleSettings } from "../../stores";
	import Modal from "./modal.svelte";

	let showModal = false;
	let currentType = null;
	let renting;
	let text;

	function buyUnit(e) {
		renting = false;
		text = "purchase";
		showModal = true;
		currentType = e;
	}

	function rentUnit(e) {
		renting = true;
		text = "rent";
		showModal = true;
		currentType = e;
	}

	function confirmPurchase(e) {
		showModal = false;
		if (e.detail.option === "confirm") {
			fetch("https://doughStorage/buyUnit", {
				method: "post",
				body: JSON.stringify({
					unitType: currentType,
					isRenting: renting,
					location: location,
					rentPrice: unitData.rentPrice,
					buyPrice: unitData.buyPrice,
				}),
			});
		}
	}
</script>

{#if showModal}
	<Modal
		on:modalEvent={confirmPurchase}
		text={$LocaleSettings.purchaseConfirmation}
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
		<p class="font-bold">{$UnitSettings[unitData.type].label}</p>
		<p>{$LocaleSettings.totalWeight} {$UnitSettings[unitData.type].size}</p>
		<p>
			{#if unitData.rentPrice > 0}
				{$LocaleSettings.rentPrice} {unitData.rentPrice}
			{/if}
		</p>

		<p>
			{#if unitData.buyPrice > 0}
				{$LocaleSettings.buyPrice} {unitData.buyPrice}
			{/if}
		</p>
		<button
			class="py-1 px-4 mt-5 bg-gray-700 border-0 rounded font-sans uppercase transition-all duration-300 ease-in-out hover:shadow-lg hover:bg-purple-800"
			on:click={buyUnit(`${unitData.type}`)}>{$LocaleSettings.buyUnit}</button
		>
		<button
			class="py-1 px-4 mt-5 bg-gray-700 border-0 rounded font-sans uppercase transition-all duration-300 ease-in-out hover:shadow-lg hover:bg-purple-800"
			on:click={rentUnit(`${unitData.type}`)}
		>
			{$LocaleSettings.rentUnit}
		</button>
	</div>
</div>
