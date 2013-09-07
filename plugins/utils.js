/*jslint continue: true, es5: true, evil: true, forin: true, sloppy: true, vars: true, regexp: true, newcap: true*/
/*global sys, SESSION, script: true, Qt, print, gc, version,
    GLOBAL: false, require: true, Config: true, module: true, exports: true*/
    
(function () {
    var Utils = {};
    
    Utils.escapeHtml = function escapeHtml(str) {
        return str.replace(/\&/g, "&amp;").replace(/</g, "&lt;").replace(/\>/g, "&gt;");
    };

    Utils.stripHtml = function stripHtml(str) {
        return str.replace(/<\/?[^>]*>/g, "");
    };
    
    Utils.escapeRegexChars = function escapeRegexChars(str) {
        return str.replace(/([.?*+\^$\[\]\\(){}|\-])/g, "\\$1");
    };
    
    Utils.midRef = function (str, position, n) { // QStringRef QString::midRef
        if (!n || typeof n !== "number") {
            n = -1;
        }

        var strlen = str.length - 1;
        if (position > strlen) {
            return "";
        }

        var substri = str.substr(position);
        if (n > strlen || n === -1) {
            return substri;
        }
        
        return substri.substr(0, n);
    };

    Utils.replaceBetween = function (str, pos1, pos2, replace) {
        return str.replace(str.substr(pos1, pos2), replace);
    };
    
    // Also accepts strings.
    Utils.shuffle = function shuffle(array) {
        // http://bost.ocks.org/mike/shuffle/
        var m = array.length, t, i, isString = typeof array === "string";
        
        if (isString) {
            array = array.split("");
        }
        
        // While there remain elements to shuffle…
        while (m) {
            // Pick a remaining element…
            i = Math.floor(Math.random() * m);
            m -= 1;
            
            // And swap it with the current element.
            t = array[m];
            array[m] = array[i];
            array[i] = t;
        }
        
        if (isString) {
            array = array.join("");
        }
        
        return array;
    };
    
    Utils.formatString = function formatString(str) {
        var exp, i, args = arguments.length;

        for (i = 1; i < args; i += 1) {
            exp = new RegExp("%" + (i + 1), "");
            str = str.replace(exp, arguments[i]);
        }
        
        return str;
    };
    
        
    // If a player is banned.
    Utils.isBanned = function (playerName) {
        // Return their name. This allows us to accept ids as well.
        var trueName = (sys.name(playerName) || playerName).toLowerCase(),
            bans = sys.banList();
        
        return bans.indexOf(trueName) !== -1;
    };
    
    // Returns the amount of seconds name is temporary banned for.
    // This > sys.dbTempBanTime.
    // NOTE: Unlike sys.dbTempBanTime, this returns 0 if the player isn't banned.
    Utils.tempBanTime = function (playerName) {
        // Return their name. This allows us to accept ids as well.
        var trueName = (sys.name(playerName) || playerName).toLowerCase();
        
        // If they aren't banned, return 0.
        if (!Utils.isBanned(trueName)) {
            return 0;
        }
        
        // Otherwise, return for how long they are banned.
        return sys.dbTempBanTime(trueName);
    };
    
    Utils.nameColor = function (src) {
        var getColor = sys.getColor(src);
        if (getColor === '#000000') {
            var clist = ['#5811b1', '#399bcd', '#0474bb', '#f8760d', '#a00c9e', '#0d762b', '#5f4c00', '#9a4f6d', '#d0990f', '#1b1390', '#028678', '#0324b1'];
            return clist[src % clist.length];
        }
        return getColor;
    };

    Utils.loginMessage = function (name, color, serverName) {
        sys.sendHtmlAll("<font color='#0c5959'><timestamp/>±<b>WelcomeBot:</b></font> <b><font color=" + color + ">" + name + "</font></b> joined <b>" + serverName + "</b>!", 0);
    };

    Utils.logoutMessage = function (name, color, serverName) {
        sys.sendHtmlAll("<font color='#0c5959'><timestamp/>±<b>GoodbyeBot:</b></font> <b><font color=" + color + ">" + name + "</font></b> left <b>" + serverName + "</b>!", 0);
    };

    Utils.cmp = function (a, b) {
        return a.toLowerCase() === b.toLowerCase();
    };

    Utils.cut = function (array, entry, join) {
        join = join || "";
        
        return [].concat(array).splice(entry).join(join);
    };
    
    Utils.stringToTime = function (str, time) {
        if (typeof str !== 'string') {
            return 0;
        }

        str = str.toLowerCase();
        time = +time;

        var unitString = str[0],
            unitString2 = str.substr(0, 2);

        var units = {
            's': 1,
            'm': 60,
            'h': 3600,
            'd': 86400,
            'w': 604800,
            'y': 31536000
        },
            units2 = {
                'mo': 2592000,
                'de': 315360000
            };

        var unit1 = units[unitString],
            unit2 = units2[unitString2];

        if (unit2 !== undefined) {
            return unit2 * time;
        }

        if (unit1 !== undefined) {
            return unit1 * time;
        }

        return units.m * time;
    };
      
    Utils.createChannel = function (cname, identifier) {
        var id = sys.createChannel(cname) || sys.channelId(cname);
        
        if (identifier) {
            Utils.chans[identifier] = id;
        }
        
        return id;
    };
    
    Utils.channelNames = function () {
        var channelIds = sys.channelIds(),
            names = [],
            len,
            i;
        
        for (i = 0, len = channelIds.length; i < len; i += 1) {
            names.push(sys.channel(channelIds[i]));
        }
        
        return names;
    };
    
    Utils.removeClanTags = function (name) {
        return name.replace(/\[[^\]]*\]/gi, '').replace(/\{[^\]]*\}/gi, '');
    };

    Utils.hasIllegalChars = function hasIllegalChars(m) {
        if (m.indexOf(/[\u202E\u202D]/) !== -1 || m.indexOf(/[\u0300-\u036F]/) !== -1 || m.indexOf(/[\u0430-\u044f\u2000-\u200d]/) !== -1 || m.indexOf("&#8") !== -1) {
            return true;
        }
        
        //if (/\u2061|\u2062|\u2063|\u2064|\u200B|\xAD/.test(m)) return true;
        return false;
    };
    
    Utils.fancyJoin = function (array) {
        var x, retstr = '',
            arrlen = array.length;

        if (arrlen === 0 || arrlen === 1) {
            return array.join("");
        }

        arrlen -= 1;

        for (x in array) {
            if (Number(x) === arrlen) {
                retstr = retstr.substr(0, retstr.lastIndexOf(","));
                retstr += " and " + array[x];

                return retstr;
            }

            retstr += array[x] + ", ";
        }

        return "";
    };
        
    Utils.getTimeString = function (sec) {
        var s = [];
        var n;
        var d = [
            [315360000, "decade"],
            [31536000, "year"],

            [2592000, "month"],
            [604800, "week"],
            [86400, "day"],
            [3600, "hour"],
            [60, "minute"],
            [1, "second"]
        ];

        var j;
        for (j = 0; j < d.length; j += 1) {
            n = parseInt(sec / d[j][0], 10);
            if (n > 0) {
                s.push((n + " " + d[j][1] + (n > 1 ? "s" : "")));
                sec -= n * d[j][0];
                if (s.length >= d.length) {
                    break;
                }
            }
        }

        if (s.length === 0) {
            return "1 second";
        }

        return Utils.fancyJoin(s);
    };
    
    Utils.hasDrizzleSwim = function (src) {
        var swiftswim = false,
            drizzle = false,
            teams_banned = [],
            ability,
            team,
            i;
        
        if (sys.hasTier(src, "5th Gen OU")) {
            for (team = 0; team < sys.teamCount(src); team += 1) {
                if (sys.tier(src, team) !== "5th Gen OU") {
                    continue;
                }
                
                for (i = 0; i < 6; i += 1) {
                    ability = sys.ability(sys.teamPokeAbility(src, team, i));
                    if (ability === "Swift Swim") {
                        swiftswim = true;
                    }
                    
                    if (ability === "Drizzle") {
                        drizzle = true;
                    }
                    
                    if (drizzle && swiftswim) {
                        teams_banned.push(team);
                        break;
                    }
                }
            }
        }
        return teams_banned;
    };

    Utils.hasSandCloak = function (src) { // Has Sand Veil or Snow Cloak in tiers < 5th Gen Ubers.
        var teams_banned = [],
            ability,
            team,
            i;
        
        for (team = 0; team < sys.teamCount(src); team += 1) {
            if (sys.tier(src, team) === "5th Gen Ubers") {
                continue;
            }
            if (sys.gen(src, team) !== 5) {
                continue; // Only care about 5th Gen
            }
            
            for (i = 0; i < 6; i = 1) {
                ability = sys.ability(sys.teamPokeAbility(src, team, i));
                if (ability === "Sand Veil" || ability === "Snow Cloak") {
                    teams_banned.push(team);
                }
            }
        }
        return teams_banned;
    };
    
    Utils.chans = {};
    
    module.exports = Utils;
}());