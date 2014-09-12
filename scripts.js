/* Meteor Falls v0.10 Scripts.
    By: [VP]Blade, TheUnknownOne, Ethan
    Credit to: Max, Lutra
*/

Config = {
    // Configuration for the script.
    servername: "Based Gods",

    maintainers: ['[BG]Heark', '[BG]OORA'],

    // Repo to load plugins from.
    repourl: "http://meteor-falls.github.io/Scripts/",
    // Repo to load data (announcement/description + tiers) from.
    dataurl: "https://raw.githubusercontent.com/meteor-falls/Server-Shit/master/",
    emotesurl: 'http://meteor-falls.github.io/Emotes/emotes.json',

    // Plugin directory.
    plugindir: "plugins/",
    datadir: "data/",

    // Do not touch unless you are adding a new plugin.
    // Plugins to load on script load.
    // mathjs is loaded dynamically.
    plugins: ['bot', 'reg', 'utils', 'rtd', 'channeldata', 'emotes', 'lists', 'init', 'feedmon', 'tours', 'commands', 'events'],
    data: ['emoji'],

    // Whether or not to load plugins from repourl. If set to false, they will load locally.
    load_from_web: true,
    // If HTML should be stripped from channel messages outputted onto the server window.
    stripHtmlFromChannelMessages: true,
    // If emotes are enabled.
    emotesEnabled: true,
    // Character limit in messages.
    characterLimit: 600
};

(function() {
    var dir = Config.plugindir,
        datadir = Config.datadir;
    sys.makeDir(dir);
    sys.makeDir(datadir);

    require = function require(name, webcall, noCache) {
        if ((name in require.cache) && !webcall && !noCache) {
            return require.cache[name];
        }

        var fileContent,
            resp;

        if (webcall) {
            resp = sys.synchronousWebCall(Config.repourl + "plugins/" + name);
            sys.writeToFile(dir + name, resp);
        }

        if (!sys.fileExists(dir + name)) {
            throw {name: "NoFileError", toString: function () { return "Couldn't find file " + (dir + name) + "."; }};
        }

        fileContent = sys.getFileContent(dir + name);

        var module = {
            exports: {},
            reload: function () { return false; },
            name: name
        };
        var exports = module.exports;

        try {
            sys.eval(fileContent, dir + name);
        } catch (e) {
            sys.sendAll("Error loading module " + name + ": " + e + " on line " + e.lineNumber);
            print(e.backtracetext);
            throw e;
        }

        print("Loaded module " + name);

        require.cache[name] = module.exports;
        require.meta[name] = module;
        return module.exports;
    };

    require.reload = function require_reload(name) {
        require(name, false, false);
        return require.meta[name].reload();
    };

    if (typeof require.cache === 'undefined' || (typeof FULLRELOAD === 'boolean' && FULLRELOAD === true)) {
        require.cache = {};
        require.meta  = {};
    }

    FULLRELOAD = false;

    require.callPlugins = function require_callPlugins(event) {
        var args = Array.prototype.slice.call(arguments, 1);
        var plugins = this.meta,
            plugin,
            exports;

        for (plugin in plugins) {
            exports = plugins[plugin].exports;
            if (event in exports) {
                try {
                    exports[event].apply(exports, args);
                } catch (e) {
                    print("Plugin error (" + plugins[plugin].name + ") on line " + e.lineNumber + ": " + e);
                    print(e.backtracetext);
                }
            }
        }
    };

    var plugin, data, resp, i;

    for (i = 0; i < Config.plugins.length; i += 1) {
        plugin = Config.plugins[i] + ".js";
        require(plugin, Config.load_from_web);
    }
    for (i = 0; i < Config.data.length; i += 1) {
        data = Config.data[i] + ".json";

        if (!sys.fileExists(datadir + data)) {
            resp = sys.synchronousWebCall(Config.repourl + "data/" + data);
            sys.writeToFile(datadir + data, resp);
        }
    }
}());

var ignoreNextChanMsg = false;

function poUser(id) {
    var ip = sys.ip(id);

    this.id = id;
    this.ip = ip;
    this.floodCount = 0;
    this.teamChanges = 0;
    this.caps = 0;
    this.muted = false;
    this.semuted = false;

    this.originalName = sys.name(id);
    this.loginTime = +sys.time();

    // This is an array so we can track multiple emotes in their last message.
    this.lastEmote = [];
}

