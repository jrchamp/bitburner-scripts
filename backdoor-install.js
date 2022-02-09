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
				let pathServers = server.path.replaceAll(/;/g, '').split(' connect ');
				let success = true;
				for (const pathServer of pathServers) {
					if (!ns.connect(pathServer.trim())) {
						success = false;
						ns.tprint('Failed connecting to ' + pathServer);
					}
				}
				if (success) {
					await ns.installBackdoor();
					ns.toast('backdoor ' + hostname, 'success', 10000);
				}
			}
		}
	}
}
