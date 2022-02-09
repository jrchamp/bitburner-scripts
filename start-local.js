import { startLocal } from 'start-remote.js';

/** @param {NS} ns **/
export async function main(ns) {
	ns.disableLog('disableLog');

	await startLocal(ns);
}
