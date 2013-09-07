/*jslint continue: true, es5: true, evil: true, forin: true, sloppy: true, vars: true, regexp: true, newcap: true*/
/*global sys, SESSION, script: true, Qt, print, gc, version,
    GLOBAL: false, require: true, Config: true, module: true, exports: true*/
    
(function () {
    var Storage = require('storage'),
        storage = Storage.storage;
    
    function hasOwn(obj, val) {
        return Object.prototype.hasOwnProperty.call(obj, val);
    }
    
    var Settings = {
        border: "<font color=green><timestamp/><b>«««««««««««««««««««««««««»»»»»»»»»»»»»»»»»»»»»»»»»</b></font>",
        tourmode: storage.read("tourmode", 0),
        spinTypes: storage.read("spinTypes", []), // can contain: items, emotes, pokemons
        muteall: storage.read("muteall", false),
        supersilence: storage.read("supersilence", false),
        rouletteon: storage.read("rouletteon", false),
        htmlchatoff: storage.read("htmlchatoff", false),
        lolmode: storage.read("lolmode", false),
        spacemode: storage.read("spacemode", false),
        capsmode: storage.read("capsmode", false),
        reversemode: storage.read("reversemode", false),
        scramblemode: storage.read("scramblemode", false),
        colormode: storage.read("colormode", false),
        pewpewpew: storage.read("pewpewpew", false),
        nightclub: storage.read("nightclub", false),
        bots: storage.read("bots", true),
        uniqueVisitors: {
            ips: {},
            count: 0,
            total: 0
        },
        leagueManager: storage.read("Leaguemanager", "HHT"),
        db: {
            megausers: storage.read("Megausers", {}),
            floodIgnore: storage.read("FloodIgnore", {}),
            capsIgnore: storage.read("Capsignore", {}),
            autoIdle: storage.read("Autoidle", {}),
            channelTopics: storage.read("Channeltopics", {}),
            mutes: storage.read("Mutes", {}),
            rangebans: storage.read("Rangebans", {}),
            kickmsgs: storage.read("Kickmsgs", {}),
            banmsgs: storage.read("Banmsgs", {}),
            welmsgs: storage.read("Welmsgs", {}),
            emoteToggles: storage.read("Emotetoggles", {}),
            emotePerms: storage.read("Emoteperms", {})
        },
        teamSpammers: {},
        reconnectTrolls: {}
    };

    storage.ensure('MOTD', '');
    storage.ensure('maxPlayersOnline', 0);
    storage.ensure('servername', "Meteor Falls");

    if (storage.get("Champ") === undefined) {
        var names = ["Gym1", "Gym2", "Gym3", "Gym4", "Gym5", "Gym6", "Gym7", "Gym8", "Elite1", "Elite2", "Elite3", "Elite4", "Champ"],
            len,
            i;

        for (i = 0, len = names.length; i < len; i += 1) {
            storage.ensure(names[i], "");
        }
    }
    
    storage.save();
    
    Settings.isMegauser = function (name) {
        return hasOwn(Settings.db.megausers, name.toLowerCase());
    };
    
    Settings.hasFloodIgnore = function (name) {
        return hasOwn(Settings.db.floodIgnore, name.toLowerCase());
    };
    
    Settings.hasCapsIgnore = function (name) {
        return hasOwn(Settings.db.capsIgnore, name.toLowerCase());
    };
    
    Settings.hasWelcomeMessage = function (name) {
        return hasOwn(Settings.db.welmsgs, name.toLowerCase());
    };
    
    Settings.hasEmotePerms = function (name) {
        return hasOwn(Settings.db.emotePerms, name.toLowerCase());
    };
    
    Settings.pruneMutes = function () {
        var time = +sys.time(),
            mute,
            i;
        
        for (i in Settings.db.mutes) {
            mute = Settings.db.mutes[i];
            
            if (mute.time && mute.time < time) {
                delete Settings.db.mutes[i];
            }
        }
    };
        
    module.exports = Settings;
}());