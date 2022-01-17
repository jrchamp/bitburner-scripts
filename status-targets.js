import { getAllTargets } from 'shared-functions.js';

/** @param {NS} ns **/
export async function main(ns) {
	ns.disableLog('disableLog');
	ns.disableLog('getServerMoneyAvailable');
	ns.disableLog('getServerSecurityLevel');
	ns.disableLog('sleep');

	// Infinite loop that continuously monitors the targets.
	while (true) {
		// Get the full list of targets.
		let targets = await getAllTargets(ns);

		// If there are no valid targets, wait.
		if (targets.length === 0) {
			await ns.sleep(1000);
			continue;
		}

		targets.forEach(function (target) {
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

			let serverStatus = host + ' - $' + Math.floor(currentMoney).toLocaleString() + ' / $' + Math.floor(maxMoney).toLocaleString() + ' (' + Math.round(100 * currentMoney / maxMoney) + '%); Security: ' + (Math.floor(100 * currentSecurity) / 100) + ' / ' + minSecurity;

			let action;
			if (currentSecurity > securityThresh) {
				// If the server's security level is above our threshold, weaken it
				action = 'weaken';
			} else if (currentMoney < moneyThresh) {
				// If the server's money is less than our threshold, grow it
				action = 'grow';
			} else {
				action = 'hack';
			}
			ns.print(action + ' ' + serverStatus);
		});

		await ns.sleep(1000);
		ns.clearLog();
	}
}
