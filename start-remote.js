/** @param {NS} ns **/
export async function main(ns) {
	ns.disableLog('disableLog');

	// TODO: Consider having this available as deploy.json.
	let files = {
		// Support scripts.
		'backdoor-install.js': false,
		'backdoor-list.js': false,
		'get-path.js': false,
		'max-hacknet.js': false,
		'shared-functions.js': false,
		'status-targets.js': false,
		'task-grow.js': false,
		'task-hack.js': false,
		'task-weaken.js': false,
		'task-share.js': false,
		'workflow-hack.js': false,
		'cache-servers.js': false,

		// Active scripts (order matters).
		'purchase-servers.js': true,
		'deploy-hack.js': true,
	};

	let baseUrl = 'https://raw.githubusercontent.com/jrchamp/bitburner-scripts/main/';
	if (ns.args.length > 0) {
		baseUrl = ns.args[0];
	}

	let runFailures = false;
	for (const filename in files) {
		let url = baseUrl + filename;
		await ns.wget(url, filename, 'home');
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
