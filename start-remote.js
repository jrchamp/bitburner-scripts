import { getStartFiles, getStartFilesFilename, startLocal } from 'start-local.js';

/** @param {NS} ns **/
export async function main(ns) {
	ns.disableLog('disableLog');

	let baseUrl = 'https://raw.githubusercontent.com/jrchamp/bitburner-scripts/main/';
	if (ns.args.length > 0) {
		baseUrl = ns.args[0];
	}

	// Fetch the files list and store it locally.
	let url = baseUrl + 'start-files.json';
	await ns.wget(url, getStartFilesFilename(), 'home');

	let files = await getStartFiles(ns);
	for (const filename in files) {
		let url = baseUrl + filename;
		await ns.wget(url, filename, 'home');
	}

	await startLocal(ns);
}
