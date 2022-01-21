/**
 * The name of the server cache file.
 *
 * @return {string}
 */
export function getServersCacheFilename() {
	return 'servers.txt';
}

/**
 * Read the list of all servers.
 *
 * @param {NS} ns
 * @return {Array}
 */
export async function getCachedServers(ns) {
	let file = getServersCacheFilename(ns);
	let data = await ns.read(file);
	return JSON.parse(data);
}

/**
 * The full set of targets that are being attacked.
 *
 * @param {NS} ns
 * @param {number=} targetLimit Defaults to 10 targets max.
 * @return {Array}
 */
export async function getAllTargets(ns, targetLimit = 10) {
	let servers = await getCachedServers(ns);

	let targets = [];
	servers.forEach(function (server) {
		// Efficiency: Make sure server's required hacking is less than 80% of the player skill.
		if (server.hackingRatio > 0.80) {
			return;
		}

		// Must be rooted.
		if (!server.hasRoot) {
			return;
		}

		// Make sure it is a valid target.
		if (server.maxMoney > 0 && server.minSecurity > 0) {
			targets.push(server);
		}
	});

	// Limit to a given number of targets.
	targets = targets.slice(0, targetLimit);

	return targets;
}

/**
 * Get a target to attack.
 *
 * @param {NS} ns
 * @param {string} taskType
 * @param {number=} offset
 * @return {Object}
 */
export async function getTarget(ns, taskType, offset = undefined) {
	let targets = await getAllTargets(ns);
	let numTargets = targets.length;

	if (numTargets === 0) {
		return undefined;
	}

	if (offset === undefined) {
		// Randomize target selection to balance the load.
		offset = Math.floor(Math.random() * numTargets);
	} else {
		// Use pre-defined offsets to - hopefully - balance target selection in a stable way.
		offset = offset % numTargets;
	}

	return targets[offset];
}

/**
 * Delay initial task start so they don't all start at the same time.
 *
 * @param {NS} ns
 * @param {string} taskType
 * @param {number=} offset
 */
export async function delayTask(ns, taskType, offset = undefined) {
	let delayCycles = 75 * Math.floor(Math.random() * 60);
	if (offset !== undefined) {
		delayCycles += offset;
	}
	await ns.sleep(200 * delayCycles);
}