function poChannel(chanId) {
    this.id   = chanId;
    this.name = sys.channel(chanId);

    this.creator = '';
    this.topic   = '';
    this.setBy   = '';

    this.members = {};
    this.auth    = {};
    this.mutes   = {};
    this.bans    = {};

    this.bots     = true;
    this.isPublic = true;
}

try {
    ChannelManager = require('channeldata.js').manager;
} catch (ex) {
    ChannelManager = {};
    sys.sendAll("Couldn't load ChannelManager: " + ex);
}

SESSION.identifyScriptAs("Meteor Falls Script v0.10.1");
SESSION.registerUserFactory(poUser);
SESSION.registerChannelFactory(poChannel);
SESSION.refill();

var poScript;
poScript = ({
    serverStartUp: function serverStartUp() {
        startUpTime = +sys.time();
        script.init();
    },
    init: function init() {
        require.reload('utils.js');

        require.reload('reg.js');
        require.reload('bot.js');

        require.reload('rtd.js');

        require.reload('feedmon.js');
        require.reload('tours.js');

        require.reload('init.js');

        require.reload('emotes.js');
        // lists.js reloaded by emotes.js
        //require.reload('lists.js');

        //MathJS = require('mathjs.js');
        sys.resetProfiling();
    },
    warning: function warning(func, message, backtrace) {
        require.callPlugins("warning", func, message, backtrace);
    },
    beforeNewMessage: function beforeNewMessage(message) {
        require.callPlugins("beforeNewMessage", message);
    },

    afterNewMessage: function afterNewMessage(message) {
        require.callPlugins("afterNewMessage", message);
    },

    beforeServerMessage: function (message) {
        require.callPlugins("beforeServerMessage", message);
    },

    beforeChannelJoin: function beforeChannelJoin(src, channel) {
        require.callPlugins("beforeChannelJoin", src, channel);
    },

    beforeChannelDestroyed: function beforeChannelDestroyed(channel) {
        require.callPlugins("beforeChannelDestroyed", channel);
    },

    afterChannelCreated: function afterChannelCreated(chan, name, src) {
        require.callPlugins("afterChannelCreated", chan, name, src);
    },

    afterChannelJoin: function afterChannelJoin(src, chan) {
        require.callPlugins("afterChannelJoin", src, chan);
    },

    beforeLogIn: function beforeLogIn(src) {
        require.callPlugins("beforeLogIn", src);
    },
    afterLogIn: function afterLogIn(src, defaultChan) {
        require.callPlugins("afterLogIn", src, defaultChan);
    },
    beforeChangeTier: function(src, team, oldtier, newtier) {
        require.callPlugins("beforeChangeTier", src, team, oldtier, newtier);
    },

    beforeChangeTeam: function beforeChangeTeam(src) {
        require.callPlugins("beforeChangeTeam", src);
    },

    beforeChatMessage: function beforeChatMessage(src, message, chan) {
        require.callPlugins("beforeChatMessage", src, message, chan);
    },

    beforeLogOut: function beforeLogOut(src) {
        require.callPlugins("beforeLogOut", src);
    },

    afterChangeTeam: function afterChangeTeam(src) {
        require.callPlugins("afterChangeTeam", src);
    },

    beforePlayerKick: function beforePlayerKick(src, bpl) {
        require.callPlugins("beforePlayerKick", src, bpl);
    },

    beforePlayerBan: function beforePlayerBan(src, bpl, time) {
        require.callPlugins("beforePlayerBan", src, bpl, time);
    },

    beforeChallengeIssued: function beforeChallengeIssued(src, dest) {
        require.callPlugins("beforeChallengeIssued", src, dest);
    },

    /*afterPlayerAway: function afterPlayerAway(src, mode) {
    },*/

    beforeBattleMatchup: function beforeBattleMatchup(src, dest, clauses, rated, mode, team1, team2) {
        require.callPlugins("beforeBattleMatchup", src, dest, clauses, rated, mode, team1, team2);
    },

    afterBattleStarted: function afterBattleStarted(src, dest, info, id, t1, t2) {
        require.callPlugins("afterBattleStarted", src, dest, info, id, t1, t2);
    },

    afterBattleEnded: function afterBattleEnded(src, dest, desc) {
        require.callPlugins("afterBattleEnded", src, dest, desc);
    },

    afterChatMessage: function afterChatMessage(src, message, chan) {
        require.callPlugins("afterChatMessage", src, message, chan);
    },

    beforePlayerRegister: function (src) {
        Utils.watch.notify(Utils.nameIp(src) + " registered.");
    },

    battleConnectionLost: function() {
        Utils.watch.notify("Connection to the battle server has been lost.");
    }
});
