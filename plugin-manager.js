const fs = require("fs");
const utils = require("./utils.js");
const events = require("events");
const request = require("request-promise");
const unzip = require("unzipper");
const semver = require("semver");
const {
	PluginManager
} = require("live-plugin-manager");

const self = module.exports = new events.EventEmitter();

self.plugins = {}
self.loadPlugins = async () => {
	for (let dir of fs.readdirSync("./plugins/")) {
		if (!utils.config.disabledPlugins.includes(dir)) {
			const plugin = JSON.parse(fs.readFileSync(`./plugins/${dir}/plugin.json`));
			utils.log("Loading plugin '%s'", plugin.displayName);
			const pobj = require(`./plugins/${dir}/${plugin.file}`);
			self.plugins[dir] = plugin;
			self.plugins[dir].obj = pobj;
			if (plugin.updates) {
				self.getUpdate(dir);
			}
			const start = (options) => {
				pobj.start(options);
			};
			if (plugin.dependencies) {
				if (plugin.dependencies.npm) {
					const moduleManager = new PluginManager({
						pluginsPath: `./plugins/${dir}/node_modules/`
					});
					let installList = [];
					for (let dependency of plugin.dependencies.npm) {
						if (!fs.existsSync(`./plugins/${dir}/node_modules/`) && !fs.existsSync(`./plugins/${dir}/dependencies/${dependency}/`)) {
							installList.push(dependency);
						}
					}
					if (installList.length > 0) {
						utils.log("Installing dependencies for '%s'.", plugin.displayName);
						for (let dependency of installList) {
							await moduleManager.install(dependency);
						}
					}
				}
			}
			if (!utils.config.plugins[dir]) {
				utils.config.plugins[dir] = plugin.config;
				utils.saveConfig();
			}
			start({
				mineflayer: require("./bot.js").bot,
				mineflayerObj: require("./bot.js").mineflayer,
				utils: utils,
				pluginManager: self,
				config: utils.config.plugins[dir]
			});
		}
	}
}

self.getPlugin = (plugindir) => {
	return self.plugins[plugindir];
};

self.getUpdate = (plugindir) => {
	if (self.plugins.hasOwnProperty(plugindir)) {
		const plugin = self.plugins[plugindir];
		utils.log("Getting updates for '%s'", plugin.displayName);
		let files = [];
		try {
			let update = false;
			request({
					url: plugin.updates,
					method: "GET",
					headers: {
						"User-Agent": `ToogerBot v${utils.package.version} by hpfxd [hpf.fun]`
					}
				})
				.pipe(unzip.Parse())
				.on("entry", (entry) => {
					var fileName = entry.path;
					var type = entry.type;
					if (fileName === "plugin.json" && type === "File") {
						let jsonstr = "";
						entry.on("data", (data) => {
							jsonstr += data.toString("utf8");
						});

						entry.on("end", () => {
							const json = JSON.parse(jsonstr);

							if (semver.valid(json.version)) {
								if (semver.gt(json.version, plugin.version)) {
									update = true;
									fs.writeFileSync(`./plugins/${plugindir}/plugin.json`, jsonstr);
								}
							}
						});
					} else {
						files.push(entry);
					}
				})
				.on("finish", () => {
					if (update) {
						files.forEach((file) => {
							file.pipe(fs.createWriteStream(`./plugins/${plugindir}/${file.path}`));
						});
						utils.log("Updated '%s'", plugin.displayName);
					}
				})
				.on("error", (e) => {
					utils.log("Error getting update for '%s': %s", plugin.displayName, e.message);
					files.forEach((entry) => {
						entry.autodrain();
					});
				});
		} catch (e) {
			utils.log("Error getting update for '%s': %s", plugin.displayName, e.message);
			files.forEach((entry) => {
				entry.autodrain();
			});
		}
	} else {
		throw new Error("Unknown plugin.");
	}
};