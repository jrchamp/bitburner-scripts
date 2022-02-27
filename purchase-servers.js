/** @param {NS} ns **/
export async function main(ns) {
	ns.disableLog('disableLog');
	ns.disableLog('getServerMoneyAvailable');
	ns.disableLog('getServerMaxRam');
	ns.disableLog('sleep');

	let maxMagnitude = Math.log2(ns.getPurchasedServerMaxRam());
	// Scale up ram automatically over time to max value of 1048576 (2^20).
	for (let magnitude = 4; magnitude <= 20; magnitude += 4) {
		// How much RAM each purchased server will have.
		let ram = Math.pow(2, Math.min(magnitude, maxMagnitude));
		let orders = {
			0: 'GB',
			1: 'TB',
			2: 'PB',
			3: 'EB',
			4: 'ZB',
			5: 'YB',
		};
		let max_order = 5;
		let order = Math.min(Math.floor(Math.log(ram) / Math.log(1024)), max_order);
		let display_ram = Math.floor(ram / Math.pow(1024, order));
		ns.print('RAM target: ' + display_ram + orders[order]);

		// Iterator we'll use for our loop
		let i = 1;

		// Continuously try to purchase servers until we've reached the maximum
		// amount of servers.
		let maxServers = ns.getPurchasedServerLimit();
		while (i <= maxServers) {
			let hostname = 'pserv-' + i;

			// If the server exists and meets the minimums, then move to the next.
			if (ns.serverExists(hostname) && ns.getServerMaxRam(hostname) >= ram) {
				ns.print(i + '/' + maxServers);
				i++;
			} else if (ns.getServerMoneyAvailable('home') > ns.getPurchasedServerCost(ram)) {
				// If the server is smaller than desired, delete it.
				if (ns.serverExists(hostname) && ns.getServerMaxRam(hostname) < ram) {
					// Prerequisite: Stop any running processes.
					ns.killall(hostname);
					ns.deleteServer(hostname);
				}

				// If there is no server, purchase one.
				if (!ns.serverExists(hostname)) {
					ns.purchaseServer(hostname, ram);

					ns.toast('Purchased ' + hostname + ' ' + display_ram + orders[order], 'success', 30000);
				}
			} else {
				// Otherwise, sleep for a bit.
				await ns.sleep(30000);
			}
		}
	}
}
