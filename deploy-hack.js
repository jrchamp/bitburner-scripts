import { getCachedServers, getAllTargets } from 'shared-functions.js';
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
	let supportFiles = ['shared-functions.js'];
	let allFiles = [...supportFiles, ...taskScripts];

	let startupGuideShown = false;
	let programsWarned = false;

	while (true) {
		try {
			await cacheServers(ns);

			// One-time startup guidance.
			if (!startupGuideShown) {
				startupGuideShown = true;
				ns.toast('Batcher is running! Next steps: buy port programs (BruteSSH.exe, FTPCrack.exe) from terminal. Track targets with "run status-targets.js". Backdoor faction servers with "run backdoor-install.js". Buy augs from your factions to grow stronger.', 'info', 30000);
			}

			let hackSkill = ns.getHackingLevel();
			let servers = await getCachedServers(ns);

			// Fix any stale hasRoot values in the cache so we don't miss workers/targets.
			for (let server of servers) {
				if (!server.hasRoot && ns.hasRootAccess(server.host)) {
					server.hasRoot = true;
				}
			}

			// Root any unrooted servers we can access.
			for (let server of servers) {
				if (server.hasRoot) continue;
				tryRoot(ns, server, hackSkill);
			}

			// Warn about missing port programs once per session.
			if (!programsWarned) {
				let names = ['BruteSSH.exe', 'FTPCrack.exe', 'relaySMTP.exe', 'HTTPWorm.exe', 'SQLInject.exe'];
				let maxPortsNeeded = 0;
				for (let server of servers) {
					if (!server.hasRoot && server.maxMoney > 0 && server.hackingRatio <= 0.80 && server.numPortsRequired > maxPortsNeeded) {
						maxPortsNeeded = server.numPortsRequired;
					}
				}
				if (maxPortsNeeded > 0) {
					let portsOwned = names.filter(n => ns.fileExists(n, 'home')).length;
					if (portsOwned < maxPortsNeeded) {
						programsWarned = true;
						let next = names[portsOwned];
						let hint;
						if (servers.some(s => s.host === 'darkweb')) {
							hint = 'Type "buy ' + next + '" in terminal.';
						} else {
							hint = 'Buy TOR router from the city (200k) to access the darkweb, then type "buy ' + next + '". Or create from the Create Program tab.';
						}
						ns.toast('Need ' + next + ' to root more servers. ' + hint, 'info', 20000);
					}
				}
			}

			// Collect worker servers (rooted with RAM), sorted by RAM descending.
			let workers = [];
			for (let server of servers) {
				if (!server.hasRoot || server.maxRam <= 0) continue;
				workers.push(server);
			}
			workers.sort((a, b) => b.maxRam - a.maxRam);

			if (workers.length === 0) {
				if (servers.length > 0) {
					ns.toast('No rooted servers with RAM available. Buy port programs and purchase servers to get started.', 'info', 10000);
				}
				await ns.sleep(10000);
				continue;
			}

			// Copy files to all workers.
			for (let worker of workers) {
				await ns.scp(allFiles, worker.host, 'home');
			}

			// Deploy one batch per target, each getting whatever RAM is left.
			let targets = await getAllTargets(ns);
			let ramW = ns.getScriptRam('task-weaken.js');
			let batchesDeployed = 0;
			let longestWeaken = 0;

			for (let target of targets) {
				let availBudget = 0;
				for (let worker of workers) {
					availBudget += Math.floor((worker.maxRam - ns.getServerUsedRam(worker.host)) / ramW);
				}
				if (availBudget <= 0) break;

				let batch = calculateBatch(ns, target, availBudget);
				if (!batch) continue;

				let deployed = deployBatch(ns, batch, workers);
				if (deployed) {
					batchesDeployed++;
					if (batch.weakenTime > longestWeaken) longestWeaken = batch.weakenTime;
					ns.print('Batch for ' + target.host + ': ' + batch.weakenThreads + 'w / ' + batch.growThreads + 'g / ' + batch.hackThreads + 'h (~' + Math.round(batch.weakenTime / 1000) + 's)');
				}
			}

			if (batchesDeployed > 0) {
				ns.toast('Deployed ' + batchesDeployed + ' batch(es)', 'info', 5000);
			}

			await ns.sleep(Math.min(Math.max(longestWeaken + 1000, 5000), 10000));
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

	let opened = 0;

	if (server.numPortsRequired >= 1 && ns.fileExists('BruteSSH.exe', 'home')) {
		if (ns.brutessh(hostname)) opened++;
	}
	if (server.numPortsRequired >= 2 && ns.fileExists('FTPCrack.exe', 'home')) {
		if (ns.ftpcrack(hostname)) opened++;
	}
	if (server.numPortsRequired >= 3 && ns.fileExists('relaySMTP.exe', 'home')) {
		if (ns.relaysmtp(hostname)) opened++;
	}
	if (server.numPortsRequired >= 4 && ns.fileExists('HTTPWorm.exe', 'home')) {
		if (ns.httpworm(hostname)) opened++;
	}
	if (server.numPortsRequired >= 5 && ns.fileExists('SQLInject.exe', 'home')) {
		if (ns.sqlinject(hostname)) opened++;
	}

	if (opened >= server.numPortsRequired) {
		ns.nuke(hostname);
		if (ns.hasRootAccess(hostname)) {
			ns.toast('Rooted: ' + hostname, 'success', 30000);
		}
	}
}

/**
 * Calculate a coordinated batch for one target that fits within a thread budget.
 *
 * Tries hack fractions from 75% down to 0.1% until the total threads fit.
 * Returns { host, hackThreads, growThreads, weakenThreads, weakenTime, growDelay, hackDelay }
 * or null if the target can't be batched.
 */
function calculateBatch(ns, target, threadBudget) {
	let host = target.host;
	let maxMoney = target.maxMoney;
	let minSecurity = target.minSecurity;

	if (maxMoney <= 0 || minSecurity <= 0) return null;

	let hackPerThread = ns.hackAnalyze(host);
	if (hackPerThread <= 0) return null;

	let maxHackThreads = Math.floor(1 / hackPerThread);

	for (let hackFraction = 0.75; hackFraction >= 0.001; hackFraction /= 2) {
		let hackThreads = Math.max(1, Math.ceil(hackFraction / hackPerThread));
		if (hackThreads > maxHackThreads) {
			hackThreads = Math.max(1, maxHackThreads);
		}

		let actualFraction = hackThreads * hackPerThread;
		let growthMultiplier = 1 / (1 - actualFraction);
		let growThreads = Math.max(1, Math.ceil(ns.growthAnalyze(host, growthMultiplier)));

		let hackSecurity = hackThreads * 0.002;
		let growSecurity = growThreads * 0.004;
		let weakenThreads = Math.max(1, Math.ceil((hackSecurity + growSecurity) / 0.05));

		let total = hackThreads + growThreads + weakenThreads;
		if (total <= threadBudget) {
			let weakenTime = ns.getWeakenTime(host);
			let growTime = ns.getGrowTime(host);
			let hackTime = ns.getHackTime(host);

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
	}

	return null;
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
