// NOTE: New functions should go in utils.js, old ones should slowly be ported over.
module.exports = {
    init: function init() {
        String.prototype.midRef = function (position, n) { // QStringRef QString::midRef
            if ((!n && n !== 0) || typeof n !== "number") {
                n = -1;
            }

            var str = this;
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

        String.prototype.replaceBetween = function (pos1, pos2, replace) {
            var str = this,
                returnStr = str,
                sub = str.substr(pos1, pos2);

            returnStr = returnStr.replace(sub, replace);

            return returnStr;
        };

        var configFile = sys.getFileContent("config").split("\n"),
            x,
            c_conf,
            serv = /server_name=/,
            desc = /server_description=/,
            ann = /server_announcement=/;

        servername = "";
        for (x in configFile) {
            c_conf = configFile[x];
            if (serv.test(c_conf) && !ann.test(c_conf) && !desc.test(c_conf)) {
                servername = c_conf.substring(12, c_conf.length).replace(/\\xe9/i, "é").replace(/\\xa2/i, "¢").trim();
                break;
            }
        }

        randcolor = function () {
            var nums = 5;
            var str = '';
            while (nums >= 0) {
                str += sys.rand(0, 16).toString(16);
                nums -= 1;
            }
            return "<font color='#" + str + "'>";
        };

        colormodemessage = function (message) {
            var x,
                retmsg = "";

            for (x in message) {
                if (x === "midRef") {
                    break;
                }
                retmsg += randcolor() + message[x] + "</font>";
            }

            return retmsg;
        };

        lolmessage = function (message) {
            var x, retmsg = "";
            for (x in message) {
                if (x === "midRef") {
                    break;
                }
                retmsg += "lol";
            }

            return retmsg;
        };

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

            message = Utils.escapeHtml(message);

            sendStr = "<font color=" + Utils.nameColor(randPlayer) + "><timestamp/><b>" + Utils.escapeHtml(name) + ": </b></font>" + (hasEmotesToggled(randPlayer) ? emoteFormat(message) : Utils.escapeHtml(message));
            if (sys.auth(randPlayer) > 0 && sys.auth(randPlayer) < 4) {
                sendStr = "<font color=" + Utils.nameColor(randPlayer) + "><timestamp/>+<i><b>" + Utils.escapeHtml(name) + ": </b></i></font>" + (hasEmotesToggled(randPlayer) ? emoteFormat(message) : message);
            }

            if (nightclub) {
                sendStr = Utils.nightclub.rainbowify("(" + Utils.escapeHtml(name) + "): " + message);
            }

            return sendStr;
        };


        // Global var name: reg val name
        var regVals = {
            "MegaUsers": "Megausers",
            "FloodIgnore": "FloodIgnore",
            "Channeltopics": "Channeltopics",
            "Mutes": "Mutes",
            "Rangebans": "Rangebans",
            "Kickmsgs": "Kickmsgs",
            "Banmsgs": "Banmsgs",
            "Welmsgs": "Welmsgs",
            "Emotetoggles": "Emotetoggles",
            "Emoteperms": "Emoteperms",
            "Feedmons": "Feedmon"
        };

        for (var i in regVals) {
            Reg.init(regVals[i], {});

            try {
                global[i] = Reg.get(regVals[i]);
            } catch (e) {
                global[i] = {};
            }
        }

        hasEmotePerms = function (name) {
            var id = sys.id(name),
                user = SESSION.users(id),
                aliases,
                len,
                i;

            if (id && user && user.originalName) {
                name = user.originalName;
            }

            var hasEmotes = sys.maxAuth(name) > 0 || Emoteperms.hasOwnProperty(name.toLowerCase());

            if (!hasEmotes) {
                aliases = sys.aliases(sys.dbIp(name));

                if (!aliases || (len = aliases.length) === 1) {
                    return false;
                }

                for (i = 0; i < len; i += 1) {
                    if (Emoteperms.hasOwnProperty(aliases[i].toLowerCase())) {
                        return true;
                    }
                }
            }

            return hasEmotes;
        };

        hasBasicPermissions = function (src) {
            var uobj = SESSION.users(src),
                name = sys.name(src);

            if (uobj && uobj.originalName) {
                name = uobj.originalName;
            }

            return Utils.getAuth(src) > 0;
        };

        hasEmotesToggled = function (src) {
            var name = SESSION.users(src).originalName.toLowerCase();
            return (hasBasicPermissions(src) || hasEmotePerms(name)) && Emotetoggles.hasOwnProperty(name);
        };

        var globalVars = {
            border: "<font color=green><timestamp/><b>«««««««««««««««««««««««««»»»»»»»»»»»»»»»»»»»»»»»»»</b></font>",
            tourmode: 0,
            spinTypes: [], // can contain: items, emotes, pokemons
            muteall: false,
            supersilence: false,
            rouletteon: false,
            htmlchat: false,
            lolmode: false,
            spacemode: false,
            capsmode: false,
            reversemode: false,
            scramblemode: false,
            colormode: false,
            pewpewpew: false,
            nightclub: false,
            warnings: {},
            teamSpammers: {},
            reconnectTrolls: {},
            uniqueVisitors: {
                ips: {},
                count: 0,
                total: 0
            },
            Poll: {
                active: false,
                subject: '',
                by: '',
                options: [],
                votes: {}
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
            for (x in LeagueArray) {
                Reg.init(LeagueArray[x], "");
            }
        }

        Leaguemanager = Reg.get("Leaguemanager");

        var makeChan = function (cname) {
            sys.createChannel(cname);
            return sys.channelId(cname);
        };

        staffchannel = makeChan("Auth Party");
        testchan = makeChan("Ground Zero");
        watch = makeChan("Watch");

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
        };

        ban = function (name) {
            sys.ban(name);
            if (sys.id(name)) {
                Utils.mod.kick(sys.id(name));
            } else {
                aliasKick(sys.dbIp(name));
            }
        };

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
                alias,
                id,
                addIp = false;

            for (alias in aliases) {
                id = sys.id(aliases[alias]);
                if (id) {
                    sys.kick(id);
                    addIp = sys.ip(id);
                }
            }
            if (addIp) {
                reconnectTrolls[addIp] = true;

                sys.setTimer(function () {
                    delete reconnectTrolls[ip];
                }, 3000, false);
            }
        };

        pruneMutes = function () {
            var x, t = Mutes,
                c_inst,
                TIME_NOW = +sys.time();
            for (x in t) {
                c_inst = t[x];
                if (c_inst.time !== 0 && c_inst.time < TIME_NOW) {
                    delete t[x];
                }
            }
        };

        RegExp.quote = function (str) {
            return str.replace(/([.?*+\^$\[\]\\(){}|\-])/g, "\\$1");
        };

        nthNumber = function (num) {
            var nthNum = {
                0: "th",
                1: "st",
                2: "nd",
                3: "rd"
            };

            return num + (nthNum[num] || "th");
        };

        function atag(s) {
            return '<a href="' + s + '">' + s + '</a>';
        }

        function clink($1) {
            return ChannelLink(sys.channel($1));
        }

        ChannelLink = function (channel) {
            if (typeof channel === "number") {
                channel = sys.channel(channel);
            }

            return "<a href='po:join/" + channel + "'>#" + channel + "</a>";
        };

        addChannelLinks = function (line) {
            var index = line.indexOf('#');
            if (index === -1) {
                return line;
            }

            var str = '', fullChanName, chanName, chr, lastIndex = 0, pos, i;
            var channelNames = Utils.channelNames(true); // lower case names

            while (index !== -1) {
                str += line.substring(lastIndex, index);
                lastIndex = index + 1; // Skip over the '#'

                fullChanName = '';
                chanName = '';

                for (i = 0, pos = lastIndex; i < 20 && (chr = line[pos]); i += 1, pos += 1) {
                    fullChanName += chr;
                    if (channelNames.indexOf(fullChanName.toLowerCase()) !== -1) {
                        chanName = fullChanName;
                    }
                }

                if (chanName) {
                    str += "<a href='po:join/" + chanName + "'>#" + chanName + "</a>";
                    lastIndex += chanName.length;
                } else {
                    str += '#';
                }

                index = line.indexOf('#', lastIndex);
            }

            // Add any leftover invalid channel(s).
            if (!chanName && fullChanName) {
                str += fullChanName;
            } else if (chanName && chanName.length < fullChanName.length) {
                str += fullChanName.substr(chanName.length);
            }

            return str;
        };

        function formatLinks(message) {
            return message.replace(/(http|ftp|https):\/\/[\w\-_]+(\.[\w\-_]+)+([\w\-\.,@?\^=%&amp;:\/~\+#]*[\w\-\@?\^=%&amp;\/~\+#])?/gi, '$1');
        }

        format = function (src, str) {
            if (typeof str !== "string") {
                str = String(str);
            }

            var auth = sys.maxAuth(sys.ip(src));
            if (src === 0) {
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
            str = str.replace(/\[spoiler\](.*?)\[\/spoiler\]/gi, '<a style="color: black; background-color:black;">$1</a>');
            str = str.replace(/\[time\]/gi, "<timestamp/>");

            if ((auth === 3 && !htmlchat) || (auth !== 3)) {
                str = str.replace(/[a-z]{3,}:\/\/[^ ]+/gi, atag);
            }

            str = str.replace(/\[color=(.*?)\](.*?)\[\/color\]/gi, '<font color=$1>$2</font>');
            str = str.replace(/\[face=(.*?)\](.*?)\[\/face\]/gi, '<font face=$1>$2</font>');
            str = str.replace(/\[font=(.*?)\](.*?)\[\/font\]/gi, '<font face=$1>$2</font>');

            if (auth > 0 || hasBasicPermissions(src)) {
                str = str.replace(/\[size=([0-9]{1,})\](.*?)\[\/size\]/gi, '<font size=$1>$2</font>');
                str = str.replace(/\[pre\](.*?)\[\/pre\]/gi, '<pre>$1</pre>');
                str = str.replace(/\[ping\]/gi, "<ping/>");
                str = str.replace(/\[br\]/gi, "<br/>");
                str = str.replace(/\[hr\]/gi, "<hr/>");
                str = str.replace(/\[announce\](.*?)\[\/announce\]/gi, function ($1, $2) {
                    return "<br><font color=navy><font size=4><b>»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»</b></font><br>" +
                        "<br/><font color=" + Utils.nameColor(src) + "><timestamp/><b>" + sys.name(src) + ":</b><font color=black> " + $2 + "<br>" +
                        "<br/><font color=navy><font size=4><b>»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»</b></font><br>";
                });
            }

            str = addChannelLinks(str); // do this late for other bbcodes to work properly
            return str;
        };
    }
};

module.reload = function reloadInit() {
    module.exports.init();
    return true;
};
