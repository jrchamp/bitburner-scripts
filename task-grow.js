/** @param {NS} ns **/
export async function main(ns) {
	ns.disableLog('disableLog');

	let target = ns.args[0];
	let delay = Number(ns.args[1]) || 0;

	if (!target) {
		return;
	}

	await ns.grow(target, { additionalMsec: delay });
}
