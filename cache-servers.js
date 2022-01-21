import { getServersCacheFilename } from 'shared-functions.js';

var cached = {};
var cache = [];

/** @param {NS} ns **/
export async function main(ns) {
	ns.disableLog('disableLog');
	ns.disableLog('getServerMaxMoney');
	ns.disableLog('getServerMinSecurityLevel');
	ns.disableLog('getServerRequiredHackingLevel');
	ns.disableLog('getServerNumPortsRequired');
	ns.disableLog('getServerMaxRam');
	ns.disableLog('scan');
	ns.disableLog('scp');
	ns.disableLog('sleep');

	let file = getServersCacheFilename(ns);
	while (true) {
		ns.print('Building server cache');
		cached = {};
		cache = [];
		scan_all(ns, '', ['home']);
		cache.sort(function (a, b) {
			return b.ratio - a.ratio;
		});
		let data = JSON.stringify(cache);
		await ns.write(file, data, 'w');
		ns.print('Total servers cached: ' + cache.length);

		let count = 0;	
		for (let i = 0; i < cache.length; i++) {
			let server = cache[i];
			if (server.host !== 'home' && server.hasRoot) {
				await ns.scp(file, 'home', server.host);
				count++;
			}
		}
		ns.print('Deployed server cache to ' + count + ' systems');
	
		await ns.sleep(30000);
	}
}

/**
 * @param {NS} ns
 * @param {Array} hosts
 */
function scan_all(ns, path, hosts) {
	hosts.forEach(function (hostname) {
		let maxMoney = ns.getServerMaxMoney(hostname);
		let minSecurity = ns.getServerMinSecurityLevel(hostname);
		let requiredHackingLevel = ns.getServerRequiredHackingLevel(hostname);
		let numPortsRequired = ns.getServerNumPortsRequired(hostname);
		let maxRam = ns.getServerMaxRam(hostname);
		let hasRoot = ns.hasRootAccess(hostname);
		let hackSkill = ns.getHackingLevel();

		let hostpath = path + 'connect ' + hostname + '; ';

		cache.push({
			'host': hostname,
			'maxMoney': maxMoney,
			'minSecurity': minSecurity,
			'requiredHackingLevel': requiredHackingLevel,
			'numPortsRequired': numPortsRequired,
			'maxRam': maxRam,
			'hasRoot': hasRoot,
			'ratio': maxMoney / minSecurity,
			'hackingRatio': (requiredHackingLevel - 1) / hackSkill,
			'path': hostpath,
		});
		cached[hostname] = true;

		let toscan = [];
		ns.scan(hostname).forEach(function (newhostname) {
			// Skip already scanned hosts.
			if (cached[newhostname] === true) {
				return;
			}

			toscan.push(newhostname);
		});
		scan_all(ns, hostpath, toscan);
	});
}
