/*jslint continue: true, es5: true, evil: true, forin: true, sloppy: true, vars: true, regexp: true, newcap: true*/
/*global sys, SESSION, script: true, Qt, print, gc, version,
    GLOBAL: false, require: true, Config: true, module: true, exports: true*/

(function () {
    var defaultFile = "Reg.json";
    
    function hasOwn(obj, val) {
        return Object.prototype.hasOwnProperty.call(obj, val);
    }
    
    function Storage(file) {
        this.data = {};
        
        this.file = file || defaultFile;
        this.changed = false;
        
        sys.appendToFile(this.file, "");
        
        if (sys.getFileContent(this.file) === "") {
            sys.writeToFile(this.file, "{}");
        }
        
        try {
            this.data = JSON.parse(sys.getFileContent(this.file));
        } catch (ex) {
            sys.sendAll("[Fatal] Couldn't parse storage for " + this.file + ".");
        }
    }
    
    Storage.prototype.add = function add(key, value, force) {
        var old = this.data[key];
        
        if (value !== old || force) {
            this.data[key] = value;
            this.changed = true;
        }
        
        return this;
    };
    
    Storage.prototype.ensure = function ensure(key, value, force) {
        if (!hasOwn(this.data, key)) {
            this.add(key, value, force);
        }
        
        return this;
    };
    
    Storage.prototype.read = Storage.prototype.get = function get(key) {
        return this.data[key];
    };
    
    Storage.prototype.remove = function remove(key) {
        if (hasOwn(this.data, key)) {
            delete this.data[key];
            this.changed = true;
        }
        
        return this;
    };
    
    Storage.prototype.save = function save(force) {
        if (this.changed || force) {
            sys.writeToFile(this.file, JSON.stringify(this.data));
            this.changed = false;
        }
        
        return this;
    };
    
    Storage.prototype.wipe = function wipe(ret) {
        var old = this.data;
        
        this.data = {};
        this.save();
        
        if (ret) {
            return old;
        }
        
        return this;
    };
    
    function create(file) {
        return new Storage(file);
    }
    
    exports.storage = new Storage();
    exports.Storage = Storage;
    exports.create = create;
}());