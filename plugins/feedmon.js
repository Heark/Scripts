(function () {
    function addCommands() {
        var commandsModule = require('commands.js');
        var addListCommand = commandsModule.addListCommand,
            addCommand     = commandsModule.addCommand;

        addListCommand(0, "feedmoncommands", "Feedmon");

        addCommand(0, "catch", function (src, command, commandData, tar, chan) {
            var name = sys.name(src).toLowerCase();
            var feedmon = Feedmon.ensurePlayer(name);
            var time = +sys.time();

            if (Feedmon.isBattling(name)) {
                bot.sendMessage(src, "You're busy battling right now!", chan);
                return;
            }

            if (Feedmon.checkTimeout(name, "timeout")) {
                bot.sendMessage(src, "Please wait " + Utils.getTimeString(feedmon.timeout - time) + " to send out another pokemon.");
                return;
            }

            if (feedmon.faint) {
                bot.sendMessage(src, "Your " + Feedmon.getPokemonName(name) + " has fainted! Revive that poor soul!", chan);
                return;
            }

            feedmon.timeout = time + Feedmon.CATCH_TIMEOUT;
            feedmon.total += 1;

            var pokemon = Feedmon.generatePokemon(name),
                pokeName = Feedmon.getPokemonName(name);

            bot.sendAll(sys.name(src) + " caught a(n) <b>" + pokeName + "</b>!", 0);
            bot.sendMessage(src, "It has the following moves: " + Utils.fancyJoin(pokemon.moves.map(Utils.boldKeys)) + "!", chan);
            bot.sendMessage(src, "Its nature is: <b>" + pokemon.nature + "</b>!", chan);
            bot.sendMessage(src, 'Type /feed to feed this pokemon.', chan);
        });

        addCommand(0, "feed", function (src, command, commandData, tar, chan) {
            var name = sys.name(src).toLowerCase(),
                player = Feedmon.getPlayer(name),
                feedname,
                feedmon,
                feedexp,
                time = +sys.time();

            if (Feedmon.isBattling(name)) {
                bot.sendMessage(src, "You're busy battling right now!", chan);
                return;
            }

            if (!player) {
                bot.sendMessage(src, "First catch a Feedmon!", chan);
                return;
            }

            feedmon = Feedmon.getPokemon(name);

            if (!feedmon) {
                bot.sendMessage(src, "First catch a Feedmon!", chan);
                return;
            }

            feedname = Feedmon.getPokemonName(name);

            if (feedmon.faint) {
                bot.sendMessage(src, "Your " + feedname + " is faint!", chan);
                return;
            }

            if (Feedmon.checkTimeout(name, "feedtimeout")) {
                bot.sendMessage(src, "Please wait " + Utils.getTimeString(player.feedtimeout - time) + " to feed your " + feedname + " again.", chan);
                return;
            }

            player.feedtimeout = time + Feedmon.FEED_TIMEOUT;
            feedmon.fed += 1;

            feedexp = Feedmon.giveExp(name);

            bot.sendMessage(src, "Your " + feedname + " gained " + feedexp.gain + " EXP" + (feedexp.happinessGain ? " and " + feedexp.happinessGain + " happiness" : "") + "!", chan);

            if (feedexp.levelGain) {
                bot.sendMessage(src, feedname + " leveled up " + feedexp.levelGain + " time(s)! It's now level " + feedmon.level + "!", chan);
            }

            Feedmon.save();
        });

        addCommand(0, "nickname", function (src, command, commandData, tar, chan) {
            var name = sys.name(src).toLowerCase(),
                player = Feedmon.getPlayer(name),
                feedmon;

            if (Feedmon.isBattling(name)) {
                bot.sendMessage(src, "You're busy battling right now!", chan);
                return;
            }

            if (!player) {
                bot.sendMessage(src, "First catch a Feedmon!", chan);
                return;
            }

            feedmon = Feedmon.getPokemon(name);

            if (!feedmon) {
                bot.sendMessage(src, "First catch a Feedmon!", chan);
                return;
            }

            if (commandData.length > 20) {
                bot.sendMessage(src, "Your nickname is too long (max: 20).", chan);
                return;
            }

            feedmon.nickname = commandData;
            bot.sendMessage(src, feedmon.name + " is now named " + feedmon.nickname + "!", chan);
        });

        addCommand(0, "level", function (src, command, commandData, tar, chan) {
            var name = sys.name(src).toLowerCase(),
                player = Feedmon.getPlayer(name),
                table = Feedmon.exp,
                nextlvl,
                feedmon,
                feedname,
                len,
                i;

            if (!player) {
                bot.sendMessage(src, "First catch a Feedmon!", chan);
                return;
            }

            feedmon = Feedmon.getPokemon(name);

            if (!feedmon) {
                bot.sendMessage(src, "First catch a Feedmon!", chan);
                return;
            }

            feedname = Feedmon.getPokemonName(name);

            if (commandData.toLowerCase() === "all") {
                Feedmon.expTableList().display(src, chan);
                return;
            }

            if (feedmon.level >= 100) {
                bot.sendMessage(src, "Max level (100) reached.", chan);
                return;
            }

            nextlvl = feedmon.level + 1;

            // Arrays start 0-index, so don't increment 1 if we want to know the exact level requirement.
            bot.sendMessage(src, "Next level (" + (nextlvl) + ") requires " + table[feedmon.level] + " EXP. Your " + feedname + " has " + feedmon.exp + " EXP, an additional " + (table[feedmon.level] - feedmon.exp) + " is required for level " + nextlvl + ".", chan);
        });

        addCommand(0, "battle", function (src, command, commandData, tar, chan) {
            var name = sys.name(src).toLowerCase(),
                player = Feedmon.getPlayer(name),
                feedmon,
                feedname;

            if (Feedmon.isBattling(name)) {
                bot.sendMessage(src, "You're busy battling right now!", chan);
                return;
            }

            if (!player) {
                bot.sendMessage(src, "First catch a Feedmon!", chan);
                return;
            }

            feedmon = Feedmon.getPokemon(name);

            if (!feedmon) {
                bot.sendMessage(src, "First catch a Feedmon!", chan);
                return;
            }

            feedname = Feedmon.getPokemonName(name);

            if (feedmon.faint) {
                bot.sendMessage(src, "Your " + feedname + " is faint!", chan);
                return;
            }

            Feedmon.generateBattle(name);

            Feedmon.turnMessage(name, function (str) {
                bot.sendMessage(src, str, chan);
            });
        });

        addCommand(0, "move", function (src, command, commandData, tar, chan) {
            var name = sys.name(src).toLowerCase(),
                player = Feedmon.getPlayer(name),
                move = parseInt(commandData, 10),
                battle,
                opponent,
                res,
                exp,
                feedmon,
                feedname;

            if (!Feedmon.isBattling(name)) {
                bot.sendMessage(src, "You're not battling anything right now!", chan);
                return;
            }

            if (!player) {
                bot.sendMessage(src, "First catch a Feedmon!", chan);
                return;
            }

            feedmon = Feedmon.getPokemon(name);

            if (!feedmon) {
                bot.sendMessage(src, "First catch a Feedmon!", chan);
                return;
            }

            feedname = Feedmon.getPokemonName(name);

            if (feedmon.faint) {
                bot.sendMessage(src, "Your " + feedname + " is faint!", chan);
                return;
            }

            battle = Feedmon.battles[name];
            opponent = battle.opponent;

            if (move <= 0 || move >= 5) {
                bot.sendMessage(src, "The move num needs to be 1-4.", chan);
                return;
            }

            res = Feedmon.battleTurn(name, move - 1);

            bot.sendMessage(src, "Turn #" + res.turn, chan);
            sys.sendMessage(src, "", chan);

            bot.sendMessage(src, feedname + " attacked <b>" + opponent.pokemon + "</b> with " + res.self.move + "!", chan);
            bot.sendMessage(src, "Ouch! <b>" + opponent.pokemon + "</b> -" + res.self.damage + " HP (HP: " + opponent.hp + ")", chan);

            if (res.opponent.fainted) {
                bot.sendMessage(src, feedname + " won the battle!", chan);
                exp = Feedmon.giveExp(name, 2);

                bot.sendMessage(src, "Your " + feedname + " gained " + exp.gain + " EXP" + (exp.happinessGain ? " and " + exp.happinessGain + " happiness" : "") + "!", chan);

                if (exp.levelGain) {
                    bot.sendMessage(src, feedname + " leveled up " + exp.levelGain + " time(s)! It's now level " + feedmon.level + "!", chan);
                }

                delete Feedmon.battles[name];
                return;
            }

            sys.sendMessage(src, "", chan);

            bot.sendMessage(src, "<b>" + opponent.pokemon + "</b> attacked " + feedname + " with " + res.opponent.move + "!", chan);
            bot.sendMessage(src, "Ouch! " + feedname + " -" + res.opponent.damage + " HP (HP: " + feedmon.hp + ")", chan);

            if (res.self.fainted) {
                bot.sendMessage(src, feedname + " lost the battle!", chan);
                // TODO: Happiness loss.
                delete Feedmon.battles[name];
                return;
            }

            sys.sendMessage(src, "", chan);

            // Re-send turn message.
            Feedmon.turnMessage(name, function (str) {
                bot.sendMessage(src, str, chan);
            });
        });

        addCommand(0, "heal", function (src, command, commandData, tar, chan) {
            var name = sys.name(src).toLowerCase(),
                player = Feedmon.getPlayer(name),
                feedmon,
                feedname;

            if (Feedmon.isBattling(name)) {
                bot.sendMessage(src, "You're busy battling right now!", chan);
                return;
            }

            if (!player) {
                bot.sendMessage(src, "First catch a Feedmon!", chan);
                return;
            }

            feedmon = Feedmon.getPokemon(name);

            if (!feedmon) {
                bot.sendMessage(src, "First catch a Feedmon!", chan);
                return;
            }

            feedname = Feedmon.getPokemonName(name);

            feedmon.faint = false;
            feedmon.hp = Feedmon.getHp(feedmon.level);
            bot.sendMessage(src, "Healed " + feedname + " to " + feedmon.hp + " (full) HP!", chan);
        });
    }

    function initialize() {
        var FEEDMON_VERSION = 3.2,
            HAPPINESS_GAIN = 0.07,
            CATCH_TIMEOUT = 5,
            FEED_TIMEOUT = 2;

        var attackingMoves = ["Pound", "Karate Chop", "DoubleSlap", "Comet Punch", "Mega Punch", "Pay Day", "Fire Punch", "Ice Punch", "ThunderPunch", "Scratch", "ViceGrip", "Guillotine", "Razor Wind", "Cut", "Gust", "Wing Attack", "Fly", "Bind", "Slam", "Vine Whip", "Stomp", "Double Kick", "Mega Kick", "Jump Kick", "Rolling Kick", "Headbutt", "Horn Attack", "Fury Attack", "Horn Drill", "Tackle", "Body Slam", "Wrap", "Take Down", "Thrash", "Double-Edge", "Poison Sting", "Twineedle", "Pin Missile", "Bite", "SonicBoom", "Acid", "Ember", "Flamethrower", "Water Gun", "Hydro Pump", "Surf", "Ice Beam", "Blizzard", "Psybeam", "BubbleBeam", "Aurora Beam", "Hyper Beam", "Peck", "Drill Peck", "Submission", "Low Kick", "Counter", "Seismic Toss", "Strength", "Absorb", "Mega Drain", "Razor Leaf", "SolarBeam", "Petal Dance", "Dragon Rage", "Fire Spin", "ThunderShock", "Thunderbolt", "Thunder", "Rock Throw", "Earthquake", "Fissure", "Dig", "Confusion", "Psychic", "Quick Attack", "Rage", "Night Shade", "Bide", "Selfdestruct", "Egg Bomb", "Lick", "Smog", "Sludge", "Bone Club", "Fire Blast", "Waterfall", "Clamp", "Swift", "Skull Bash", "Spike Cannon", "Constrict", "Hi Jump Kick", "Dream Eater", "Barrage", "Leech Life", "Sky Attack", "Bubble", "Dizzy Punch", "Psywave", "Crabhammer", "Explosion", "Fury Swipes", "Bonemerang", "Rock Slide", "Hyper Fang", "Tri Attack", "Super Fang", "Slash", "Struggle", "Triple Kick", "Thief", "Flame Wheel", "Snore", "Flail", "Aeroblast", "Reversal", "Powder Snow", "Mach Punch", "Faint Attack", "Sludge Bomb", "Mud-Slap", "Octazooka", "Zap Cannon", "Icy Wind", "Bone Rush", "Outrage", "Giga Drain", "Rollout", "False Swipe", "Spark", "Fury Cutter", "Steel Wing", "Return", "Present", "Frustration", "Sacred Fire", "Magnitude", "DynamicPunch", "Megahorn", "DragonBreath", "Pursuit", "Rapid Spin", "Iron Tail", "Metal Claw", "Vital Throw", "Hidden Power", "Cross Chop", "Twister", "Crunch", "Mirror Coat", "ExtremeSpeed", "AncientPower", "Shadow Ball", "Future Sight", "Rock Smash", "Whirlpool", "Beat Up", "Fake Out", "Uproar", "Spit Up", "Heat Wave", "Facade", "Focus Punch", "SmellingSalt", "Superpower", "Revenge", "Brick Break", "Knock Off", "Endeavor", "Eruption", "Secret Power", "Dive", "Arm Thrust", "Luster Purge", "Mist Ball", "Blaze Kick", "Ice Ball", "Needle Arm", "Hyper Voice", "Poison Fang", "Crush Claw", "Blast Burn", "Hydro Cannon", "Meteor Mash", "Astonish", "Weather Ball", "Air Cutter", "Overheat", "Rock Tomb", "Silver Wind", "Water Spout", "Signal Beam", "Shadow Punch", "Extrasensory", "Sky Uppercut", "Sand Tomb", "Sheer Cold", "Muddy Water", "Bullet Seed", "Aerial Ace", "Icicle Spear", "Dragon Claw", "Frenzy Plant", "Bounce", "Mud Shot", "Poison Tail", "Covet", "Volt Tackle", "Magical Leaf", "Leaf Blade", "Rock Blast", "Shock Wave", "Water Pulse", "Doom Desire", "Psycho Boost", "Wake-Up Slap", "Hammer Arm", "Gyro Ball", "Brine", "Natural Gift", "Feint", "Pluck", "Metal Burst", "U-turn", "Close Combat", "Payback", "Assurance", "Fling", "Trump Card", "Wring Out", "Punishment", "Last Resort", "Sucker Punch", "Flare Blitz", "Force Palm", "Aura Sphere", "Poison Jab", "Dark Pulse", "Night Slash", "Aqua Tail", "Seed Bomb", "Air Slash", "X-Scissor", "Bug Buzz", "Dragon Pulse", "Dragon Rush", "Power Gem", "Drain Punch", "Vacuum Wave", "Focus Blast", "Energy Ball", "Brave Bird", "Earth Power", "Giga Impact", "Bullet Punch", "Avalanche", "Ice Shard", "Shadow Claw", "Thunder Fang", "Ice Fang", "Fire Fang", "Shadow Sneak", "Mud Bomb", "Psycho Cut", "Zen Headbutt", "Mirror Shot", "Flash Cannon", "Rock Climb", "Draco Meteor", "Discharge", "Lava Plume", "Leaf Storm", "Power Whip", "Rock Wrecker", "Cross Poison", "Gunk Shot", "Iron Head", "Magnet Bomb", "Stone Edge", "Grass Knot", "Chatter", "Judgment", "Bug Bite", "Charge Beam", "Wood Hammer", "Aqua Jet", "Attack Order", "Head Smash", "Double Hit", "Roar of Time", "Spacial Rend", "Crush Grip", "Magma Storm", "Seed Flare", "Ominous Wind", "Shadow Force", "Psyshock", "Venoshock", "Smack Down", "Storm Throw", "Flame Burst", "Sludge Wave", "Heavy Slam", "Synchronoise", "Electro Ball", "Flame Charge", "Low Sweep", "Acid Spray", "Foul Play", "Round", "Echoed Voice", "Chip Away", "Clear Smog", "Stored Power", "Scald", "Hex", "Sky Drop", "Circle Throw", "Incinerate", "Acrobatics", "Retaliate", "Final Gambit", "Inferno", "Water Pledge", "Fire Pledge", "Grass Pledge", "Volt Switch", "Struggle Bug", "Bulldoze", "Frost Breath", "Dragon Tail", "Electroweb", "Wild Charge", "Drill Run", "Dual Chop", "Heart Stamp", "Horn Leech", "Sacred Sword", "Razor Shell", "Heat Crash", "Leaf Tornado", "Steamroller", "Night Daze", "Psystrike", "Tail Slap", "Hurricane", "Head Charge", "Gear Grind", "Searing Shot", "Techno Blast", "Relic Song", "Secret Sword", "Glaciate", "Bolt Strike", "Blue Flare", "Fiery Dance", "Freeze Shock", "Ice Burn", "Snarl", "Icicle Crash", "V-create", "Fusion Flare", "Fusion Bolt"];

        var movePower = [40, 50, 15, 18, 80, 40, 75, 75, 75, 40, 55, 1, 80, 50, 40, 60, 90, 15, 80, 35, 65, 30, 120, 100, 60, 70, 65, 15, 1, 50, 85, 15, 90, 120, 120, 15, 25, 14, 60, 1, 40, 40, 95, 40, 120, 95, 95, 120, 65, 65, 65, 150, 35, 80, 80, 1, 1, 1, 80, 20, 40, 55, 120, 120, 1, 35, 40, 95, 120, 50, 100, 1, 80, 50, 90, 40, 20, 1, 1, 200, 100, 20, 20, 65, 65, 120, 80, 35, 60, 100, 20, 10, 130, 100, 15, 20, 140, 20, 70, 1, 90, 250, 18, 50, 75, 80, 80, 1, 70, 50, 10, 40, 60, 40, 1, 100, 1, 40, 40, 60, 90, 20, 65, 120, 55, 25, 120, 75, 30, 40, 65, 20, 70, 1, 1, 1, 100, 1, 100, 120, 60, 40, 20, 100, 50, 70, 1, 100, 40, 80, 1, 80, 60, 80, 100, 40, 35, 1, 40, 90, 1, 100, 70, 150, 60, 120, 60, 75, 20, 1, 150, 70, 80, 15, 70, 70, 85, 30, 60, 90, 50, 75, 150, 150, 100, 30, 50, 55, 140, 50, 60, 150, 75, 60, 80, 85, 35, 1, 95, 25, 60, 25, 80, 150, 85, 55, 50, 60, 120, 60, 90, 25, 60, 60, 140, 140, 60, 100, 1, 65, 1, 30, 60, 1, 70, 120, 50, 50, 1, 1, 1, 1, 140, 80, 120, 60, 90, 80, 80, 70, 90, 80, 75, 80, 90, 90, 100, 70, 75, 40, 120, 80, 120, 90, 150, 40, 60, 40, 70, 65, 65, 65, 40, 65, 70, 80, 65, 80, 90, 140, 80, 80, 140, 120, 150, 70, 120, 80, 60, 100, 1, 60, 100, 60, 50, 120, 40, 90, 150, 35, 150, 100, 1, 120, 120, 60, 120, 80, 65, 50, 40, 70, 95, 1, 70, 1, 50, 60, 40, 95, 60, 40, 70, 50, 20, 80, 50, 60, 60, 30, 55, 70, 1, 100, 50, 50, 50, 70, 30, 60, 40, 60, 55, 90, 80, 40, 60, 75, 90, 75, 1, 65, 65, 85, 100, 25, 120, 120, 50, 100, 85, 75, 85, 65, 130, 130, 80, 140, 140, 55, 85, 180, 100, 100];

        var _table;

        // Algorithm:
        /* var array = [25], last; while(array.length < 100) { last = array[array.length - 1]; array.push(Math.floor(last * 1.13) + last % 100); } array;
        */
        var exp = [25, 53, 112, 138, 193, 311, 362, 471, 603, 684, 856, 1023, 1178, 1409, 1601, 1810, 2055, 2377, 2763, 3185, 3684, 4246, 4843, 5515, 6246, 7103, 8029, 9101, 10285, 11707, 13235, 14990, 17028, 19269, 21842, 24723, 27959, 31652, 35818, 40492, 45847, 51854, 58649, 66322, 74965, 84775, 95870, 108403, 122498, 138520, 156547, 176945, 199992, 226082, 255554, 288830, 326407, 368846, 416841, 471071, 532381, 601671, 679959, 768412, 868317, 981215, 1108787, 1253016, 1415924, 1600018, 1808038, 2043120, 2308745, 2608926, 2948112, 3331378, 3764535, 4253959, 4807032, 5431978, 6138213, 6936193, 7837991, 8857020, 10008452, 11309602, 12779852, 14441284, 16318734, 18440203, 20837432, 23546330, 26607382, 30066423, 33975080, 38391920, 43382889, 49022753, 55395763, 62597275];

        /* var array = [11], add, last; while(array.length < 100) { last = array[array.length - 1]; add = Math.floor(Math.sqrt(last % 9)); array.push(last + (1 + last % 2 + add)); } array; */
        var hpTable = [11, 14, 17, 21, 24, 27, 29, 32, 35, 39, 42, 45, 47, 50, 53, 57, 60, 63, 65, 68, 71, 75, 78, 81, 83, 86, 89, 93, 96, 99, 101, 104, 107, 111, 114, 117, 119, 122, 125, 129, 132, 135, 137, 140, 143, 147, 150, 153, 155, 158, 161, 165, 168, 171, 173, 176, 179, 183, 186, 189, 191, 194, 197, 201, 204, 207, 209, 212, 215, 219, 222, 225, 227, 230, 233, 237, 240, 243, 245, 248, 251, 255, 258, 261, 263, 266, 269, 273, 276, 279, 281, 284, 287, 291, 294, 297, 299, 302, 305, 309];

        var battles = {};

        function getHp(level) {
            return hpTable[level - 1];
        }

        function getExp(level) {
            return exp[level - 1];
        }

        function getMoveDamage(move) {
            return movePower[attackingMoves.indexOf(move)];
        }

        function randomPokemon() {
            return sys.pokemon(sys.rand(1, 650));
        }

        function randomMove() {
            return attackingMoves[sys.rand(0, attackingMoves.length)];
        }

        function randomMoves() {
            return [randomMove(), randomMove(), randomMove(), randomMove()];
        }

        function randomNature() {
            return sys.nature(sys.rand(0, 25));
        }

        function save() {
            Reg.save('Feedmon', Feedmons);
        }

        function getPlayer(name) {
            return Feedmons[name.toLowerCase()];
        }

        function ensurePlayer(name) {
            name = name.toLowerCase();

            if (!Feedmons[name]) {
                Feedmons[name] = {
                    'timeout': 0,
                    'feedtimeout': 0,
                    'pokemon': false
                };
            }

            return Feedmons[name];
        }

        function has(name) {
            return !!getPlayer(name);
        }

        function isBattling(name) {
            return !!battles[name];
        }

        function checkTimeout(name, timeout) {
            var player = ensurePlayer(name);

            timeout = timeout || 'timeout';
            return player[timeout] !== 0 && player[timeout] > (+sys.time());
        }

        function generatePokemon(name) {
            var player = getPlayer(name);

            player.pokemon = {
                name: randomPokemon(),
                nickname: '',
                moves: randomMoves(),
                nature: randomNature(),
                happiness: 0,
                hp: hpTable[0],
                faint: false,

                level: 1,
                fed: 0,
                exp: exp[0]
            };

            save();
            return player.pokemon;
        }

        function getPokemonName(name) {
            var player = getPlayer(name),
                pname = "<b>" + player.pokemon.name + "</b>";

            if (player.pokemon.nickname) {
                pname = "<b>" + Utils.escapeHtml(player.pokemon.nickname) + "</b> (" + player.pokemon.name + ")";
            }

            return pname + " <img src='icon:" + sys.pokeNum(player.pokemon.name) + "'>";
        }

        function getPokemon(name) {
            var player;

            if (!has(name)) {
                return null;
            }

            return getPlayer(name).pokemon;
        }

        // IMPORTANT: When displaying to players, Math.floor feedmon.happiness

        function giveExp(name, multiplier) {
            var happinessGain = 0,
                oldHappiness,
                feedmon = getPokemon(name),
                player = getPlayer(name),
                lvlGain = 0,
                gain = 0,
                lvl = feedmon.level;

            var looplvl,
                lvlexp,
                len,
                i;

            var bonusRange = Math.round(lvl / 10),
                bonus = [0, 0];

            multiplier = multiplier || 1;

            if (bonusRange > 0) {
                bonus = [bonusRange * (Math.round(lvl / 2)), bonusRange * lvl];
            }

            gain = sys.rand((10 * lvl) + bonus[0], ((24 * lvl) + bonus[1]) + 1) * multiplier;
            feedmon.exp += gain;

            oldHappiness = Math.floor(feedmon.happiness);
            feedmon.happiness += HAPPINESS_GAIN;
            happinessGain = Math.floor(feedmon.happiness) - oldHappiness;

            if (lvl < 100) {
                for (i = lvl - 2, len = exp.length; i < len; i += 1) {
                    lvlexp = exp[i];
                    looplvl = i + 1;

                    if (lvl >= looplvl) {
                        continue;
                    }

                    if (feedmon.exp >= lvlexp) {
                        lvlGain += 1;
                    } else {
                        break;
                    }
                }
            }

            if (lvlGain) {
                feedmon.level += lvlGain;
                feedmon.hp = getHp(feedmon.level);
            }

            return {
                gain: gain,
                happinessGain: happinessGain,
                levelGain: lvlGain,
                now: feedmon.exp,
                bonus: bonus
            };
        }

        function generateBattle(name) {
            var player,
                feedmon,
                lvl;

            if (battles[name]) {
                return false;
            }

            player = getPlayer(name);
            feedmon = getPokemon(name);
            lvl = sys.rand(feedmon.level - 2, feedmon.level + 3);

            battles[name] = {
                turn: 0,
                opponent: {
                    pokemon: randomPokemon(),
                    level: lvl,
                    hp: getHp(lvl),
                    nature: randomNature(),
                    moves: randomMoves(),
                    faint: false
                }
            };

            return battles[name];
        }

        // TODO: Natures, stats
        function battleTurn(name, move) {
            var player = getPlayer(name),
                feedmon = getPokemon(name),
                feedname = getPokemonName(name),
                battle = battles[name],
                opponent = battle.opponent,
                selfMoveName = feedmon.moves[move],
                selfMoveDamage = Math.floor(getMoveDamage(selfMoveName) * (feedmon.level / 80)),
                opponentMoveName = opponent.moves[sys.rand(0, opponent.moves.length)],
                opponentMoveDamage = Math.floor(getMoveDamage(opponentMoveName) * (opponent.level / 80)),
                selfNum = sys.pokeNum(feedmon.pokemon),
                oppNum = sys.pokeNum(opponent.pokemon);

            // TODO: Types
            var result = {self: {}, opponent: {}};

            battle.turn += 1;

            result.turn = battle.turn;
            result.self.damage = selfMoveDamage;
            result.self.move = selfMoveName;
            result.opponent.move = opponentMoveName;
            result.opponent.damage = opponentMoveDamage;

            opponent.hp -= selfMoveDamage;

            if (opponent.hp < 0) {
                opponent.hp = 0;
            }

            result.opponent.hp = opponent.hp;
            if (opponent.hp <= 0) {
                result.opponent.fainted = opponent.faint = true;
                result.end = true;
                return result;
            }

            feedmon.hp -= opponentMoveDamage;

            if (feedmon.hp < 0) {
                feedmon.hp = 0;
            }

            result.self.hp = feedmon.hp;
            if (feedmon.hp <= 0) {
                result.self.fainted = feedmon.faint = true;
                result.end = true;
                return result;
            }

            return result;
        }

        function turnMessage(name, sendMessage) {
            var player = getPlayer(name),
                feedmon = getPokemon(name),
                feedname = getPokemonName(name),
                battle = battles[name];

            sendMessage("Start of turn #" + (battle.turn + 1) + " vs. <b>" + battle.opponent.pokemon + "</b> <img src='icon:" + sys.pokeNum(battle.opponent.pokemon) + "'>");
            sendMessage(feedmon.moves.map(function (name, index) {
                return "<b>" + name + "</b> (" + (index + 1) + ")";
            }).join(" | "));
            sendMessage("To use a move, type /move [num] (/move 1)");
            sendMessage("");
        }

        // Lazy generation.
        function expTableList() {
            if (_table) {
                return _table;
            }

            var len,
                i;

            _table = new TableList("EXP", "stripe", 1, 2, "navy");
            _table.add(["Level", "EXP", "Level", "EXP", "Level", "EXP", "Level", "EXP", "Level", "EXP", "Level", "EXP", "Level", "EXP", "Level", "EXP", "Level", "EXP", "Level", "EXP"], true);

            for (i = 0, len = exp.length; i < len; i += 10) {
                _table.add([i + 1, exp[i], i + 2, exp[i + 1], i + 3, exp[i + 2], i + 4, exp[i + 3], i + 5, exp[i + 4], i + 6, exp[i + 5], i + 7, exp[i + 6], i + 8, exp[i + 7], i + 9, exp[i + 8], i + 10, exp[i + 9]], false);
            }

            _table.finish();

            return _table;
        }

        return {
            battles: battles,
            isBattling: isBattling,

            randomMove: randomMove,
            randomMoves: randomMoves,
            randomNature: randomNature,
            randomPokemon: randomPokemon,

            getPlayer: getPlayer,
            getPokemonName: getPokemonName,
            getPokemon: getPokemon,
            getMoveDamage: getMoveDamage,
            getExp: getExp,
            getHp: getHp,

            ensurePlayer: ensurePlayer,
            checkTimeout: checkTimeout,
            has: has,

            generatePokemon: generatePokemon,
            generateBattle: generateBattle,
            battleTurn: battleTurn,
            turnMessage: turnMessage,

            save: save,
            exp: exp,
            attackingMoves: attackingMoves,
            movePower: movePower,

            giveExp: giveExp,
            expTableList: expTableList,

            VERSION: FEEDMON_VERSION,
            HAPPINESS_GAIN: HAPPINESS_GAIN,
            CATCH_TIMEOUT: CATCH_TIMEOUT,
            FEED_TIMEOUT: FEED_TIMEOUT
        };
    }

    module.reload = function () {
        Feedmon = initialize();
        addCommands();
        return true;
    };
    module.exports = initialize;
    module.exports.addCommands = addCommands;
}());
