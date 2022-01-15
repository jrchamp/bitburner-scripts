/** @param {NS} ns **/
export async function main(ns) {
	ns.disableLog("disableLog");
	ns.disableLog("getServerRequiredHackingLevel");
	ns.disableLog("getHackingLevel");
	ns.disableLog("getServerNumPortsRequired");
	ns.disableLog("getScriptRam");
	ns.disableLog("getServerMaxRam");
	ns.disableLog("getServerUsedRam");
	ns.disableLog("exec");
	ns.disableLog("kill");
	ns.disableLog("scp");
	ns.disableLog("sleep");

	let script = "workflow-hack.js";
	let serversList = "servers.txt";
	let files = [
		script,
		serversList,
	];

	let backdoorTargets = {
		"CSEC": true,
		"avmnite-02h": true,
		"I.I.I.I": true,
		"run4theh111z": true,
		".": true,
		"The-Cave": true,
	};

	let tohack = [];
	do {
		let data = await ns.read(serversList);
		let servers = JSON.parse(data);
		tohack = [];
		for (let i = 0; i < servers.length; i++) {
			let server = servers[i];
			let hostname = server.host;

			if (!server.hasRoot) {
				// Double check it for next time.
				tohack.push(server);

				let hack_required = server.requiredHackingLevel;
				let hack_skill = ns.getHackingLevel();
				let serverStatus = hostname + " - " + hack_skill + "/" + hack_required + ": " + (Math.floor(10000 * hack_skill / hack_required) / 100) + "%";
				if (hack_skill < hack_required) {
					ns.print("Waiting to attack: " + serverStatus);
					continue;
				}
				ns.print("Attacking: " + serverStatus);

				let ports_required = server.numPortsRequired;

				if (ports_required >= 6) {
					ns.print("Unknown port required for: " + hostname + "; requires " + ports_required);
					continue;
				}

				if (ports_required >= 5) {
					// When possible, open the SQL port on the target server.
					if (!ns.fileExists("SQLInject.exe", "home")) {
						ns.print("SQL required for: " + hostname);
						continue;
					}
					ns.sqlinject(hostname);
				}

				if (ports_required >= 4) {
					// When possible, open the HTTP port on the target server.
					if (!ns.fileExists("HTTPWorm.exe", "home")) {
						ns.print("HTTP required for: " + hostname);
						continue;
					}
					ns.httpworm(hostname);
				}

				if (ports_required >= 3) {
					// When possible, open the SMTP port on the target server.
					if (!ns.fileExists("relaySMTP.exe", "home")) {
						ns.print("SMTP required for: " + hostname);
						continue;
					}
					ns.relaysmtp(hostname);
				}

				if (ports_required >= 2) {
					// When possible, open the FTP port on the target server.
					if (!ns.fileExists("FTPCrack.exe", "home")) {
						ns.print("FTP required for: " + hostname);
						continue;
					}
					ns.ftpcrack(hostname);
				}

				if (ports_required >= 1) {
					// When possible, open the SSH port on the target server.
					if (!ns.fileExists("BruteSSH.exe", "home")) {
						ns.print("SSH required for: " + hostname);
						continue;
					}
					ns.brutessh(hostname);
				}

				// Get root access to target server.
				ns.nuke(hostname);

				/* Requires Source Code 4.1
				if (backdoorTargets[hostname] === true) {
					await ns.installBackdoor(hostname);
				}
				*/

				ns.toast("Rooted: " + hostname, "success", 30000);
			}

			let script_ram = ns.getScriptRam(script);
			let available_ram = server.maxRam - ns.getServerUsedRam(hostname);
			if (available_ram >= script_ram) {
				// Copy the attack script and supporting files.
				if (hostname !== "home") {
					ns.print("Copying attack files to " + hostname);
					await ns.scp(files, "home", hostname);
				}

				// Stop any currently running version of the process.
				ns.kill(script, hostname);

				// Determine the number of threads to run.
				available_ram = server.maxRam - ns.getServerUsedRam(hostname);
				let threads = Math.floor(available_ram / script_ram);
				ns.exec(script, hostname, threads);
			}
		}
		ns.print("Remaining targets: " + tohack.length);
		await ns.sleep(30000);
	} while (tohack.length > 0);
}