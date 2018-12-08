const zlib = require("zlib");
const fs = require("fs");
const dns = require("dns");

const self = module.exports = {
	log: (msg, ...args) => {
		const text = `${self.ansi.blue}[ToogerBot] ${self.ansi.white}${msg}`;
		if (args.length > 0) console.log(text, args);
		else console.log(text);
	},
	config: null,
	saveConfig: () => {
		fs.writeFileSync("./config/config.json", JSON.stringify(self.config, null, "	"));
	},
	ansi: {
		black: "\x1b[30m",
		red: "\x1b[31m",
		green: "\x1b[32m",
		yellow: "\x1b[33m",
		blue: "\x1b[34m",
		magenta: "\x1b[35m",
		cyan: "\x1b[36m",
		white: "\x1b[37m"
	},
	data: {},
	saveData: () => {
		fs.writeFileSync("data.dat", zlib.deflateSync(JSON.stringify(self.data)));
	},
	loadData: () => {
		if (!fs.existsSync("data.dat")) {
			self.saveData();
		}
		self.data = JSON.parse(zlib.inflateSync(fs.readFileSync("data.dat")).toString());
	},
	resolveServer: (host) => {
		return new Promise((resolve, reject) => {
			dns.resolveSrv(`_minecraft._tcp.${host}`, (err, addresses) => {
				if (!err && addresses.length > 0) {
					resolve(addresses[0].name, addresses[0].port);
				} else {
					resolve();
				}
			});
		});
	},
	package: require("./package.json")
};