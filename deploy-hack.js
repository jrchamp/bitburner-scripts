import { getServersCacheFilename, getCachedServers, getTargetLimit } from 'shared-functions.js';
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

	let tasks = {
		'all': 'workflow-hack.js',
		'share': 'task-share.js',
		'grow': 'task-grow.js',
		'weaken': 'task-weaken.js',
		'hack': 'task-hack.js',
	};
	// Order matters! Each task uses this percentage of remaining RAM.
	let taskRatios = {
		'all': 0,
		'share': 0,
		'grow': 11 / 16,
		'weaken': 4 / 5,
		'hack': 1,
	};
	let taskMaxThreads = {
		'all': 28000,
		'share': 1e9,
		'grow': 28000,
		'weaken': 1700,
		'hack': 1800,
	};
	let files = [
		getServersCacheFilename(ns),
		'shared-functions.js',
	];
	for (const taskType in tasks) {
		files.push(tasks[taskType]);
	}

	while (true) {
		// Caching the servers as part of this script saves 2.25 GB.
		await cacheServers(ns);

		let hack_skill = ns.getHackingLevel();
		let servers = await getCachedServers(ns);
		let tohack = [];
		for (let i = 0; i < servers.length; i++) {
			let server = servers[i];
			let hostname = server.host;

			if (!server.hasRoot) {
				// Double check it for next time.
				tohack.push(server);

				let hack_required = server.requiredHackingLevel;
				let serverStatus = hostname + ' - ' + hack_skill + '/' + hack_required + ': ' + (Math.floor(10000 * hack_skill / hack_required) / 100) + '%';
				if (hack_skill < hack_required) {
					ns.print('Waiting to attack: ' + serverStatus);
					continue;
				}
				ns.print('Attacking: ' + serverStatus);

				let ports_required = server.numPortsRequired;

				if (ports_required >= 6) {
					ns.print('Unknown port required for: ' + hostname + '; requires ' + ports_required);
					continue;
				}

				if (ports_required >= 5) {
					// When possible, open the SQL port on the target server.
					if (!ns.fileExists('SQLInject.exe', 'home')) {
						ns.print('SQL required for: ' + hostname);
						continue;
					}
					ns.sqlinject(hostname);
				}

				if (ports_required >= 4) {
					// When possible, open the HTTP port on the target server.
					if (!ns.fileExists('HTTPWorm.exe', 'home')) {
						ns.print('HTTP required for: ' + hostname);
						continue;
					}
					ns.httpworm(hostname);
				}

				if (ports_required >= 3) {
					// When possible, open the SMTP port on the target server.
					if (!ns.fileExists('relaySMTP.exe', 'home')) {
						ns.print('SMTP required for: ' + hostname);
						continue;
					}
					ns.relaysmtp(hostname);
				}

				if (ports_required >= 2) {
					// When possible, open the FTP port on the target server.
					if (!ns.fileExists('FTPCrack.exe', 'home')) {
						ns.print('FTP required for: ' + hostname);
						continue;
					}
					ns.ftpcrack(hostname);
				}

				if (ports_required >= 1) {
					// When possible, open the SSH port on the target server.
					if (!ns.fileExists('BruteSSH.exe', 'home')) {
						ns.print('SSH required for: ' + hostname);
						continue;
					}
					ns.brutessh(hostname);
				}

				// Get root access to target server.
				ns.nuke(hostname);

				ns.toast('Rooted: ' + hostname, 'success', 30000);
			}

			let taskType = 'all';
			let script = tasks[taskType];
			let scriptRam = ns.getScriptRam(script);

			let availableRam = server.maxRam - ns.getServerUsedRam(hostname);
			if (availableRam >= scriptRam) {
				// Copy the attack script and supporting files.
				if (hostname !== 'home') {
					ns.print('Copying attack files to ' + hostname);
					await ns.scp(files, 'home', hostname);
				}

				for (const taskType in tasks) {
					script = tasks[taskType];

					// Stop any currently running version of the processes.
					ns.scriptKill(script, hostname);
				}

				let taskStats = {};
				for (const taskType in tasks) {
					// Determine the amount of available RAM (minus a safety buffer).
					availableRam = server.maxRam - ns.getServerUsedRam(hostname) - 0.05;

					script = tasks[taskType];
					scriptRam = ns.getScriptRam(script);

					// Determine the number of threads to run of each process.
					let totalThreads = Math.floor(taskRatios[taskType] * availableRam / scriptRam);

					if (totalThreads > 0) {
						taskStats[taskType] = totalThreads;

						if (totalThreads < 100 || taskType === 'share') {
							// Use all the threads with random target selection.
							ns.exec(script, hostname, totalThreads);
						} else {
							// Split the threads into buckets with fixed target selection.
							let numTargets = getTargetLimit();
							let maxThreads = Math.min(Math.ceil(totalThreads / numTargets), taskMaxThreads[taskType]);
							let remainingThreads = totalThreads;
							for (let offset = 0; remainingThreads > 0; offset++) {
								let processThreads = Math.min(maxThreads, remainingThreads);
								ns.exec(script, hostname, processThreads, offset);
								remainingThreads -= processThreads;
							}
						}
					}
				}
				ns.toast('Task distribution for ' + hostname + ' - ' + JSON.stringify(taskStats), 'info', 30000);
			}
		}
		ns.print('Remaining targets: ' + tohack.length);
		await ns.sleep(15000);
	}
}
