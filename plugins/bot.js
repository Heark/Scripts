/*jslint continue: true, es5: true, evil: true, forin: true, sloppy: true, vars: true, regexp: true, newcap: true*/
/*global sys, SESSION, script: true, Qt, print, gc, version,
    GLOBAL: false, require: true, Config: true, module: true, exports: true*/
    
(function () {
    function Bot(name, color, prefix, italics) {
        this.name = name;
        this.italics = !!italics;
        this.prefix = prefix || (this.italics ? "+" : "±");
        this.color = color || "red";
    }
    
    Bot.prototype.sendAll = function (message, channel) {
        var italics = ["", ""];
        
        if (this.italics) {
            italics = ["<i>", "</i>"];
        }
    
        var message_format = "<font color='" + this.color + "'><timestamp/>" + this.prefix + "<b>" + italics[0] + this.name + ":" + italics[1] + "</b></font> " + message;
    
        if (channel === undefined) {
            sys.sendHtmlAll(message_format);
            return;
        }
    
        sys.sendHtmlAll(message_format, channel);
    };
    
    Bot.prototype.sendMessage = function (player, message, channel) {
        var italics = ["", ""];
        if (this.italics) {
            italics = ["<i>", "</i>"];
        }
    
        var message_format = "<font color='" + this.color + "'><timestamp/>" + this.prefix + "<b>" + italics[0] + this.name + ":" + italics[1] + "</b></font> " + message;
    
        if (channel === undefined) {
            sys.sendHtmlMessage(player, message_format);
            return;
        }
    
        sys.sendHtmlMessage(player, message_format, channel);
    };
    
    exports.load = function () {
        exports.bots.bot = new Bot("Bot", "blue");
        exports.bots.guard = new Bot("Guard", "darkred");
        exports.bots.watchbot = new Bot("Watch", "green");
        exports.bots.topicbot = new Bot("Channel Topic", "red", "±");
        exports.bots.setbybot = new Bot("Set By", "orange", "±");
        exports.bots.capsbot = new Bot("CAPSBot", "mediumseagreen");
        exports.bots.flbot = new Bot("FloodBot", "mediumseagreen");
    };
    
    exports.Bot = Bot;
    exports.bots = {};
}());