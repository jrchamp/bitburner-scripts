import { getCachedServers } from 'shared-functions.js';

/** @param {NS} ns **/
export async function main(ns) {
	ns.disableLog('disableLog');
	ns.disableLog('sleep');

	let backdoorTargets = {
		// Factions
		'avmnite-02h': true,
		'CSEC': true,
		'I.I.I.I': true,
		'run4theh111z': true,
		'fulcrumassets': true,

		// Discounts
		'crush-fitness': true,
		'iron-gym': true,
		'millenium-fitness': true,
		'powerhouse-fitness': true,
		'snap-fitness': true,
		'rothman-uni': true,
		'summit-uni': true,
		'zb-institute': true,

		// Other
		'w0r1d_d43m0n': true,
	};

	let servers = await getCachedServers(ns);
	for (let i = 0; i < servers.length; i++) {
		let server = servers[i];
		let hostname = server.host;

		if (server.hasRoot) {
			// Requires Source Code 4.1
			if (backdoorTargets[hostname] === true) {
				await ns.installBackdoor(hostname);
			}
		}
	}
}

