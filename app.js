const utils = require("./utils.js");
utils.log("Loading data...");
utils.loadData();
utils.log("Loading libraries...");
const pluginManager = require("./plugin-manager.js");
const fs = require("fs");
utils.log("Loading config...");
if (!fs.existsSync("./config/config.json")) {
	utils.log("Could not find the configuration file... Exiting.");
	process.exit(1);
}
utils.log("Parsing config...");
try {
	utils.config = JSON.parse(fs.readFileSync("./config/config.json"));
} catch (err) {
	utils.log("Could not parse the configuration file. %s", err.message);
	process.exit(1);
}
utils.log("Config loaded, starting ToogerBot.");
require("./bot.js");

process.on("uncaughtException", (err) => {
	utils.log("Error: %s", err.stack);
});