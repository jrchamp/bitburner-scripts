/** @param {NS} ns **/
export async function main(ns) {
	while (true) {
		let newFactions = ns.checkFactionInvitations();
		for (const faction of newFactions) {
			ns.joinFaction(faction);
		}

		/*
		ns.getFactionRep(faction); // Get faction reputation.
		ns.workForFaction(faction, workType, focus); // Work for a faction.

		ns.getFactionFavor(faction); // Get faction favor.
		ns.getFactionFavorGain(faction); // Get faction favor gain.
		ns.donateToFaction(faction, amount); // Donate to a faction.
		*/

		await ns.sleep(1000);
	}
}
