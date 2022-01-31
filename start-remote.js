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

		// Active scripts (order matters).
		'cache-servers.js': true,
		'purchase-servers.js': true,
		'deploy-hack.js': true,
	};

	let baseUrl = 'https://raw.githubusercontent.com/jrchamp/bitburner-scripts/main/';
	if (ns.args.length > 0) {
		baseUrl = ns.args[0];
	}

	for (const filename in files) {
		let url = baseUrl + filename;
		await ns.wget(url, filename, 'home');
		ns.toast('wget ' + filename, 'success', 10000);
		if (files[filename] === true) {
			ns.run(filename);
			ns.toast('run ' + filename, 'success', 10000);
		}
	}
}
