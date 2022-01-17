/** @param {NS} ns **/
export async function main(ns) {
	ns.disableLog('disableLog');
	ns.disableLog('getServerMoneyAvailable');
	ns.disableLog('sleep');

	while (true) {
		while (ns.hacknet.numNodes() < ns.hacknet.maxNumNodes() && ns.getServerMoneyAvailable('home') > ns.hacknet.getPurchaseNodeCost()) {
			ns.hacknet.purchaseNode();
			ns.toast('Purchased hacknet node #' + ns.hacknet.numNodes(), 'success', 30000);
		}

		let number = 1;

		for (let index = 0; index < ns.hacknet.numNodes(); index++) {
			if (hacknetNodeIsMax(ns, index)) {
				continue;
			}

			if (index === 0) {
				ns.print(ns.hacknet.getNodeStats(index));
			}

			let upgraded = false;

			while (ns.hacknet.getLevelUpgradeCost(index, number) < ns.getServerMoneyAvailable('home')) {
				ns.hacknet.upgradeLevel(index, number);
				upgraded = true;
			}

			while (ns.hacknet.getRamUpgradeCost(index, number) < ns.getServerMoneyAvailable('home')) {
				ns.hacknet.upgradeRam(index, number);
				upgraded = true;
			}

			while (ns.hacknet.getCoreUpgradeCost(index, number) < ns.getServerMoneyAvailable('home')) {
				ns.hacknet.upgradeCore(index, number);
				upgraded = true;
			}

			if (upgraded) {
				ns.print('Upgraded hacknet node #' + index);
			}

			if (hacknetNodeIsMax(ns, index)) {
				ns.toast('Maximized hacknet node #' + index, 'success', 30000);
			}
			/* // Hashnet only.
			while (ns.hacknet.getCacheUpgradeCost(index, number) < ns.getServerMoneyAvailable("home")) {
				ns.hacknet.upgradeCache(index, number);
			}
			*/
		}

		if (ns.hacknet.numNodes() === ns.hacknet.maxNumNodes() && hacknetNodeIsMax(ns, ns.hacknet.maxNumNodes() - 1)) {
			// Completely maxed out all nodes.
			break;
		}
		await ns.sleep(60000);
	}

	/*
	let hashUpgrades = ns.hacknet.getHashUpgrades();
	hashUpgrades.forEach(function (upgradeName) {
		ns.hacknet.getHashUpgradeLevel(upgradeName);
		ns.hacknet.hashCost(upgradeName);
		ns.hacknet.spendHashes(upgradeName, upgradeTarget);
	});

	ns.hacknet.getStudyMult();
	ns.hacknet.getTrainingMult();
	ns.hacknet.hashCapacity();
	ns.hacknet.numHashes();
	*/
}

function hacknetNodeIsMax(ns, index) {
	let number = 1;
	return ns.hacknet.getLevelUpgradeCost(index, number) === Infinity
		&& ns.hacknet.getRamUpgradeCost(index, number) === Infinity
		&& ns.hacknet.getCoreUpgradeCost(index, number) === Infinity;
}
