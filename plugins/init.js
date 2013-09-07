/*jslint continue: true, es5: true, evil: true, forin: true, sloppy: true, vars: true, regexp: true, newcap: true*/
/*global sys, SESSION, script: true, Qt, print, gc, version,
    GLOBAL: false, require: true, Config: true, module: true, exports: true*/

module.exports = {
    init: function () {
        floodIgnoreCheck = function (src) {
            var myNameToLower = sys.name(src).toLowerCase();
            return myNameToLower in FloodIgnore;
        }

        removeTag = function (name) {
            return name.replace(/\[[^\]]*\]/gi, '').replace(/\{[^\]]*\}/gi, '');
        }
        randcolor = function () {
            var nums = 5;
            var str = '';
            while (nums >= 0) {
                str += sys.rand(0, 16).toString(16);
                nums--;
            }
            return "<font color='#" + str + "'>";
        }

        colormodemessage = function (message) {
            var x, retmsg = "";
            for (x in message) {
                if (x == "format") {
                    break;
                }
                retmsg += randcolor() + message[x] + "</font>";
            }

            return retmsg;
        }

        lolmessage = function (message) {
            var x, retmsg = "";
            for (x in message) {
                if (x == "format") {
                    break;
                }
                retmsg += "lol";
            }

            return retmsg;
        }

        pewpewpewmessage = function (message) {
            var sendStr;
            var ids = sys.playerIds(),
                playerLen = ids.length,
                randPlayer = ids[sys.rand(0, playerLen)];
                
            while (!sys.loggedIn(randPlayer)) {
                randPlayer = ids[sys.rand(0, playerLen)];
            }
            
            var name = sys.name(randPlayer),
                auth = sys.auth(randPlayer);
                
            message = html_escape(message);
            
            var sendStr = "<font color=" + namecolor(randPlayer) + "><timestamp/><b>" + html_escape(name) + ": </b></font>" + (hasEmotesToggled(randPlayer) ? emoteFormat(message) : html_escape(message));
            if (sys.auth(randPlayer) > 0 && sys.auth(randPlayer) < 4) {
                sendStr = "<font color=" + namecolor(randPlayer) + "><timestamp/>+<i><b>" + html_escape(name) + ": </b></i></font>" + (hasEmotesToggled(randPlayer) ? emoteFormat(message) : message);
            }
            
            if (nightclub) {
                sendStr = "<" + src + ">" + Nightclub.rainbowify("(" + html_escape(name) + "): " + message);
            }
            
            return sendStr;
        }


        // Global var name: reg val name
        var regVals = {
            "MegaUsers": "Megausers",
            "FloodIgnore": "FloodIgnore",
            "Capsignore": "Capsignore",
            "Autoidle": "Autoidle",
            "Channeltopics": "Channeltopics",
            "Mutes": "Mutes",
            "Rangebans": "Rangebans",
            "Kickmsgs": "Kickmsgs",
            "Banmsgs": "Banmsgs",
            "Welmsgs": "Welmsgs",
            "Emotetoggles": "Emotetoggles",
            "Emoteperms": "Emoteperms",
            "Itemtoggles": "Itemtoggles"
        };

        for (var i in regVals) {
            Reg.init(regVals[i], "{}");

            try {
                global[i] = JSON.parse(Reg.get(regVals[i]));
            } catch (e) {
                global[i] = {};
            }
        }

        hasEmotePerms = function (name) {
            var id = sys.id(name),
                user,
                aliases,
                len,
                i = 0;
            
            if (id && (user = JSESSION.users(id)) && user.originalName) {
                name = user.originalName;
            } 
            
            var hasEmotes = sys.maxAuth(name) > 0 || Emoteperms.hasOwnProperty(name.toLowerCase());
            
            if (!hasEmotes) {
                aliases = sys.aliases(sys.dbIp(name));
                
                if (!aliases || (len = aliases.length) === 1) {
                    return false;
                }
                
                for (; i < len; i += 1) {
                    if ((aliases[i].toLowerCase()) in Emoteperms) {
                        return true;
                    }
                }
            }
            
            return hasEmotes;
        }
        
        hasBasicPermissions = function (src) {
            var uobj = JSESSION.users(src),
                name = sys.name(src);
                
            if (uobj && uobj.originalName) {
                name = uobj.originalName;
            }
            
            return getAuth(src) > 0 || Config.permissions.update.indexOf(name.toLowerCase()) > -1;
        };

        hasEmotesToggled = function (src) {
            var name = JSESSION.users(src).originalName.toLowerCase();
            return (hasBasicPermissions(src) || hasEmotePerms(name)) && Emotetoggles.hasOwnProperty(name);
        };
        
        itemsEnabled = function (src) {
            var name = sys.name(src),
                user;
            
            if (typeof src === 'string') {
                name = src;
            } else if ((user = JSESSION.users(src)) && user.originalName && typeof user.originalname === 'string') {
                name = user.orignalName;
            }
            
            return Itemtoggles.hasOwnProperty(name.toLowerCase());
        };

        getTier = function (src, tier) {
            return sys.hasTier(src, tier);
        }

        ev_name = function (num) {
            var ret = num == 0 ? "HP" : num == 1 ? "ATK" : num == 2 ? "DEF" : num == 3 ? "SPATK" : num == 4 ? "SPDEF" : "SPD";
            return ret;
        }

        isTier = function (tier) {
            var found = false;
            sys.getTierList().forEach(function (t) {
                if (cmp(t, tier)) found = true;
            });
            return found;
        }

        hasDrizzleSwim = function (src) {
            var swiftswim = false,
                drizzle = false,
                teams_banned = [];
            if (getTier(src, "5th Gen OU")) {
                for (var team = 0; team < sys.teamCount(src); ++team) {
                    if (sys.tier(src, team) !== "5th Gen OU") continue;
                    for (var i = 0; i < 6; i++) {
                        ability = sys.ability(sys.teamPokeAbility(src, team, i));
                        if (ability === "Swift Swim")
                            swiftswim = true;
                        if (ability === "Drizzle")
                            drizzle = true;
                        if (drizzle && swiftswim) {
                            teams_banned.push(team);
                            break;
                        }
                    }
                }
            }
            return teams_banned;
        }

        hasSandCloak = function (src) { // Has Sand Veil or Snow Cloak in tiers < 5th Gen Ubers.
            var teams_banned = [],
                ability;
            for (var team = 0; team < sys.teamCount(src); ++team) {
                if (sys.tier(src, team) == "5th Gen Ubers") continue;
                if (sys.gen(src, team) != 5) continue; // Only care about 5th Gen
                for (var i = 0; i < 6; i++) {
                    ability = sys.ability(sys.teamPokeAbility(src, team, i));
                    if (ability == "Sand Veil" || ability == "Snow Cloak")
                        teams_banned.push(team);
                }
            }
            return teams_banned;
        }

        var globalVars = {
            border: "<font color=green><timestamp/><b>«««««««««««««««««««««««««»»»»»»»»»»»»»»»»»»»»»»»»»</b></font>",
            tourmode: 0,
            spinTypes: [], // can contain: items, emotes, pokemons
            muteall: false,
            supersilence: false,
            rouletteon: false,
            htmlchatoff: false,
            lolmode: false,
            spacemode: false,
            capsmode: false,
            reversemode: false,
            scramblemode: false,
            colormode: false,
            pewpewpew: false,
            nightclub: false,
            bots: true,
            uniqueVisitors: {
                ips: {},
                count: 0,
                total: 0
            }
        };

        for (i in globalVars) {
            if (typeof global[i] === "undefined") {
                global[i] = globalVars[i];
            }
        }

        Reg.init('MOTD', '');
        Reg.init('maxPlayersOnline', 0);
        Reg.init('servername', "Meteor Falls");
        Reg.init("Leaguemanager", "HHT");

        if (Reg.get("Champ") === undefined) {
            var LeagueArray = ["Gym1", "Gym2", "Gym3", "Gym4", "Gym5", "Gym6", "Gym7", "Gym8", "Elite1", "Elite2", "Elite3", "Elite4", "Champ"];

            for (var x in LeagueArray) {
                Reg.init(LeagueArray[x], "");
            }
        }

        Leaguemanager = Reg.get("Leaguemanager");

        var channelIds = sys.channelIds();
        ChannelNames = [];
        for (var x in channelIds) {
            ChannelNames.push(sys.channel(channelIds[x]));
        }

        PlayerIds = sys.playerIds();

        getTimeString = function (sec) {
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

            var j, n;
            for (j = 0; j < d.length; ++j) {
                n = parseInt(sec / d[j][0]);
                if (n > 0) {
                    s.push((n + " " + d[j][1] + (n > 1 ? "s" : "")));
                    sec -= n * d[j][0];
                    if (s.length >= d.length) {
                        break;
                    }
                }
            }

            if (s.length == 0) {
                return "1 second";
            }

            return andJoin(s);
        }

        andJoin = function (array) {
            var x, retstr = '',
                arrlen = array.length;

            if (arrlen === 0 || arrlen === 1) {
                return array.join("");
            }

            arrlen--;

            for (x in array) {
                if (Number(x) === arrlen) {
                    retstr = retstr.substr(0, retstr.lastIndexOf(","));
                    retstr += " and " + array[x];

                    return retstr;
                }

                retstr += array[x] + ", ";
            }

            return "";
        }

        ban = function (name) {
            sys.ban(name);
            if (sys.id(name) != undefined) {
                kick(sys.id(name));
            } else {
                aliasKick(sys.dbIp(name));
            }
        }

        getName = function (name) {
            var pId = sys.id(name);
            if (pId == undefined) {
                return name;
            }

            return sys.name(pId);
        }

        kick = function (src, floodBot) {
            var xlist, c;
            var ip = sys.ip(src);
            var playerIdList = PlayerIds,
                addIp = false;

            for (xlist in playerIdList) {
                c = playerIdList[xlist];
                if (ip == sys.ip(c)) {
                    if (!floodBot) {
                        sys.setTimer((function (c) {
                            return function () {
                                sys.kick(c);
                            };
                        }(c)), 20, false);
                    } else {
                        sys.kick(c);
                    }
                    addIp = true;
                }
            }

            if (addIp) {
                reconnectTrolls[ip] = true;
                
                sys.setTimer(function () {
                    delete reconnectTrolls[ip];
                }, 3000, false);
            }
            sys.kick(src);
        }
        
        // Temporarly bans a player.
        // NOTE: Time is in minutes.
        // NOTE: This is done quietly.
        tempBan = function (name, time) {
            // Since there is basically nothing to customise atm (kick is done automatically), this is simply a small wrapper (though it does kick players under the same alt.)
            // Ensure time is an integer.
            time = Math.round(time);
            
            sys.tempBan(name, time);
            
            aliasKick(sys.ip(name));
        };
    
        aliasKick = function (ip) {
            var aliases = sys.aliases(ip),
                alias, id, addIp = false;
            for (alias in aliases) {
                id = sys.id(aliases[alias]);
                if (id != undefined) {
                    sys.setTimer((function (id) {
                            return function () {
                                sys.kick(id);
                            };
                        }(id)), 20, false);
                    addIp = sys.ip(id);
                }
            }
            if (addIp != false) {
                reconnectTrolls[addIp] = true;
                
                sys.setTimer(function () {
                    delete reconnectTrolls[ip];
                }, 3000, false);
            }
        }
        
        pruneMutes = function () {
            var x, t = Mutes,
                c_inst, TIME_NOW = sys.time() * 1;
            for (x in t) {
                c_inst = t[x];
                if (c_inst.time != 0 && c_inst.time < TIME_NOW) {
                    delete t[x];
                }
            }
        }

        script.loadCommandLists();
        print("Command lists loaded into memory.");

        nthNumber = function (num) {
            var nthNum = {
                0: "th",
                1: "st",
                2: "nd",
                3: "rd"
            };

            return (num + '') + (nthNum[num] || "th");
        }

        function atag(s) {
            return '<a href="' + s + '">' + s + '</a>';
        }

        function clink($1) {
            return ChannelLink(sys.channel($1));
        }

        ChannelLink = function (channel) {
            if (sys.channelId(channel) == undefined) {
                return "";
            }

            return "<a href='po:join/" + channel + "'>#" + channel + "</a>";
        }

        addChannelLinks = function (line2) {
            var line = line2;
            var pos = 0;
            pos = line.indexOf('#', pos);
            var longestName = "",
                longestChannelName = "",
                html = "",
                channelName = "",
                res;
            while (pos != -1) {
                ++pos;
                ChannelNames.forEach(function (name) {
                    channelName = String(line.midRef(pos, name.length));
                    res = channelName.toLowerCase() == name.toLowerCase();
                    if (res && longestName.length < channelName.length) {
                        longestName = name;
                        longestChannelName = channelName;
                    }
                });
                if (longestName !== "") {
                    html = "<a href=\"po:join/%1\">#%2</a>".format(longestName, longestChannelName);
                    line = line.replaceBetween(pos - 1, longestName.length + 1, html);
                    pos += html.length - 1;
                    longestName = "";
                    longestChannelName = "";
                }
                pos = line.indexOf('#', pos);
            }
            return line;
        }

        function atag(s) {
            return '<a href="' + s + '">' + s + '</a>';
        }

        function formatLinks(message) {
            return message.replace(/(http|ftp|https):\/\/[\w\-_]+(\.[\w\-_]+)+([\w\-\.,@?^=%&amp;:/~\+#]*[\w\-\@?^=%&amp;/~\+#])?/gi, '$1');
        }

        format = function (src, str) {
            if (typeof str != "string") {
                str = String(str);
            }

            var auth = sys.maxAuth(sys.ip(src));
            if (src == 0) {
                auth = 3;
            }

            str = str.replace(/\[b\](.*?)\[\/b\]/gi, '<b>$1</b>');
            str = str.replace(/\[s\](.*?)\[\/s\]/gi, '<s>$1</s>');
            str = str.replace(/\[u\](.*?)\[\/u\]/gi, '<u>$1</u>');
            str = str.replace(/\[i\](.*?)\[\/i\]/gi, '<i>$1</i>');
            str = str.replace(/\[sub\](.*?)\[\/sub\]/gi, '<sub>$1</sub>');
            str = str.replace(/\[sup\](.*?)\[\/sup\]/gi, '<sup>$1</sup>');
            str = str.replace(/\[sub\](.*?)\[\/sub\]/gi, '<sub>$1</sub>');
            str = str.replace(/\[code\](.*?)\[\/code\]/gi, '<code>$1</code>');
            str = str.replace(/\[link\](.*?)\[\/link\]/gi, '<a href="$1">$1</a>');
            str = str.replace(/\[servername\]/gi, "Meteor Falls".bold());
            str = str.replace(/\[spoiler\](.*?)\[\/spoiler\]/gi, '<a style="color: black; background-color:black;">$1</a>');
            str = str.replace(/\[time\]/gi, "<timestamp/>");
            if (auth != 3 && !htmlchatoff) {
                str = str.replace(/[a-z]{3,}:\/\/[^ ]+/i, atag);
            }
            str = str.replace(/\[color=(.*?)\](.*?)\[\/color\]/gi, '<font color=$1>$2</font>')
            str = str.replace(/\[face=(.*?)\](.*?)\[\/face\]/gi, '<font face=$1>$2</font>');
            str = str.replace(/\[font=(.*?)\](.*?)\[\/font\]/gi, '<font face=$1>$2</font>');

            if (auth > 0) {
                str = str.replace(/\[size=([0-9]{1,})\](.*?)\[\/size\]/gi, '<font size=$1>$2</font>')
                str = str.replace(/\[pre\](.*?)\[\/pre\]/gi, '<pre>$1</pre>');
                str = str.replace(/\[ping\]/gi, "<ping/>");
                str = str.replace(/\[br\]/gi, "<br/>");
                str = str.replace(/\[hr\]/gi, "<hr/>");
            }

            str = addChannelLinks(str); // do this late for other bbcodes to work properly
            return str;
        }

        firstGen = function (poke) {
            if (poke < 152) {
                return sys.rand(1, 6);
            } else if (poke < 252) {
                return sys.rand(2, 6);
            } else if (poke < 387) {
                return sys.rand(3, 6);
            } else if (poke < 494) {
                return sys.rand(4, 6);
            }

            return 5;
        }

        randPoke = function () {
            return "<img src='pokemon:num=" + sys.rand(1, 649) + (sys.rand(1, 100) == 50 ? '&shiny=true:' : '') + "'>";
        }

        formatPoke = function (pokenum, shine, backsprite, gendar, gan) {
            if (!pokenum || pokenum < 1 || isNaN(pokenum)) {
                if (sys.pokeNum(pokenum) == undefined) {
                    return "<img src='pokemon:0'>";
                } else {
                    pokenum = sys.pokeNum(pokenum);
                }
            }

            var shiny = false,
                back = false,
                gender = "neutral";

            if (shine) shiny = true;

            if (backsprite) back = true;

            if (gendar) {
                gendar = Number(gendar);
                if ((gendar == 0 || gendar == 1 || gendar == 2)) {
                    gender = {
                        0: "neutral",
                        1: "male",
                        2: "female"
                    }[gendar];
                }
            }
            return "<img src='pokemon:" + pokenum + "&shiny=" + shiny + "&back=" + back + "&gender=" + gender + "&gen=" + gan + "'>";
        }

        hasIllegalChars = function (m) {
            if (m.indexOf(/[\u202E\u202D]/) != -1) return true;
            if (m.indexOf(/[\u0300-\u036F]/) != -1) return true;
            if (m.indexOf(/[\u0430-\u044f\u2000-\u200d]/) != -1) return true;
            if (m.indexOf("&#8") != -1) return true;
            //if (/\u2061|\u2062|\u2063|\u2064|\u200B|\xAD/.test(m)) return true;
            return false;
        }
        
        Nightclub = {};

        Nightclub.hsv2rgb = function(h, s, v){
            var r, g, b;
            var RGB = [];
            if(s==0){
                RGB[0]=RGB[1]=RGB[2]=Math.round(v*255);
            }else{
                // h must be < 1
                var var_h = h * 6;
                if (var_h==6) var_h = 0;
                //Or ... var_i = floor( var_h )
                var var_i = Math.floor( var_h );
                var var_1 = v*(1-s);
                var var_2 = v*(1-s*(var_h-var_i));
                var var_3 = v*(1-s*(1-(var_h-var_i)));
                if(var_i==0){
                    var_r = v;
                    var_g = var_3;
                    var_b = var_1;
                }else if(var_i==1){
                    var_r = var_2;
                    var_g = v;
                    var_b = var_1;
                }else if(var_i==2){
                    var_r = var_1;
                    var_g = v;
                    var_b = var_3
                }else if(var_i==3){
                    var_r = var_1;
                    var_g = var_2;
                    var_b = v;
                }else if (var_i==4){
                    var_r = var_3;
                    var_g = var_1;
                    var_b = v;
                }else{
                    var_r = v;
                    var_g = var_1;
                    var_b = var_2
                }
                //rgb results = 0 ÷ 255  
                RGB[0]=Math.round(var_r * 255);
                RGB[1]=Math.round(var_g * 255);
                RGB[2]=Math.round(var_b * 255);
            }
            for (i=0; i<RGB.length; i++){
                RGB[i] = Math.round(RGB[i]).toString(16);
                if (RGB[i].length != 2){
                    RGB[i] = "0" + RGB[i];
                }
            }
            return "#" + RGB.join("");
        };
 
        Nightclub.rainbowify = (function(){
            var numcolors = 360,
                colors = [],
                base = sys.rand(0, numcolors);
            for (var i=0; i<numcolors; i++){
                colors.push(Nightclub.hsv2rgb((i%360)/360, 1, 1));
            }
     
            return function(text){
                var html = "";
                var step = sys.rand(0, 30);
                for (var i=0; i<text.length; i++){
                    html += "<font color='" + colors[(++base + step)%numcolors] + "'>" + html_escape(text[i]) + "</font>";
                }
                return "<table cellpadding='12' cellspacing='0' width='100%' " +
                       "bgcolor='black' style='margin: -12'><tr><td><b>" + html +
                       "</b></td></tr></table>";
            };
        }());
    
        if (typeof teamSpammers == 'undefined') {
            teamSpammers = {};
        }
        if (typeof reconnectTrolls == 'undefined') {
            reconnectTrolls = {};
        }
    }
};
