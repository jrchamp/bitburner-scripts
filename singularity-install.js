/** @param {NS} ns **/
export async function main(ns) {
	let readyToBuyAugmentations = true;
	if (readyToBuyAugmentations) {
		purchaseAndInstallAugmentations(ns);
	}
}

/**
 * @param {NS} ns
 * @param {String} augName
 * @param {Object} augmentations
 **/
function recursivelyPurchaseAugmentation(ns, augName, augmentations) {
	let augmentation = augmentations[augName];

	let ownedAugmentations = ns.getOwnedAugmentations(true);
	if (ownedAugmentations.includes(augName) && augName !== 'NeuroFlux Governor') {
		//ns.tprint('Augmentation already owned: ' + augName);
		return true;
	}

	let cost = ns.getAugmentationPrice(augName);
	let money = ns.getServerMoneyAvailable('home');
	if (money < cost) {
		ns.tprint('Cannot afford ' + augName + ': ' + money + ' / ' + cost);
		return false;
	}

	for (const preReq of ns.getAugmentationPrereq(augName)) {
		if (!recursivelyPurchaseAugmentation(ns, preReq, augmentations)) {
			ns.tprint('Prerequisite of ' + augName + ' failed: ' + preReq);
			return false;
		}
	}

	money = ns.getServerMoneyAvailable('home');
	if (money < cost) {
		ns.tprint('After pre-req, cannot afford ' + augName + ': ' + money + ' / ' + cost);
		return false;
	}

	let bestFaction = null;
	let bestFactionRep = 0;
	let repRequired = ns.getAugmentationRepReq(augName);
	for (const faction of augmentation['factions']) {
		let factionRep = ns.getFactionRep(faction);
		if (factionRep > bestFactionRep) {
			bestFactionRep = factionRep;
			bestFaction = faction;
		}

		if (repRequired < factionRep) {
			//return ns.purchaseAugmentation(faction, augmentation);
			if (ns.purchaseAugmentation(faction, augName)) {
				ns.tprint('Purchased augmentation ' + augName + ' from faction: ' + faction + ' (cost: ' + Math.ceil(cost) + ')');
				return true;
			}
			return false;
		}
	}

	ns.tprint('Augmentation purchase failed: ' + augName + ' (best faction: ' + bestFaction + ' ' + Math.floor(bestFactionRep) + '/' + Math.ceil(repRequired) + ')');
	return false;
}

/**
 * @param {NS} ns
 **/
export function purchaseAndInstallAugmentations(ns) {
	let player = ns.getPlayer();

	let goodStats = [];
	let hackingStats = [
		'hacking_mult',
		'hacking_speed_mult',
		'hacking_chance_mult',
		'hacking_exp_mult',
		'hacking_money_mult',
		'hacking_grow_mult',
		'faction_rep_mult',
	];
	let physicalStats = [
		'strength_mult',
		'defense_mult',
		'dexterity_mult',
		'agility_mult',
		'charisma_mult',
		'strength_exp_mult',
		'defense_exp_mult',
		'dexterity_exp_mult',
		'agility_exp_mult',
		'charisma_exp_mult',
	];
	let companyStats = [
		'company_rep_mult',
		'work_money_mult',
	];
	let crimeStats = [
		'crime_money_mult',
		'crime_success_mult',
	];
	let hacknetStats = [
		'hacknet_node_money_mult',
		'hacknet_node_purchase_cost_mult',
		'hacknet_node_ram_cost_mult',
		'hacknet_node_core_cost_mult',
		'hacknet_node_level_cost_mult',
	];
	const hackingStatsAreGood = true;
	if (hackingStatsAreGood) {
		goodStats = goodStats.concat(hackingStats);
	}
	const physicalStatsAreGood = false;
	if (physicalStatsAreGood) {
		goodStats = goodStats.concat(physicalStats);
	}
	const companyStatsAreGood = false;
	if (companyStatsAreGood) {
		goodStats = goodStats.concat(companyStats);
	}
	const crimeStatsAreGood = false;
	if (crimeStatsAreGood) {
		goodStats = goodStats.concat(crimeStats);
	}
	const hacknetStatsAreGood = false;
	if (hacknetStatsAreGood) {
		goodStats = goodStats.concat(hacknetStats);
	}

	// Build list of all available augmentations.
	let augmentations = {};
	for (const faction of player.factions) {
		let factionAugmentations = ns.getAugmentationsFromFaction(faction); // Get a list of augmentation available from a faction.
		for (const augName of factionAugmentations) {
			if (augmentations[augName]) {
				augmentations[augName]['factions'].push(faction);
			} else {
				let stats = ns.getAugmentationStats(augName);
				let statNames = Object.keys(stats);
				let hasGoodStats = false;
				for (const statName of statNames) {
					if (goodStats.includes(statName)) {
						hasGoodStats = true;
						break;
					}
				}
				if (hasGoodStats) {
					augmentations[augName] = {
						'name': augName,
						'factions': [faction],
						'price': ns.getAugmentationPrice(augName),
					};
				}
			}
		}
	}

	// Sort the list of desired augmentations by price descending.
	let sortedAugmentations = Object.keys(augmentations);
	sortedAugmentations.sort(function (a, b) {
		return augmentations[b].price - augmentations[a].price;
	});

	// Buy the augmentations, fulfilling prerequisites first as needed.
	for (const augName of sortedAugmentations) {
		recursivelyPurchaseAugmentation(ns, augName, augmentations);
	}

	// Upgrade home computer RAM.
	while (ns.getUpgradeHomeRamCost() < ns.getServerMoneyAvailable('home')) {
		ns.upgradeHomeRam();
	}

	// Upgrade home computer cores.
	while (ns.getUpgradeHomeCoresCost() < ns.getServerMoneyAvailable('home')) {
		ns.upgradeHomeCores();
	}

	// Spend the rest of the money on NeuroFlux Governor levels.
	while (recursivelyPurchaseAugmentation(ns, 'NeuroFlux Governor', augmentations)) {
		// Intentionally left blank as the loop condition does the work.
	}

	// Install augmentations and run initial script.
	ns.installAugmentations('start-local.js');
}
