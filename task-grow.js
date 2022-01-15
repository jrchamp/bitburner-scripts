/** @param {NS} ns **/
export async function main(ns) {
	ns.disableLog("disableLog");
	ns.disableLog("sleep");

	let file = "servers.txt";

	// Infinite loop that continuously hacks/grows/weakens.
	while (true) {
		// Read the list of all servers.
		let data = await ns.read(file);
		let servers = JSON.parse(data);

		let targets = [];
		servers.forEach(function (server) {
			// Ignore pointless targets.
			if (server.hasRoot && server.maxMoney > 0 && server.minSecurity > 0) {
				targets.push(server);
			}
		});

		// If there are not valid targets, wait.
		if (targets.length <= 0) {
			await ns.sleep(1000);
			continue;
		}

		// Randomize target selection to balance the load.
		let num_targets = Math.min(targets.length, 10),
			random_index = Math.floor(Math.random() * num_targets),
			target = targets[random_index];

		// Use cached data about the server to minimize RAM usage.
		let host = target.host;

		await ns.grow(host);
	}
}
