(function () {
    var listBorder = "»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»";

    function formatArgs(args) {
        if (!args || !Array.isArray(args)) {
            return "";
        }

        return " " + args.map(function (val) {
            return "<b style='color: #f40000;'>[" + val + "]</b>";
        }).join(":");
    }

    CommandList = function (title, bordercolor, help, listtype) {
        this.title = title;
        this.bordercolor = bordercolor;
        this.template = "<font color='" + this.bordercolor + "' size='4'><b>" + listBorder + "</b></font><br/><h2>" + title + "</h2>";

        if (!help && help !== "") {
            help = "Type one of the following into the channel's chat to use it:";
        }

        if (!listtype) {
            listtype = "ul";
        }

        if (help !== "") {
            this.template += "<i>" + help + "</i><" + listtype + ">";
        }

        this.forCommands = title.indexOf("Commands") > -1 || title.indexOf("Option") > -1;
        this.isMarkdown = title.indexOf("Markdown") > -1;
        this.listtype = listtype;
    };

    CommandList.prototype.add = function (cmd, desc, args) {
        if (this.forCommands) {
            if (!args) {
                cmd = "/<a href='po:send//" + cmd + "' style='text-decoration: none; color: black;'>" + cmd + "</a>";
            } else {
                cmd = "/" + cmd;
            }

            this.template += "<li><b>" + cmd + "</b>" + formatArgs(args) + " " + desc + "</li>";
        } else {
            this.template += "<li><b>" + cmd + "</b></li>";
        }
    };

    CommandList.prototype.finish = function () {
        this.template += "</" + this.listtype + "><br/><font color='" + this.bordercolor + "' size='4'><b>" + listBorder + "</b></font>";
    };

    CommandList.prototype.display = function (player, channel) {
        sys.sendHtmlMessage(player, this.template, channel);
    };

    // Default border: 2
    // Default padding: 5
    TableList = function (name, color, border, padding, borderColor) {
        this.name = name;
        this.color = color;
        this.border = border;
        this.padding = padding;
        this.borderColor = borderColor;

        this.template = "<font color='" + borderColor + "' size='4'><b>" + listBorder + "</b></font><h2>" + name + "</h2><br/>";
        this.template += "<table border='" + border + "' cellpadding='" + padding + "'>";

        this._zebra = true;
    };

    TableList.prototype.bgcolor = function () {
        var color = this.color.toLowerCase();

        if (color === "zebra" || color === "stripe") {
            if (this._zebra) {
                color = "#eaeaea";
            } else {
                color = "#f4f4f4";
            }

            this._zebra = !this._zebra;
        }

        return color;
    };

    TableList.prototype.add = function (elements, isBold) {
        var out = "<tr bgcolor='" + this.bgcolor() + "'>",
            tags = isBold ? ['<th>', '</th>'] : ['<td>', '</td>'],
            len,
            i;

        for (i = 0, len = elements.length; i < len; i += 1) {
            out += tags[0] + elements[i] + tags[1];
        }

        out += "</tr>";
        this.template += out;
    };

    TableList.prototype.addEvery = function (elements, isBold, every, remainingIsBold) {
        var out = [],
            len,
            element;

        for (element = 0, len = elements.length; element < len; element += 1) {
            out.push(elements[element]);

            if (out.length >= every) {
                this.add(out, isBold);
                out = [];
            }
        }

        if (out.length) {
            this.add(out, remainingIsBold === undefined ? isBold : remainingIsBold);
        }
    };

    TableList.prototype.finish = function () {
        this.template += "</table><br><br/><font color='" + this.borderColor + "' size='4'><b>»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»</b></font>";
    };

    TableList.prototype.display = function (player, channel) {
        sys.sendHtmlMessage(player, this.template, channel);
    };

    function generateLists() {
        var Lists = {};

        var Commands = new CommandList("Commands", "navy");
        Commands.add("usercommands", "To view the commands for <b>users</b>.");
        Commands.add("feedmoncommands", "To view the commands related to <b>feedmon</b>.");
        Commands.add("megausercommands", "To view the commands for <b>megausers</b>.");
        Commands.add("leaguemanagercommands", "To view the commands for <b>leaguemanagers</b>.");
        Commands.add("modcommands", "To view the commands for <b>moderators</b>.");
        Commands.add("admincommands", "To view the commands for <b>administrators</b>.");
        Commands.add("ownercommands", "To view the commands for <b>owners</b>.");
        Commands.finish();

        Lists.Commands = Commands;

        /** USER COMMANDS **/
        var User = new CommandList("User Commands", "navy");
        User.add("funcommands", "To view the fun commands.");
        User.add("rules", "To view the rules.");
        User.add("scriptinfo", "To view script information.");
        User.add("auth", "To view the authlist.");
        User.add("megausers", "To view the list of people who can make tournaments.");
        User.add("floodignorelist", "To view the users who can't be flood kicked");
        User.add("emotepermlist", "To view the users who have emote permissions.");
        User.add("league", "To view the list of gym leaders, elites, and the champion.");
        User.add("leaguerules", "To view the rules for the League.");
        User.add("tourusercommands", "To view the tournament commands for users.");
        User.add("sendto", "To send a message to a certain person. To ping, just type /sendto [person].", ["person", "message"]);
        User.add("emotes", "To view a list of emotes. For moderators and above only.");
        User.add("emotetoggle", "To toggle emotes on or off for you.");
        User.add("bbcode", "To view a list of bbcodes.");
        User.add("selfkick", "Kicks all the ghosts on your ip.");
        User.add("vote", "To vote on a poll option.", ["option"]);
        User.add("calc", "Evaluates a mathematical expression (10 / 2 * 4 ^ pi!). Full documentation <a href='https://github.com/josdejong/mathjs/blob/master/README.md'>here</a>.", ["expression"]);
        User.add("players", "Tells you how many players there are online on the given [os] (windows, mac, linux, android, webclient). If not specified, tells you how many players there are online regardless of OS.", ["os"]);
        User.finish();

        Lists.User = User;

        /** LEAGUE MANAGER **/
        var LeagueManager = new CommandList("League Manager Commands", "navy");
        LeagueManager.add("gl", "To make someone the [spot] gym leader. [spot] can be 1-8. Removes gym leader [spot] if [player] is empty.", ["player", "spot"]);
        LeagueManager.add("el", "To make someone the [spot] elite. [spot] can be 1-4. Removes elite [spot] if [player] is empty.", ["player", "spot"]);
        LeagueManager.add("champ", "To make someone the champion. Removes the champion if [player] is empty.", ["player"]);
        LeagueManager.finish();

        Lists.LeagueManager = LeagueManager;

        /** FUN **/
        var Fun = new CommandList("Fun Commands", "navy");
        Fun.add("burn", "To burn someone.", ["player"]);
        Fun.add("freeze", "To freeze someone.", ["player"]);
        Fun.add("paralyze", "To burn someone.", ["player"]);
        Fun.add("poison", "To burn someone.", ["player"]);
        Fun.add("cure", "To cure someone.", ["player"]);
        Fun.add("me", "To post a message with *** around it.", ["message"]);
        Fun.add("spin", "To play roulette if a game is going on.");
        Fun.add("attack", "To use a pokemon attack on someone.", ["player"]);
        Fun.add("superimp", "To superimp a name (<font size=2>Wraps your name in '~~'</font>)", ["name"]);
        Fun.add("impoff", "To stop imping.");
        Fun.finish();

        Lists.Fun = Fun;

        /** FEEDMON **/
        var FeedmonList = new CommandList("Feedmon Commands", "navy");
        FeedmonList.add("catch", "Catches a random pokemon.");
        FeedmonList.add("feed", "Feeds your caught pokemon.");
        FeedmonList.add("nickname", "Gives your caught pokemon a nickname.", ["name"]);
        FeedmonList.add("level", "If [option] is all, displays requirements for all levels. Otherwise, displays how many EXP you still need for the next level.", ["option"]);
        FeedmonList.add("battle", "Starts a battle with a random pokémon.");
        FeedmonList.add("move", "Uses one of your pokemon's moves in battle.", ["num"]);
        FeedmonList.add("heal", "Revives/heals your (fainted) pokemon.");
        FeedmonList.finish();

        Lists.Feedmon = FeedmonList;

        /** MEGAUSER **/
        var Megauser = new CommandList("Megauser Commands", "navy");
        Megauser.add("tour", "To start a tournament with tier [tier] that allows [#ofplayers] people to play with optional prize [prize].", ["tier", "#ofplayers", "prize"]);
        Megauser.add("endtour", "To end a running tournament.");
        Megauser.add("sub", "To replace [player1] with [player2] in the running tournament.", ["player1", "player2"]);
        Megauser.add("changecount", "To change the number of entrants allowed to [number] durning the signup phase.", ["number"]);
        Megauser.add("push", "To force [player] in the running tournament.", ["player"]);
        Megauser.add("dq", "To disqualify [player] from the running tournament.", ["player"]);
        Megauser.add("restart", "To restart [name]'s battle in the running tournament. Abusing this can cost you your megauser status.", ["name"]);
        Megauser.finish();

        Lists.Megauser = Megauser;

        /** TOURNAMENT USER **/
        var Tour = new CommandList("Tour User Commands", "navy");
        Tour.add("join", "To join a tournament durning the signup phase.");
        Tour.add("unjoin", "To leave a tournament.");
        Tour.add("viewround", "To view the status of the tournament.");
        Tour.add("tourtier", "To view the tier of the tournament.");
        Tour.finish();

        Lists.Tour = Tour;

        /** EMOTES **/
        var Emotes = new TableList("Emotes", "stripe", 1, 2, "navy");

        var emotesToAdd = [],
            len,
            i;

        for (i = 0, len = EmoteList.__display__.length; i < len; i += 1) {
            emotesToAdd.push(Utils.escapeHtml(EmoteList.__display__[i]));

            if (emotesToAdd.length >= 8) {
                Emotes.add(emotesToAdd, false);
                emotesToAdd = [];
            }
        }

        if (emotesToAdd.length) {
            Emotes.add(emotesToAdd, false);
        }

        Emotes.finish();

        Lists.Emotes = Emotes;

        /** RULES **/
        var Rules = new CommandList("Rules", "navy", "Please follow the rules or risk punishment:", "ol");
        Rules.add("Keep disrespectful statements to a minimum. Jokes shouldn't go too far and direct disrespect may warrant punishment depending on its severity.");
        Rules.add("Do not ask for any kind of auth. In order to get auth, you must earn it.");
        Rules.add("Do not abuse CAPS. Either CAPSBot or an auth will kick + mute you if you overuse CAPS.");
        Rules.add("Do not advertise your server. Advertising will give your server a bad reputation and result in a mute or ban depending on severity.");
        Rules.add("Do not spam or flood the chat. FloodBot and/or an auth will kick/mute you.");
        Rules.add("No sexual or harmful content whatsoever. This includes porn sites, viruses, sexual ASCII art, etc.. You will be punished.");
        Rules.add("Listen to the auth. If an auth tells you to stop misbehaving, you must listen or your punishment is their choice (as long as it's reasonable).");
        Rules.add("No sexism shall be exercised by any persons whatsoever. Exhibiting this action will grant a kick or mute to whomever is responsible.");
        Rules.add("Do not repeat the same message over and over, you will be kicked or muted swiftly.");

        Rules.template += "</ol>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Follow all the rules above and you will have no problem having a good time at " + Reg.get("servername") + "!<br>";
        Rules.finish();

        Lists.Rules = Rules;

        /** LEAGUE RULES **/
        var League = new CommandList("League Rules", "navy", "Please follow the rules below or you will be unable to challenge the league:", "ol");
        League.add("You must follow any rules made by the gym leader/elite 4. If the rule is crazy, talk to an auth. If the gym leader/elite 4 doesn't have rules, read rule 8.");
        League.add("No lying. If you lie about defeating a league member, you will have to start the league over again.");
        League.add("Be a good sport. If you lose, say GG or nothing, just don't be mean!");
        League.add("Respect one another. This rule goes for both league members and challengers. Friendly trash talk is fine, don't make it personal.");
        League.add("If you lose a gym battle, you can rematch that gym at a time specified by the gym leader.");
        League.add("If you lose to an elite 4 or the champion, you must start back over at the first elite.");
        League.add("If you defeat the gyms, elites, and the champion, you will be in the Hall of Fame!");
        League.add("If the league member does not have set rules, follow these guidelines:</ol><ul><b><li>5th Gen OU Tier</li><b><li>Singles battle</li><b><li>Best 2 out of 3 decides winner</li></ul></li>");
        League.finish();

        Lists.LeagueRules = League;

        /** MODERATOR COMMANDS **/
        var Mod = new CommandList("Moderator Commands", "navy");
        Mod.add("moderationcommands", "To display a list of commands that moderate the chat.");
        Mod.add("partycommands", "To display a list of party commands.");
        Mod.add("changetopic", "To change the topic of the channel [channel] to [topic].", ["channel", "topic"]);
        Mod.add("[c]wall", "To post [text] with borders around it. [c makes it so it only appears in the channel it's used in]", ["text"]);
        Mod.add("floodignore", "Toggles [name]'s flood ignore privilege.", ["name"]);
        Mod.add("emoteperms", "To add/remove [name] from the emote permission list.", ["name"]);
        Mod.add("imp", "To change your name to [name].", ["name"]);
        Mod.add("motd", "To change the Message of the Day to [message].", ["message"]);
        Mod.add("roulette", "To start or end a roulette (/spin) game. Types can include: pokemons, items, emotes, avatars. By default, all 4 are enabled. It is separated with a comma followed by a space (, ).", ["type1, type2"]);
        Mod.add("forcerules", "To show the rules to [player].", ["player"]);
        Mod.add("info", "To view info about [player].", ["player"]);
        Mod.add("sendall", "To send a message to everyone.", ["message"]);
        Mod.add("sendhtmlall", "To send a HTML message to everyone.", ["message"]);
        Mod.add("warn", "To send a warning to [player] with reason [reason]. If [reason] is undo, the warning is undone. [reason] is only required when the target hasn't been infracted. Further usage of the command will result in a kick/mute (5 minutes) of the player.", ["player", "reason"]);
        Mod.add("getmotd", "To get the MOTD (including HTML).");
        Mod.add("public", "To make the server public.");
        Mod.add("poll", "To start a poll. You must specify at least 2 options.", ["subject", "option1*option2*option..."]);
        Mod.add("closepoll", "To close the poll.");
        Mod.add("onos", "Gives you the list of players on the given [os] (windows, mac, linux, android, webclient).", ["os"]);
        Mod.finish();

        Lists.Mod = Mod;

        /** MODERATION COMMANDS **/
        var Moderate = new CommandList("Moderation Commands", "navy");
        Moderate.add("logwarn", "To warn [player] of excessive logs.", ["player"]);
        Moderate.add("tellemotes", "To explain to [player] what emotes are.", ["player"]);
        Moderate.add("kick", "To kick [player] from the server. You can kick multiple players with by separating their names with '*'. [reason] is optional.", ["player*player2", "reason"]);
        Moderate.add("channelkick", "To kick [player] from the channel.", ["player"]);
        Moderate.add("mute", "To mute someone, [time], [timeunit], and [reason] are optional. [Units are: seconds, minutes, hours, days, weeks, months, years, decades. Default is minutes]. If no time is specified, mutes forever. You can skip time by doing: /mute [player]:::[reason].", ["person", "time", "unit", "reason"]);
        Moderate.add("unmute", "To unmute [person].", ["person"]);
        Moderate.add("tempban", "To tempban [person] for [time]. [timeunit] and [reason] are optional. Units are the same from /mute. Default time is 30 minutes.", ["person", "time", "timeunit", "reason"]);
        Moderate.add("untempban", "To remove [person]'s tempban.", ["person"]);
        Moderate.add("mutes", "To see a list of muted people.");
        Moderate.add("tempbans", "To see a list of temporarily banned players.");
        Moderate.add("rangebans", "To see a list of rangebanned ips.");
        Moderate.add("silence", "To silence all users.");
        Moderate.add("unsilence", "To cancel the silence.");
        Moderate.add("message", "To set your kick, ban, or welcome message. Use {target} to say target (if kick or ban msg). If it is a welcome message, use {server} to say the server. You can use HTML, but don't abuse. Example: " + Utils.escapeHtml("<font color=green><timestamp/> <b>Ethan struck the banhammer on {target}!</b></font>."), ["kick/ban/welcome", "message"]);
        Moderate.add("viewmessage", "To view your kick, ban, or welcome message.", ["kick/ban/welcome"]);
        Moderate.add("removemessage", "To remove a kick, ban, or welcome message.", ["kick/ban/welcome"]);

        Moderate.finish();

        Lists.Moderate = Moderate;

        var Party = new CommandList("Party Commands", "navy");
        Party.add("lolmode", "To turn color mode on or off.");
        Party.add("spacemode", "To turn space mode on or off.");
        Party.add("capsmode", "To turn caps mode on or off.");
        Party.add("reversemode", "To turn reverse mode on or off.");
        Party.add("scramblemode", "To turn scramble mode on or off.");
        Party.add("colormode", "To turn color mode on or off.");
        Party.add("pewpewpew", "To turn pewpewpew mode on or off.");
        Party.finish();

        Lists.Party = Party;

        /** ADMIN COMMANDS **/
        var Admin = new CommandList("Administrator Commands", "navy");
        Admin.add("<font color=blue>[s]</font>ban", "To ban [player]. Use /sban instead to silently ban.", ["player"]);
        Admin.add("unban", "To unban a [player].", ["player"]);
        Admin.add("skick", "To silently kick [player].", ["player"]);
        Admin.add("clearpass", "To clear [player]'s password.", ["player"]);
        Admin.add("clearchat", "To clear the chat in the channel [channel]. Default channel is " + sys.channel(0) + ".", ["channel"]);
        Admin.add("supersilence", "To silence all users and mods.");
        Admin.add("unssilence", "To cancel the super silence. Note: double s.");
        Admin.add("showteam", "To view a player's team.", ["player"]);
        Admin.add("megauser", "To give/take [player] megauser status.", ["player"]);
        Admin.add("private", "To make the server private.");
        Admin.finish();

        Lists.Admin = Admin;

        /** OWNER COMMANDS **/
        var Owner = new CommandList("Owner Commands", "navy");
        Owner.add("authoptions", "To view the authority options.");
        Owner.add("eval", "To evaluate [code].", ["code"]);
        Owner.add("resetladder", "To reset all ladders.");
        Owner.add("bots", "To turn all bots on or off.");
        Owner.finish();

        Lists.Owner = Owner;

        /** AUTH OPTIONS **/
        var Auth = new CommandList("Auth Options", "navy");
        Auth.add("changeauth", "Changes a user's auth.", ["player", "level"]);
        Auth.add("dbauths", "To view all the players who have auth in the database.");
        Auth.finish();

        Lists.Auth = Auth;
        return Lists;
    }

    module.exports = {
        lists: generateLists,
        CommandList: CommandList,
        TableList: TableList
    };

    module.reload = function () {
        Lists = generateLists();
        return true;
    };
}());
