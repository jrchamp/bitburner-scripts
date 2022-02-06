/** @param {NS} ns **/
export async function main(ns) {
	ns.disableLog('disableLog');

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
