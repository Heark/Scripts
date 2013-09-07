/*jslint continue: true, es5: true, evil: true, forin: true, sloppy: true, vars: true, regexp: true, newcap: true*/
/*global sys, SESSION, script: true, Qt, print, gc, version,
    GLOBAL: false, require: true, Config: true, module: true, exports: true*/

(function () {
    var Utils = require('utils'),
        Emotes = require('emotes'),
        Storage = require('storage').storage;
    
    function CommandList(title, bordercolor, help, listtype) {
        this.title = title;
        this.bordercolor = bordercolor;
        this.template = "<font color=" + this.bordercolor + " size=4><b>»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»</b></font><br><h2>" + title + "</h2><br>";
    
        if (!help && help !== "") {
            help = "Type the following in the main chat in order to use them:";
        }
    
        if (!listtype) {
            listtype = "ul";
        }
    
        if (help !== "") {
            this.template += "<i>" + help + "</i><br/><" + listtype + ">";
        }
    
        this.forCommands = title.indexOf("Commands") > -1 || title.indexOf("Option") > -1;
        this.isMarkdown = title.indexOf("Markdown") > -1;
        this.listtype = listtype;
    }

    CommandList.prototype.add = function (cmd, desc) {
        if (this.forCommands) {
            this.template += "<li><b>/" + cmd + ": " + desc + "</b></li>";
        } else {
            this.template += "<li><b>" + cmd + "</b></li>";
        }
    };
    
    CommandList.prototype.finish = function () {
        this.template += "</" + this.listtype + "><br><font color=" + this.bordercolor + " size=4><b>»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»</b></font>";
    };
    
    CommandList.prototype.display = function (player, channel) {
        sys.sendHtmlMessage(player, this.template, channel);
    };
    
    // Default border: 2
    // Default padding: 5
    function TableList(name, color, border, padding, borderColor) {
        this.name = name;
        this.color = color;
        this.border = border;
        this.padding = padding;
        this.borderColor = borderColor;
        
        this.template = "<font color=" + borderColor + " size=4><b>»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»</b></font><br><h2>" + name + "</h2><br/>";
        this.template += "<table border='" + border + "' cellpadding='" + padding + "'>";
        
        this.zebra = true;
    }
    
    TableList.prototype.bgcolor = function () {
        var color = this.color.toLowerCase();
        
        if (color === "zebra" || color === "stripe") {
            if (this.zebra) {
                color = "#eaeaea";
            } else {
                color = "#f4f4f4";
            }
            
            this.zebra = !this.zebra;
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
        this.template += "</table><br><br/><font color=" + this.borderColor + " size=4><b>»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»</b></font>";
    };
    
    TableList.prototype.display = function (player, channel) {
        sys.sendHtmlMessage(player, this.template, channel);
    };
    
    module.exports = {
        lists: function () {
            var Lists = {};
    
            var Commands = new CommandList("Commands", "navy");
            Commands.add("usercommands", "To view the commands for <b>users</b>.");
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
            User.add("autoidlelist", "To view the users who automatic idle.");
            User.add("emotepermlist", "To view the users who have emote permissions.");
            User.add("league", "To view the list of gym leaders, elites, and the champion.");
            User.add("leaguerules", "To view the rules for the League.");
            User.add("summonauth", "To summon all of the authorities.");
            User.add("tourusercommands", "To view the tournament commands for users.");
            User.add("sendto <font color=red><b>[person]</b></font>:<font color=red><b>[message]</b></font>", "To send a message to a certain person. To ping, just type /sendto [person].");
            User.add("emotes", "To view a list of emotes. For moderators and above only.");
            User.add("emotetoggle", "To toggle emotes on or off for you.");
            User.add("bbcode", "To view a list of bbcodes.");
            User.add("selfkick", "Kicks all the ghosts on your ip.");
            User.finish();
    
            Lists.User = User;
    
            /** LEAGUE MANAGER **/
            var LeagueManager = new CommandList("League Manager Commands", "navy");
            LeagueManager.add("gl <b><font color=red>[player]</font></b>:<font color=red><b>[spot]</b></font>", "To make someone the [spot] gym leader. [spot] can be 1-8. Removes gym leader [spot] if [player] is empty.");
            LeagueManager.add("el <b><font color=red>[player]</font></b>:<font color=red><b>[spot]</b></font>", "To make someone the [spot] elite. [spot] can be 1-4. Removes elite [spot] if [player] is empty.");
            LeagueManager.add("champ <b><font color=red>[player]</font></b>", "To make someone the champion. Removes the champion if [player] is empty.");
            LeagueManager.finish();
    
            Lists.LeagueManager = LeagueManager;
    
            /** FUN **/
            var Fun = new CommandList("Fun Commands", "navy");
            Fun.add("burn <font color=red><b>[player]</b></font>", "To burn someone.");
            Fun.add("freeze <font color=red><b>[player]</b></font>", "To freeze someone.");
            Fun.add("paralyze <font color=red><b>[player]</b></font>", "To burn someone.");
            Fun.add("poison <font color=red><b>[player]</b></font>", "To burn someone.");
            Fun.add("cure <font color=red><b>[player]</b></font>", "To cure someone.");
            Fun.add("me <font color=red><b>[message]</b></font>", "To post a message with *** around it.");
            Fun.add("facepalm", "To facepalm.");
            Fun.add("spin", "To play roulette if a game is going on.");
            Fun.add("attack <font color=red><b>[player]</b></font>", "To use a pokemon attack on someone.");
            Fun.add("superimp <font color=red><b>[name]</b></font>", "To superimp a name (<font size=2>Wraps your name in '~~'</font>)");
            Fun.add("impoff", "To stop imping.");
            Fun.finish();
    
            Lists.Fun = Fun;
    
            /** MEGAUSER **/
            var Megauser = new CommandList("Megauser Commands", "navy");
            Megauser.add("tour <font color=red><b>[tier]</b></font>:<b><font color=red>[#ofplayers]</font></b>:<font color=red><b>[prize]</b></font>", "To start a tournament with tier [tier] that allows [#ofplayers] people to play with optional prize [prize].");
            Megauser.add("endtour", "To end a running tournament.");
            Megauser.add("sub <font color=red><b>[player1]</b></font>:<font color=red><b>[player2]</b></font>", "To replace [player1] with [player2] in the running tournament.");
            Megauser.add("changecount <font color=red><b>[number]</b></font>", "To change the number of entrants allowed to [number] durning the signup phase.");
            Megauser.add("push <font color=red><b>[player]</b></font>", "To force [player] in the running tournament.");
            Megauser.add("dq <font color=red><b>[player]</b></font>", "To disqualify [player] from the running tournament.");
            Megauser.add("restart <font color=red><b>[name]</b></font>", "To restart [name]'s battle in the running tournament. Abusing this can cost you your megauser status.");
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
            var EmoteList = new TableList("Emotes", "stripe", 1, 2, "navy");
    
            var emotesToAdd = [],
                len,
                i;
            
            for (i = 0, len = Emotes.display.length; i < len; i += 1) {
                emotesToAdd.push(Utils.escapeHtml(Emotes.display[i]));
                
                if (emotesToAdd.length >= 8) {
                    EmoteList.add(emotesToAdd, false);
                    emotesToAdd = [];
                }
            }
            
            if (emotesToAdd.length) {
                EmoteList.add(emotesToAdd, false);
            }
    
            EmoteList.finish();
    
            Lists.Emotes = EmoteList;
    
            /** RULES **/
            var Rules = new CommandList("Rules", "navy", "Please follow the rules or risk punishment:", "ol");
            Rules.add("Do not troll people. It is disrespectful and will not be tolerated here.");
            Rules.add("Do not disrespect anyone. Disrespect will not be tolerated and you WILL be reprimanded.");
            Rules.add("Do not ask for any kind of auth. In order to get auth, you must earn it.");
            Rules.add("Do not abuse CAPS. Either CAPSBot will mute you or an auth will if you overuse CAPS.");
            Rules.add("Do not advertise your server. Advertising will give your server a bad reputation and result in a mute or kick.");
            Rules.add("Do not spam or flood the chat. FloodBot will kick you and/or an auth will mute you.");
            Rules.add("No sexual or harmful content whatsoever. This includes: porn sites, viruses, sexual conversations, etc.. You will be punished.");
            Rules.add("Listen to the auth. If an auth tells you to stop misbehaving, you must listen or your punishment is their choice.");
            Rules.add("No racism or sexism shall be exercised by any persons whatsoever. Exhibiting this action will grant a heavy level of punishment to whomever is responsible.");
    
            Rules.template += "</ol>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Follow all the rules above and you will have no problem having a good time at " + Storage.read("servername") + "!<br>";
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
            Mod.add("changetopic <font color=red><b>[channel]</b></font>:<font color=red><b>[topic]</b></font>", "To change the topic of the channel [channel] to [topic].");
            Mod.add("wall <font color=red><b>[text]</b></font>", "To post [text] with borders around it. [appears in all channels]");
            Mod.add("cwall <font color=red><b>[text]</b></font>", "To post [text] with borders around it. [only appears in channel command used in]");
            Mod.add("addautoidle <font color=red>[name]</font>", "To add [name] to the auto idle list");
            Mod.add("removeautoidle <font color=red>[name]</font>", "To remove [name] from the auto idle list.");
            Mod.add("addfloodignore <font color=red><b>[name]</b></font>", "To add [name] to the flood ignore list.");
            Mod.add("removefloodignore <font color=red><b>[name]</b></font>", "To remove [name] from the flood ignore list.");
            Mod.add("emoteperms <font color=red><b>[name]</b></font>", "To add/remove [name] from the emote permission list.");
            Mod.add("imp <font color=red><b>[name]</b></font>", "To change your name to [name].");
            Mod.add("motd <font color=red><b>[message]</b></font>", "To change the Message of the Day to [message].");
            Mod.add("roulette <font color='red'><b>&lt;type1, type2&gt;</b></font>", "To start or end a roulette (/spin) game. Types can include: pokemons, items, emotes, avatars. By default, all 4 are enabled.");
            Mod.add("info <font color=red><b>[player]</b></font>", "To view info about [player].");
            Mod.add("hurr", "To fix the chat if it got messed up.");
            Mod.add("sendall <font color=red><b>[message]</b></font>", "To send a message to everyone.");
            Mod.add("sendhtmlall <font color=red><b>[message]</b></font>", "To send a HTML message to everyone.");
            Mod.add("warn <font color=red><b>[player]</b></font>:<font color=red><b>[reason]</b></font>", "To send a warning to [player] with reason [reason].");
            Mod.add("tellupdate <font color=red><b>[player]</b></font>", "To tell [player] how to update to the latest version.");
            Mod.add("getmotd", "To get the MOTD (including HTML).");
            Mod.add("moderationcommands", "To display a list of commands that moderate the chat.");
            Mod.add("partycommands", "To display a list of party commands.");
            Mod.add("silence", "To silence all users.");
            Mod.add("unsilence", "To cancel the silence.");
            Mod.add("silenceoff", "Same as unsilence.");
            Mod.add("public", "To make the server public.");
            Mod.finish();
    
            Lists.Mod = Mod;
    
            /** MODERATION COMMANDS **/
            var Moderate = new CommandList("Moderation Commands", "navy");
            Moderate.add("logwarn <font color=red><b>[player]</b></font>", "To warn [player] of excessive logs.");
            Moderate.add("kick <font color=red><b>[player*player2]</b></font>:<font color=red><b>[reason]</b></font>", "To kick [player] from the server. You can kick multiple players with by separating their names with '*'. [reason] is optional.");
            Moderate.add("channelkick <font color=red><b>[player]</b></font>", "To kick [player] from the channel.");
            Moderate.add("mute <font color=red><b>[person]</b></font>:<font color=red><b>[time]</b></font>:<font color=red><b>[unit]</b></font>:<font color=red><b>[reason]</b></font>", "To mute someone, [time], [timeunit], and [reason] is optional. [Units are: seconds, minutes, hours, days, weeks, months, years, decades. Default is minutes]. If no time is specified, mutes forever. You can skip time by doing: /mute [player]:::[reason].");
            Moderate.add("unmute <font color=red><b>[person]</b></font>", "To unmute [person].");
            Moderate.add("tempban <font color=red>[person]:[time]:[timeunit]:[reason]</font>", "To tempban [person] for [time]. [timeunit] and [reason] are optional. Units are the same from /mute. Default time is 30 minutes.");
            Moderate.add("untempban <font color=red>[person]</font>", "To remove [person]'s tempban.");
            Moderate.add("mutes", "To see a list of muted people.");
            //Moderate.add("tempbans", "To see a list of temporarily banned players.");
            Moderate.add("rangebans", "To see a list of rangebanned ips.");
            Moderate.add("message <font color=red><b>[kick/ban/welcome]:[message]</b></font>", "To set your kick, ban, or welcome message. Use {target} to say target (if kick or ban msg). If it is a welcome message, use {server} to say the server. You can use HTML, but don't aboose. Example: " + Utils.escapeHtml("<font color=green><timestamp/> <b>Ian struck the banhammer on {target}!</b></font>."));
            Moderate.add("viewmessage", "<fontcolor=red><b>[kick/ban/welcome]</b></font", "To view your kick, ban, or welcome message.");
            Moderate.add("removemessage", "<fontcolor=red><b>[kick/ban/welcome]</b></font", "To remove a kick, ban, or welcome message.");
    
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
            Admin.add("<font color=blue>[s]</font>ban <font color=red><b>[player]</b></font>", "To ban [player]. Use /sban instead to silently ban.");
            Admin.add("unban <font color=red><b>[player]</b></font>", "To unban a [player].");
            Admin.add("skick <font color=red><b>[player]</b></font>", "To silently kick [player].");
            Admin.add("clearpass <font color=red><b>[player]</b></font>", "To clear [player]'s password.");
            Admin.add("clearchat <font color=red><b>[channel]</b></font>", "To clear the chat in the channel [channel]. Default channel is " + sys.channel(0));
            Admin.add("supersilence", "To silence all users and mods.");
            Admin.add("unssilence", "To cancel the super silence.");
            Admin.add("ssilenceoff", "Same as unssilence.");
            Admin.add("showteam <font color=red><b>[player]</b></font>", "To view a player's team.");
            Admin.add("forcerules <font color=red><b>[player]</b></font>", "To show the rules to [player].");
            Admin.add("megauser <font color=red><b>[player]</b></font>", "To make [player] a megauser.");
            Admin.add("megauseroff <font color=red><b>[player]</b></font>", "To remove [player]'s megauser.");
            Admin.add("private", "To make the server private.");
            Admin.finish();
    
            Lists.Admin = Admin;
    
            /** OWNER COMMANDS **/
            var Owner = new CommandList("Owner Commands", "navy");
            Owner.add("authoptions", "To view the authority options.");
            Owner.add("eval <font color=red><b>[code]</b></font>", "To evaluate [code].");
            Owner.add("resetladder", "To reset all ladders.");
            Owner.add("bots", "To turn all bots on or off.");
            Owner.finish();
    
            Lists.Owner = Owner;
    
            /** AUTH OPTIONS **/
            var Auth = new CommandList("Auth Options", "navy");
            Auth.add("changeauth <font color=red><b>[player]</b></font>:<font color=red><b>[level]</b></font>", "Changes a user's auth.");
            Auth.add("dbauths", "To view all the players who have auth in the database.");
            Auth.finish();
    
            Lists.Auth = Auth;
            return Lists;
        }
    };
}());

