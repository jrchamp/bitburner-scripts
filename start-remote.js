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

export function getStartFilesFilename() {
	return 'start-files.txt';
}

/** @param {NS} ns **/
export async function getStartFiles(ns) {
	let contents = await ns.read(getStartFilesFilename());
	return JSON.parse(contents);
}

/** @param {NS} ns **/
export async function startLocal(ns) {
	let files = await getStartFiles(ns);

	let runFailures = false;
	for (const filename in files) {
		if (files[filename] === true) {
			let runStatus = 'error';
			if (ns.run(filename)) {
				runStatus = 'success';
			} else {
				runFailures = true;
			}
			ns.toast('run ' + filename, runStatus, 10000);
		}
	}

	if (runFailures) {
		ns.tprint('Some scripts failed to run. home may not have enough memory.');
		ns.tprint('At a minimum, run the command: run deploy-hack.js');
	}
}
