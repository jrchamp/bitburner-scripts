import { getCachedServers } from 'shared-functions.js';

/** @param {NS} ns **/
export async function main(ns) {
	ns.disableLog('disableLog');
	ns.disableLog('sleep');

	if (ns.args.length < 1) {
		ns.tprint('Error: No server provided.');
		return;
	}

	let destination = ns.args[0];

	// Get the full list of servers.
	let servers = await getCachedServers(ns);

	let found = false;
	servers.forEach(function (server) {
		let host = server.host;
		if (host === destination) {
			ns.tprint(server.path);
			found = true;
		}
	});

	if (!found) {
		ns.tprint('Error: Server hostname not found: ' + destination);
	}
}
