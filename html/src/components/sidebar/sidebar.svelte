<script>
	export let police;
	export let location;
	export let communityName;
	export let communityLogo;
	import { createEventDispatcher } from "svelte";
	import SidebarItem from "./sidebarItem.svelte";
	import { UnitLocations, LocaleSettings } from "../../stores";

	const dispatch = createEventDispatcher();

	function clickHandler(e) {
		dispatch("clickEvent", {
			menu: e.detail.menu,
		});
	}
</script>

<div
	class="flex flex-col justify-between items-start w-1/5 h-full border-r-2 border-white "
>
	<div class="h-1/5 w-full flex flex-col items-center justify-center px-5">
		<img src={communityLogo} alt={communityName} />
	</div>
	<div class="w-full text-center">
		<p class="font-sans text-white font-bold text-md uppercase">
			{$UnitLocations[location].label}
		</p>
		<div class="px-7">
			<SidebarItem
				id="myUnits"
				text={$LocaleSettings.myUnits}
				icon="fas fa-home"
				on:clickEvent={clickHandler}
			/>
			<SidebarItem
				id="buyUnits"
				text={$LocaleSettings.buyUnits}
				icon="fas fa-store-alt"
				on:clickEvent={clickHandler}
			/>
			{#if police}
				<SidebarItem
					id="raidUnits"
					text={$LocaleSettings.raidUnits}
					icon="fas fa-hammer"
					on:clickEvent={clickHandler}
				/>
			{/if}
		</div>
	</div>
	<div class="h-1/5 w-full flex items-end justify-center">
		<p class="font-sans text-white text-sm py-1">Created by .dough#0001</p>
	</div>
</div>
