/** @param {NS} ns **/
export async function main(ns) {
	ns.disableLog("disableLog");
	ns.disableLog("getServerMoneyAvailable");
	ns.disableLog("getServerSecurityLevel");
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

		// If there are no valid targets, wait.
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
		let maxMoney = target.maxMoney;
		let minSecurity = target.minSecurity;

		// Don't hack unless the server has at least this much money.
		let moneyThresh = maxMoney * 0.75;

		// If the security level is above this threshold, we'll weaken.
		let securityThresh = minSecurity + 5;

		let currentMoney = ns.getServerMoneyAvailable(host);
		let currentSecurity = ns.getServerSecurityLevel(host);

		let serverStatus = host + " - $" + Math.floor(currentMoney).toLocaleString() + " / $" + Math.floor(maxMoney).toLocaleString() + " (" + Math.round(100 * currentMoney / maxMoney) + "%); Security: " + currentSecurity + " / " + minSecurity;
		ns.print(serverStatus);

		if (currentSecurity > securityThresh) {
			// If the server's security level is above our threshold, weaken it
			await ns.weaken(host);
		} else if (currentMoney < moneyThresh) {
			// If the server's money is less than our threshold, grow it
			await ns.grow(host);
		} else {
			// Otherwise, hack it
			await ns.hack(host);
		}
	}
}
