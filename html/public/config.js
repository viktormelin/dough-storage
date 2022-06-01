//
// ----------------------------------
// DO NOT TOUCH ANYTHING BELOW HERE!
// ----------------------------------
//

function hideGlobalDisplay() {
	fetch("https://doughStorage/hideDisplay", {
		method: "post",
		body: JSON.stringify({}),
	});
}

export { hideGlobalDisplay };
