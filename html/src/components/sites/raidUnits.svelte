<script>
	export let units;
	export let useNames;
	import RaidCard from "../utils/raidItem.svelte";
	import SimpleBar from "@woden/svelte-simplebar";
	import { LocaleSettings } from "../../stores";

	let searchTerm = "";
	let filteredArray = [];

	$: {
		if (searchTerm) {
			filteredArray = units.filter(
				(unit) =>
					unit.owner.toLowerCase().includes(searchTerm.toLowerCase()) ||
					unit.id.toString().toLowerCase().includes(searchTerm.toLowerCase())
			);
		} else {
			filteredArray = [...units];
		}
	}
</script>

<div
	class="flex justify-center items-center flex-col relative w-4/5 h-full p-5 font-sans"
>
	<div class="relative w-40 h-10 mb-5 self-start">
		<input
			type="text"
			id="searchInput"
			placeholder={$LocaleSettings.searchInput}
			class="p-2 bg-transparent text-white border-b-2 border-white focus:outline-none"
			bind:value={searchTerm}
		/>
	</div>
	<SimpleBar forceVisible={true} style="height: 90%; width: 620px">
		<div class="h-full w-[600px] flex flex-col gap-5">
			{#each filteredArray as unit}
				<RaidCard importData={unit} useName={useNames} />
			{/each}
		</div>
	</SimpleBar>
</div>
