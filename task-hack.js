import { getTarget } from 'shared-functions.js';

/** @param {NS} ns **/
export async function main(ns) {
	ns.disableLog('disableLog');
	ns.disableLog('sleep');

	// Infinite loop that continuously hacks.
	while (true) {
		// Get a random target.
		let target = await getTarget(ns, 'hack');

		// If there are no valid targets, wait.
		if (target === undefined) {
			await ns.sleep(1000);
			continue;
		}

		// Use cached data about the server to minimize RAM usage.
		let host = target.host;

		await ns.hack(host);
	}
}
