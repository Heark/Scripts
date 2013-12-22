(function () {
    var commands = {};
    var disabledCmds = [];
    function addCommand(authLevel, name, callback, flags) {
        // Proper checks
        if (typeof authLevel !== "number") {
            print("Error: command " + name + " doesn't have a minimum authlevel.");
            return;
        }

        if ((typeof name !== "string") && (typeof name !== "object")) {
            print("Error: unknown command without name.");
            return;
        }

        if (typeof callback !== "function") {
            print("Error: command " + name + " doesn't have a callback.");
            return;
        }

        var names = [].concat(name),
            len,
            i;

        for (i = 0, len = names.length; i < len; i += 1) {
            commands[names[i]] = {
                'authLevel': authLevel,
                'callback': callback,
                'flags': flags || 0
            };
        }
    }

    addCommand.flags = {
        MAINTAINERS: 1
    };

    // Shorthands
    function addListCommand(auth, names, listname, cb, flags) {
        addCommand(auth, names, function (src, command, commandData, tar, chan) {
            if (cb) {
                if (!cb.call(this, src, command, commandData, tar, chan)) {
                    return;
                }
            }

            Lists[listname].display(src, chan);
        }, flags);
    }

    function addMaintainerCommand(names, cb) {
        addCommand(3, names, cb, addCommand.flags.MAINTAINERS);
    }

    function canUseCommand(src, command) {
        if (!commands.hasOwnProperty(command)) {
            throw "The command " + command + " doesn't exist.";
        }
        var srcauth = Utils.getAuth(src),
            name = SESSION.users(src).originalName,
            cmd = commands[command];
        if (disabledCmds.indexOf(command.toLowerCase()) > -1 && srcauth < 3) {
            throw "The command " + command + " has been disabled.";
        }

        if ((cmd.flags & addCommand.flags.MAINTAINERS) && Config.maintainers.indexOf(name) !== -1) {
            return true;
        }

        if (cmd.authLevel && cmd.authLevel > srcauth) {
            throw "You need to be a higher auth to use this command.";
        }
        return true;
    }

    function handleCommand(src, message, command, commandData, tar, chan) {
        var poUser = SESSION.users(src),
            isMuted = poUser.muted,
            originalName = poUser.originalName,
            isLManager = Leaguemanager === originalName.toLowerCase(),
            myAuth = Utils.getAuth(src);

        var cmd = commands[command];
        if (typeof cmd.callback === "function") {
            cmd.callback.call(
                {
                    poUser: poUser,
                    isMuted: isMuted,
                    originalName: originalName,
                    isLManager: isLManager,
                    myAuth: myAuth
                },
                src,
                command,
                commandData,
                tar,
                chan
            );
        }
    }

    /** USER COMMANDS */
    addListCommand(0, "commands", "Commands");
    addListCommand(0, "usercommands", "User");
    addListCommand(0, "funcommands", "Fun");
    addListCommand(0, "tourusercommands", "Tour");
    addListCommand(0, "megausercommands", "Megauser", function () {
        if (!this.poUser.megauser && this.myAuth < 1) {
            bot.sendMessage(src, "You need to be a megauser to view these.", chan);
            return false;
        }
    });
    addListCommand(0, "leaguemanagercommands", "LeagueManager", function (src, command, commandData, tar, chan) {
        if (!this.isLManager) {
            bot.sendMessage(src, 'You need to be a league manager to view these!', chan);
            return false;
        }
    });

    addCommand(0, "vote", function (src, command, commandData, tar, chan) {
        if (!Poll.active) {
            return bot.sendMessage(src, "There is no poll right now.", chan);
        }

        var option = parseInt(commandData, 10) - 1;
        if (!Poll.options[option]) {
            return bot.sendMessage(src, "There is no such option as " + (option + 1) + " available.", chan);
        }

        var ip = sys.ip(src);
        bot.sendMessage(src, "You voted for option #" + (option + 1) + ": " + Poll.options[option], chan);

        if (ip in Poll.votes) {
            bot.sendAll(sys.name(src) + " changed their vote!", chan);
        } else {
            bot.sendAll(sys.name(src) + " voted!", chan);
        }

        Poll.votes[ip] = option;
    });

    addCommand(0, "burn", function (src, command, commandData, tar, chan) {
        if (!tar) {
            bot.sendMessage(src, "Target doesn't exist!", chan);
            return;
        }
        sys.sendHtmlAll("<img src=Themes/Classic/status/battle_status4.png><b><font color=red><font size=3>" + Utils.escapeHtml(sys.name(tar)) + " was burned by " + Utils.escapeHtml(sys.name(src)) + " <img src=Themes/Classic/status/battle_status4.png>", chan);
    });

    addCommand(0, "freeze", function (src, command, commandData, tar, chan) {
        if (!tar) {
            bot.sendMessage(src, "Target doesn't exist!", chan);
            return;
        }
        sys.sendHtmlAll("<img src=Themes/Classic/status/battle_status3.png><b><font color=blue><font size=3> " + Utils.escapeHtml(sys.name(tar)) + " was frozen by " + Utils.escapeHtml(sys.name(src)) + " <img src=Themes/Classic/status/battle_status3.png>", chan);
    });

    addCommand(0, "paralyze", function (src, command, commandData, tar, chan) {
        if (!tar) {
            bot.sendMessage(src, "Target doesn't exist!", chan);
            return;
        }
        sys.sendHtmlAll("<img src=Themes/Classic/status/battle_status1.png><b><font color='#C9C909'><font size=3> " + Utils.escapeHtml(sys.name(tar)) + " was paralyzed by " + Utils.escapeHtml(sys.name(src)) + " <img src=Themes/Classic/status/battle_status1.png>", chan);
    });

    addCommand(0, "poison", function (src, command, commandData, tar, chan) {
        if (!tar) {
            bot.sendMessage(src, "Target doesn't exist!", chan);
            return;
        }
        sys.sendHtmlAll("<img src=Themes/Classic/status/battle_status5.png><b><font color=Purple><font size=3> " + Utils.escapeHtml(sys.name(tar)) + " was poisoned by " + Utils.escapeHtml(sys.name(src)) + " <img src=Themes/Classic/status/battle_status5.png>", chan);
    });

    addCommand(0, "cure", function (src, command, commandData, tar, chan) {
        if (!tar) {
            bot.sendMessage(src, "Target doesn't exist!", chan);
            return;
        }
        sys.sendHtmlAll("<img src=Themes/Classic/status/battle_status2.png><b><font color=Black><font size=3> " + Utils.escapeHtml(sys.name(tar)) + " was put to sleep and cured of all status problems by " + Utils.escapeHtml(sys.name(src)) + " <img src=Themes/Classic/status/battle_status2.png>", chan);
    });

    addCommand(0, "league", function (src, command, commandData, tar, chan) {
        var League = new CommandList("<font color=red>League</font>", "navy", "");
        League.template += "<h2><font color=green>~~Gyms~~</font></h2><ol>";

        var Gym1 = Reg.get("Gym1"),
            Gym2 = Reg.get("Gym2"),
            Gym3 = Reg.get("Gym3"),
            Gym4 = Reg.get("Gym4"),
            Gym5 = Reg.get("Gym5"),
            Gym6 = Reg.get("Gym6"),
            Gym7 = Reg.get("Gym7"),
            Gym8 = Reg.get("Gym8"),
            Elite1 = Reg.get("Elite1"),
            Elite2 = Reg.get("Elite2"),
            Elite3 = Reg.get("Elite3"),
            Elite4 = Reg.get("Elite4"),
            Champ = Reg.get("Champ");

        League.add(Gym1 || "Open");
        League.add(Gym2 || "Open");
        League.add(Gym3 || "Open");
        League.add(Gym4 || "Open");
        League.add(Gym5 || "Open");
        League.add(Gym6 || "Open");
        League.add(Gym7 || "Open");
        League.add(Gym8 || "Open");

        League.template += "</ol><br><h2><font color=blue>**Elite 4**</font></h2><ol>";

        League.add(Elite1 || "Open");
        League.add(Elite2 || "Open");
        League.add(Elite3 || "Open");
        League.add(Elite4 || "Open");

        League.template += "</ol><br><h2><font color=red>±±The Champion±±</font></h2><ul><b>" + (Champ || "Open") + "</b></ul>";

        League.finish();
        League.display(src, chan);
        sys.sendHtmlMessage(src, '<i><b><font color=blue>Type /leaguerules to see the rules of the league!</font>', chan);
    });

    addListCommand(0, "leaguerules", "LeagueRules");

    addCommand(0, "superimp", function (src, command, commandData, tar, chan) {
        if (commandData === "Server") {
            bot.sendMessage(src, "You may not superimp ~~Server~~!", chan);
            return;
        }
        if (commandData.length > 20) {
            bot.sendMessage(src, "The name is " + Number(commandData.length - 20) + " characters too long.", chan);
            return;
        }
        if (tar) {
            bot.sendMessage(src, "It appears as if your target does not appreciate being impersonated.", chan);
            return;
        }

        var displayImp = Utils.escapeHtml(commandData);
        sys.sendHtmlAll('<font color=#8A2BE2><timestamp/><b>' + Utils.escapeHtml(sys.name(src)) + ' has super-impersonated ' + displayImp + '!</font></b>', 0);
        Utils.watch.notify(Utils.nameIp(src) + " super-impersonated <b style='color: " + Utils.nameColor(src) + "'>~~" + displayImp + "~~</b>.");

        sys.changeName(src, '~~' + commandData + '~~');
    });

    addCommand(0, ["impoff", "unimp"], function (src, command, commandData, tar, chan) {
        if (sys.name(src) === this.originalName) {
            bot.sendMessage(src, "You aren't imping!", chan);
            return;
        }

        sys.sendHtmlAll('<font color=#8A2BE2><timestamp/><b>' + this.originalName + ' changed their name back!</font></b>', 0);
        Utils.watch.notify(Utils.nameIp(src) + " changed their name back to <b style='color: " + Utils.nameColor(src) + "'>" + this.originalName + "</b>.");
        sys.changeName(src, this.originalName);
    });

    addCommand(0, ["selfkick", "ghostkick", "sk"], function (src, command, commandData, tar, chan) {
        var xlist, c;
        var ip = sys.ip(src);
        var playerIdList = sys.playerIds(),
            ghosts = 0;
        for (xlist in playerIdList) {
            c = playerIdList[xlist];
            if (c !== src && ip === sys.ip(c)) {
                sys.kick(c);
                ghosts += 1;
            }
        }
        bot.sendMessage(src, ghosts + " ghosts were kicked.", chan);
    });

    addCommand(0, "me", function (src, command, commandData, tar, chan) {
        if (commandData === undefined) {
            bot.sendMessage(src, "You must post a message.", chan);
            return;
        }
        var color = Utils.nameColor(src);
        var name = sys.name(src);
        sys.sendHtmlAll("<font color=" + color + "><timestamp/><b><i>*** " + Utils.escapeHtml(name) + " " + Utils.escapeHtml(commandData) + " ***</font></b></i>", chan);
    });

    addListCommand(0, "rules", "Rules");
    addListCommand(0, "emotes", "Emotes");

    addCommand(0, "scriptinfo", function (src, command, commandData, tar, chan) {
        sys.sendHtmlMessage(src, "<br><font color=red><timestamp/><b> ««««««««««««««««««««»»»»»»»»»»»»»»»»»»»»</b></font><br><font color=black><timestamp/><b>Meteor Falls™ v0.9 Scripts</b></font><br><font color=blue><timestamp/><b>Created By:</b></font> <b><font color=navy>[VP]Blade,</font> <font color=#00aa7f>TheUnknownOne,</font> <font color=black>Ethan</b></font> <br><font color=green><timestamp/><b>Full Script: <a href='https://raw.github.com/meteor-falls/Scripts/master/scripts.js'>https://raw.github.com/meteor-falls/Scripts/master/scripts.js</a></b></font><br><font color=darkorange><timestamp/><b>WebCall Script:</font> <b><a href='https://raw.github.com/meteor-falls/Scripts/master/webcall.js'>https://raw.github.com/meteor-falls/Scripts/master/webcall.js</a></b><br><font color=navy><timestamp/><b>Special Thanks To:</b></font> <b><font color=#8A2BE2>Lutra,</font> <font color=navy>Max</b></font><br><font color=black><timestamp/><b> © Meteor Falls 2013 [WTFPL] </b></font><br><font color=red><timestamp/><b> ««««««««««««««««««««»»»»»»»»»»»»»»»»»»»»</b></font><br>", chan);
    });

    addCommand(0, ["calc", "calculate", "calculator"], function (src, command, commandData, tar, chan) {
        if (!mathjs) {
            require.reload('mathjs.js');
        }

        var res;
        try {
            res = mathjs.eval(commandData);

            bot.sendMessage(src, Utils.escapeHtml("The result of '" + commandData + "' is:"), chan);
            bot.sendMessage(src, Utils.escapeHtml(res.toString()), chan);
        } catch (ex) {
            bot.sendMessage(src, "Error in parsing your expression (" + Utils.escapeHtml(commandData) + ").", chan);
            bot.sendMessage(src, ex, chan);
        }
    });

    addCommand(0, ["bbcode", "bbcodes"], function (src, command, commandData, tar, chan) {
        var BB = new CommandList("BB Code List", "navy", "Type in these BB Codes to use them:");
        var formatBB = function (m) {
            return m + " <b>-</b> " + format(0, m);
        };

        BB.add(formatBB("[b]Bold[/b]"));
        BB.add(formatBB("[i]Italics[/i]"));
        BB.add(formatBB("[s]Strike[/s]"));
        BB.add(formatBB("[u]Underline[/u]"));
        BB.add(formatBB("[sub]Subscript[/sub]"));
        BB.add(formatBB("[sup]Superscript[/sup]"));
        BB.add(formatBB("[code]Code[/code]"));
        BB.add(formatBB("[color=red]Any color[/color]"));
        BB.add(formatBB("[face=arial]Any font[/face] or [font=arial]Any font[/font]"));
        BB.add(formatBB("[spoiler]Spoiler[/spoiler]"));
        BB.add(formatBB("[link]Link[/link]"));
        BB.add("[time]A timestamp - <timestamp/>");

        if (hasBasicPermissions(src)) {
            BB.add(formatBB("[pre]Preformatted text[/pre]"));
            BB.add(formatBB("[size=5]Any size[/size]"));
            BB.add("[br]Skips a line");
            BB.add("[hr]Makes a long, solid line - <hr>");
            BB.add("[ping]Pings everybody");
        }

        BB.finish();
        BB.display(src, chan);
    });
    addCommand(0, ["sendto", "ping"], function (src, command, commandData, tar, chan) {
        var r = commandData.split(':');
        var mess = Utils.cut(r, 1, ':');

        tar = sys.id(r[0]);

        if (!tar) {
            bot.sendMessage(src, "Must send the message to a real person!", chan);
            return;
        }

        if (!mess || command === "ping") {
            bot.sendMessage(src, "Your ping was sent to " + Utils.escapeHtml(r[0]) + "!", chan);
            bot.sendMessage(tar, "<ping/>" + Utils.escapeHtml(sys.name(src)) + " has sent you a ping!", chan);
            return;
        }

        mess = Utils.escapeHtml(mess);
        if (this.myAuth > 0 && hasEmotesToggled(src)) {
            mess = emoteFormat(true, mess);
        }

        bot.sendMessage(src, "Your message was sent!", chan);
        bot.sendMessage(tar, '<ping/>' + Utils.escapeHtml(sys.name(src)) + ' sent you a message! The message says: ' + mess);
    });
    addCommand(0, "auth", function (src, command, commandData, tar, chan) {
        var authlist = sys.dbAuths().sort();
        var x;

        sys.sendHtmlMessage(src, "<font color=navy><b>»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»</b></font><br><font color=black><h2>Auth List</h2>", chan);
        sys.sendHtmlMessage(src, "<b><font color=red>**Owners**", chan);

        for (x in authlist) {
            if (sys.dbAuth(authlist[x]) === 3) {
                if (!sys.id(authlist[x])) {
                    sys.sendHtmlMessage(src, "<img src='Themes/Classic/client/OAway.png'><b><font color=black><font size=2> " + authlist[x], chan);
                } else {
                    sys.sendHtmlMessage(src, "<img src='Themes/Classic/client/OAvailable.png'><b><font color=black><font size=2> " + sys.name(sys.id(authlist[x])), chan);
                }
            }
        }

        sys.sendMessage(src, "", chan);
        sys.sendHtmlMessage(src, "<b><font color=blue><font size=3>**Administrators**", chan);

        for (x in authlist) {
            if (sys.dbAuth(authlist[x]) === 2) {
                if (!sys.id(authlist[x])) {
                    sys.sendHtmlMessage(src, "<img src='Themes/Classic/client/AAway.png'><b><font color=black><font size=2> " + authlist[x], chan);
                } else {
                    sys.sendHtmlMessage(src, "<img src='Themes/Classic/client/AAvailable.png'><b><font color=black><font size=2> " + sys.name(sys.id(authlist[x])), chan);
                }
            }
        }
        sys.sendMessage(src, "", chan);
        sys.sendHtmlMessage(src, "<b><font color=green><font size=3>**Moderators**", chan);

        for (x in authlist) {
            if (sys.dbAuth(authlist[x]) === 1) {
                if (!sys.id(authlist[x])) {
                    sys.sendHtmlMessage(src, "<img src='Themes/Classic/client/MAway.png'><b><font color=black><font size=2> " + authlist[x], chan);
                } else {
                    sys.sendHtmlMessage(src, "<img src='Themes/Classic/client/MAvailable.png'><b><font color=black><font size=2> " + sys.name(sys.id(authlist[x])), chan);
                }
            }
        }
        sys.sendMessage(src, "", chan);
        sys.sendHtmlMessage(src, "<font color=navy><b>»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»</b></font>", chan);
    });
    addCommand(0, "join", function (src, command, commandData, tar, chan) {
        if (tourmode !== 1) {
            bot.sendMessage(src, "Sorry, you are unable to join because a tournament is not currently running or has passed the signups phase.", chan);
            return;
        }
        var name = sys.name(src).toLowerCase();
        if (tourips.indexOf(sys.ip(src)) !== -1) {
            bot.sendMessage(src, "Sorry, you are already in the tournament. You are not able to join more than once.", chan);
            return;
        }
        var srctier = sys.hasTier(src, tourtier);
        if (!srctier) {
            bot.sendMessage(src, "You are currently not battling in the " + tourtier + " tier. Change your tier to " + tourtier + " to be able to join.", chan);
            return;
        }
        if (script.tourSpots() > 0) {
            tourmembers.push(name);
            tourips.push(sys.ip(src));
            tourplayers[name] = sys.name(src);
            sys.sendHtmlAll("<font color=blue><timestamp/><b>" + Utils.escapeHtml(sys.name(src)) + " joined the tournament! " + script.tourSpots() + " more spot(s) left!</b></font>", 0);
            if (script.tourSpots() === 0) {
                tourmode = 2;
                roundnumber = 0;
                script.roundPairing();
            }
        }
    });
    addCommand(0, "viewround", function (src, command, commandData, tar, chan) {
        if (tourmode !== 2) {
            bot.sendMessage(src, "Sorry, you are unable to view the round because a tournament is not currently running or is in signing up phase.", chan);
            return;
        }
        var myStr;
        var finals = isFinals;
        var i;

        if (finals) {
            myStr = "<center><table width=50% bgcolor=black><tr style='background-image:url(Themes/Classic/battle_fields/new/hH3MF.jpg)'><td align=center><br/><font style='font-size:20px; font-weight:bold;'>Finals of <i style='color:red; font-weight:bold;'>" + tourtier + "</i> tournament:</font><hr width=300/>";
        } else {
            myStr = "<center><table width=50% bgcolor=black><tr style='background-image:url(Themes/Classic/battle_fields/new/hH3MF.jpg)'><td align=center><br/><font style='font-size:20px; font-weight:bold;'>Round <i>" + roundnumber + "</i> of <i style='color:red; font-weight:bold;'>" + tourtier + "</i> tournament!</font><hr width=300/>";
        }

        if (battlesLost.length > 0) {
            myStr += "<br><b><u>Battles Finished:</u></b><br>";
            for (i = 0; i < battlesLost.length; i += 2) {
                myStr += battlesLost[i] + " won against " + battlesLost[i + 1] + "<br>";
            }
            myStr += "<br>";
        }
        if (tourbattlers.length > 0) {
            if (battlesStarted.indexOf(true) !== -1) {
                myStr += "<br><b><u>Ongoing battles:</u></b><br>";
                for (i = 0; i < tourbattlers.length; i += 2) {
                    if (battlesStarted[i / 2] === true) {
                        myStr += tourplayers[tourbattlers[i]] + " VS " + tourplayers[tourbattlers[i + 1]] + "<br>";
                    }
                }
                myStr += "<br>";
            }
            if (battlesStarted.indexOf(false) !== -1) {
                myStr += "<br><b><u>Yet to start battles:</u></b><br>";
                for (i = 0; i < tourbattlers.length; i += 2) {
                    if (battlesStarted[i / 2] === false) {
                        myStr += tourplayers[tourbattlers[i]] + " VS " + tourplayers[tourbattlers[i + 1]] + "<br>";
                    }
                }
            }
        }
        if (tourmembers.length > 0) {
            myStr += "<br><b><u>Members to the next round:</u></b><br>";
            var str = "",
                x;

            for (x in tourmembers) {
                myStr += (str.length === 0 ? "" : ", ") + tourplayers[tourmembers[x]] + "<br>";
            }
        }
        sys.sendHtmlMessage(src, myStr, chan);
    });
    addCommand(0, "unjoin", function (src, command, commandData, tar, chan) {
        if (tourmode === 0) {
            bot.sendMessage(src, "Wait till the tournament has started.", chan);
            return;
        }
        var name2 = sys.name(src).toLowerCase();
        if (tourmembers.indexOf(name2) !== -1) {
            tourmembers.splice(tourmembers.indexOf(name2), 1);
            tourips.splice(tourips.indexOf(sys.ip(src)), 1);
            delete tourplayers[name2];
            sys.sendHtmlAll("<font color=red><timestamp/><b>" + this.originalName + " left the tournament!</b></font>", 0);
            return;
        }
        if (tourbattlers.indexOf(name2) !== -1) {
            battlesStarted[Math.floor(tourbattlers.indexOf(name2) / 2)] = true;
            sys.sendHtmlAll("<font color=red><timestamp/><b>" + this.originalName + " left the tournament!</b></font>", 0);
            script.tourBattleEnd(script.tourOpponent(name2), name2);
        }
    });
    addCommand(0, "tourtier", function (src, command, commandData, tar, chan) {
        if (tourmode === 0) {
            bot.sendMessage(src, "Wait till the tournament has started.", chan);
            return;
        }
        bot.sendMessage(src, 'The tier of the current tournament is ' + tourtier + '!', chan);
    });
    addCommand(0, "attack", function (src, command, commandData, tar, chan) {
        function randomColor(text) {
            var randColors = ["blue", "darkblue", "green", "darkgreen", "red", "darkred", "orange", "skyblue", "purple", "violet", "black", "lightsteelblue", "navy", "burlywood", "DarkSlateGrey", "darkviolet", "Gold", "Lawngreen", "silver"];

            var selectedColor = sys.rand(0, randColors.length);

            return "<font color='" + randColors[selectedColor] + "'>" + text + "</font>";
        }

        if (!tar) {
            bot.sendMessage(src, 'Target doesn\'t exist!', chan);
            return;
        }

        var move = sys.rand(1, 559);
        sys.sendHtmlAll("<font color=green><timestamp/><b><i><font color=green>+AttackBot: </i></font><b><font color=" + Utils.nameColor(src) + ">" + Utils.escapeHtml(sys.name(src)) + " </b><font color=black>has used <b>" + randomColor(sys.move(move)) + " </b><font color=black>on <b><font color=" + Utils.nameColor(tar) + ">" + Utils.escapeHtml(sys.name(tar)) + "!</font>", chan);
    });
    addCommand(0, "emotetoggle", function (src, command, commandData, tar, chan) {
        if (this.myAuth < 1 && !hasEmotePerms(sys.name(src))) {
            bot.sendMessage(src, "You cannot use emotes.", chan);
            return;
        }
        var word = (hasEmotesToggled(src)) ? "off" : "on";
        bot.sendMessage(src, "Emotes are now toggled " + word + ".", chan);
        if (hasEmotesToggled(src)) {
            delete Emotetoggles[sys.name(src).toLowerCase()];
        } else {
            Emotetoggles[sys.name(src).toLowerCase()] = true;
        }
        Reg.save("Emotetoggles", Emotetoggles);
    });
    addCommand(0, "spin", function (src, command, commandData, tar, chan) {
        if (!rouletteon) {
            bot.sendMessage(src, "Roulette has been turned off!", chan);
            return;
        }
        var num = sys.rand(1, 279);
        var numb = sys.rand(1, 646);
        var emotes = Object.keys(EmoteList);
        emotes.splice(emotes.indexOf("__display__"), 1);

        var randomEmote = emotes[Math.floor(Math.random() * emotes.length)];

        var possibilities = [];

        if (spinTypes.indexOf('pokemons') !== -1) {
            possibilities.push("<b><font color=" + Utils.nameColor(src) + ">" + Utils.escapeHtml(sys.name(src)) + "</b></font> has spun a <font color=gray><b>" + sys.rand(1, 9002) + "</b></font> and won a <b><font color=red>" + sys.nature(sys.rand(1, 25)) + "</b></font> <b><font color=blue>" + sys.pokemon(numb) + "!<img src='icon:" + numb + "'></b></font>");
        }

        if (spinTypes.indexOf('items') !== -1) {
            possibilities.push("<b><font color=" + Utils.nameColor(src) + ">" + sys.name(src) + "</b></font> has spun a <font color=gray><b>" + sys.rand(1, 9002) + "</b></font> and won <b><font color=red>" + sys.item(num) + "! <img src='item:" + num + "'></b></font>");
        }

        if (spinTypes.indexOf('emotes') !== -1) {
            possibilities.push("<b><font color=" + Utils.nameColor(src) + ">" + sys.name(src) + "</b></font> has spun a <font color=gray><b>" + sys.rand(1, 9002) + "</b></font> and won " + EmoteList[randomEmote] + "!");
        }

        if ((spinTypes.indexOf('avatars') !== -1) || (spinTypes.indexOf('trainers') !== -1)) {
            possibilities.push("<b><font color=" + Utils.nameColor(src) + ">" + sys.name(src) + "</b></font> has spun a <font color=gray><b>" + sys.rand(1, 9002) + "</b></font> and won <img src='trainer:" + sys.rand(1, 301) + "'>!");
        }

        sys.sendHtmlAll("<font color=navy><timestamp/><b>±RouletteBot:</b></font> " + possibilities[sys.rand(0, possibilities.length)], chan);
    });

    addCommand(0, "megausers", function (src, command, commandData, tar, chan) {
        var keys = Object.keys(MegaUsers),
            list;

        if (keys.length === 0) {
            bot.sendMessage(src, "There are no megausers.", chan);
            return;
        }

        list = new TableList("Megausers", "cornflowerblue", 2, 5, "navy");
        list.addEvery(keys, false, 10);
        list.finish();
        list.display(src, chan);
    });

    addCommand(0, "floodignorelist", function (src, command, commandData, tar, chan) {
        var keys = Object.keys(FloodIgnore),
            list;

        if (keys.length === 0) {
            bot.sendMessage(src, "There are no flood ignores.", chan);
            return;
        }

        list = new TableList("Flood Ignores", "cornflowerblue", 2, 5, "navy");
        list.addEvery(keys, false, 10);
        list.finish();
        list.display(src, chan);
    });

    addCommand(0, "emotepermlist", function (src, command, commandData, tar, chan) {
        var keys = Object.keys(Emoteperms),
            list;

        if (keys.length === 0) {
            bot.sendMessage(src, "There are no emote perm users.", chan);
            return;
        }

        list = new TableList("Emote Permission", "cornflowerblue", 2, 5, "navy");
        list.addEvery(keys, false, 10);
        list.finish();
        list.display(src, chan);
    });

    addCommand(0, "players", function (src, command, commandData, tar, chan) {
        if (commandData) {
            commandData = commandData.toLowerCase();
        }

        if (["windows", "linux", "android", "mac", "webclient"].indexOf(commandData) !== -1) {
            var count = 0;
            sys.playerIds().forEach(function (id) {
                if (sys.os(id) === commandData) {
                    count += 1;
                }
            });
            bot.sendMessage(src, "There are  " + count + " " + commandData + " players online.", chan);
            return;
        }

        bot.sendMessage(src, "There are " + sys.numPlayers() + " players online.", chan);
    });

    addCommand(0, "gl", function (src, command, commandData, tar, chan) {
        if (!this.isLManager) {
            bot.sendMessage(src, "You need to be a league manager to use this command!", chan);
            return;
        }
        var parts = commandData.split(":"),
            player = parts[0],
            spot = Math.round(Number(parts[1]));
        if (isNaN(spot) || spot < 1 || spot > 8) {
            bot.sendMessage(src, "Valid range for gym leaders is 1-8.", chan);
            return;
        }

        if (!player) {
            bot.sendAll("The gym leader " + spot + " spot has been voided.", 0);
            Reg.save("Gym" + spot, "");
            return;
        }
        bot.sendAll(player + " has been made gym leader " + spot + "!", 0);
        Reg.save("Gym" + spot, player);
    });

    addCommand(0, "el", function (src, command, commandData, tar, chan) {
        if (!this.isLManager) {
            bot.sendMessage(src, "You need to be a league manager to use this command!", chan);
            return;
        }
        var parts = commandData.split(":"),
            player = parts[0],
            spot = Math.round(Number(parts[1]));
        if (isNaN(spot) || spot < 1 || spot > 4) {
            bot.sendMessage(src, "Valid range for the elite is 1-4.", chan);
            return;
        }

        if (!player) {
            bot.sendAll("The elite " + spot + " spot has been voided.", 0);
            Reg.save("Elite" + spot, "");
            return;
        }
        bot.sendAll(player + " has been made elite " + spot + "!", 0);
        Reg.save("Elite" + spot, player);
    });

    addCommand(0, "champ", function (src, command, commandData, tar, chan) {
        if (!this.isLManager) {
            bot.sendMessage(src, "You need to be a league manager to use this command!", chan);
            return;
        }
        if (!commandData) {
            bot.sendAll("The champion spot has been voided.", 0);
            Reg.save("Champ", "");
            return;
        }
        bot.sendAll(commandData + " has been made the champion!", 0);
        Reg.save("Champ", commandData);
    });

    addCommand(0, "sub", function (src, command, commandData, tar, chan) {
        if (!this.poUser.megauser && this.myAuth < 1) {
            bot.sendMessage(src, "You need to be a higher auth to use this command!", chan);
            return;
        }
        if (tourmode !== 2) {
            bot.sendMessage(src, "Wait until a tournament starts", chan);
            return;
        }
        var players = commandData.split(':');
        if (!script.isInTourney(players[0]) && !script.isInTourney(players[1])) {
            bot.sendMessage(src, "Neither are in the tourney.", chan);
            return;
        }
        sys.sendHtmlAll("<font color=blue><timestamp/><b>" + Utils.escapeHtml(players[0]) + " and " + Utils.escapeHtml(players[1]) + " were exchanged places in the ongoing tournament by " + Utils.escapeHtml(sys.name(src)) + ".</b></font>", 0);
        var p1 = players[0].toLowerCase();
        var p2 = players[1].toLowerCase(),
            x;

        for (x in tourmembers) {
            if (tourmembers[x] === p1) {
                tourmembers[x] = p2;
            } else if (tourmembers[x] === p2) {
                tourmembers[x] = p1;
            }
        }
        for (x in tourbattlers) {
            if (tourbattlers[x] === p1) {
                tourbattlers[x] = p2;
                battlesStarted[Math.floor(x / 2)] = false;
            } else if (tourbattlers[x] === p2) {
                tourbattlers[x] = p1;
                battlesStarted[Math.floor(x / 2)] = false;
            }
        }
        if (!script.isInTourney(p1)) {
            tourplayers[p1] = players[0];
            delete tourplayers[p2];
        } else if (!script.isInTourney(p2)) {
            tourplayers[p2] = players[1];
            delete tourplayers[p1];
        }
    });

    addCommand(0, "restart", function (src, command, commandData, tar, chan) {
        if (!this.poUser.megauser && this.myAuth < 1) {
            bot.sendMessage(src, "You need to be a higher auth to use this command!", chan);
            return;
        }
        if (tourmode !== 2) {
            bot.sendMessage(src, "Wait until a tournament starts", chan);
            return;
        }
        var name = commandData.toLowerCase();
        if (tourbattlers.indexOf(name) !== -1) {
            battlesStarted[Math.floor(tourbattlers.indexOf(name) / 2)] = false;
            sys.sendHtmlAll("<font color=green><timestamp/><b>" + Utils.escapeHtml(sys.name(tar)) + "'s match was restarted by " + Utils.escapeHtml(sys.name(src)) + "!</b></font>", 0);
        }
    });

    addCommand(0, "tour", function (src, command, commandData, tar, chan) {
        if (!this.poUser.megauser && this.myAuth < 1) {
            bot.sendMessage(src, "You need to be a higher auth to use this command!", chan);
            return;
        }
        if (typeof tourmode !== "undefined" && tourmode > 0) {
            bot.sendMessage(src, "Sorry, you are unable to start a tournament because one is still currently running.", chan);
            return;
        }

        var commandpart;
        if (commandData.indexOf(':') === -1) {
            commandpart = commandData.split(' ');
        } else {
            commandpart = commandData.split(':');
        }

        tournumber = parseInt(commandpart[1], 10);
        prize = commandpart[2];
        if (isNaN(tournumber) || tournumber <= 2) {
            bot.sendMessage(src, "You must specify a tournament size of 3 or more.", chan);
            return;
        }
        var found = true;
        if (!Utils.isTier(commandpart[0])) {
            found = false;
        }

        if (!found) {
            bot.sendMessage(src, "Sorry, the server does not recognise the " + commandpart[0] + " tier.", chan);
            return;
        }
        tourtier = commandpart[0];
        tourmode = 1;
        tourmembers = [];
        tourips = [];
        tourbattlers = [];
        tourplayers = [];
        battlesStarted = [];
        battlesLost = [];
        isFinals = false;

        if (typeof prize === "undefined") {
            prize = "No prize";
        }

        sys.sendHtmlAll("<br/><center><table width=50% bgcolor=black><tr style='background-image:url(Themes/Classic/battle_fields/new/hH3MF.jpg)'><td align=center><br/><font style='font-size:20px; font-weight:bold;'>Tournament Started by <i style='color:red; font-weight:bold;'>" + Utils.escapeHtml(sys.name(src)) + "!</i></font><hr width=300/><table cellspacing=2 cellpadding=2><tr><td><b>Tier: <font style='color:red; font-weight:bold;'>" + tourtier + "</i></td></tr><tr><td><b>Players: <font style='color:red; font-weight:bold;'>" + tournumber + "</i></td></tr><tr><td><b>Prize: <font style='color:red; font-weight:bold;'>" + Utils.escapeHtml(prize) + "</i></td></tr></table><hr width=300/><center style='margin-right: 7px;'><b>Type <font color=red>/join</font> to join!<br/></td></tr></table></center><br/>", 0);
    });

    addCommand(0, "dq", function (src, command, commandData, tar, chan) {
        if (!this.poUser.megauser && this.myAuth < 1) {
            bot.sendMessage(src, "You need to be a higher auth to use this command!", chan);
            return;
        }
        if (tourmode === 0) {
            bot.sendMessage(src, "Wait till the tournament has started.", chan);
            return;
        }
        var name2 = commandData.toLowerCase();
        if (tourmembers.indexOf(name2) !== -1) {
            tourmembers.splice(tourmembers.indexOf(name2), 1);
            tourips.splice(tourips.indexOf(sys.dbIp(name2)), 1);
            delete tourplayers[name2];
            sys.sendHtmlAll("<font color=red><timestamp/><b>" + Utils.escapeHtml(commandData) + " was disqualified by " + Utils.escapeHtml(sys.name(src)) + "!</b></font>", 0);
            return;
        }
        if (tourbattlers.indexOf(name2) !== -1) {
            battlesStarted[Math.floor(tourbattlers.indexOf(name2) / 2)] = true;
            sys.sendHtmlAll("<font color=red><timestamp/><b>" + Utils.escapeHtml(commandData) + " was disqualified by " + Utils.escapeHtml(sys.name(src)) + "!</b></font>", 0);
            script.tourBattleEnd(script.tourOpponent(name2), name2);
        }
    });

    addCommand(0, "push", function (src, command, commandData, tar, chan) {
        if (!this.poUser.megauser && this.myAuth < 1) {
            bot.sendMessage(src, "You need to be a higher auth to use this command!", chan);
            return;
        }
        if (tourmode === 0) {
            bot.sendMessage(src, "Wait until the tournament has started.", chan);
            return;
        }
        if (!sys.id(commandData) && commandData.toLowerCase() !== 'sub') {
            bot.sendMessage(src, "You may only add real people or a sub!", chan);
            return;
        }
        if (script.isInTourney(commandData.toLowerCase())) {
            bot.sendMessage(src, commandData + " is already in the tournament.", chan);
            return;
        }

        if (tourmode === 2) {
            sys.sendHtmlAll("<font color=blue><timestamp/><b>" + Utils.escapeHtml(commandData) + " was added to the tournament by " + Utils.escapeHtml(sys.name(src)) + ".</b></font>", 0);

            tourmembers.push(commandData.toLowerCase());
            tourips.push(sys.dbIp(commandData));
            tourplayers[commandData.toLowerCase()] = commandData;
        } else if (tourmode === 1) {
            tourmembers.push(commandData.toLowerCase());
            tourips.push(sys.dbIp(commandData));
            tourplayers[commandData.toLowerCase()] = commandData;
            sys.sendHtmlAll("<font color=blue><timestamp/><b>" + Utils.escapeHtml(commandData) + " was added to the tournament by " + Utils.escapeHtml(sys.name(src)) + ".</b></font>", 0);
        }

        if (tourmode === 1 && script.tourSpots() === 0) {
            tourmode = 2;
            roundnumber = 0;
            script.roundPairing();
        }
    });

    addCommand(0, "changecount", function (src, command, commandData, tar, chan) {
        if (!this.poUser.megauser && this.myAuth < 1) {
            bot.sendMessage(src, "You need to be a higher auth to use this command!", chan);
            return;
        }
        if (tourmode !== 1) {
            bot.sendMessage(src, "Sorry, you are unable to join because the tournament has passed the sign-up phase.", chan);
            return;
        }
        var count = parseInt(commandData, 10);
        if (isNaN(count) || count < 3) {
            bot.sendMessage(src, "Minimum amount of players is 3!", chan);
            return;
        }
        if (count < tourmembers.length) {
            bot.sendMessage(src, "There are more than that people registered", chan);
            return;
        }
        tournumber = count;
        sys.sendHtmlAll("<br/><center><table width=50% bgcolor=black><tr style='background-image:url(Themes/Classic/battle_fields/new/hH3MF.jpg)'><td align=center><br/><font style='font-size:20px; font-weight:bold;'><i style='color:red; font-weight:bold;'>" + Utils.escapeHtml(sys.name(src)) + "</i> changed the number of entrants to <i style='color:red; font-weight:bold;'>" + count + "!</i></font><hr width=300/><br><b><i style='color:red; font-weight:bold;'>" + script.tourSpots() + "</i> more spot(s) left!</b><br/><br/></td></tr></table></center><br/>", 0);
        if (script.tourSpots() === 0) {
            tourmode = 2;
            roundnumber = 0;
            script.roundPairing();
        }
    });
    addCommand(0, "endtour", function (src, command, commandData, tar, chan) {
        if (!this.poUser.megauser && this.myAuth < 1) {
            bot.sendMessage(src, "You need to be a higher auth to use this command!", chan);
            return;
        }
        if (tourmode !== 0) {
            tourmode = 0;
            sys.sendHtmlAll("<br/><center><table width=50% bgcolor=black><tr style='background-image:url(Themes/Classic/battle_fields/new/hH3MF.jpg)'><td align=center><br/><font style='font-size:20px; font-weight:bold;'>The tour was ended by <i style='color:red; font-weight:bold;'>" + Utils.escapeHtml(sys.name(src)) + "!</i></font><hr width=300/><br><b>Sorry! A new tournament may be starting soon!</b><br/><br/></td></tr></table></center><br/>", 0);
        } else {
            bot.sendMessage(src, "Sorry, you are unable to end a tournament because one is not currently running.", chan);
        }
    });

    addCommand(0, "message", function (src, command, commandData, tar, chan) {
        if (!this.poUser.megauser && this.myAuth < 1) {
            bot.sendMessage(src, "You need to be a higher auth to use this command!", chan);
            return;
        }

        if (!commandData) {
            bot.sendMessage(src, "Specify kick, ban, or welcome!", chan);
            return;
        }

        commandData = commandData.split(":");
        if (!commandData[1]) {
            bot.sendMessage(src, "Usage of this command is: [kick/ban/welcome]:[message]", chan);
            return;
        }
        var which = commandData[0];
        var message = Utils.cut(commandData, 1, ":");
        var whichl = which.toLowerCase();

        if (whichl === "kick") {
            bot.sendMessage(src, "Set kick message to: " + Utils.escapeHtml(message) + "!", chan);
            Kickmsgs[sys.name(src).toLowerCase()] = {
                "message": message
            };
            Reg.save("Kickmsgs", Kickmsgs);
        } else if (whichl === "welcome") {
            bot.sendMessage(src, "Set welcome message to: " + Utils.escapeHtml(message) + "!", chan);
            Welmsgs[sys.name(src).toLowerCase()] = {
                "message": message
            };
            Reg.save("Welmsgs", Welmsgs);
        } else if (whichl === "ban") {
            if (this.myAuth < 2) {
                bot.sendMessage(src, "You need to be a higher auth to set your ban message!", chan);
                return;
            }
            bot.sendMessage(src, "Set ban message to: " + Utils.escapeHtml(message) + "!", chan);
            Banmsgs[sys.name(src).toLowerCase()] = {
                "message": message
            };
            Reg.save("Banmsgs", Banmsgs);
        } else {
            bot.sendMessage(src, "Specify kick, ban, or welcome!", chan);
        }
    });

    addCommand(0, "viewmessage", function (src, command, commandData, tar, chan) {
        if (!this.poUser.megauser && this.myAuth < 1) {
            bot.sendMessage(src, "You need to be a higher auth to use this command!", chan);
            return;
        }

        if (!commandData) {
            bot.sendMessage(src, "Specify kick, ban, or welcome!", chan);
            return;
        }

        if (commandData === "kick") {
            if (!Kickmsgs[sys.name(src).toLowerCase()]) {
                bot.sendMessage(src, "You currently do not have a kick message, please go make one!", chan);
                return;
            }
            bot.sendMessage(src, "Your kick message is set to: " + Utils.escapeHtml(Kickmsgs[sys.name(src).toLowerCase()].message), chan);
            return;
        } else if (commandData === "welcome") {
            if (!Welmsgs[sys.name(src).toLowerCase()]) {
                bot.sendMessage(src, "You currently do not have a welcome message, please go make one!", chan);
                return;
            }
            bot.sendMessage(src, "Your welcome message is set to: " + Utils.escapeHtml(Welmsgs[sys.name(src).toLowerCase()].message), chan);
            return;
        } else if (commandData === "ban") {
            if (this.myAuth < 2 || !Banmsgs[sys.name(src).toLowerCase()]) {
                bot.sendMessage(src, "You either cannot have a ban message or you do not have one, go make one if you can!", chan);
                return;
            }
            bot.sendMessage(src, "Your ban message is set to: " + Utils.escapeHtml(Banmsgs[sys.name(src).toLowerCase()].message), chan);
            return;
        } else {
            bot.sendMessage(src, "Specify kick, ban, or welcome!", chan);
            return;
        }
    });

    addCommand(0, "removemessage", function (src, command, commandData, tar, chan) {
        if (!this.poUser.megauser && this.myAuth < 1) {
            bot.sendMessage(src, "You need to be a higher auth to use this command!", chan);
            return;
        }

        var lower = commandData.toLowerCase();
        if (lower === "kick") {
            if (!Kickmsgs[sys.name(src).toLowerCase()]) {
                bot.sendMessage(src, "You don't have a kick message!", chan);
                return;
            }
            delete Kickmsgs[sys.name(src).toLowerCase()];
            Reg.save("Kickmsgs", Kickmsgs);
            bot.sendMessage(src, "Kick message removed!", chan);
            return;
        } else if (lower === "ban") {
            if (!Banmsgs[sys.name(src).toLowerCase()]) {
                bot.sendMessage(src, "You don't have a ban message!", chan);
                return;
            }
            delete Banmsgs[sys.name(src).toLowerCase()];
            Reg.save("Banmsgs", Banmsgs);
            bot.sendMessage(src, "Ban message removed!", chan);
            return;
        } else if (lower === "welcome") {
            if (!Welmsgs[sys.name(src).toLowerCase()]) {
                bot.sendMessage(src, "You don't have a welcome message!", chan);
                return;
            }
            delete Welmsgs[sys.name(src).toLowerCase()];
            Reg.save("Welmsgs", Welmsgs);
            bot.sendMessage(src, "Welcome message removed!", chan);
            return;
        } else {
            bot.sendMessage(src, "Specify a message (kick/ban/welcome)!", chan);
            return;
        }
    });

    /** MOD COMMANDS */
    addListCommand(1, "modcommands", "Mod");
    addCommand(1, "emoteperms", function (src, command, commandData, tar, chan) {
        if (!commandData) {
            bot.sendMessage(src, "You need to specify a user!", chan);
            return;
        }
        if (!sys.dbRegistered(commandData)) {
            bot.sendMessage(src, "This person is not registered and will not receive permission to use emotes until they register.", chan);
            bot.sendMessage(tar, "Please register so you can receive permission to use emotes.");
            return;
        }
        if (Emoteperms[commandData.toLowerCase()]) {
            bot.sendAll(sys.name(src) + " revoked " + commandData + "'s permission to use emotes!");
            delete Emoteperms[commandData.toLowerCase()];
            Reg.save("Emoteperms", Emoteperms);
            return;
        }
        bot.sendAll(sys.name(src) + " has given " + commandData + " permission to use emotes!");
        Emoteperms[commandData.toLowerCase()] = true;
        Reg.save("Emoteperms", Emoteperms);
    });
    addCommand(1, "channelkick", function (src, command, commandData, tar, chan) {
        if (!tar) {
            bot.sendMessage(src, "This person either does not exist or isn't logged on.", chan);
            return;
        }
        if (sys.auth(tar) >= this.myAuth) {
            bot.sendMessage(src, "Unable to channel kick this person.", chan);
            return;
        }
        bot.sendAll(commandData + " has been kicked from the channel!", chan);
        sys.kick(tar, chan);
    });
    addCommand(1, "motd", function (src, command, commandData, tar, chan) {
        if (!commandData) {
            bot.sendMessage(src, "Specify a message!", chan);
            return;
        }

        var name = sys.name(src);
        Reg.save("MOTD", commandData);
        bot.sendAll("The MOTD has been changed by " + name + " to:", 0);
        sys.sendHtmlAll(MOTDmessage, 0);
    });
    addCommand(1, "getmotd", function (src, command, commandData, tar, chan) {
        bot.sendMessage(src, "The MOTD is: " + Utils.escapeHtml(Reg.get("MOTD")), chan);
    });
    addCommand(1, ["wall", "cwall"], function (src, command, commandData, tar, chan) {
        var wallchan = (command === "cwall" ? chan : undefined);

        if (!commandData) {
            bot.sendMessage(src, "Please post a message.", chan);
            return;
        }

        var wallmessage = Utils.escapeHtml(commandData);

        if (hasEmotesToggled(src)) {
            wallmessage = emoteFormat(true, wallmessage);
        }

        sys.sendHtmlAll("<br><font color=navy><font size=4><b>»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»</b></font><br>", wallchan);
        sys.sendHtmlAll("<font color=" + Utils.nameColor(src) + "><timestamp/>+<b><i>" + sys.name(src) + ":</b><font color=black> " + wallmessage + "<br>", wallchan);
        sys.sendHtmlAll("<font color=navy><font size=4><b>»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»</b></font><br>", wallchan);
    });

    addCommand(1, "sendhtmlall", function (src, command, commandData, tar, chan) {
        if (!commandData) {
            bot.sendMessage(src, "Sorry, invalid message.", chan);
            return;
        }
        sys.sendHtmlAll(commandData, chan);
    });
    addCommand(1, "sendall", function (src, command, commandData, tar, chan) {
        if (!commandData) {
            bot.sendMessage(src, "Sorry, invalid message.", chan);
            return;
        }
        sys.sendAll(commandData, chan);
    });
    addCommand(1, "floodignore", function (src, command, commandData, tar, chan) {
        if (!sys.dbIp(commandData)) {
            bot.sendMessage(src, "Specify a real person!", chan);
            return;
        }

        var playerName = commandData.toLowerCase();
        if (FloodIgnore.hasOwnProperty(playerName)) {
            bot.sendMessage(src, commandData + " was removed from the flood ignore list!", chan);
            delete FloodIgnore[playerName];
        } else {
            if (!sys.dbRegistered(commandData)) {
                bot.sendMessage(src, "This person is not registered and will not receive flood ignore until they register.", chan);
                bot.sendMessage(tar, "Please register so you can receive flood ignore.");
                return;
            }
            bot.sendMessage(src, commandData + " was added to the flood ignore list!", chan);
            FloodIgnore[playerName] = true;
        }

        Reg.save("FloodIgnore", FloodIgnore);
    });

    addCommand(1, "removetopic", function (src, command, commandData, tar, chan) {
        if (!Channeltopics[sys.channel(chan).toLowerCase()]) {
            bot.sendMessage(src, "This channel doesn't have a topic!", chan);
            return;
        }
        delete Channeltopics[sys.channel(chan).toLowerCase()];
        bot.sendMessage(src, "Channel topic was removed!", chan);
    });
    addCommand(1, "changetopic", function (src, command, commandData, tar, chan) {
        /*if (chan === android) {
            topicbot.sendMessage(src, "Can't change the topic of the android channel!", chan);
            return;
        }*/
        topicbot.sendAll(sys.name(src) + " changed the topic of this channel to: " + commandData, chan);
        var channelToLower = sys.channel(chan).toLowerCase();
        Channeltopics[channelToLower] = {
            "by": sys.name(src),
            "topic": commandData
        };
        Reg.save("Channeltopics", Channeltopics);
    });

    addCommand(1, ["mutes", "mutelist"], function (src, command, commandData, tar, chan) {
        var keys = Object.keys(Mutes),
            timeNow = +sys.time(),
            list,
            now,
            key;

        if (keys.length === 0) {
            bot.sendMessage(src, "There are no mutes.", chan);
            return;
        }

        list = new TableList("Mutes", "cornflowerblue", 2, 5, "navy");
        list.add(["IP", "Muted Name", "By", "Length", "Reason"], true);

        for (key in Mutes) {
            now = Mutes[key];
            var mutedname = now.mutedname,
                by = now.by,
                time = now.time,
                timeString = (time === 0 ? "forever" : "for " + Utils.getTimeString(time - timeNow)),
                reason = now.reason;

            list.add([key, mutedname, by, timeString, reason], false);
        }

        list.finish();
        list.display(src, chan);
    });

    addCommand(1, ["rangebans", "rangebanlist"], function (src, command, commandData, tar, chan) {
        var keys = Object.keys(Rangebans),
            timeNow = +sys.time(),
            list,
            now,
            key;

        if (keys.length === 0) {
            bot.sendMessage(src, "There are no rangebans.", chan);
            return;
        }

        list = new TableList("Rangebans", "cornflowerblue", 2, 5, "navy");
        list.add(["IP", "By", "Reason"], true);

        for (key in Rangebans) {
            now = Rangebans[key];
            list.add([key, now.by, now.reason], false);
        }

        list.finish();
        list.display(src, chan);
    });

    addCommand(1, ["bans", "banlist"], function (src, command, commandData, tar, chan) {
        var keys = sys.banList(),
            len,
            i,
            list;

        if (keys.length === 0) {
            bot.sendMessage(src, "There are no bans.", chan);
            return;
        }

        list = new TableList("Bans", "cornflowerblue", 2, 5, "navy");
        list.add(["IP", "Aliases"], true);

        for (i = 0, len = keys.length; i < len; i += 1) {
            list.add([keys[i], sys.aliases(keys[i])], false);
        }

        list.finish();
        list.display(src, chan);
    });

    addCommand(1, "poll", function (src, command, commandData, tar, chan) {
        if (Poll.active) {
            return bot.sendMessage(src, "There is already a poll. Close it with /closepoll.", chan);
        }

        var parts = commandData.split(':');
        var subject = parts[0];
        var options = Utils.cut(parts, 1, ':').split('*');

        if (!subject) {
            return bot.sendMessage(src, "You need to give a subject!", chan);
        }

        if (!options || options.length < 2) {
            return bot.sendMessage(src, "You need at least 2 options.", chan);
        }

        var self = sys.name(src), len, i;
        Poll.active = true;
        Poll.subject = subject;
        Poll.by = self;
        Poll.options = options;

        bot.sendAll(self + " started a poll!", 0);
        bot.sendAll(subject, 0);
        bot.sendAll("Options:", 0);
        for (i = 0, len = options.length; i < len; i += 1) {
            bot.sendAll((i + 1) + ". " + options[i], 0);
        }
        bot.sendAll("Vote with /vote [option]!", 0);
    });

    addCommand(1, "closepoll", function (src, command, commandData, tar, chan) {
        if (!Poll.active) {
            return bot.sendMessage(src, "There isn't a poll. Start one with /poll [subject]:[option1]*[option..].", chan);
        }

        var self = sys.name(src);
        bot.sendAll(self + " closed the poll (started by " + Poll.by + ")!", 0);

        if (Object.keys(Poll.votes).length !== 0) {
            var results = {}, msgs = {}, choice, i, total, winner, most = 0;
            for (i in Poll.votes) {
                choice = Poll.votes[i];
                if (!(choice in results)) {
                    results[choice] = 1;
                } else {
                    results[choice] += 1;
                }

                if (results[choice] > most) {
                    winner = choice;
                    most = results[choice];
                }
            }

            for (i in results) {
                msgs[i] = "Option #" + (parseInt(i, 10) + 1) + " (" + Poll.options[i] + "): " + results[i] + " vote" + (results[i] === 1 ? '' : 's');
            }

            bot.sendAll("'" + Poll.subject + "' - Results:", 0);

            for (i = 0, total = Poll.options.length; i < total; i += 1) {
                if (msgs[i]) {
                    bot.sendAll(msgs[i], 0);
                }
            }

            sys.sendAll("", 0);
            bot.sendAll("Winner: Option #" + (winner + 1) + " (" + Poll.options[winner] + ") with " + results[winner] + " vote" + (results.winner === 1 ? '' : 's') + ".", 0);
        }

        Poll.active = false;
        Poll.subject = '';
        Poll.by = '';
        Poll.options = [];
        Poll.votes = {};
    });

    addCommand(1, "info", function (src, command, commandData, tar, chan) {
        if (!sys.dbIp(commandData)) {
            bot.sendMessage(src, 'You need to put a real person!', chan);
            return;
        }
        var tarip = sys.dbIp(commandData);
        var tarauth = sys.dbAuth(commandData);
        var aliases = sys.aliases(tarip);
        var registered = sys.dbRegistered(commandData) ? "yes" : "no";
        var loggedon = sys.loggedIn(tar) ? "yes" : "no";
        sys.sendMessage(src, "", chan);

        sys.sendHtmlMessage(src, "<timestamp/><b><font color=black>±Bot:</font></b> Information of player <font color=" + Utils.nameColor(tar) + "><b>" + commandData + ":</font></b>", chan);
        sys.sendHtmlMessage(src, "<timestamp/><font color=purple><b>IP:</b></font> " + tarip, chan);
        sys.sendHtmlMessage(src, "<timestamp/><font color=black><b>Auth Level:</b></font> " + tarauth, chan);
        sys.sendHtmlMessage(src, "<timestamp/><font color=purple><b>Aliases:</b></font> " + aliases, chan);
        sys.sendHtmlMessage(src, "<timestamp/><font color=black><b>Number of aliases:</b></font> " + aliases.length, chan);
        sys.sendHtmlMessage(src, "<timestamp/><font color=purple><b>Registered:</b></font> " + registered, chan);
        sys.sendHtmlMessage(src, "<timestamp/><font color=black><b>Logged In:</b></font> " + loggedon, chan);

        if (loggedon === "yes") {
            var lengths;
            var arrays = [];
            var channelU = sys.channelsOfPlayer(tar);
            for (lengths in channelU) {
                arrays.push(sys.channel(channelU[lengths]));
            }
            sys.sendHtmlMessage(src, "<timestamp/><font color=purple><b>Channels of Player:</b></font> " + arrays.join(", "), chan);
        } else {
            sys.sendHtmlMessage(src, "<timestamp/><font color=purple><b>Last On:</b></font> " + sys.dbLastOn(commandData), chan);
        }

        sys.sendMessage(src, "", chan);
    });
    addCommand(1, "logwarn", function (src, command, commandData, tar, chan) {
        if (!tar) {
            bot.sendMessage(src, "This person doesn't exist.", chan);
            return;
        }
        if (this.myAuth <= Utils.getAuth(tar) && this.myAuth < 3) {
            bot.sendMessage(src, "Can't warn someone with higher or equal auth.", chan);
            return;
        }
        var warning = "@" + commandData + ": If you have a log over (or at) 5 lines, please use http://pastebin.com to show the log. Otherwise, you might be kicked by the Flood Bot, or muted by a Moderator/or you may be temporarily banned. This is your last warning.";
        sys.sendAll(sys.name(src) + ": " + warning, chan);
    });
    addCommand(1, "tellemotes", function (src, command, commandData, tar, chan) {
        if (!tar) {
            bot.sendMessage(src, "This person doesn't exist.", chan);
            return;
        }
        if (this.myAuth <= Utils.getAuth(tar) && this.myAuth < 3) {
            bot.sendMessage(src, "Can't tell someone with higher or equal auth to update.", chan);
            return;
        }
        sys.sendAll(sys.name(src) + ": Hey, " + commandData + ", the thing you are confused about is an emote. An emote is basically an emoticon but with a picture put in. Since we tend to enjoy emotes you might see one of us using the emote alot or the chat may be filled with emotes. We are sorry if we use any that is weird and creeps you out. To be able to use emotes you need seniority. To get 'seniority' you need to participate in the chat and our forums! The link to the forums is in the banner above, be sure to check it out. Good day!", chan);
    });
    addCommand(1, "silence", function (src, command, commandData, tar, chan) {
        if (muteall) {
            bot.sendMessage(src, "Silence is already on!", chan);
            return;
        }
        sys.sendHtmlAll("<font color=blue><timestamp/><b>" + Utils.escapeHtml(sys.name(src)) + " silenced the chat!</b></font>");
        muteall = true;
    });
    addCommand(1, ["unsilence", "silenceoff"], function (src, command, commandData, tar, chan) {
        if (!muteall) {
            bot.sendMessage(src, "Silence isn't going on.", chan);
            return;
        }
        sys.sendHtmlAll("<font color=green><timestamp/><b>" + Utils.escapeHtml(sys.name(src)) + " ended the silence!</b></font>");
        muteall = false;
    });
    addCommand(1, ["kick", "k"], function (src, command, commandData, tar, chan) {
        if (!commandData) {
            bot.sendMessage(src, "You can't kick nothing!", chan);
            return;
        }

        var t = commandData.split(':'),
            tars = (t[0].split("*")),
            reason = t[1] || false,
            toKick = [],
            len = tars.length,
            i;

        for (i = 0; i < len; i += 1) {
            tar = sys.id(tars[i]);

            if (tar === undefined) {
                bot.sendMessage(src, "This person (" + tars[i] + ") doesn't exist.", chan);
                continue;
            }

            if (this.myAuth <= Utils.getAuth(tar) && this.myAuth < 3) {
                bot.sendMessage(src, "Can't kick someone (" + tars[i] + ") with higher or equal auth.", chan);
                continue;
            }

            toKick.push(sys.name(tar));
        }

        if (!toKick.length) {
            bot.sendMessage(src, "No one to kick.", chan);
            return;
        }

        var theirmessage = Kickmsgs[sys.name(src).toLowerCase()];
        var tarNames = Utils.fancyJoin(toKick);
        var msg = (theirmessage !== undefined) ? theirmessage.message : "<font color='navy'><timestamp/><b>" + tarNames + " " + (toKick.length === 1 ? "was" : "were") + " kicked by " + Utils.escapeHtml(sys.name(src)) + "!";

        if (theirmessage) {
            msg = msg.replace(/\{Target\}/gi, tarNames);
        }

        if (reason) {
            sys.sendHtmlAll(msg + "<br></font></b><font color=black><timestamp/><b>Reason:</font></b> " + reason);
        }

        for (i = 0, len = toKick.length; i < len; i += 1) {
            Utils.mod.kick(sys.id(toKick[i]));
        }
    });
    addCommand(1, "public", function (src, command, commandData, tar, chan) {
        if (!sys.isServerPrivate()) {
            sys.sendMessage(src, "~~Server~~: The server is already public.");
            sys.stopEvent();
            return;
        }
        sys.sendAll('~~Server~~: The server was made public by ' + sys.name(src) + '.');
        sys.makeServerPublic(true);
    });

    addCommand(1, ["tempban", "tb"], function (src, command, commandData, tar, chan) {
        var t = commandData.split(':'),
            bantime = t[1],
            timeunit = t[2],
            reason = t[3],
            time,
            timestr;

        if (!timeunit) {
            timeunit = "minutes";
        }

        tar = sys.id(t[0]);
        var tarip = sys.dbIp(t[0]);
        if (!tarip) {
            bot.sendMessage(src, "Target doesn't exist!", chan);
            return;
        }

        if (Utils.mod.tempBanTime(tarip)) {
            bot.sendMessage(src, "This person is already (temp)banned.", chan);
            return;
        }

        if (Utils.getAuth(t[0]) >= this.myAuth) {
            bot.sendMessage(src, "You dont have sufficient auth to tempban " + commandData + ".", chan);
            return;
        }
        if (!bantime) {
            bot.sendMessage(src, "Please specify a time.", chan);
            return;
        }

        reason = reason || 'No reason.';

        bantime = Number(bantime);
        if (bantime === 0) {
            time = 30;
            timestr = "30 minutes";
        } else {
            time = Utils.stringToTime(timeunit, bantime);
            timestr = Utils.getTimeString(time);
        }

        if (time > 86400 /* seconds */ && this.myAuth === 1) {
            bot.sendMessage(src, "You can only ban for a maximum of 1 day.", chan);
            return;
        }

        sys.sendHtmlAll("<font color=red><timestamp/><b> " + t[0] + " has been tempbanned by " + Utils.escapeHtml(sys.name(src)) + " for " + timestr + "!</font></b><br><font color=black><timestamp/><b> Reason:</b> " + Utils.escapeHtml(reason), 0);

        tempBan(t[0], time / 60);
    });

    addCommand(1, "untempban", function (src, command, commandData, tar, chan) {
        var tip = sys.dbIp(commandData);
        if (!tip) {
            bot.sendMessage(src, "Target doesn't exist!", chan);
            return;
        }
        if (!Utils.mod.tempBanTime(tip)) {
            bot.sendMessage(src, "This person isn't tempbanned.", chan);
            return;
        }
        sys.sendHtmlAll("<font color=blue><timestamp/><b> " + commandData + "'s tempban has been removed by " + Utils.escapeHtml(sys.name(src)) + "!</font></b>", 0);
        sys.unban(commandData);
    });
    addCommand(1, ["mute"], function (src, command, commandData, tar, chan) {
        var v = commandData.split(':'),
            reason = Utils.cut(v, 3, ":"),
            mutetime = v[1],
            timeunit = v[2],
            tarip = sys.dbIp(v[0]);

        tar = sys.id(v[0]);

        if (!tarip) {
            bot.sendMessage(src, "Target doesn't exist!", chan);
            return;
        }
        pruneMutes();
        if (Mutes[tarip]) {
            bot.sendMessage(src, 'This person is already muted.', chan);
            return;
        }
        if (Utils.getAuth(v[0]) >= this.myAuth) {
            bot.sendMessage(src, "You don't have sufficient auth to mute " + v[0] + ".", chan);
            return;
        }

        if (!reason) {
            bot.sendMessage(src, "A reason must be specified.", chan);
            return;
        }

        reason = Utils.escapeHtml(reason);

        var time = Utils.stringToTime(timeunit, Number(mutetime)),
            time_now = +sys.time(),
            trueTime = time + time_now,
            timeString = "for " + Utils.getTimeString(time);

        if (tar) {
            SESSION.users(tar).muted = true;
        }

        if (!mutetime || mutetime === "forever") {
            trueTime = 0;
            time = 0;
            timeString = "forever";
        }

        var muteHash = {
            "by": sys.name(src),
            "reason": reason,
            "time": trueTime,
            "mutedname": v[0]
        };

        Mutes[tarip] = muteHash;
        Reg.save("Mutes", Mutes);

        sys.sendHtmlAll("<font color=blue><timestamp/><b>" + Utils.escapeHtml(sys.name(src)) + " muted " + v[0] + " " + timeString + "!</b></font>");
        sys.sendHtmlAll("<font color=green><timestamp/><b>Reason:</b></font> " + reason);
    });
    addCommand(1, "m", function (src, command, commandData, tar, chan) {
        // Reuse code
        commands.mute.callback.call({myAuth: this.myAuth}, src, "mute", commandData + ":5:minutes:No reason.", tar, chan);
    });
    addCommand(1, "unmute", function (src, command, commandData, tar, chan) {
        var ip = sys.dbIp(commandData);
        if (!ip) {
            bot.sendMessage(src, "Target doesn't exist!", chan);
            return;
        }
        pruneMutes();
        if (!Mutes[ip]) {
            bot.sendMessage(src, 'This person is not muted.', chan);
            return;
        }
        sys.sendHtmlAll("<font color=green><timestamp/><b>" + commandData + " was unmuted by " + Utils.escapeHtml(sys.name(src)) + "!</b></font>");
        delete Mutes[ip];
        Reg.save("Mutes", Mutes);

        if (tar !== undefined) {
            SESSION.users(tar).muted = false;
        }
    });

    addListCommand(1, ["moderationcommands", "moderatecommands"], "Moderate");
    addListCommand(1, ["partycommands", "funmodcommands"], "Party");

    addCommand(1, "imp", function (src, command, commandData, tar, chan) {
        if (commandData.length < 3) {
            bot.sendMessage(src, "Thou cannot impersonate the void (longer name, please)!", chan);
            return;
        }

        if (tar) {
            bot.sendMessage(src, "It appears as if your target does not appreciate being impersonated.", chan);
            return;
        }

        var displayImp = Utils.escapeHtml(commandData);
        sys.sendHtmlAll('<font color=#8A2BE2><timestamp/><b>' + Utils.escapeHtml(sys.name(src)) + ' has impersonated ' + displayImp + '!</font></b>', 0);
        Utils.watch.notify(Utils.nameIp(src) + " impersonated <b style='color: " + Utils.nameColor(src) + "'>" + displayImp + "</b>.");

        sys.changeName(src, commandData);
    });

    addCommand(1, "roulette", function (src, command, commandData, tar, chan) {
        rouletteon = !rouletteon;

        spinTypes = [];
        if (!rouletteon) {
            sys.sendHtmlAll('<font color=blue><timestamp/><b>»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»', chan);
            sys.sendHtmlAll('<font color=black><timestamp/><b><font color=black>' + Utils.escapeHtml(sys.name(src)) + ' ended the roulette game.', chan);
            sys.sendHtmlAll('<font color=blue><timestamp/><b>»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»', chan);
        } else {
            var types = commandData.split(", ").map(function (val) {
                return val.toLowerCase();
            }).filter(function (val, index, array) {
                return (val === "pokemons" || val === "items" || val === "emotes" || val === "trainers" || val === "avatars") && array.indexOf(val) === -1;
            });

            if ((types.indexOf('trainers') !== -1) && (types.indexOf('avatars') !== -1)) {
                types.splice(types.indexOf('trainers'), 1);
            }

            if (types.length) {
                spinTypes = types;
            } else {
                spinTypes = ['pokemons', 'items', 'emotes', 'avatars'];
            }

            sys.sendHtmlAll('<font color=blue><timestamp/><b>»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»', chan);
            sys.sendHtmlAll('<font color=red><timestamp/><b>A roulette game was started by <font color=black>' + Utils.escapeHtml(sys.name(src)) + '!', chan);
            sys.sendHtmlAll('<font color=orange><timestamp/><b>Type(s):</b></font> ' + spinTypes.join(", "), chan);
            sys.sendHtmlAll('<font color=green><timestamp/><b>Type /spin to play!', chan);
            sys.sendHtmlAll('<font color=blue><timestamp/><b>»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»', chan);
        }
    });
    addCommand(1, ["spacemode", "capsmode", "reversemode", "lolmode", "scramblemode", "colormode", "pewpewpew"], function (src, command, commandData, tar, chan) {
        var word = (global[command] = !(global[command])) ? "on" : "off";
        var name = command.indexOf("mode") > -1 ? command.split("mode")[0] : command;
        name = name.substr(0, 1).toUpperCase() + name.substr(1);

        bot.sendAll(name + " Mode was turned " + word + "!", 0);
    });
    addCommand(1, "nightclub", function (src, command, commandData, tar, chan) {
        nightclub = !nightclub;
        if (nightclub) {
            sys.sendHtmlAll("<br/>" + Utils.nightclub.rainbowify("Let the Night Club commence!"), chan);
        } else {
            sys.sendHtmlAll(Utils.nightclub.rainbowify("Kay, Night Club times are over...") + "<br/>", chan);
        }
    });

    addCommand(1, "onos", function (src, command, commandData, tar, chan) {
        commandData = commandData.toLowerCase();
        if (["windows", "linux", "android", "mac", "webclient"].indexOf(commandData) !== -1) {
            var output = sys.playerIds().filter(function (id) {
                return sys.os(id) === commandData;
            }).map(sys.name);
            bot.sendMessage(src, "Players on OS " + commandData + " are: " + output.join(", "), chan);
            return;
        }
        bot.sendMessage(src, commandData + " is not a valid OS.", chan);
    });

    addCommand(1, "disable", function (src, command, commandData, tar, chan) {
        if (commandData === undefined) {
            bot.sendMessage(src, "You must disable something!", chan);
            return;
        }
        var cmdToLower = commandData.toLowerCase();
        if (!commands.hasOwnProperty(cmdToLower)) {
            bot.sendMessage(src, "The command " + commandData + " doesn't exist!", chan);
            return;
        }
        if (disabledCmds.indexOf(cmdToLower) > -1) {
            bot.sendMessage(src, "The command " + command + " is already disabled!", chan);
            return;
        }
        if (["disable", "enable"].indexOf(cmdToLower) > -1) {
            bot.sendMessage(src, "Sorry, you may not disable the " + commandData + " command.", chan);
            return;
        }
        disabledCmds.push(cmdToLower);
        bot.sendAll(sys.name(src) + " disabled /" + cmdToLower + "!");
    });
    addCommand(1, "enable", function (src, command, commandData, tar, chan) {
        if (commandData === undefined) {
            bot.sendMessage(src, "You must enable something!", chan);
            return;
        }
        var cmdToLower = commandData.toLowerCase();
        if (!commands.hasOwnProperty(cmdToLower)) {
            bot.sendMessage(src, "The command " + commandData + " doesn't exist!", chan);
            return;
        }
        if (disabledCmds.indexOf(cmdToLower) === -1) {
            bot.sendMessage(src, "The command " + commandData + " is already enabled!", chan);
            return;
        }
        disabledCmds.splice(disabledCmds.indexOf(cmdToLower), 1);
        bot.sendAll(sys.name(src) + " re-enabled /" + cmdToLower + "!");
    });

    addCommand(1, "warn", function (src, command, commandData, _, chan) {
        var parts = commandData.split(':'), tar = sys.id(parts[0]), msg = parts[1];
        if (!tar) {
            bot.sendMessage(src, "You have to specify a target!", chan);
            return;
        }

        if (sys.auth(tar) > 0) {
            bot.sendMessage(src, "Can't warn auth.", chan);
            return;
        }

        var tarname = sys.name(tar);
        var warning = warnings[tarname];

        if (!msg && !warning) {
            bot.sendMessage(src, "Specify a reason!", chan);
            return;
        }

        if (msg === "undo") {
            if (warning) {
                delete warnings[tarname];
                bot.sendMessage(src, tarname + "'s warning is now void!", chan);
                return;
            } else {
                return bot.sendMessage(src, tarname + " doesn't have any warnings yet.", chan);
            }
        }

        if (!warning) {
            warning = warnings[tarname] = {
                strike: 0,
                reason: msg
            };
        }

        warning.strike += 1;
        switch (warning.strike) {
            case 1:
                script.beforeChatMessage(src, tarname + ": You've received a warning: " + msg, chan);
                script.beforeChatMessage(src, "Further infraction of the rules may result in a kick, mute, or ban.", chan);
                break;
            case 2:
                commands.kick.callback.call({myAuth: this.myAuth}, src, "kick", parts[0] + ":" + warning.reason + ". You have been warned.", tar, chan);
                break;
            case 3:
                commands.mute.callback.call({myAuth: this.myAuth}, src, "mute", parts[0] + ":5:minutes:" + warning.reason + ". You have been warned.", tar, chan);
                delete warnings[tarname];
                break;
        }
    });

    addCommand(1, "forcerules", function (src, command, commandData, tar, chan) {
        if (!tar) {
            bot.sendMessage(src, "Must force rules to a real person!", chan);
            return;
        }
        bot.sendMessage(tar, Utils.escapeHtml(sys.name(src)) + " has forced the rules to you!");
        Lists.Rules.display(tar, chan);
        bot.sendMessage(src, "You have forced " + sys.name(tar) + " to read the rules!", chan);
    });

    /** ADMIN COMMANDS */
    addListCommand(2, "admincommands", "Admin");

    addCommand(2, "skick", function (src, command, commandData, tar, chan) {
        if (!tar) {
            bot.sendMessage(src, "Target doesn't exist!", chan);
            return;
        }
        if (this.myAuth <= sys.auth(tar)) {
            bot.sendMessage(src, "Sorry. Your request has been denied.", chan);
            return;
        }
        bot.sendMessage(src, "You silently kicked " + sys.name(tar) + "!", chan);
        Utils.mod.kick(tar);
    });

    addCommand(2, "clearpass", function (src, command, commandData, tar, chan) {
        var ip = sys.dbIp(commandData);
        if (!ip) {
            bot.sendMessage(src, "Target doesn't exist!", chan);
            return;
        }
        if (this.myAuth <= sys.dbAuth(commandData)) {
            bot.sendMessage(src, "You are unable to clear this person's password.", chan);
            return;
        }
        if (!sys.dbRegistered(commandData)) {
            bot.sendMessage(src, "This person isn't registered.", chan);
            return;
        }
        sys.clearPass(commandData);
        bot.sendMessage(src, commandData + "'s password has been cleared!", chan);
    });

    addCommand(2, ["rangeban", "rb"], function (src, command, commandData, tar, chan) {
        var rb = commandData.split(":"),
            rangeip = rb[0],
            rbreason = rb[1];
        if (!rangeip) {
            sys.sendMessage(src, "Please specify a valid range.");
            return;
        }
        var lowername = this.originalName.toLowerCase();
        if (!rbreason) {
            bot.sendMessage(src, "Please specify a reason.", chan);
            return;
        }

        function valid(ip) {
            if (ip.length > 8) {
                return false;
            }
            if (ip.indexOf(".") === -1) {
                return false;
            }
            if (isNaN(Number(ip))) {
                return false;
            }
            return true;
        }

        if (!valid(rangeip)) {
            bot.sendMessage(src, "Ranges can only go up to 6 digits and must have one period.", chan);
            return;
        }
        bot.sendMessage(src, "Rangeban added for range: " + rangeip, chan);
        bot.sendMessage(src, "Reason: " + rbreason, chan);

        Rangebans[rangeip] = {
            "by": sys.name(src),
            "reason": rbreason
        };

        Reg.save("Rangebans", Rangebans);

    });
    addCommand(2, "unrangeban", function (src, command, commandData, tar, chan) {
        if (!commandData) {
            bot.sendMessage(src, "Please specify a valid range.", chan);
            return;
        }
        if (!Rangebans[commandData]) {
            bot.sendMessage(src, "Range isn't banned.", chan);
            return;
        }
        bot.sendMessage(src, "Rangeban removed for range: " + commandData, chan);

        delete Rangebans[commandData];
        Reg.save("Rangebans", Rangebans);
    });

    addCommand(2, "megauser", function (src, command, commandData, tar, chan) {
        if (!sys.dbIp(commandData)) {
            bot.sendMessage(src, "That person does not exist.", chan);
            return;
        }
        var playerName = commandData.toLowerCase();
        if (!sys.dbRegistered(commandData)) {
            bot.sendMessage(src, "This person is not registered and will not receive megauser until they register.", chan);
            bot.sendMessage(tar, "Please register so you can receive megauser.");
            return;
        }

        var added = Utils.regToggle(MegaUsers, playerName, "Megausers");
        if (added) {
            bot.sendAll(commandData + ' is now a megauser!', 0);
        } else {
            bot.sendAll(commandData + ' is no longer a megauser!', 0);
        }

        if (tar) {
            SESSION.users(tar).megauser = added;
        }
    });

    addCommand(2, "clearchat", function (src, command, commandData, tar, chan) {
        chan = sys.channelId(commandData);
        if (chan === undefined) {
            bot.sendMessage(src, "Please specify a valid channel.", chan);
            return;
        }
        if (chan === watch) {
            bot.sendMessage(src, "I'm watching you...", chan);
            return;
        }
        var c;
        for (c = 0; c < 2999; c += 1) {
            sys.sendAll("", chan);
        }
        sys.sendHtmlAll("<b><font color=" + sys.getColor(src) + ">" + Utils.escapeHtml(sys.name(src)) + " </b></font>cleared the chat in the channel: <b><font color=red>" + sys.channel(chan) + "</b></font>!", chan);
    });
    addCommand(2, "supersilence", function (src, command, commandData, tar, chan) {
        if (supersilence) {
            bot.sendMessage(src, "Super Silence is already on!", chan);
            return;
        }
        sys.sendHtmlAll("<font color=blue><timestamp/><b>" + Utils.escapeHtml(sys.name(src)) + " super silenced the chat!</b></font>");
        supersilence = true;
    });
    addCommand(2, ["unssilence", "ssilenceoff"], function (src, command, commandData, tar, chan) {
        if (!supersilence) {
            bot.sendMessage(src, "Super Silence isn't going on.", chan);
            return;
        }
        sys.sendHtmlAll("<font color=green><timestamp/><b>" + Utils.escapeHtml(sys.name(src)) + " ended the super silence!</b></font>");
        supersilence = false;
    });
    addCommand(2, "private", function (src, command, commandData, tar, chan) {
        if (sys.isServerPrivate()) {
            sys.sendMessage(src, "~~Server~~: The server is already private.");
            sys.stopEvent();
            return;
        }
        sys.makeServerPublic(false);
        sys.sendAll('~~Server~~: The server was made private by ' + sys.name(src) + '.');
    });
    addCommand(2, "showteam", function (src, command, commandData, tar, chan) {
        if (!tar) {
            bot.sendMessage(src, "Target doesn't exist!", chan);
            return;
        }
        var ret = [],
            i,
            j,
            z,
            team;
        ret.push("");

        for (team = 0; team < sys.teamCount(tar); team += 1) {
            var toPush = "<table cellpadding=3 cellspacing=3 width='20%' border=1><tr><td><b>Team #" + (team + 1) + "</b></td></tr>";
            toPush += "<tr><td>";
            for (i = 0; i < 6; i += 1) {
                var ev_result = "";
                var poke = sys.teamPoke(tar, team, i);
                var item = sys.teamPokeItem(tar, team, i);
                if (poke === 0) {
                    continue;
                }

                toPush += "<font color=black><img src='pokemon:" + poke + "&gen=" + sys.gen(tar, team) + "'/><br>Item: <img src='item:" + item + "'/><br>";
                toPush += '<font color=black>Ability: ' + sys.ability(sys.teamPokeAbility(tar, team, i)) + "<br>";

                for (z = 0; z < 6; z += 1) {
                    if (sys.teamPokeEV(tar, team, i, z) !== 0) {
                        var ev_append = sys.teamPokeEV(tar, team, i, z) + " " + Utils.EVName(z) + " / ";
                        ev_result = ev_result + ev_append;
                    }
                }

                toPush += ("EVs: " + ev_result + "<br>");

                for (j = 0; j < 4; j += 1) {
                    toPush += '- ' + sys.move(sys.teamPokeMove(tar, team, i, j)) + "<br>";
                }
                if (poke === sys.teamPoke(tar, team, 5)) {
                    toPush += "</td></tr>";
                    toPush += "</table>";
                    ret.push(toPush);
                }
            }
        }
        if (ret.length > 1) {
            for (i in ret) {
                sys.sendHtmlMessage(src, ret[i], chan);
            }
        } else {
            bot.sendMessage(src, "That person doesn't have a valid team.", chan);
        }
    });
    addCommand(2, ["ban", "sban"], function (src, command, commandData, tar, chan) {
        if (!sys.dbIp(commandData)) {
            bot.sendMessage(src, "No player exists by this name!", chan);
            return;
        }
        var ip = sys.dbIp(commandData);
        if (this.myAuth <= Utils.getAuth(commandData)) {
            bot.sendMessage(src, "You can't ban this person. What are you thinking!", chan);
            return;
        }
        var banlist = sys.banList(),
            a,
            cmdToL = commandData.toLowerCase();

        for (a in banlist) {
            if (cmdToL === banlist[a].toLowerCase()) {
                bot.sendMessage(src, "He/she's already banned!", chan);
                return;
            }
        }
        if (command === "ban") {
            commandData = Utils.toCorrectCase(commandData);
            var theirmessage = Banmsgs[sys.name(src).toLowerCase()];
            var msg = (theirmessage) ? theirmessage.message : "<font color=blue><timestamp/><b>" + commandData + ' was banned by ' + Utils.escapeHtml(sys.name(src)) + '!</font></b>';
            if (theirmessage) {
                msg = msg.replace(/\{Target\}/gi, commandData);
            }
            sys.sendHtmlAll(msg);
        } else {
            sys.sendHtmlMessage(src, "<font color=blue><timestamp/> <b>You banned " + commandData + " silently!</b></font>", chan);
        }
        ban(commandData);
    });
    addCommand(2, "unban", function (src, command, commandData, tar, chan) {
        var target = sys.dbIp(commandData);
        if (!target) {
            bot.sendMessage(src, "No player exists by this name!", chan);
            return;
        }

        var ipBanList = sys.banList().map(function (name) {
            return sys.dbIp(name);
        });

        if (ipBanList.indexOf(target) === -1) {
            bot.sendMessage(src, "He/she's not banned!", chan);
            return;
        }

        sys.unban(commandData);
        sys.sendHtmlAll("<font color=blue><timestamp/><b>" + Utils.escapeHtml(commandData) + " was unbanned by " + Utils.escapeHtml(sys.name(src)) + "!", 0);
    });
    /** OWNER COMMANDS */
    addListCommand(3, "ownercommands", "Owner");

    addCommand(3, ["toggleemotes"], function (src, command, commandData, tar, chan) {
        Config.emotesEnabled = !Config.emotesEnabled;
        bot.sendAll("Emotes were " + (Config.emotesEnabled ? "enabled!" : "disabled."), chan);
    });
    addCommand(3, "bots", function (src, command, commandData, tar, chan) {
        SESSION.channels(chan).bots = !SESSION.channels(chan).bots;
        var word = SESSION.channels(chan).bots ? "on" : "off";
        bot.sendAll(sys.name(src) + " turned bots " + word + " in this channel!", chan);
    });
    addCommand(3, "leaguemanager", function (src, command, commandData, tar, chan) {
        if (tar === undefined) {
            bot.sendAll(commandData + " is now the league manager!");
            Reg.save("Leaguemanager", commandData.toLowerCase());
            Leaguemanager = commandData.toLowerCase();
        } else {
            bot.sendAll(sys.name(tar) + " is now the league manager!");
            Reg.save("Leaguemanager", sys.name(tar).toLowerCase());
            Leaguemanager = sys.name(tar).toLowerCase();
        }
    });
    addCommand(3, "changeauth", function (src, command, commandData, tar, chan) {
        var cmdData = commandData.split(":");
        if (cmdData.length < 2) {
            bot.sendMessage(src, "Usage: name:level", chan);
            return;
        }
        var name = cmdData[0],
            level = cmdData[1];
        if (!sys.dbIp(name)) {
            bot.sendMessage(src, "Target doesn't exist!", chan);
            return;
        }
        if (parseInt(level, 10) < 0 || parseInt(level, 10) > 4 || isNaN(parseInt(level, 10))) {
            bot.sendMessage(src, "Invalid level.", chan);
            return;
        }
        if (!sys.dbRegistered(name)) {
            bot.sendMessage(src, "This person is not registered and will not receive auth until they register.", chan);
            bot.sendMessage(sys.id(name), "Please register so you can receive auth.");
            return;
        }
        bot.sendAll(sys.name(src) + " changed the auth level of " + name + " to " + level);
        sys.changeDbAuth(name, level);
        sys.changeAuth(sys.id(name), level);
    });
    addCommand(3, "eval", function (src, command, commandData, tar, chan) {
        bot.sendMessage(src, "You evaluated: " + Utils.escapeHtml(commandData), chan);
        try {
            var res = sys.eval(commandData);
            sys.sendHtmlMessage(src, "<timestamp/><b>Evaluation Check: </b><font color='green'>OK</font>", chan);
            sys.sendHtmlMessage(src, "<timestamp/><b>Response: </b> " + res, chan);
        } catch (error) {
            sys.sendHtmlMessage(src, "<timestamp/><b>Evaluation Check: </b><font color='red'>" + error + "</font>", chan);
            if (error.backtracetext) {
                sys.sendHtmlMessage(src, "<timestamp/><b>Backtrace:</b> <br/> " + error.backtracetext.replace(/\n/g, "<br/>"), chan);
            }
        }
    });
    addCommand(3, "htmlchat", function (src, command, commandData, tar, chan) {
        if (htmlchat) {
            bot.sendMessage(src, "HTML Chat has been disabled!", chan);
        } else {
            bot.sendMessage(src, "HTML Chat has been enabled!", chan);
        }

        htmlchat = !htmlchat;
    });

    addCommand(3, "dbauths", function (src, command, commandData, tar, chan) {
        sys.sendMessage(src, sys.dbAuths());
    });
    addCommand(3, "unidle", function (src, command, commandData, tar, chan) {
        if (!tar) {
            bot.sendMessage(src, "Invalid target.", chan);
        } else {
            bot.sendMessage(src, "You have made " + commandData + " unidle.", chan);
            sys.changeAway(sys.id(commandData), false);
            return;
        }
    });
    addCommand(3, "resetladder", function (src, command, commandData, tar, chan) {
        var tiers = sys.getTierList(),
            x;

        for (x in tiers) {
            sys.resetLadder(tiers[x]);
        }
        bot.sendAll("The entire ladder has been reset!");
    });
    addListCommand(3, "authoptions", "Auth");

    addCommand(3, "setwelcomemessage", function(src, command, commandData, tar, chan) {
        var r = commandData.split(':'),
            mess = Utils.cut(r, 1, ':'),
            name = r[0];

        if (r.length != 2) {
            bot.sendMessage(src, "Usage of this command is Name:Message", chan);
            return;
        }

        if (sys.dbIp(name) === undefined) {
            bot.sendMessage(src, "You must set the welcome message of a real person!", chan);
            return;
        }

        Welmsgs[name] = {message: mess};
        Reg.save("Welmsgs", Welmsgs);

        bot.sendMessage(src, "Set welcome message of " + name + " to: " + Utils.escapeHtml(mess), chan);
    });

    /* Maintainer commands */
    addListCommand(3, "maintainercommands", "Maintainer", null, addCommand.flags.MAINTAINERS);

    addMaintainerCommand("update", function (src, command, commandData, tar, chan) {
        if (!commandData) {
            bot.sendMessage(src, "Specify a plugin!", chan);
            return;
        }

        var plugins = commandData.trim().split(" ");
        var plugin, len, i;
        for (i = 0, len = plugins.length; i < len; i += 1) {
            plugin = plugins[i];
            if (plugin.indexOf(".js") === -1) {
                plugin += ".js";
            }

            bot.sendMessage(src, "Updating plugin " + plugin + "...", chan);
            Utils.watch.notify("Updating plugin " + plugin + "...");
            try {
                require(plugin, true, false);
                if (!require.reload(plugin)) {
                    bot.sendMessage(src, "Plugin " + plugin + " refused to reload.", chan);
                    Utils.watch.notify("Plugin " + plugin + " refused to reload.");
                }

                bot.sendMessage(src, "Plugin " + plugin + " updated!", chan);
                Utils.watch.notify("Plugin " + plugin + " updated.");
            } catch (ex) {
                bot.sendMessage(src, "Couldn't update plugin " + plugin + ": " + ex.toString() + " on line " + ex.lineNumber + " :(", chan);
                sys.sendHtmlMessage(src, ex.backtrace.join("<br/>"), chan);
                Utils.watch.notify("Couldn't update plugin " + plugin + ": " + ex.toString() + " on line " + ex.lineNumber + " :(");
                print(ex.backtracetext);
            }
        }
    });

    addMaintainerCommand("init", function (src, command, commandData, tar, chan) {
        try {
            script.init();
            bot.sendMessage(src, "Init was called successfully.", chan);
        } catch (ex) {
            bot.sendMessage(src, "Couldn't call init: " + ex, chan);
            sys.sendHtmlMessage(src, ex.backtrace.join("<br/>"), chan);
        }
    });

    addMaintainerCommand(["webcall", "updatescript"], function (src, command, commandData, tar, chan) {
        sys.sendHtmlAll('<font color=blue><timestamp/><b>±ScriptBot: </b></font>The scripts were webcalled by ' + sys.name(src) + '!', 0);
        if (!commandData) {
            commandData = "https://raw.github.com/meteor-falls/Scripts/master/scripts.js";
        }
        sys.webCall(commandData, function (resp) {
            try {
                FULLRELOAD = true;
                sys.changeScript(resp);
                var oldContent = sys.getFileContent("scripts.js");
                sys.writeToFile("scripts.js", resp);
                sys.writeToFile("scripts_before_webcall.js", oldContent);
            } catch (e) {
                sys.changeScript(sys.getFileContent("scripts.js"));
                bot.sendMessage(src, "An error occured:", chan);
                bot.sendMessage(src,  e + " on line " + e.lineNumber, chan);
            }
        });
    });

    addMaintainerCommand("sessionrefill", function (src, command, commandData, tar, chan) {
        SESSION.refill();
        bot.sendMessage(src, "Done.", chan);
    });

    addMaintainerCommand("resetprofiling", function (src, command, commandData, tar, chan) {
        sys.resetProfiling();
        bot.sendMessage(src, "Done.", chan);
    });

    addMaintainerCommand("regremove", function (src, command, commandData, tar, chan) {
        var removed = Reg.remove(commandData);
        bot.sendMessage(src, commandData + " was " + (removed ? "removed" : "not removed (doesn't exist)") + ".", chan);
    });

    // /dump memory:profile
    // /dump *
    addMaintainerCommand("dump", function (src, command, commandData, tar, chan) {
        var types = (commandData || '*').split(':').map(Utils.lowerKeys),
            wildcard = types.indexOf('*') !== -1;
        function wantsDump(type) {
            return wildcard || types.indexOf(type) !== -1;
        }

        if (wantsDump('memory')) {
            bot.sendMessage(src, "Memory dump:", chan);
            sys.sendMessage(src, sys.memoryDump(), chan);
        }

        if (wantsDump('profile')) {
            bot.sendMessage(src, "Profile dump:", chan);
            sys.sendHtmlMessage(src, sys.profileDump().replace(/\n/g, '<br/>'), chan);
        }

        if (wantsDump('session')) {
            bot.sendMessage(src, "SESSION dump:", chan);
            sys.sendHtmlMessage(src, SESSION.dump().replace(/\n/g, '<br/>'), chan);
        }

        if (wantsDump('reg')) {
            bot.sendMessage(src, "Reg dump:", chan);
            sys.sendHtmlMessage(src, Reg.dump().replace(/\n/g, '<br/>'), chan);
        }
    });

    addMaintainerCommand("updatetiers", function (src, command, commandData, tar, chan) {
        if (!commandData || (commandData.substr(0, 7) !== 'http://' && commandData.substr(0, 8) !== 'https://')) {
            commandData = Config.dataurl + "tiers.xml";
        }
        sys.sendHtmlAll('<font color=blue><timestamp/><b>±TierBot: </b></font>The tiers were webcalled by ' + sys.name(src) + '!', 0);
        sys.webCall(commandData, function (resp) {
            try {
                sys.writeToFile("tiers.xml", resp);
                sys.reloadTiers();
            } catch (e) {
                bot.sendMessage(src, "Error updating tiers: " + e);
                print(e.backtracetext);
            }
        });
    });

    addMaintainerCommand(["testann", "updateann"], function (src, command, commandData, tar, chan) {
        if (!commandData || (commandData.substr(0, 7) !== 'http://' && commandData.substr(0, 8) !== 'https://')) {
            commandData = Config.dataurl + "announcement.html";
        }

        if (command === "updateann") {
            sys.sendHtmlAll('<font color=blue><timestamp/><b>±AnnouncementBot: </b></font>The announcement was webcalled by ' + sys.name(src) + '!', 0);
        }

        sys.webCall(commandData, function (resp) {
            if (command === "testann") {
                sys.setAnnouncement(resp, src);
            } else {
                var oldAnn = sys.getAnnouncement();
                sys.writeToFile("old_announcement.html", oldAnn);
                bot.sendMessage(src, "Old announcement stored in old_announcement.html", chan);
                sys.changeAnnouncement(resp);
            }
        });
    });

    addMaintainerCommand(["updatedesc"], function (src, command, commandData, tar, chan) {
        if (!commandData || (commandData.substr(0, 7) !== 'http://' && commandData.substr(0, 8) !== 'https://')) {
            commandData = Config.dataurl + "description.html";
        }

        sys.sendHtmlAll('<font color=blue><timestamp/><b>±DescriptionBot: </b></font>The description was webcalled by ' + sys.name(src) + '!', 0);

        sys.webCall(commandData, function (resp) {
            var oldDesc = sys.getDescription();
            sys.writeToFile("old_description.html", oldDesc);
            bot.sendMessage(src, "Old description stored in old_description.html", chan);
            sys.changeDescription(resp);
        });
    });

    require('feedmon.js').addCommands();

    /* Exports & metadata */
    module.exports = {
        handleCommand: handleCommand,
        canUseCommand: canUseCommand,
        addCommand: addCommand,
        addListCommand: addListCommand,
        addMaintainerCommand: addMaintainerCommand
    };

    module.reload = function () {
        // Update commands inside events
        require.reload('events.js');
        return true;
    };
}());
