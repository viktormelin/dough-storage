<script>
	export let location;
	import UnitCard from "../utils/buyUnitCard.svelte";
	// import { locationSettings } from "../../../public/config";
	import { UnitLocations } from "../../stores";
	import SimpleBar from "@woden/svelte-simplebar";

	const locationLabel = $UnitLocations[location].label;
	const locationTypes = $UnitLocations[location].types;
</script>

<SimpleBar
	forceVisible={true}
	direction={"ltr"}
	style="width: 819.19px; height: 600px"
>
	<div class="relative grid w-4/5 h-full p-10 grid-flow-col gap-5">
		{#each locationTypes as unit}
			<UnitCard unitData={unit} {location} />
		{/each}
	</div>
</SimpleBar>
