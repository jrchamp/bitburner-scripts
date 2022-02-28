/** @param {NS} ns **/
export async function main(ns) {
	while (true) {
		if (acquirePrograms(ns)) {
			break;
		}
		await ns.sleep(1000);
	}
}

/** @param {NS} ns **/
export function acquirePrograms(ns) {
	const programs = {
		'BruteSSH.exe': 500e3,
		'FTPCrack.exe': 1500e3,
		'relaySMTP.exe': 5e6,
		'HTTPWorm.exe': 30e6,
		'SQLInject.exe': 250e6,
	};

	let player = ns.getPlayer();
	if (!player.tor && ns.purchaseTor()) {
		player.tor = true;
		ns.toast('Purchased Tor router', 'success', 3000);
	}

	let returnValue = true;
	let programKeys = Object.keys(programs);
	for (const programName of programKeys) {
		if (ns.fileExists(programName)) {
			continue;
		} else {
			returnValue = false;
		}

		// Still working on creating a program.
		if (ns.isFocused()) {
			if (player.tor && ns.getServerMoneyAvailable('home') > programs[programName]) {
				ns.stopAction();
			} else {
				continue;
			}
		}

		if (player.tor && ns.purchaseProgram(programName)) {
			ns.toast('Purchased program: ' + programName, 'success', 3000);
		} else {
			ns.createProgram(programName, true);
		}
	}

	return returnValue;
}
