const utils = require("./utils.js");
const mineflayer = require("mineflayer");
const pluginManager = require("./plugin-manager.js");

const botOptions = {
	host: utils.config.server.host,
	port: utils.config.server.port,
	version: utils.config.version
};

if (utils.data.session) {
	utils.log("Using cached session.");
	botOptions.session = utils.data.session;
} else {
	utils.log("Creating new session.");
	botOptions.username = utils.config.account.email;
	botOptions.password = utils.config.account.password;
}
module.exports.mineflayer = mineflayer;
const bot = module.exports.bot = mineflayer.createBot(botOptions);
if (utils.config.server.command && utils.config.server.command !== "") {
	s();
} else {
	utils.log("Loading plugins...");
	pluginManager.loadPlugins().then(s);
}

function s() {
	utils.log("Starting bot...");
	bot.once("spawn", () => {
		if (utils.config.server.command && utils.config.server.command !== "") {
			bot.chat(utils.config.server.command);
			utils.log("Loading plugins...");
			pluginManager.loadPlugins();
		}
	});
	bot.on("message", (msg) => {
		console.log(msg.toAnsi());
	});

	bot._client.once("session", () => {
		utils.data.session = bot._client.session;
		utils.saveData();
	});

	bot.on("error", (err) => {
		utils.log(err);
	});
}