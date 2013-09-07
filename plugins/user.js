/*jslint continue: true, es5: true, evil: true, forin: true, sloppy: true, vars: true, regexp: true, newcap: true*/
/*global sys, SESSION, script: true, Qt, print, gc, version,
    GLOBAL: false, require: true, Config: true, module: true, exports: true*/
    
(function () {
    function User(id) {
        var ip = sys.ip(id);
        
        this.id = id;
        this.ip = ip;
        this.floodCount = 0;
        this.caps = 0;
        this.muted = false;
        //Mutes.hasOwnProperty(ip);
    
        this.originalName = sys.name(id);
        this.megauser = false;
        //MegaUsers.hasOwnProperty(this.originalName.toLowerCase());
    }
    
    exports.User = User;
}());