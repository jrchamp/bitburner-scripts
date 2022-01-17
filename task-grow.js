import {getTarget} from 'shared-functions.js';

/** @param {NS} ns **/
export async function main(ns) {
	ns.disableLog("disableLog");
	ns.disableLog("sleep");

	// Infinite loop that continuously grows.
	while (true) {
		// Get a random target.
		let target = await getTarget(ns, "grow");

		// If there are no valid targets, wait.
		if (target === undefined) {
			await ns.sleep(1000);
			continue;
		}

		// Use cached data about the server to minimize RAM usage.
		let host = target.host;

		await ns.grow(host);
	}
}
