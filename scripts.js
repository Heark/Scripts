/* Meteor Falls v0.9 Scripts.
    By: [VP]Blade, TheUnknownOne, Ethan
    Credit to: Max, Lutra
*/

var Config = {
    // Configuration for the script.
    maintainers: ['[VP]Blade', 'Ethan', 'TheUnknownOne'],

    // Repo to load plugins from.
    repourl: "https://raw.github.com/meteor-falls/Scripts/master/plugins/",
    // Repo to load data (announcement/description + tiers) from.
    dataurl: "https://raw.github.com/meteor-falls/Server-Shit/master/",

    // Plugin directory.
    plugindir: "plugins/",

    // Do not touch unless you are adding a new plugin.
    // Plugins to load on script load.
    // mathjs is loaded dynamically.
    plugins: ['bot', 'reg', 'utils', 'emotes', 'lists', 'init', 'commands', 'feedmon', 'events'],

    // Whether or not to load plugins from repourl. If set to false, they will load locally.
    load_from_web: true,
    // If HTML should be stripped from channel messages outputted onto the server window.
    stripHtmlFromChannelMessages: true,
    // If emotes are enabled.
    emotesEnabled: true
};

(function() {
    var dir = Config.plugindir;
    sys.makeDir(dir);

    require = function require(name, webcall, noCache) {
        if ((name in require.cache) && !webcall && (require.meta[name] ? (!require.meta[name].preferCache && !noCache) : !noCache)) {
            return require.cache[name];
        }

        var fileContent,
            resp;

        if (webcall) {
            resp = sys.synchronousWebCall(Config.repourl + name);
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

    var plugin,
        i;

    for (i = 0; i < Config.plugins.length; i += 1) {
        plugin = Config.plugins[i] + ".js";
        require(plugin, Config.load_from_web);
    }
}());

var ignoreNextChanMsg = false;

function poUser(id) {
    var ip = sys.ip(id);

    this.id = id;
    this.ip = ip;
    this.floodCount = 0;
    this.caps = 0;
    this.muted = false;

    this.originalName = sys.name(id);
    this.megauser = false;

    // This is an array so we can track multiple emotes in their last message.
    this.lastEmote = [];
}

function poChannel(chanId) {
    this.id = chanId;
    this.name = sys.channel(chanId);

    this.bots = true;
}

SESSION.identifyScriptAs("Meteor Falls Script v0.9");
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
        require.reload('feedmon.js');

        require.reload('init.js');

        require.reload('emotes.js');
        require.reload('lists.js');

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

    megauserCheck: function megauserCheck(src) {
        SESSION.users(src).megauser = MegaUsers.hasOwnProperty(sys.name(src).toLowerCase());
    },

    /*afterChannelCreated: function afterChannelCreated(chan, name, src) {
    },*/

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

    tourSpots: function tourSpots() {
        return tournumber - tourmembers.length;
    },

    roundPairing: function roundPairing() {
        roundnumber += 1;
        battlesStarted = [];
        tourbattlers = [];
        battlesLost = [];
        if (tourmembers.length === 1) {
            sys.sendHtmlAll("<br/><center><table width=50% bgcolor=black><tr style='background-image:url(Themes/Classic/battle_fields/new/hH3MF.jpg)'><td align=center><br/><font style='font-size:20px; font-weight:bold;'><font style='font-size:25px;'>C</font>ongratulations, <i style='color:red; font-weight:bold;'>" + Utils.escapeHtml(tourplayers[tourmembers[0]]) + "!</i></font><hr width=300/><br><b>You won the tournament! You win " + prize + "!</b><br/><br/></td></tr></table></center><br/>", 0);
            tourmode = 0;
            isFinals = false;
            return;
        }
        var str;
        var finals = tourmembers.length === 2;
        if (!finals) {
            str = "<br/><center><table width=50% bgcolor=black><tr style='background-image:url(Themes/Classic/battle_fields/new/hH3MF.jpg)'><td align=center><br/><font style='font-size:20px; font-weight:bold;'>Round <i>" + roundnumber + "</i> of <i style='color:red; font-weight:bold;'>" + tourtier + "</i> tournament!</font><hr width=300/><i>Current Matchups</i><br/><b>";
        } else {
            isFinals = true;
            str = "<br/><center><table width=50% bgcolor=black><tr style='background-image:url(Themes/Classic/battle_fields/new/hH3MF.jpg)'><td align=center><br/><font style='font-size:20px; font-weight:bold;'><font style='font-size:25px;'>F</font>inals of <i style='color:red; font-weight:bold;'>" + tourtier + "</i> tournament!</font><hr width=300/><i>Matchup</i><br/><b>";
        }
        var i = 0;
        while (tourmembers.length >= 2) {
            i += 1;
            var x1 = sys.rand(0, tourmembers.length);
            tourbattlers.push(tourmembers[x1]);
            var name1 = tourplayers[tourmembers[x1]];
            tourmembers.splice(x1, 1);
            x1 = sys.rand(0, tourmembers.length);
            tourbattlers.push(tourmembers[x1]);
            var name2 = tourplayers[tourmembers[x1]];
            tourmembers.splice(x1, 1);
            battlesStarted.push(false);
            str += Utils.escapeHtml(name1) + " vs " + Utils.escapeHtml(name2) + "<br/>";
        }
        if (tourmembers.length > 0) {
            str += "</b><br/><i>" + Utils.escapeHtml(tourplayers[tourmembers[0]]) + " is randomly selected to go next round!<br/>";
        }
        str += "<br/></td></tr></table></center><br/>";
        sys.sendHtmlAll(str, 0);
    },

    isInTourney: function isInTourney(name) {
        return tourplayers.hasOwnProperty(name.toLowerCase());
    },

    tourOpponent: function tourOpponent(nam) {
        var name = nam.toLowerCase();
        var x = tourbattlers.indexOf(name);
        if (x !== -1) {
            if (x % 2 === 0) {
                return tourbattlers[x + 1];
            } else {
                return tourbattlers[x - 1];
            }
        }
        return "";
    },

    areOpponentsForTourBattle: function areOpponentsForTourBattle(src, dest) {
        return script.isInTourney(sys.name(src)) && script.isInTourney(sys.name(dest)) && script.tourOpponent(sys.name(src)) === sys.name(dest).toLowerCase();
    },

    areOpponentsForTourBattle2: function areOpponentsForTourBattle2(src, dest) {
        return script.isInTourney(src) && script.isInTourney(dest) && script.tourOpponent(src) === dest.toLowerCase();
    },

    ongoingTourneyBattle: function ongoingTourneyBattle(name) {
        return tourbattlers.indexOf(name.toLowerCase()) !== -1 && battlesStarted[Math.floor(tourbattlers.indexOf(name.toLowerCase()) / 2)] === true;
    },

    afterBattleStarted: function afterBattleStarted(src, dest, info, id, t1, t2) {
        if (tourmode === 2) {
            if (script.areOpponentsForTourBattle(src, dest)) {
                if (sys.hasTier(src, tourtier) && sys.hasTier(dest, tourtier)) {
                    battlesStarted[Math.floor(tourbattlers.indexOf(sys.name(src).toLowerCase()) / 2)] = true;
                }
            }
        }
    },

    afterBattleEnded: function afterBattleEnded(src, dest, desc) {
        if (tourmode !== 2 || desc === "tie") {
            return;
        }

        script.tourBattleEnd(sys.name(src), sys.name(dest));
    },

    afterChatMessage: function afterChatMessage(src, message, chan) {
        require.callPlugins("afterChatMessage", src, message, chan);
    },

    beforePlayerRegister: function (src) {
        Utils.watch.notify(Utils.nameIp(src) + " registered.");
    },

    tourBattleEnd: function tourBattleEnd(src, dest) {
        if (!script.areOpponentsForTourBattle2(src, dest) || !script.ongoingTourneyBattle(src)) {
            return;
        }

        battlesLost.push(src);
        battlesLost.push(dest);
        var srcL = src.toLowerCase();
        var destL = dest.toLowerCase();
        battlesStarted.splice(Math.floor(tourbattlers.indexOf(srcL) / 2), 1);
        tourbattlers.splice(tourbattlers.indexOf(srcL), 1);
        tourbattlers.splice(tourbattlers.indexOf(destL), 1);
        tourmembers.push(srcL);
        delete tourplayers[destL];
        var str = "";
        if (tourbattlers.length !== 0 || tourmembers.length > 1) {
            str = "<br/><center><table width=50% bgcolor=black><tr style='background-image:url(Themes/Classic/battle_fields/new/hH3MF.jpg)'><td align=center><br/><font style='font-size:20px; font-weight:bold;'><font style='font-size:25px;'>B</font>attle <font style='font-size:25px;'>C</font>ompleted!</font><hr width=300/><br>";
            str += "<b><i style='color:red; font-weight:bold;'>" + Utils.escapeHtml(Utils.toCorrectCase(src)) + "</i> won their battle and moves on to the next round.<br><br><i style='color:red; font-weight:bold;'>" + Utils.escapeHtml(Utils.toCorrectCase(dest)) + "</i> lost their battle and is out of the tournament.</b>";
        }
        if (tourbattlers.length > 0) {
            str += "<br><hr width=300/><br><i style='color:red; font-weight:bold;'>" + tourbattlers.length / 2 + "</i>  battle(s) remaining!";
            str += "<br/><br/></td></tr></table></center><br/>";
            sys.sendHtmlAll(str, 0);
            return;
        }

        if (str.length > 0) {
            sys.sendHtmlAll(str + "<br/><br/></td></tr></table></center><br/>", 0);
        }

        script.roundPairing();
    },

    dreamAbilityCheck: function dreamAbilityCheck(src) {
        var bannedAbilities = {
            'chandelure': ['shadow tag']
        };

        var i;
        for (i = 0; i < sys.teamCount(src); i += 1) {
            var ability = sys.ability(sys.teamPokeAbility(src, i, i));
            var lability = ability.toLowerCase();
            var poke = sys.pokemon(sys.teamPoke(src, i, i));
            var lpoke = poke.toLowerCase();
            if (bannedAbilities.hasOwnProperty(lpoke) && bannedAbilities[lpoke].indexOf(lability) !== -1) {
                bot.sendMessage(src, poke + " is not allowed to have ability " + ability + " in 5th Gen x Tier. Please change it in Teambuilder. You are now in the Random Battle tier.");
                return true;
            }
        }

        return false;
    }
});
