/*jslint continue: true, es5: true, evil: true, forin: true, sloppy: true, vars: true, regexp: true, newcap: true*/
/*global sys, SESSION, script: true, Qt, print, gc, version,
    GLOBAL: false, require: true, Config: true, module: true, exports: true*/

/* Meteor Falls v0.6 Scripts.
    By: HHT, TheUnknownOne, Ethan
    Credit to: Max, Lutra
*/

var Config = {
    // Configuration for the script.
    repourl: "https://raw.github.com/meteor-falls/Scripts/master/plugins/", // Repo to load plugins from.
    dataurl: "https://raw.github.com/meteor-falls/Server-Shit/master/", // Repo to load data (announcement/description + tiers) from.
    
    plugindir: "plugins/", // Plugin directory.
    
    serverowner: "HHT", // The server owner.
   
    permissions: {
        update: ["hht", "ethan", "theunknownone"], // People who can update scripts/tiers.
        
        // Gives users access to all commands of that level.
        auth_permissions: {
            mod: [],
            admin: [],
            owner: ["ethan"]
        }
    },

    // Module options
    fromWeb: true, // Whether or not to load plugins from repourl. If set to false, they will load locally.
    
    // Misc.
    stripHtmlFromChannelMessages: true, // If HTML should be stripped from channel messages outputted onto the server window.
    emotesEnabled: true // If emotes are enabled
};

var GLOBAL = this;

var require = (function () {
    var dir = Config.plugindir;
    sys.makeDir(dir);
    
    function resolve(file) {
        var fargs = file.split('.'),
            fname = file[0],
            fext = file[1];
        
        if (!fext) {
            fext = ".js";
        }
        
        return fname + fext;
    }
    
    function unresolve(file) {
        return file.split('.')[0];
    }
    
    function un(file) {
        var fileName = resolve(file);
        
        if (require.modules[fileName]) {
            require.modules[fileName] = null;
            return true;
        }
        
        return false;
    }
    
    function callHooks(evt) {
        var args = [].slice.call(arguments, 1),
            stop = false,
            module,
            res,
            i;
        
        for (i in require.modules) {
            module = require.modules[i];
            
            if (module[evt]) {
                try {
                    res = module[evt].apply(module[evt], args);
                    
                    if (res) {
                        stop = true;
                    }
                } catch (ex) {
                    sys.sendAll("[Fatal] Couldn't call event '" + evt + "' in module '" + module + "': " + ex + " (line " + ex.lineNumber + ")");
                }
            }
        }
        
        return stop;
    }
    
    function require(file, fromWeb, noCache) {
        var fileName = resolve(file),
            moduleName = unresolve(file);
        
        if (Config.fromWeb) {
            fromWeb = Config.fromWeb;
        } else if (require.fromWeb) {
            fromWeb = require.fromWeb;
        }
        
        if (require.noCache) {
            noCache = require.noCache;
        }
        
        if (require.modules[fileName] && !noCache) {
            return require.modules[fileName];
        }
        
        var fileContent = sys.getFileContent(dir + fileName),
            module = {
                exports: {}
            },
            exports = module.exports;
        
        if (fromWeb || !fileContent) {
            fileContent = sys.synchronousWebCall(Config.repourl + fileName);
            
            if (!fileContent) {
                sys.sendAll("[Fatal] Couldn't require module '" + moduleName + "': No local copy exists, couldn't download.");
                return false;
            }
            
            sys.writeToFile(dir + fileName, fileContent);
        }
        
        try {
            eval(fileContent);
        } catch (ex) {
            print("[Fatal] Couldn't require module '" + moduleName + "': " + ex + " (line " + ex.lineNumber + ").");
            return false;
        }
        
        if (module.exports.load) {
            module.exports.load();
        }
        
        require.modules[fileName] = module.exports;
        return require.modules[fileName];
    }
    
    require.resolve = resolve;
    require.unresolve = unresolve;
    require.un = un;
    
    require.noCache = false;
    require.fromWeb = false;
    require.modules = {};
    return require;
}());

/*
function reloadPlugin(plugin_name) {
    
    if (plugin_name === "init.js") {
        script.init();
    } else if (plugin_name === "lists.js") {
        script.loadCommandLists();
    } else if (plugin_name === "bot.js") {
        script.loadBots();
    } else if (plugin_name === "reg.js") {
        script.loadRegHelper();
    } else if (plugin_name === "emotes.js") {
        Plugins('emotes.js')();
        
        // We also have to reload the command lists,
        // otherwise /emotes won't be updated
        script.loadCommandLists();
    }
}*/

var poScript = require('events');