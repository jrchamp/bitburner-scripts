/** @param {NS} ns **/
export async function main(ns) {
	ns.disableLog('disableLog');
	ns.disableLog('sleep');

	// Infinite loop that continuously shares.
	while (true) {
		await ns.share();
	}
}
