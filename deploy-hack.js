import { getServersCacheFilename, getCachedServers, getAllTargets } from 'shared-functions.js';
import { cacheServers } from 'cache-servers.js';

/** @param {NS} ns **/
export async function main(ns) {
	ns.disableLog('disableLog');
	ns.disableLog('getHackingLevel');
	ns.disableLog('getScriptRam');
	ns.disableLog('getServerUsedRam');
	ns.disableLog('exec');
	ns.disableLog('scriptKill');
	ns.disableLog('scp');
	ns.disableLog('sleep');
	ns.disableLog('hackAnalyze');
	ns.disableLog('growthAnalyze');
	ns.disableLog('getWeakenTime');
	ns.disableLog('getGrowTime');
	ns.disableLog('getHackTime');

	let taskScripts = ['task-hack.js', 'task-grow.js', 'task-weaken.js'];
	let supportFiles = [getServersCacheFilename(), 'shared-functions.js'];
	let allFiles = [...supportFiles, ...taskScripts];

	while (true) {
		try {
			await cacheServers(ns);

			let hackSkill = ns.getHackingLevel();
			let servers = await getCachedServers(ns);

			// Root any unrooted servers we can access.
			for (let server of servers) {
				if (server.hasRoot) continue;
				tryRoot(ns, server, hackSkill);
			}

			// Collect worker servers (rooted, not home/pserv-1, have RAM).
			let workers = [];
			for (let server of servers) {
				if (server.host === 'home' || server.host === 'pserv-1') continue;
				if (!server.hasRoot || server.maxRam <= 0) continue;
				workers.push(server);
			}

			if (workers.length === 0) {
				await ns.sleep(15000);
				continue;
			}

			// Copy files to all workers and kill stale task scripts.
			for (let worker of workers) {
				await ns.scp(allFiles, worker.host, 'home');
				for (let script of taskScripts) {
					ns.scriptKill(script, worker.host);
				}
			}

			// Calculate and deploy batches for each target.
			let targets = await getAllTargets(ns);
			let batchesDeployed = 0;
			for (let target of targets) {
				let batch = calculateBatch(ns, target);
				if (!batch) continue;

				let deployed = deployBatch(ns, batch, workers);
				if (deployed) {
					batchesDeployed++;
					ns.print('Batch for ' + target.host + ': ' + batch.weakenThreads + 'w / ' + batch.growThreads + 'g / ' + batch.hackThreads + 'h (~' + Math.round(batch.weakenTime / 1000) + 's)');
				}
			}

			if (batchesDeployed > 0) {
				ns.toast('Deployed ' + batchesDeployed + ' batch(es)', 'info', 5000);
			}

			await ns.sleep(15000);
		} catch (err) {
			ns.print('Error: ' + err);
			await ns.sleep(5000);
		}
	}
}

/**
 * Attempt to root a single server.
 */
function tryRoot(ns, server, hackSkill) {
	let hostname = server.host;
	if (hackSkill < server.requiredHackingLevel) return;
	if (server.numPortsRequired > 5) return;

	if (server.numPortsRequired >= 5 && ns.fileExists('SQLInject.exe', 'home')) {
		ns.sqlinject(hostname);
	}
	if (server.numPortsRequired >= 4 && ns.fileExists('HTTPWorm.exe', 'home')) {
		ns.httpworm(hostname);
	}
	if (server.numPortsRequired >= 3 && ns.fileExists('relaySMTP.exe', 'home')) {
		ns.relaysmtp(hostname);
	}
	if (server.numPortsRequired >= 2 && ns.fileExists('FTPCrack.exe', 'home')) {
		ns.ftpcrack(hostname);
	}
	if (server.numPortsRequired >= 1 && ns.fileExists('BruteSSH.exe', 'home')) {
		ns.brutessh(hostname);
	}

	if (ns.getServerNumPortsRequired(hostname) <= server.numPortsRequired) {
		ns.nuke(hostname);
		ns.toast('Rooted: ' + hostname, 'success', 30000);
	}
}

/**
 * Calculate a coordinated batch for one target.
 *
 * Returns { host, hackThreads, growThreads, weakenThreads, weakenTime, growDelay, hackDelay }
 * or null if the target can't be batched.
 */
function calculateBatch(ns, target) {
	let host = target.host;
	let maxMoney = target.maxMoney;
	let minSecurity = target.minSecurity;

	if (maxMoney <= 0 || minSecurity <= 0) return null;

	// Fraction of money to steal each batch.
	let hackFraction = 0.5;
	let hackPerThread = ns.hackAnalyze(host);
	if (hackPerThread <= 0) return null;

	let hackThreads = Math.ceil(hackFraction / hackPerThread);

	// Clamp so we never try to steal more than the server has.
	let maxHackThreads = Math.floor(1 / hackPerThread);
	if (hackThreads > maxHackThreads) {
		hackThreads = Math.max(1, maxHackThreads);
	}

	// Grow multiplier needed to restore money after the hack.
	let actualFraction = hackThreads * hackPerThread;
	let growthMultiplier = 1 / (1 - actualFraction);
	let growThreads = Math.ceil(ns.growthAnalyze(host, growthMultiplier));

	// Weaken threads to offset the security from hack + grow.
	let hackSecurity = hackThreads * 0.002;
	let growSecurity = growThreads * 0.004;
	let weakenThreads = Math.ceil((hackSecurity + growSecurity) / 0.05);

	if (hackThreads < 1 || growThreads < 1 || weakenThreads < 1) return null;

	let weakenTime = ns.getWeakenTime(host);
	let growTime = ns.getGrowTime(host);
	let hackTime = ns.getHackTime(host);

	// All operations finish at weakenTime from batch start.
	// weaken starts immediately, grow and hack are delayed so they align.
	let safetyMargin = 50;
	let growDelay = Math.max(0, weakenTime - growTime - safetyMargin);
	let hackDelay = Math.max(0, weakenTime - hackTime - safetyMargin);

	return {
		host,
		hackThreads,
		growThreads,
		weakenThreads,
		weakenTime,
		growDelay,
		hackDelay,
	};
}

/**
 * Deploy a batch's threads across available worker servers.
 * Returns true if all threads were deployed.
 */
function deployBatch(ns, batch, workers) {
	let { host, hackThreads, growThreads, weakenThreads, growDelay, hackDelay } = batch;

	let remainW = weakenThreads;
	let remainG = growThreads;
	let remainH = hackThreads;

	let ramW = ns.getScriptRam('task-weaken.js');
	let ramG = ns.getScriptRam('task-grow.js');
	let ramH = ns.getScriptRam('task-hack.js');

	for (let worker of workers) {
		let avail = worker.maxRam - ns.getServerUsedRam(worker.host);

		if (remainW > 0 && avail >= ramW) {
			let threads = Math.min(remainW, Math.floor(avail / ramW));
			ns.exec('task-weaken.js', worker.host, threads, host, 0);
			remainW -= threads;
			avail -= threads * ramW;
		}

		if (remainG > 0 && avail >= ramG) {
			let threads = Math.min(remainG, Math.floor(avail / ramG));
			ns.exec('task-grow.js', worker.host, threads, host, growDelay);
			remainG -= threads;
			avail -= threads * ramG;
		}

		if (remainH > 0 && avail >= ramH) {
			let threads = Math.min(remainH, Math.floor(avail / ramH));
			ns.exec('task-hack.js', worker.host, threads, host, hackDelay);
			remainH -= threads;
			avail -= threads * ramH;
		}
	}

	return remainW <= 0 && remainG <= 0 && remainH <= 0;
}
