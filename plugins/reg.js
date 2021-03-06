(function () {
    var currentVersion = 1;
    function updateReg(reg) {
        if (reg.version === 0) {
            ("Megausers FloodIgnore Mutes Rangebans Kickmsgs Banmsgs Welmsgs EmoteToggles Emoteperms Feedmon")
                .split(" ")
                .forEach(function (key) {
                    var val = reg.get(key);
                    if (typeof val === "string") {
                        reg.save(key, JSON.parse(val));
                    }
                });
        }

        reg.save("version", currentVersion);
        reg.version = currentVersion;
    }

    function RegClass() {
        var file = "Reg.json";
        this.data = {};
        this.version = -1;

        if (sys.fileExists(file)) {
            this.data = JSON.parse(sys.getFileContent(file));
        } else {
            sys.writeToFile(file, "{}");
        }

        this.version = this.data.version || currentVersion;

        this.save = function (key, value) {
            // Not sure if this solution is advantageous...
            /*if (typeof(this.data[key]) === "string" && typeof(value) === "string") {
                if (this.data[key] === value) {
                    return;
                }
            }*/
            this.data[key] = value;
            this.saveData();
        };

        this.init = function (key, value) {
            if (this.data[key] === undefined) {
                this.save(key, value);
            }
        };

        this.get = function (key) {
            return this.data[key];
        };

        this.remove = function (key) {
            var deleted = false;
            if (this.data[key]) {
                deleted = (delete this.data[key]);
                this.saveData();
            }

            return deleted;
        };

        /*
        this.removeIf = function (func) {
            var x, d = this.data,
                madeChange = false;
            for (x in d) {
                if (func(d, x)) {
                    delete d[x];
                    madeChange = true;
                }
            }

            if (madeChange) {
                this.saveData();
            }
        };

        this.removeIfValue = function (key, value) {
            if (this.data[key] === value) {
                delete this.data[key];
                this.saveData();
            }
        };*/

        this.saveData = function () {
            sys.writeToFile(file, JSON.stringify(this.data));
        };

        this.clearAll = function () {
            this.data = {};
            this.saveData();
        };

        this.dump = function () {
            var dataKeys = Object.keys(this.data);
            return [
                "Reg dump @ " + (new Date()).toUTCString(),
                "Version " + this.version,
                dataKeys.length + " keys, being:",
                dataKeys.join(", ")
            ].join("\n");
        };

        updateReg(this);
    }

    module.exports.Reg = RegClass;
    module.exports.updateReg = updateReg;
    module.reload = function () {
        Reg = new (module.exports.Reg)();
        return true;
    };
}());
