(function () {
    var commands = require('commands.js');
    var sendWarningsTo = ['Ethan', 'TheUnknownOne'];

    module.exports = {
        warning: function (func, message, backtrace) {
            var len = sendWarningsTo.length, id, i;

            for (i = 0; i < len; i += 1) {
                id = sys.id(sendWarningsTo[i]);

                if (id && sys.isInChannel(id, 0)) {
                    sys.sendMessage(id, "Script warning in function " + func + ": " + message, 0);
                    sys.sendMessage(id, backtrace, 0);
                }
            }
        },
        beforeNewMessage: function (message) {
            if (ignoreNextChanMsg) {
                // Don't call sys.stopEvent here
                ignoreNextChanMsg = false;
                return;
            }

            if (message.substr(0, 16) === "[#Watch] ±Watch:") {
                return sys.stopEvent();
            }

            // Strip HTML. :]
            if (Config.stripHtmlFromChannelMessages && message.substring(0, 2) === "[#") {
                sys.stopEvent();
                ignoreNextChanMsg = true;
                print(Utils.stripHtml(message));
                return;
            }
        },
        afterNewMessage: function (message) {
            if (message.substr(0, 33) === "The name of the server changed to") {
                servername = message.substring(34, message.lastIndexOf("."));
                return;
            }
            if (message === "Script Check: OK") {
                sys.sendHtmlAll("<b><i><font color=Blue><font size=4>±ScriptBot:</font></b><b><i><font color=Black><font size=4> Scripts were updated!</font></b></i>");
                script.init();
                return;
            }

            if (message.substr(0, 17) === "Script Error line" && sys.id('ethan')) {
                sys.sendMessage(sys.id('ethan'), message);
            }
        },
        beforeServerMessage: function (message) {
            var isEval = message.substr(0, 2) === ">>",
                evalCode;

            if (isEval) {
                sys.stopEvent();

                evalCode = message.substr(2);
                print(message);
                try {
                    print(eval(evalCode));
                } catch (ex) {
                    print(ex);
                    print(ex.backtracetext);
                }
            }
        },
        beforeChannelJoin: function (src, channel) {
            var user = SESSION.users(src);

            if ((channel === staffchannel && !user.megauser && !hasBasicPermissions(src)) || (channel === watch && !hasBasicPermissions(src))) {
                if (sys.isInChannel(src, 0)) {
                    guard.sendMessage(src, "HEY! GET AWAY FROM THERE!", 0);
                }
                watchbot.sendAll(Utils.nameIp(src) + " tried to join " + ChannelLink(sys.channel(channel)) + "!", watch);
                sys.stopEvent();
                return;
            }
        },
        afterChannelCreated: function (channel, cname, src) {
            if (src) {
                Utils.watch.notify(Utils.nameIp(src) + " created channel " + ChannelLink(cname) + ".");
            }
        },
        beforeChannelDestroyed: function (channel) {
            if (channel === staffchannel || channel === testchan || channel === watch) {
                sys.stopEvent();
                return;
            }


            Utils.watch.notify("Channel " + ChannelLink(channel) + " was destroyed.");
        },
        afterChannelJoin: function (src, chan) {
            var channelToLower = sys.channel(chan).toLowerCase();
            var topic = Channeltopics[channelToLower] || {
                topic: "No channel topic has been set.",
                by: null
            };

            if (chan !== 0) {
                topicbot.sendMessage(src, topic.topic, chan);

                if (topic.by) {
                    setbybot.sendMessage(src, topic.by, chan);
                }
            }

            if (chan !== 0) {
                watchbot.sendAll(Utils.nameIp(src) + " has joined " + ChannelLink(sys.channel(chan)) + "!", watch);
            }
        },
        beforeLogIn: function (src) {
            var srcip = sys.ip(src);

            var poUser = SESSION.users(src),
                cu_rb,
                t_n = +sys.time(),
                x;

            if (sys.auth(src) < 3) {
                for (x in Rangebans) {
                    if (x === srcip.substr(0, x.length)) {
                        sys.stopEvent();
                        watchbot.sendAll("Rangebanned IP [" + sys.ip(src) + "] tried to log in.", watch);
                        return;
                    }
                }
                if (Utils.hasIllegalChars(sys.name(src))) {
                    sys.stopEvent();
                    return;
                }
            }

            if (sys.name(src) === "[VP]Blade") {
                var sip = sys.ip(src).substr(0, 9);
                if (sip !== "198.255.2") {
                    sys.stopEvent();
                    return;
                }
            }
        },
        afterLogIn: function (src, defaultChan) {
            var poUser = SESSION.users(src),
                myName = sys.name(src),
                ip = sys.ip(src),
                myAuth = Utils.getAuth(src),
                numPlayers = sys.numPlayers(),
                newRecord = false;

            poUser.originalName = sys.name(src);

            if (hasBasicPermissions(src)) {
                if (!sys.isInChannel(src, watch)) {
                    sys.putInChannel(src, watch);
                }

                if (!sys.isInChannel(src, staffchannel)) {
                    sys.putInChannel(src, staffchannel);
                }
            }

            if (numPlayers > Reg.get("maxPlayersOnline")) {
                Reg.save("maxPlayersOnline", numPlayers);
                newRecord = true;
            }

            if (!sys.isInChannel(src, defaultChan)) {
                sys.putInChannel(src, defaultChan);
            }

            function displayBot(name, message, color) {
                sys.sendHtmlMessage(src, "<font color='" + color + "'><timestamp/> ±<b>" + name + ":</b></font> " + message, defaultChan);
            }

            displayBot("ServerBot", "Hey, <b><font color='" + Utils.nameColor(src) + "'>" + sys.name(src) + "</font></b>!", "purple");
            displayBot("CommandBot", "Type <b>/commands</b> for a list of commands, <b>/rules</b> for a list of rules, and <b>/league</b> for the league.", "green");
            displayBot("ForumBot", "Get in touch with the community by joining the <b><a href='http://meteorfalls.us/'>Meteor Falls Forums</a></b>!", "blue");
            displayBot("StatsBot", "There are <b>" + numPlayers + "</b> players online. You are the <b>" + nthNumber(Utils.placeCommas(src)) + "</b> player to join. At most, there were <b>" + Reg.get("maxPlayersOnline") + "</b> players online" + (newRecord ? " (new record!)" : "") + ".", "goldenrod");
            if (typeof(startUpTime) === "number" && startUpTime < +sys.time()) {
                displayBot("UptimeBot", "The server has been up for " + andJoin(Utils.uptime()) + ".", "orange");
            }

            var MOTD = Reg.get("MOTD");
            if (MOTD !== "") {
                displayBot("Message of the Day", MOTD, "red");
            }

            sys.sendMessage(src, '');

            var hasWelcomeMessage = Welmsgs.hasOwnProperty(sys.name(src).toLowerCase());
            if (sys.numPlayers() < 30 && !hasWelcomeMessage) {
                Utils.loginMessage(sys.name(src), Utils.nameColor(src));
            }

            if (hasWelcomeMessage) {
                var theirmessage = Welmsgs[sys.name(src).toLowerCase()];
                var msg = (theirmessage) ? theirmessage.message : Utils.loginMessage(sys.name(src), Utils.nameColor(src));
                if (theirmessage) {
                    msg = msg.replace(/\{Server\}/gi, Reg.get("servername")).replace(/\{Color\}/gi, Utils.nameColor(src));
                    msg = emoteFormat(true, msg);
                }
                sys.sendHtmlAll(msg, 0);
            }

            pruneMutes();
            if (Mutes.hasOwnProperty(ip)) {
                var myMute = Mutes[ip],
                    muteStr = myMute.time !== 0 ? Utils.getTimeString(myMute.time - +sys.time()) : "forever";
                poUser.muted = true;
                bot.sendMessage(src, "You are muted for " + muteStr + ". By: " + myMute.by + ". Reason: " + myMute.reason, defaultChan);
            }

            var i;
            var drizzleSwim = Utils.tier.hasDrizzleSwim(src);
            if (drizzleSwim.length > 0) {
                for (i = 0; i < drizzleSwim.length; i += 1) {
                    bot.sendMessage(src, "Sorry, DrizzleSwim is banned from 5th Gen OU.", defaultChan);
                    sys.changeTier(src, drizzleSwim[i], "5th Gen Ubers");
                }
            }
            var sandCloak = Utils.tier.hasSandCloak(src);
            if (sandCloak.length > 0) {
                for (i = 0; i < sandCloak.length; i += 1) {
                    bot.sendMessage(src, "Sorry, Sand Veil & Snow Cloak are only usable in 5th Gen Ubers.", defaultChan);
                    sys.changeTier(src, sandCloak[i], "5th Gen Ubers");
                }
            }

            for (var team = 0; team < sys.teamCount(src); team++) {
                if (!Utils.tier.hasOneUsablePoke(src, team) && !Utils.tier.isCCTier(sys.tier(src, team))) {
                    bot.sendMessage(src, "Sorry, you do not have a valid team for the " + sys.tier(src, team) + " tier.", defaultChan);
                    bot.sendMessage(src, "You have been placed into 'Challenge Cup'.", defaultChan);
                    sys.changeTier(src, team, "Challenge Cup");
                }
            }

            script.megauserCheck(src);

            if (tourmode === 1) {
                sys.sendHtmlMessage(src, "<br/><center><table width=30% bgcolor=black><tr style='background-image:url(Themes/Classic/battle_fields/new/hH3MF.jpg)'><td align=center><br/><font style='font-size:11px; font-weight:bold;'>A <i style='color:red; font-weight:bold;'>" + tourtier + "</i> tournament is in sign-up phase</font><hr width=200/><br><b><i style='color:red; font-weight:bold;'>" + script.tourSpots() + "</i> space(s) are remaining!<br><br>Type <i style='color:red; font-weight:bold;'>/join</i> to join!</b><br/><br/></td></tr></table></center><br/>", defaultChan);
            } else if (tourmode === 2) {
                sys.sendHtmlMessage(src, "<br/><center><table width=35% bgcolor=black><tr style='background-image:url(Themes/Classic/battle_fields/new/hH3MF.jpg)'><td align=center><br/><font style='font-size:11px; font-weight:bold;'>A <i style='color:red; font-weight:bold;'>" + tourtier + "</i> tournament is currently running.</font><hr width=210/><br><b>Type <i style='color:red; font-weight:bold;'>/viewround</i> to check the status of the tournament!</b><br/><br/></td></tr></table></center><br/>", defaultChan);
            }

            var tier = sys.hasTier(src, "5th Gen OU");
            if (tier) {
                script.dreamAbilityCheck(src);
            }

            Utils.watch.notify(Utils.nameIp(src) + " logged in.");
        },

        beforeChangeTier: function (src, team, oldtier, newtier) {
            if (!Utils.tier.hasOneUsablePoke(src, team) && !Utils.tier.isCCTIer(newtier)) {
                sys.stopEvent();
                bot.sendMessage(src, "Sorry, you do not have a valid team for the " + newtier + " tier.");
                bot.sendMessage(src, "You have been placed into 'Challenge Cup'.");
                sys.changeTier(src, team, "Challenge Cup");
            }

            var drizzleSwim = Utils.tier.hasDrizzleSwim(src),
                i;

            if (drizzleSwim.length > 0) {
                for (i = 0; i < drizzleSwim.length; i += 1) {
                    bot.sendMessage(src, "Sorry, DrizzleSwim is banned from 5th Gen OU.");
                    sys.changeTier(src, drizzleSwim[i], "5th Gen Ubers");
                    sys.stopEvent();
                }
            }
            var sandCloak = Utils.tier.hasSandCloak(src);
            if (sandCloak.length > 0) {
                for (i = 0; i < sandCloak.length; i += 1) {
                    bot.sendMessage(src, "Sorry, Sand Veil & Snow Cloak are only usable in 5th Gen Ubers.");
                    sys.changeTier(src, sandCloak[i], "5th Gen Ubers");
                    sys.stopEvent();
                }
            }
            if (newtier === "5th Gen OU") {
                if (script.dreamAbilityCheck(src)) {
                    sys.stopEvent();
                }
            }
        },
        beforeChatMessage: function (src, message, chan) {
            if (!hasBasicPermissions(src) && message.length > 600) {
                sys.stopEvent();
                bot.sendMessage(src, "Sorry, your message has exceeded the 600 character limit.", chan);
                watchbot.sendAll("User, " + Utils.nameIp(src) + ", has tried to post a message that exceeds the 600 character limit. Take action if need be.", watch);
                script.afterChatMessage(src, message, chan);
                return;
            }

            var poUser = SESSION.users(src),
                isMuted = poUser.muted,
                originalName = poUser.originalName,
                isLManager = Leaguemanager === originalName.toLowerCase(),
                messageToLowerCase = message.toLowerCase(),
                myAuth = Utils.getAuth(src),
                isOwner = myAuth === 3;

            if (Utils.hasIllegalChars(message) && myAuth < 3) {
                bot.sendMessage(src, 'WHY DID YOU TRY TO POST THAT, YOU NOOB?!', chan);
                watchbot.sendAll(Utils.nameIp(src) + ' TRIED TO POST A BAD CODE! KILL IT!', watch);
                sys.stopEvent();
                script.afterChatMessage(src, message, chan);
                return;
            }

            if (myAuth < 2 && isMuted) {
                pruneMutes();
                if (!Mutes[sys.ip(src)]) {
                    poUser.muted = false;
                } else {
                    sys.stopEvent();
                    var myMute = Mutes[sys.ip(src)],
                        muteStr = myMute.time !== 0 ? Utils.getTimeString(myMute.time - +sys.time()) : "forever";
                    bot.sendMessage(src, "Shut up, you are muted for " + muteStr + ", by " + myMute.by + "! Reason: " + myMute.reason, chan);
                    Utils.watch.message(src, "Muted Message", message, chan);
                    script.afterChatMessage(src, message, chan);
                    return;
                }
            }

            if (myAuth < 1 && muteall || myAuth < 2 && supersilence) {
                sys.stopEvent();
                bot.sendMessage(src, "Shut up! Silence is on!", chan);
                Utils.watch.message(src, "Silence Message", message, chan);
                script.afterChatMessage(src, message, chan);
                return;
            }

            // Strip empty character
            message = message.replace(/\ufffc/gi, "");

            if (message.length === 0) {
                return sys.stopEvent();
            }

            var secondchar = (message[1] || '').toLowerCase();
            if ((message[0] === '/' || message[0] === '!') && message.length > 1 && secondchar >= 'a' && secondchar <= 'z') {
                print("[#" + sys.channel(chan) + "] Command -- " + sys.name(src) + ": " + message);
                Utils.watch.message(src, "Command", message, chan);

                sys.stopEvent();
                var command = "";
                var commandData = "";
                var pos = message.indexOf(' ');

                if (pos !== -1) {
                    command = message.substring(1, pos).toLowerCase();
                    commandData = message.substr(pos + 1);
                } else {
                    command = message.substr(1).toLowerCase();
                }

                var tar = sys.id(commandData);
                try {
                    if (commands.canUseCommand(src, command)) {
                        commands.handleCommand(src, message, command, commandData, tar, chan);
                        return;
                    }
                } catch (err) {
                    bot.sendMessage(src, err + (err.lineNumber ? " on line " + err.lineNumber : ""), chan);
                    print(err.backtracetext);
                    return;
                }
            }

            var originalMessage = message;
            var sentMessage = ((isOwner && htmlchat) ? originalMessage : Utils.escapeHtml(originalMessage, true).replace(/&lt;_&lt;/g, "<_<").replace(/&gt;_&lt;/g, ">_<").replace(/&gt;_&gt;/g, ">_>").replace(/&lt;3/g, "<3")); // no amp
            var emotes = false;
            sentMessage = format(src, sentMessage);

            if (hasEmotesToggled(src)) {
                var simpleMessage = sentMessage;
                sentMessage = emoteFormat(true, sentMessage, src);
                if (simpleMessage !== sentMessage) {
                    emotes = true;
                }
                sentMessage = sentMessage.replace(/<_</g, "&lt;_&lt;").replace(/>_</g, "&gt;_&lt;").replace(/<3/g, "&lt;3");
            }
            message = sentMessage;

            if (!emotes) {
                if (lolmode) {
                    message = lolmessage(message);
                }

                if (spacemode) {
                    message = message.split("").join(" ");
                }

                if (capsmode) {
                    message = message.toUpperCase();
                }

                if (reversemode) {
                    message = message.split("").reverse().join("");
                }

                if (scramblemode) {
                    message = Utils.fisheryates(message.split("")).join("");
                }

                if (colormode) {
                    message = colormodemessage(message);
                }
            }

            var sendStr = "<font color=" + Utils.nameColor(src) + "><timestamp/><b>" + Utils.escapeHtml(sys.name(src)) + ": </b></font>" + message;
            if (sys.auth(src) > 0 && sys.auth(src) < 4) {
                sendStr = "<font color=" + Utils.nameColor(src) + "><timestamp/>+<i><b>" + Utils.escapeHtml(sys.name(src)) + ": </b></i></font>" + message;
            }

            if (pewpewpew) {
                sendStr = pewpewpewmessage(originalMessage);
            } else if (nightclub) {
                sendStr = "<" + src + ">" + Utils.nightclub.rainbowify("(" + sys.name(src) + "): " + originalMessage);
            }

            sys.stopEvent();
            sys.sendHtmlAll(sendStr, chan);

            if (chan !== watch) {
                Utils.watch.message(src, "Message", originalMessage, chan);
            }

            script.afterChatMessage(src, originalMessage, chan);
        },

        beforeLogOut: function (src) {
            var user = SESSION.users(src);

            if (sys.numPlayers() < 30 && !user.autokick) {
                Utils.logoutMessage(Utils.escapeHtml(sys.name(src)), Utils.nameColor(src));
                Utils.watch.notify(Utils.nameIp(src) + " logged out.");
            }
        },
        afterChangeTeam: function (src) {
            if (Utils.hasIllegalChars(sys.name(src))) {
                aliasKick(sys.ip(src));
                return;
            }

            for (var team = 0; team < sys.teamCount(src); team++) {
                if (!Utils.tier.hasOneUsablePoke(src, team) && !Utils.tier.isCCTier(sys.tier(src, team))) {
                    bot.sendMessage(src, "Sorry, you do not have a valid team for the " + sys.tier(src, team) + " tier.");
                    bot.sendMessage(src, "You have been placed into 'Challenge Cup'.");
                    sys.changeTier(src, team, "Challenge Cup");
                }
            }

            var drizzleSwim = Utils.tier.hasDrizzleSwim(src),
                i;

            if (drizzleSwim.length > 0) {
                for (i = 0; i < drizzleSwim.length; i += 1) {
                    bot.sendMessage(src, "Sorry, DrizzleSwim is banned from 5th Gen OU.");
                    sys.changeTier(src, drizzleSwim[i], "5th Gen Ubers");
                }
            }
            var sandCloak = Utils.tier.hasSandCloak(src);
            if (sandCloak.length > 0) {
                for (i = 0; i < sandCloak.length; i += 1) {
                    bot.sendMessage(src, "Sorry, Sand Veil & Snow Cloak are only usable in 5th Gen Ubers.");
                    sys.changeTier(src, sandCloak[i], "5th Gen Ubers");
                }
            }

            var myUser = SESSION.users(src);

            myUser.originalName = sys.name(src);

            script.megauserCheck(src);
            if (typeof myUser.teamChanges === 'undefined') {
                myUser.teamChanges = 0;
            }

            myUser.teamChanges += 1;

            var teamChanges = myUser.teamChanges;
            var ip = sys.ip(src);

            if (!teamSpammers) {
                teamSpammers = {};
            }

            if (teamChanges > 2) {
                if (typeof teamSpammers[ip] === "undefined") {
                    teamSpammers[ip] = 0;

                    sys.setTimer(function () {
                        if (typeof teamSpammers[ip] !== "undefined") {
                            teamSpammers[ip] = 1;

                            if (teamSpammers[ip] <= 0) {
                                delete teamSpammers[ip];
                            }
                        }
                    }, 40 * 1000, false);

                } else if (teamSpammers[ip] === 0) {
                    teamSpammers[ip] = 1;
                    watchbot.sendAll("Alert: Possible team spammer " + Utils.nameIp(src) + ". Kicked for now.", watch);
                    Utils.mod.kick(src);

                    sys.setTimer(function () {
                        if (typeof teamSpammers[ip] !== "undefined") {
                            teamSpammers[ip] = 1;

                            if (teamSpammers[ip] <= 0) {
                                delete teamSpammers[ip];
                            }
                        }
                    }, 180 * 1000, false);

                    return;
                } else {
                    watchbot.sendAll("Team spammer found: " + Utils.nameIp(src) + ". Banning.", watch);
                    ban(sys.name(src));
                    delete teamSpammers[ip];
                    return;
                }
            }

            sys.setTimer(function () {
                var user = SESSION.users(src);

                if (user) {
                    user.teamChanges -= 1;
                }
            }, 5 * 1000, false);

            watchbot.sendAll(Utils.nameIp(src) + " changed teams.", watch);
        },
        beforePlayerKick: function (src, bpl) {
            sys.stopEvent();
            if (Utils.getAuth(bpl) >= Utils.getAuth(src)) {
                bot.sendMessage(src, "You may not kick this person!");
                return;
            } else {
                var theirmessage = Kickmsgs[Utils.realName(src).toLowerCase()];
                var msg = (theirmessage) ? theirmessage.message : "<font color='navy'><timestamp/><b>" + sys.name(src) + " kicked " + Utils.escapeHtml(sys.name(bpl)) + "!</font></b>";
                if (theirmessage) {
                    msg = msg.replace(/\{Target\}/gi, sys.name(bpl));
                }

                sys.sendHtmlAll(msg, 0);
                Utils.watch.notify(Utils.nameIp(src) + " kicked " + Utils.nameIp(bpl) + ".");
                Utils.mod.kick(bpl);
            }
        },
        beforePlayerBan: function (src, bpl, time) {
            sys.stopEvent();

            if (Utils.getAuth(bpl) >= Utils.getAuth(src)) {
                bot.sendMessage(src, "You may not ban this person!");
                return;
            }

            var targetName = sys.name(bpl), timeString;
            var banMessage = Banmsgs[Utils.realName(src).toLowerCase()];

            if (banMessage) {
                banMessage = banMessage.replace(/\{Target\}/gi, targetName);
            }

            if (time) {
                // Temporary ban.
                // Time is in minutes, and getTimeString expects seconds.
                timeString = Utils.getTimeString(time * 60);
                if (banMessage) {
                    sys.sendHtmlAll(banMessage, 0);
                } else {
                    sys.sendHtmlAll("<font color=blue><timestamp/><b>" + sys.name(src) + " banned " + Utils.escapeHtml(targetName) + " for " + timeString + "!</font></b>", 0);
                }

                Utils.watch.notify(Utils.nameIp(src) + " banned " + Utils.nameIp(bpl) + " for " + timeString + ".");
                tempBan(targetName, time);
            } else {
                // Permanent ban.
                if (banMessage) {
                    sys.sendHtmlAll(banMessage, 0);
                } else {
                    sys.sendHtmlAll("<font color=blue><timestamp/><b>" + sys.name(src) + " banned " + Utils.escapeHtml(targetName) + "!</font></b>", 0);
                }

                Utils.watch.notify(Utils.nameIp(src) + " banned " + Utils.nameIp(bpl) + ".");
                ban(targetName);
            }
        },
        beforeChallengeIssued: function (src, dest) {
            /*var tier = sys.hasTier(src, "Dream World");
            if (tier) {
                if (script.dreamAbilityCheck(src) || script.dreamAbilityCheck(dest)) {
                    sys.stopEvent();
                    return;
                }
            }*/

            Utils.watch.notify(Utils.nameIp(src) + " challenged " + Utils.nameIp(dest) + ".");

            if (tourmode === 2) {
                var name1 = sys.name(src);
                var name2 = sys.name(dest);
                if (script.isInTourney(name1)) {
                    if (script.isInTourney(name2)) {
                        if (script.tourOpponent(name1) !== name2.toLowerCase()) {
                            bot.sendMessage(src, "This guy isn't your opponent in the tourney.");
                            sys.stopEvent();
                            return;
                        }
                    } else {
                        bot.sendMessage(src, "This guy isn't your opponent in the tourney.");
                        sys.stopEvent();
                        return;
                    }
                    if (!sys.hasTier(src, tourtier) || !sys.hasTier(sys.id(name2), tourtier)) {
                        bot.sendMessage(src, "You must be both in the tier " + tourtier + " to battle in the tourney.");
                        sys.stopEvent();
                        return;
                    }
                } else {
                    if (script.isInTourney(name2)) {
                        bot.sendMessage(src, "This guy is in the tournament and you are not, so you can't battle him/her.");
                        sys.stopEvent();
                        return;
                    }
                }
            }
        },
        beforeBattleMatchup: function (src, dest, clauses, rated, mode, team1, team2) {
            /*var tier = sys.hasTier(src, sys.tier(team1)),
                desttier = sys.hasTier(dest, sys.tier(team2));
            if (tier && desttier) {
                if (script.dreamAbilityCheck(src) || script.dreamAbilityCheck(dest)) {
                    sys.stopEvent();
                }
            }*/

            Utils.watch.notify(Utils.nameIp(src) + " got matched up via Find Battle with " + Utils.nameIp(dest));

            if (tourmode === 2 && (script.isInTourney(sys.name(src)) || script.isInTourney(sys.name(dest)))) {
                sys.stopEvent();
                return;
            }
        },
        afterChatMessage: function (src, message, chan) {
            if (!SESSION.channels(chan).bots) {
                return;
            }

            var time = +sys.time();
            var srcip = sys.ip(src);
            var poUser = SESSION.users(src),
                limit,
                ignoreFlood = Utils.checkFor(FloodIgnore, sys.name(src)),
                auth = Utils.getAuth(src);

            if (auth < 1 && !ignoreFlood) {
                if (poUser.floodCount < 0) {
                    poUser.floodCount = 0;
                }

                poUser.floodCount += 1;

                sys.setTimer(function () {
                    var user = SESSION.users(src);

                    if (user) {
                        user.floodCount -= 1;
                    }

                }, 8 * 1000, false);

                limit = (chan === testchan ? 18 : 7);

                if (poUser.floodCount > limit && !poUser.muted) {
                    watchbot.sendAll(Utils.nameIp(src) + " was kicked and muted for flooding in " + ChannelLink(sys.channel(chan)) + ".", watch);
                    flbot.sendAll(sys.name(src) + " was kicked and muted for flooding.", chan);
                    poUser.muted = true;
                    Mutes[srcip] = {
                        "by": flbot.name,
                        "mutedname": sys.name(src),
                        "reason": "Flooding.",
                        "time": time + 300
                    };
                    Utils.mod.kick(src);
                    return;
                }
            }

            if (Utils.isMCaps(message) && auth < 1 && !ignoreFlood) {
                poUser.caps += 1;

                limit = (chan === testchan ? 15 : 6);

                if (poUser.caps >= limit && !poUser.muted) {
                    capsbot.sendAll(sys.name(src) + " was muted for 5 minutes for CAPS.", 0);
                    poUser.muted = true;
                    Mutes[srcip] = {
                        "by": capsbot.name,
                        "mutedname": sys.name(src),
                        "reason": "Caps.",
                        "time": time + 300
                    };
                }
            } else if (poUser.caps > 0) {
                poUser.caps -= 1;
            }
        }
    };

    module.reload = function () {
        commands = require('commands.js');
        return true;
    };
}());
