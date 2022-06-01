<script>
	export let location;
	export let unitData;
	export let sellDecrease;
	import UnitCard from "../utils/myUnitCard.svelte";
	import SimpleBar from "@woden/svelte-simplebar";
</script>

<SimpleBar
	forceVisible={true}
	direction={"ltr"}
	style="width: 819.19px; height: 600px"
>
	<div class="relative grid w-4/5 h-full p-10 grid-flow-col gap-5">
		{#each unitData as unit}
			{#if unit.location == location}
				<UnitCard unitData={unit} {sellDecrease} />
			{/if}
		{/each}
	</div>
</SimpleBar>
