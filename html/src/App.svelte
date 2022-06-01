<script>
	import Sidebar from "./components/sidebar/sidebar.svelte";
	import MyUnits from "./components/sites/myUnits.svelte";
	import BuyUnits from "./components/sites/buyUnits.svelte";
	import RaidUnits from "./components/sites/raidUnits.svelte";
	import { hideGlobalDisplay } from "../public/config";
	import {
		UnitData,
		UnitSettings,
		UnitLocations,
		RaidableUnits,
		LocaleSettings,
	} from "./stores";

	let displayUI = false;
	let menu = "myUnits";
	let isPolice = false;
	let useNames = false;
	let currentLocation = "";
	let communityName = "";
	let communityLogo = "";
	let sellDecrease = 0;

	function handleWindowClick(e) {
		if (e.key == "Escape") {
			displayUI = !displayUI;
			hideDisplay();
		}
	}

	function handleWindowMessage(e) {
		if (e.data.type === "showUI") {
			if (displayUI) clearOldData();
			displayUI = true;
			UnitData.set(e.data.unitdata);
			UnitSettings.set(e.data.unitsettings);
			UnitLocations.set(e.data.unitlocations);
			isPolice = e.data.ispolice;
			useNames = e.data.useName;
			RaidableUnits.set(e.data.allunitsdata);
			LocaleSettings.set(e.data.locales);
			currentLocation = e.data.currentlocation;
			communityName = e.data.communityName;
			communityLogo = e.data.communityLogo;
			sellDecrease = e.data.sellDecrease;
		} else if (e.data.type === "hideUI" && displayUI) {
			hideDisplay();
		}
	}

	function handleMenuChange(e) {
		menu = e.detail.menu;
	}

	function hideDisplay() {
		displayUI = false;
		UnitData.set([]);
		UnitSettings.set([]);
		UnitLocations.set([]);
		RaidableUnits.set([]);
		LocaleSettings.set([]);
		isPolice = false;
		currentLocation = "";
		communityName = "";
		communityLogo = "";
		sellDecrease = 0;
		hideGlobalDisplay();
	}

	function clearOldData() {
		UnitData.set([]);
		UnitSettings.set([]);
		UnitLocations.set([]);
		RaidableUnits.set([]);
		LocaleSettings.set([]);
		isPolice = false;
		currentLocation = "";
		communityName = "";
		communityLogo = "";
		sellDecrease = 0;
	}
</script>

<svelte:head>
	<title>{communityName}</title>
</svelte:head>

<svelte:window
	on:keydown={handleWindowClick}
	on:message={handleWindowMessage}
/>

{#if displayUI}
	<main class="flex justify-center items-center w-full h-screen">
		<div class="flex flex-row h-[600px] w-[1024px] bg-gray-700 rounded-lg">
			<Sidebar
				location={currentLocation}
				police={isPolice}
				{communityName}
				{communityLogo}
				on:clickEvent={handleMenuChange}
			/>
			{#if menu === "myUnits"}
				<MyUnits
					location={currentLocation}
					unitData={$UnitData}
					{sellDecrease}
				/>
			{:else if menu === "buyUnits"}
				<BuyUnits location={currentLocation} />
			{:else if isPolice && menu === "raidUnits"}
				<RaidUnits units={$RaidableUnits} {useNames} />
			{/if}
		</div>
	</main>
{/if}

<style lang="postcss" global>
	@import url("https://fonts.googleapis.com/css2?family=Roboto+Condensed:wght@400;700&display=swap");
	@tailwind base;
	@tailwind components;
	@tailwind utilities;
</style>
