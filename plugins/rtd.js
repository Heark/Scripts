module.exports.load = function () {
    global.RTD = {};
    var playerEffects = {};
    var MIN_COOLDOWN = 90; // 1m30s
    var MAX_COOLDOWN = 130; // 2m10s

    function randomSample(hash) {
        var cum = 0;
        var val = Math.random();
        var psum = 0.0;
        var x;
        var count = 0;
        for (x in hash) {
            psum += hash[x].chance;
            count += 1;
        }
        if (psum === 0.0) {
            var j = 0;
            for (x in hash) {
                cum = (++j) / count;
                if (cum >= val) {
                    return x;
                }
            }
        } else {
            for (x in hash) {
                cum += hash[x].chance / psum;
                if (cum >= val) {
                    return x;
                }
            }
        }
    }

    var effects = {
        blank_emotes: {
            name: 'Blank Emotes',
            chance: 1/18,
            duration: 30,
            type: 'negative'
        },
        smaller_emotes: {
            name: 'Smaller Emotes',
            chance: 1/17,
            duration: 30,
            type: 'negative'
        },
        bigger_emotes: {
            name: 'Bigger Emotes',
            chance: 1/20,
            duration: 20,
            type: 'positive'
        },
        mega_emotes: {
            name: 'Mega Emotes',
            chance: 1/30,
            duration: 10,
            type: 'positive'
        },
        nobody_cares: {
            name: 'Nobody Cares',
            chance: 1/15,
            duration: 30,
            type: 'neutral'
        },
        terry_crews: {
            name: "Terry Crews",
            chance: 1/15,
            duration: 30,
            type: 'neutral'
        },
        im_blue: {
            name: "I'm Blue",
            chance: 1/23,
            duration: 30,
            type: 'neutral'
        }
    };

    RTD.getTypeColor = function (type) {
        return {
            'negative': '#e41a28',
            'neutral': '#0a281f',
            'positive': '#2de727'
        }[type];
    };

    RTD.rollString = function (id, effect) {
        var obj = effects[effect];
        return sys.name(id) + " rolled and won <b style='color: " + RTD.getTypeColor(obj.type) + ";'>" + obj.name + "</b> for <b>" + obj.duration + "</b> seconds.";
    };

    RTD.rollTheDice = function () {
        return randomSample(effects);
    };

    RTD.giveEffect = function (id, effect, duration, timeout) {
        var ip = sys.ip(id),
            peffect;

        if (typeof timeout !== 'function') {
            timeout = function () {
                var name = sys.name(id);
                if (!name) { // player left
                    return;
                }

                rtdbot.sendAll(name + "'s effect ended.", 0);
                playerEffects[ip].active = false;
            };
        }

        effect = effect || RTD.rollTheDice();
        duration = duration || effects[effect].duration;

        peffect = playerEffects[ip] = {
            effect: effect,
            timer: -1,
            at: +sys.time(),
            duration: duration,
            active: true,
            cooldown: sys.rand(MIN_COOLDOWN, MAX_COOLDOWN)
        };

        playerEffects[ip].timer = sys.setTimer(timeout, duration * 1000, false);
        // Is the garbage collection really necessary here?
        // The objects are small, not everyone uses rtd,
        // the server is restarted often,
        // and there will be race conditions if it is collected using timers
        /*sys.setTimer(function () {
            delete playerEffects[ip];
        }, peffect.at + peffect.cooldown);*/
        return effect;
    };

    RTD.hasEffect = function (id, effect) {
        var peffect = playerEffects[sys.ip(id)];
        return peffect && peffect.effect === effect && (peffect.at + peffect.duration) >= +sys.time() && peffect.active;
    };

    // If the result of this function <= 0, the player may roll the dice again.
    RTD.cooldownFor = function (id) {
        var ip = sys.ip(id);
        if (!playerEffects[ip]) {
            return 0;
        }

        return playerEffects[ip].at + playerEffects[ip].cooldown - +sys.time();
    };

    RTD.getPlayer = function (id) {
        return playerEffects[sys.ip(id)];
    };

    RTD.takeEffect = function (id) {
        var ip = sys.ip(id);
        if (!playerEffects[ip]) {
            return false;
        }

        return (delete playerEffects[ip]);
    };

    RTD.effects = effects;
    RTD.MIN_COOLDOWN = MIN_COOLDOWN;
    RTD.MAX_COOLDOWN = MAX_COOLDOWN;
};

module.reload = function () {
    module.exports.load();
    return true;
};
