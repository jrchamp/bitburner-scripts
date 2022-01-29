import { getCachedServers, getBackdoorTargets } from 'shared-functions.js';

/** @param {NS} ns **/
export async function main(ns) {
	let backdoorTargets = getBackdoorTargets();
	let servers = await getCachedServers(ns);
	for (const server of servers) {
		if (server.hasRoot) {
			let hostname = server.host;
			if (backdoorTargets[hostname] === true) {
				// Requires Source Code 4.1
				await ns.installBackdoor(hostname);
			}
		}
	}
}
