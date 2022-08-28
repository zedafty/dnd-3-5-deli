<!-- SHEET WORKERS -->
<script type="text/worker">

// =============================================================================
// -----------------------------------------------------------------------------
// # Utility
// -----------------------------------------------------------------------------
// =============================================================================

function toInt(v) { // v = string or number ; returns integer
	return parseInt(v) || 0;
}

function toFlt(v) { // s = string or number ; returns float
	if (typeof v == "string") v = v.replace(",", ".");
	return parseFloat(v) || 0;
}

function roundMeter(n, m) { // n = number (src), m = number (base) ; returns number
	if (m === undefined) m = 1.5;
	let r = Math.floor(n / m);
	return r * m;
}

function feetToMeter(n, b) { // n = number, b = dot to colon ; returns string
	n = Math.max(roundMeter(n / 5 * 1.5), 1.5).toFixed(1).replace(".0", "");
	if (b) n = n.replace(".", ",");
	return n;
}

function poundsToKilos(n) { // n = number ; returns number
	return n / 2;
}

function toStr(v, d, b) { // v = string or number, d = decimals, b = round to 1.5 ; returns string
	if (d === undefined) d = 3;
	if (typeof v == "number") {
		if (b) v = roundMeter(v);
		v = v.toFixed(d);
	}
	if (typeof v == "string") {
		v = parseFloat(v);
		if (b) v = roundMeter(v);
		if (!isNaN(v)) {
			let r = new RegExp("\\d+\\.?\\d{0," + d + "}");
			let m = v.toString().match(r);
			if (m != null) return m[0];
		}
	}
	return "";
}

function signInt(n, b) { // n = number, b = skip zero flag ; returns string
	return n > 0 ? "+" + n.toString() : n < 0 ? n.toString() : b ? "" : 0;
}

function clamp(n, min, max) { // n = number, min = number, max = number ; returns number
	return Math.min(Math.max(n, min), max);
}

function getTranslation(s) { // s = string ; returns string
	return getTranslationByKey(s.replaceAll("-", "_"));
}

function testPositiveSum(s) { // s = string ; returns boolean
	let reg = /^[\+]?\d+\s*([\+]\s*\d+)?\s*([\+]\s*\d+)?\s*([\+]\s*\d+)?\s*([\+]\s*\d+)?\s*([\+]\s*\d+)?$/i;
	return reg.test(s);
}

function parsePositiveSum(s) { // s = string ; returns integer
	return testPositiveSum(s) ? eval(s) : 0;
}

// =============================================================================
// -----------------------------------------------------------------------------
// # Races
// -----------------------------------------------------------------------------
// =============================================================================

// Races
const races = {
	"none" : {},
	"human" : {"size" : "m", "spd" : 30, "key" : "hu", "attr" : ["feat", "sk", "cls-fav"]},
	"halfelf" : {"size" : "m", "spd" : 30, "key" : "he", "attr" : ["immunity", "save", "vision", "sk1", "sk2", "blood", "cls-fav"]},
	"halforc" : {"size" : "m", "spd" : 30, "key" : "ho", "attr" : ["abi", "vision", "blood", "cls-fav"]},
	"elf" : {"size" : "m", "spd" : 30, "key" : "el", "attr" : ["abi", "immunity", "save", "vision", "wpn", "sk", "detect", "cls-fav"]},
	"dwarf" : {"size" : "m", "spd" : 20, "key" : "dw", "attr" : ["abi", "vision", "stone", "wpn", "stab", "save1", "save2", "atk", "def", "sk1", "sk2", "cls-fav"]},
	"gnome" : {"size" : "s", "spd" : 20, "key" : "gn", "attr" : ["abi", "vision", "wpn", "save", "spl-dc", "atk", "def", "sk1", "sk2", "spl-like", "cls-fav"]},
	"halfling" : {"size" : "s", "spd" : 20, "key" : "ha", "attr" : ["abi", "save1", "save2", "atk", "sk1", "sk2", "cls-fav"]}
};

// Autofill Races
const autofillRace = function(e) { // e = event
	getAttrs(["race-autofill"], v => {
		let a = Object.keys(races);
		let k = e.newValue;
		let y = e.previousValue;
		if (a.includes(k)) {
			if (y != undefined) k = "none";
			let u = {};
			let i, o, p, b;
			u["char-race"] = k == "none" ? "" : (getTranslation(`race-${k}`) || k);
			if (v["race-autofill"] == "1") {
				u["char-size"] = races[k].size || "m";
				u["mvt-land-base"] = races[k].spd ? feetToMeter(races[k].spd, true) + " m" : "";
				u["mvt-swim"] = races[k].spd ? feetToMeter(races[k].spd / 4, true) + " m" : "";
				if (k == "none") {
					for (i = 0; i < a.length; i++) {
						if (a[i] == "none") continue;
						p = races[a[i]].key;
						b = races[a[i]].attr;
						u[`show-race-${a[i]}`] = "0";
						for (o in b) u[`${p}-${b[o]}`] = "0";
					}
				} else {
					p = races[k].key;
					b = races[k].attr;
					u[`show-race-${k}`] = "1";
					for (o in b) u[`${p}-${b[o]}`] = "1";
				}
			}
			setAttrs(u);
		}
	});
};

on("change:char-race", function(e) {
	autofillRace(e);
});

// =============================================================================
// -----------------------------------------------------------------------------
// # Karma
// -----------------------------------------------------------------------------
// =============================================================================

/**
	This section is a user request.
	Select a token binded to a sheet,
	Then type one of the below command:
	— %{selected|karma-show} >>>> Notice GM of a character karma number.
	— %{selected|karma-toggle} >>>> Hide/Show karma number to the player.
	— %{selected|karma-increase} >>>> Add 1 point to karma number.
	— %{selected|karma-decrease} >>>> Substract 1 point to karma number (min 0).
*/

const setKarma = function(n) { // n = number to add/substract
	getAttrs(["char-karma"], v => {
		setAttrs({"char-karma" : Math.max(n + toInt(v["char-karma"]), 0)}, {"silent" : true});
	});
};

on("clicked:karma-toggle", function() {
	getAttrs(["show-karma"], v => {
		setAttrs({"show-karma" : toInt(v["show-karma"]) == 0 ? 1 : 0}, {"silent" : true});
	});
});
on("clicked:karma-increase", function() {
	setKarma(1);
});
on("clicked:karma-decrease", function() {
	setKarma(-1);
});

// =============================================================================
// -----------------------------------------------------------------------------
// # Size
// -----------------------------------------------------------------------------
// =============================================================================

const getCharacterSizeModifier = function(k, g, h) { // k = size cat, g = grapple, h = hide
	let m = h ? -1 : 1;
	switch (k) {
		case "f" : return g || h ? -16 * m : 8;
		case "d" : return g || h ? -12 * m : 4;
		case "t" : return g || h ? -8 * m : 2;
		case "s" : return g || h ? -4 * m : 1;
		case "l" : return g || h ? 4 * m : -1;
		case "h" : return g || h ? 8 * m : -2;
		case "g" : return g || h ? 12 * m : -4;
		case "c" : return g || h ? 16 * m : -8;
	}
	return 0;
};

const setCharacterSize = function(k) { // k = size cat
	let u = {};
	u["char-size-mod"] = getCharacterSizeModifier(k);
	u["char-size-grapple"] = getCharacterSizeModifier(k, true);
	u["char-size-hide"] = getCharacterSizeModifier(k, null, true);
	setAttrs(u);
};

on("change:char-size", function(e) {
	setCharacterSize(e.newValue);
});

// =============================================================================
// -----------------------------------------------------------------------------
// # Languages
// -----------------------------------------------------------------------------
// =============================================================================

// Autofill Languages
const autofillLanguage = function(e) { // e = event
	let k = e.newValue;
	let id = e.sourceAttribute.substr(16, 19);
	if (languages.includes(k)) {
		let u = {};
		u[`repeating_lang${id}_name`] = getTranslation(`lang-${k}`) || k;
		u[`repeating_lang${id}_users`] = getTranslation(`lang-${k}-users`) || "";
		u[`repeating_lang${id}_alphabet`] = getTranslation(`lang-${k}-alphabet`) || "";
		setAttrs(u, {"silent" : true});
	}
};

on("change:repeating_lang:name", function(e) {
	autofillLanguage(e);
});

// =============================================================================
// -----------------------------------------------------------------------------
// # Classes
// -----------------------------------------------------------------------------
// =============================================================================

const getCharacterLevel = function(v, b) { // v = attribute list, b = ajusted flag
	let n = toInt(v["cls1-lvl"]) + toInt(v["cls2-lvl"]) + toInt(v["cls3-lvl"]) + toInt(v["cls4-lvl"]) + toInt(v["race-lvl"]);
	if (b) n += toInt(v["lvl-adj"]);
	return n;
};

const getClassSkillsReset = function() { // returns object
	let u = {};
	let v, l = skills;
	let n, m, i;
	let b = ["craftalchemy", "craft", "profession"];
	for (v in l) {
		n = b.includes(l[v]) ? 1 : 0;
		m = l[v] == "profession" ? 2 : l[v] == "craft" || l[v] == "perform" ? 3 : l[v] == "other" ? 6 : 0;
		if (m > 0) {
			for (i = 1; i <= m; i++) u[`sk-${l[v]}${i}-cls`] = n;
		} else {
			u[`sk-${l[v]}-cls`] = n;
		}
	}
	return u;
};

const getClassSkillsUpdate = function(k) { // k = class key ; returns object
	let u = {};
	let a = classes;
	let v, l = a[k]["sk-cls"];
	for (v in l) {
		if (l[v] == "knowledgeall") {
			u["sk-knowledgearcana"] = 1;
			u["sk-knowledgearchitecture-cls"] = 1;
			u["sk-knowledgedungeon-cls"] = 1;
			u["sk-knowledgegeography-cls"] = 1;
			u["sk-knowledgehistory-cls"] = 1;
			u["sk-knowledgelocal-cls"] = 1;
			u["sk-knowledgenature-cls"] = 1;
			u["sk-knowledgenobility-cls"] = 1;
			u["sk-knowledgereligion-cls"] = 1;
			u["sk-knowledgeplanes-cls"] = 1;
		} else if (l[v] == "perform") {
			u["sk-perform1-cls"] = 1;
			u["sk-perform2-cls"] = 1;
			u["sk-perform3-cls"] = 1;
		} else {
			u[`sk-${l[v]}-cls`] = 1;
		}
	}
	return u;
};

// Autofill Classes
const autofillClass = function(e, b) { // e = event, b = lvl flag
	let k = e.newValue;
	let s = e.sourceAttribute.substr(0, 5);
	getAttrs(["cls-autofill", "cls1-key", "cls2-key", "cls3-key", "cls4-key", s + "lvl"], v => {
		let autofill = v["cls-autofill"] == "1";
		let u = {};
		let a = classes;
		if (b) k = v[s + "key"];
		if (Object.keys(a).includes(k)) {
				if (!b) {
					u[s + "name"] = getTranslation(`cls-${k}`) || k;
					u[s + "key"] = k;
				}
				if (autofill) {
					let lvl = toInt(v[s + "lvl"]) || 0;
					u[s + "cast"] = a[k].cast ? 1 : 0;
					u[s + "cast"] = a[k].cast ? 1 : 0;
					u[s + "hd"] = a[k].hd;
					u[s + "fort"] = a[k].fort ? Math.floor(2 + lvl / 2) : Math.floor(lvl / 3);
					u[s + "refl"] = a[k].refl ? Math.floor(2 + lvl / 2) : Math.floor(lvl / 3);
					u[s + "will"] = a[k].will ? Math.floor(2 + lvl / 2) : Math.floor(lvl / 3);
					u[s + "sk"] = a[k].sk;
					u[s + "bab"] = Math.floor(lvl * a[k].bab);
					if (lvl == 0) u[s + "lvl"] = 1;
					u = Object.assign(u, getClassSkillsUpdate(k));
				}
				setAttrs(u);
		} else {
			if (e.newValue === "none") {
				u[s + "key"] = "";
				if (autofill) {
					u[s + "name"] = "";
					u[s + "fav"] = 0;
					u[s + "cast"] = 0;
					u[s + "prest"] = 0;
					u[s + "hd"] = "null";
					u[s + "lvl"] = 0;
					u[s + "fort"] = 0;
					u[s + "refl"] = 0;
					u[s + "will"] = 0;
					u[s + "sks"] = 0;
					u[s + "bab"] = 0;
					u = Object.assign(u, getClassSkillsReset());
					let i;
					let n = parseInt(s.substr(3,1));
					for (i = 1; i <= 4; i++) {
						if (i == n) continue;
						if (Object.keys(a).includes(v[`cls${i}-key`])) {
							u = Object.assign(u, getClassSkillsUpdate(v[`cls${i}-key`]));
						}
					}
				}
				setAttrs(u);
			}
		}
	});
};

on("change:cls1-lvl change:cls2-lvl change:cls3-lvl change:cls4-lvl", function(e) {
	autofillClass(e, true);
});

on("change:cls1-name change:cls2-name change:cls3-name change:cls4-name", function(e) {
	autofillClass(e);
});

// =============================================================================
// -----------------------------------------------------------------------------
// # Abilities
// -----------------------------------------------------------------------------
// =============================================================================

// Constitution
const getConstitution = function(v) { // v = attribute list
	return toInt(v["con-base"]) + toInt(v["con-dmg"]) + toInt(v["con-race"]) + toInt(v["con-item"]) + toInt(v["con-misc"]) + toInt(v["con-temp"]) + toInt(v["brb-rage"]) - toInt(v["char-aging"]);
};

const getConstitutionModifier = function(v, l) { // v = attribute list, l = character level
	return (Math.floor((getConstitution(v))/2)-5) * l;
};

// =============================================================================
// -----------------------------------------------------------------------------
// # Statistics
// -----------------------------------------------------------------------------
// =============================================================================

// Hit points
const getHitPointsMax = function(v, m) { // v = attribute list, m = constitution modifier
	let n = parsePositiveSum(v["hp-roll1"]) + parsePositiveSum(v["hp-roll2"]) + parsePositiveSum(v["hp-roll3"]) + parsePositiveSum(v["hp-roll4"]) + toInt(v["hp-feat"]) + toInt(v["hp-item"]);
	return n + m;
};

on("change:hp", function(e) {
	let n = e.newValue;
	let r = new RegExp;
	let reg = /^[\+\-]?\d+\s*([\+\-]\s*\d+)?\s*([\+\-]\s*\d+)?\s*([\+\-]\s*\d+)?\s*([\+\-]\s*\d+)?\s*([\+\-]\s*\d+)?$/i;
	n = reg.test(n) ? eval(n) : e.previousValue;
	setAttrs({"hp" : n}, {"silent" : true});
});

on("change:hp-roll1 change:hp-roll2 change:hp-roll3 change:hp-roll4", function(e) {
	let s = e.newValue;
	if (!testPositiveSum(s)) {
		let u = {};
		u[e.sourceAttribute] = 0;
		setAttrs(u);
	}
});

// Movement
const updateArmorSpeed = function() {
	getAttrs(["mvt-land-base", "arm-type", "arm-run"], v => {
		let a = armorCategory;
		let k = v["arm-type"];
		if (k === undefined || !Object.keys(a).includes(k)) k = "nil";
		let r = a[k].run;
		let s = toStr(toFlt(v["mvt-land-base"]) * a[k].spd, 1, true) + " m" || "";
		if (v["arm-run"] == "5") r = k == "med" || k == "hvy" ? 4: 5;
		setAttrs({"arm-spd" : s, "arm-run" : r}, {"silent" : true});
	});
};

const updateLoadSpeed = function() {
	getAttrs(["mvt-land-base", "load-spd"], v => {
		let s = toStr(toFlt(v["mvt-land-base"]) * toFlt(v["load-spd"]), 1, true) + " m" || "";
		setAttrs({"load-spd-str" : s,}, {"silent" : true});
	});
};

// Armor Speed
on("change:arm-type", updateArmorSpeed);

// Autofill Movement
const autofillMovement = function(e) { // e = event
	let k = e.newValue;
	if (movement.includes(k)) {
		let u = {};
		u["mvt-land-base"] = getTranslation(`mvt-${k}-val`) || k;
		u["mvt-swim"] = feetToMeter(toFlt(u["mvt-land-base"]) / 4, true) + " m";
		setAttrs(u, {"silent" : true}, function() {
			updateArmorSpeed();
			updateLoadSpeed();
		});
	} else {
		updateArmorSpeed();
		updateLoadSpeed();
	}
};

on("change:mvt-land-base", autofillMovement);

// Armor Class Ajusted Dexterity Modifier
const setMaximumDexterity = function() {
	let a = ["dex-base", "dex-misc", "dex-temp", "brb-fat", "char-aging"];
	getAttrs([...a, "arm-worn", "arm-dex", "load-dex"], v => {
		let n = v["arm-worn"] == "1" ? toInt(v["arm-dex"]) : 99;
		let m = toInt(v["load-dex"]);
		let i = Math.floor((Math.floor(a.reduce(function(t, n) {return t + toInt(v[n])}, 0)) - 10) / 2);
		let j = Math.max(Math.min(n, m), 0);
		setAttrs({"dex-max" : Math.min(i, j)});
	});
};

on("change:arm-worn change:arm-dex change:load-dex", setMaximumDexterity);

// =============================================================================
// -----------------------------------------------------------------------------
// # Skills
// -----------------------------------------------------------------------------
// =============================================================================

// Synergies
const skillSynergies = {
	"bluff" : [
		"diplomacy",
		"disguise-cond",
		"sleightofhand"
	],
	"craft1" : ["appraise-cond"],
	"craft2" : ["appraise-cond"],
	"craft3" : ["appraise-cond"],
	"craftalchemy" : ["appraise-cond"],
	"decipher" : ["usemagicdevice-cond"],
	"escapeartist" : ["userope-cond"],
	"userope" : [
		"climb-cond",
		"escapeartist-cond"
	],
	"handleanimal" : [
		// "animalempathy", // Ranger ability -- TODO
		"ride"
	],
	"jump" : ["tumble"],
	"knowledgearcana" : ["spellcraft"],
	"knowledgearchitecture" : ["search-cond"],
	"knowledgedungeon" : ["survival2-cond"],
	"knowledgegeography" : ["survival3-cond"],
	// "knowledgehistory" : ["bardicknowledge"], // Bard ability -- TODO
	"knowledgelocal" : ["gatherinformation"],
	"knowledgenature" : ["survival4-cond"],
	"knowledgenobility" : ["diplomacy"],
	"knowledgeplanes" : ["survival5-cond"],
	// "knowledgereligion" : [turnundead], // Cleric ability -- TODO
	"search" : ["survival1-cond"],
	"sensemotive" : ["intimidate"],
	"spellcraft" : ["usemagicdevice-cond"],
	"survival" : ["knowledgenature"],
	"tumble" : ["jump", "balance"],
	"usemagicdevice" : ["spellcraft-cond"]
};

const checkSkillSynergy = function(k) { // k = skill key
	getAttrs([`sk-${k}-rank`, "sk-decipher-rank", "sk-spellcraft-rank", "sk-craft1-rank", "sk-craft2-rank", "sk-craft3-rank", "sk-craftalchemy-rank", "sk-bluff-rank", "sk-knowledgenobility-rank"], v => {
		let c = ["craft1", "craft2", "craft3", "craftalchemy"];
		let u = {};
		let q, i, a = skillSynergies;
		let b = toInt(v[`sk-${k}-rank`]) >= 5;
		let n = b ? 2 : 0;
		if ((k == "bluff" && toInt(v["sk-knowledgenobility-rank"]) >= 5) || (k == "knowledgenobility" && toInt(v["sk-bluff-rank"]) >= 5)) n += 2;
		if (c.includes(k)) for (q in c) if (v[`sk-${c[q]}-rank`] >= 5) b = true;
		if (k == "decipher" || k == "spellcraft") {
			let c1 = toInt(v["sk-decipher-rank"]) >= 5;
			let c2 = toInt(v["sk-spellcraft-rank"]) >= 5;
			u["sk-usemagicdevice-cond-syn"] = c1 && c2 ? getTranslation("sk-usemagicdevice-cond-syn2") : c1 || c2 ? getTranslation("sk-usemagicdevice-cond-syn1") : "";
		} else {
			for (i = 0; i < a[k].length; i++) {
				if (a[k][i].endsWith("-cond")) {
					u[`sk-${a[k][i]}-syn`] = b ? getTranslation(`sk-${a[k][i]}-syn`) : "";
				} else {
					u[`sk-${a[k][i]}-syn`] = n;
				}
			}
		}
		setAttrs(u);
	});
};

Object.keys(skillSynergies).forEach(k => {
	on(`change:sk-${k}-rank`, function(e) {
			checkSkillSynergy(k);
	});
});

// =============================================================================
// -----------------------------------------------------------------------------
// # Racial Abilities
// -----------------------------------------------------------------------------
// =============================================================================

// Racial Abilities
const racialAbilities = {
	"ho" : {"str" : 2, "int" : -2, "cha" : -2},
	"el" : {"dex" : 2, "con" : -2},
	"dw" : {"con" : 2, "cha" : -2},
	"gn" : {"str" : -2, "con" : 2},
	"ha" : {"str" : -2, "dex" : 2}
};

const setRacialAbilities = function(k, m, y) { // k = race key, m = new value, y = old value
	let o = racialAbilities[k];
	let a = Object.keys(o);
	getAttrs(a.map(k => `${k}-race`), v => {
		let u = {};
		a.forEach(k => {
			u[`${k}-race`] = toInt(v[`${k}-race`]) + (o[k] * (m == "1" ? 1 : y == "1" ? -1 : 0));
		});
		setAttrs(u);
	});
};

on("change:ho-abi change:el-abi change:dw-abi change:gn-abi change:ha-abi", function(e) {
	setRacialAbilities(e.sourceAttribute.split("-")[0], e.newValue, e.previousValue);
});

// Racial Saves
const setRacialSaves = function(a, n, m, y) { // k = skill key array, n = number, m = new value, y = old value
	getAttrs(a.map(k => `${k}-race`), v => {
		let u = {};
		a.forEach(k => {
			u[`${k}-race`] = toInt(v[`${k}-race`]) + (n * (m == "1" ? 1 : y == "1" ? -1 : 0));
		});
		setAttrs(u);
	});
};

on("change:ha-save1", function(e) {
	setRacialSaves(["fort", "refl", "will"], 1, e.newValue, e.previousValue);
});

// Racial Skills
const setRacialSkill = function(a, n, m, y) { // k = skill key array, n = number, m = new value, y = old value
	getAttrs(a.map(k => `sk-${k}-race`), v => {
		let u = {};
		a.forEach(k => {
			u[`sk-${k}-race`] = toInt(v[`sk-${k}-race`]) + (n * (m == "1" ? 1 : y == "1" ? -1 : 0));
		});
		setAttrs(u);
	});
};

on("change:he-sk1", function(e) {
	setRacialSkill(["listen", "search", "spot"], 1, e.newValue, e.previousValue);
});

on("change:he-sk2", function(e) {
	setRacialSkill(["diplomacy", "gatherinformation"], 2, e.newValue, e.previousValue);
});

on("change:el-sk", function(e) {
	setRacialSkill(["listen", "search", "spot"], 2, e.newValue, e.previousValue);
});

on("change:gn-sk1", function(e) {
	setRacialSkill(["listen"], 2, e.newValue, e.previousValue);
});
on("change:gn-sk2", function(e) {
	setRacialSkill(["craftalchemy"], 2, e.newValue, e.previousValue);
});

on("change:ha-sk1", function(e) {
	setRacialSkill(["climb", "jump", "movesilently"], 2, e.newValue, e.previousValue);
});

on("change:ha-sk2", function(e) {
	setRacialSkill(["listen"], 2, e.newValue, e.previousValue);
});

// Visions
on("change:he-vision change:el-vision change:gn-vision", function(e) {
	setAttrs({"vis-low" : e.newValue});
});

on("change:ho-vision change:dw-vision", function(e) {
	let u = {};
	let n = e.newValue;
	u["vis-dark"] = n;
	u["vis-dark-range"] = n == "1" ? getTranslation("stat-vis-dark-range-pl") : "";
	setAttrs(u);
});

// =============================================================================
// -----------------------------------------------------------------------------
// # Class Abilities
// -----------------------------------------------------------------------------
// =============================================================================

// Barbarian
on("clicked:brb-rage-on", function() {
	getAttrs(["brb-rage-num", "brb-rage-type"], v => {
		let n = toInt(v["brb-rage-num"]);
		if (n > 0) {
			let u = {};
			let q = v["brb-rage-type"];
			let m = q == "2" ? 8 : q == "1" ? 6 : 4;
			u["brb-rage-step-str"] = getTranslation("brb-rage-step-1");
			u["brb-rage-step"] = 1;
			u["brb-rage-num"] = n - 1;
			u["brb-rage"] = m;
			u["brb-ac"] = -2;
			u["brb-will"] = m / 2;
			setAttrs(u, {"silent" : true});
		}
	});
});

on("clicked:brb-rage-off", function() {
	getAttrs(["brb-tire"], v => {
		let u = {};
		let n = v["brb-tire"] == "0" ? 0 : 2;
		u["brb-rage-step-str"] = n == 0 ? "" : getTranslation("brb-rage-step-" + n);
		u["brb-rage-step"] = n;
		u["brb-rage"] = 0;
		u["brb-ac"] = 0;
		u["brb-will"] = 0;
		u["brb-fat"] = -1 * n;
		setAttrs(u, {"silent" : true});
	});
});

on("clicked:brb-fat-off", function() {
	let u = {};
	u["brb-rage-step-str"] = "";
	u["brb-rage-step"] = 0;
	u["brb-fat"] = 0;
	setAttrs(u, {"silent" : true});
});

// =============================================================================
// -----------------------------------------------------------------------------
// # Spells
// -----------------------------------------------------------------------------
// =============================================================================

// Spell Slots
const getSpellSlotsArray = function() { // returns array
	let a = [], i = 1;
	for (i; i <= 8; i++) {a.push("slot-" + i)}
	return a;
};

const updateSpellSlotsTotal = function(k) { // k = repeating section key
	let a = getSpellSlotsArray();
	TAS.repeating(k, true)
		.attr(`cls1-${k}-slot`, `cls2-${k}-slot`, `cls3-${k}-slot`, `cls4-${k}-slot`)
		.field(["cls-num", ...a])
		.reduce(function(m, r, q) {
			a.forEach(v => {
				if (r["cls-num"] != "0") m["cls" + r["cls-num"]] += toInt(r[v]);
			});
			return m;
		}, {"cls1" : 0, "cls2" : 0, "cls3" : 0, "cls4" : 0}, function(m, r, q) {
			q[`cls1-${k}-slot`] = m.cls1;
			q[`cls2-${k}-slot`] = m.cls2;
			q[`cls3-${k}-slot`] = m.cls3;
			q[`cls4-${k}-slot`] = m.cls4;
		})
		.execute();
};

const clearSpellSlotsTotal = function(k) { // k = repeating section key
	let a = getSpellSlotsArray();
	TAS.repeating(k, true)
		.field(a)
		.each(function(r) {
			a.forEach(k => {r[k] = 0});
		})
		.after(function() {
			updateSpellSlotsTotal(k);
		})
		.execute();
};

const getSpellSlotsListener = function() {
	let i = 0;
	let j = 0;
	let r = "";
	let s = "";
	for (i; i <= 9; i++) {
		j = 1;
		s = "";
		for (j; j <= 8; j++) { // slot
			s += `change:repeating_spl-${i}:slot-${j} `;
			if (j == 8) {
				s += `remove:repeating_spl-${i} `;
				r += s;
			}
		}
	}
	return r;
};

const getSpellListener = function(s) { // s = event listener string
	let i = 0;
	let r = "";
	for (i; i <= 9; i++) {
		r += s.replaceAll("$0", "spl-" + i) + " ";
	}
	return r;
};

on(getSpellSlotsListener(), function(e) {
	updateSpellSlotsTotal(`spl-${e.sourceAttribute.split("_")[1].slice(-1)}`);
});

on(getSpellListener("clicked:clear-slots-$0"), function(e) {
	clearSpellSlotsTotal(`spl-${e.triggerName.slice(-1)}`);
});

// Spell DC
const updateSpellDC = function(e) {
	let s = e.sourceAttribute.split("_");
	let id = s[2];
	let sec = s[1];
	let k = `repeating_${sec}_${id}_`;
	let j = toInt(sec.slice(-1));
	getAttrs([k + "cls-num", k + "sch"], v => {
		let u = {};
		let q = v[k + "sch"];
		let i = v[k + "cls-num"];
		u[k + "dc-cls"] = `@{cls${i}-spl-${j}-dc}`;
		u[k + "spl-focus"] = q == "universal" ? "0" : `@{spl-focus-${q}}`;
		setAttrs(u);
	});
};

on(getSpellListener("change:repeating_$0-cls-num change:repeating_$0:sch"), function(e) {
	updateSpellDC(e);
});

// Class Name
on(getSpellListener("change:repeating_$0:cls-num"), function(e) {
	let k = e.newValue;
	let i = e.sourceAttribute.split("_")[1].slice(-1);
	let u = {};
	u[`repeating_spl-${i}_cls-val`] = k !== "0" ? `@{cls${k}-name}` : "@{char-race}";
	u[`repeating_spl-${i}_cl`] = k !== "0" ? `@{cls${k}-cast-lvl}` : "@{ecl}";
	setAttrs(u, null, function() {
		updateSpellDC(e);
		updateSpellSlotsTotal(`spl-${i}`);
	});
});

// Autofill Spells
const spellLevel = ["brd", "clr", "drd", "rgr", "pal", "sor-wiz", "brd-sor-wiz", "sor-wiz-clr", "brd-clr-sor-wiz", "brd-clr-drd-sor-wiz"];

on(getSpellListener("change:repeating_$0:level"), function(e) {
	let k = e.newValue;
	if (spellLevel.includes(k)) {
		let src = e.sourceAttribute.split("_");
		let p = `repeating_${src[1]}_${src[2]}_`;
		getAttrs([p + "lvl"], v => {
			let u = {};
			let lvl = toInt(v[p + "lvl"]);
			if (lvl == 0 || lvl > 4) {
				k = k.replace("rgr", "");
				k = k.replace("pal", "");
			}
			if (lvl > 6) {
				k = k.replace("brd-", "");
				k = k.replace("brd", "");
			}
			u[p + "level"] = k.length > 0 ? getTranslation(`spl_level_${k}`).replaceAll("$0", lvl) : "";
			setAttrs(u, {"silent" : true});
		});
	}
});

const spellComponents = ["vs", "vsm", "vsdf", "v", "s"];
const spellCastingTime = ["1-std", "1-rnd", "1-min", "10-min"];
const spellRange = ["touch", "personal", "short", "medium", "long"];
const spellTarget = ["self", "1-touch", "1-living", "1-dead"];
const spellDuration = ["instant", "perm", "concent", "1-rnd", "1-min", "10-min", "1-rnd-lvl", "1-min-lvl", "10-min-lvl"];
const spellSave = ["refl-neg", "refl-half", "fort-neg", "fort-harmless", "fort-partial", "will-neg", "will-harmless", "will-reveal",];

on(getSpellListener("change:repeating_$0:compo change:repeating_$0:ct change:repeating_$0:range change:repeating_$0:target change:repeating_$0:dur change:repeating_$0:save"), function(e) {
	let src = e.sourceAttribute.split("_");
	let q = src[3];
	let a;
	switch(q) {
		case "compo" : a = spellComponents; break;
		case "ct" : a = spellCastingTime; break;
		case "range" : a = spellRange; break;
		case "target" : a = spellTarget; break;
		case "dur" : a = spellDuration; break;
		case "save" : a = spellSave; break;
	}
	let k = e.newValue;
	if (a.includes(k)) {
		let u = {};
		let p = `repeating_${src[1]}_${src[2]}_`;
		u[p + q] = getTranslation(`spl_${q}_${k}`);
		setAttrs(u, {"silent" : true});
	}
});

// =============================================================================
// -----------------------------------------------------------------------------
// # Weapons
// -----------------------------------------------------------------------------
// =============================================================================

// Critical Threshold
on("change:roll-die", function(e) {
	let i = 20;
	switch(e.newValue) {
		case "22" :
		case "23" : i = 21; break;
	}
	setAttrs({"crit-max" : i}, {"silent" : true}, function() {
		let n = 0;
		if (e.previousValue == "20") n = 1;
		else if (e.newValue == "20") n = -1;
		TAS.repeating("wpn")
			.field("crit-min")
			.each(function(r) {
				r["crit-min"] = r.I["crit-min"] + n;
			})
			.execute();
	});
});

// Full Attack
const getFullAttackNumber = function(n) { // n = bab
	if (n > 15) return 4;
	else if (n > 10) return 3;
	else if (n > 5) return 2;
	return 1;
};

on("change:bab", function() {
	getAttrs(["cls1-bab", "cls2-bab", "cls3-bab", "cls4-bab", "race-bab"], v => {
		let n = toInt(v["cls1-bab"]) + toInt(v["cls2-bab"]) + toInt(v["cls3-bab"]) + toInt(v["cls4-bab"]) + toInt(v["race-bab"]);
		setAttrs({"atk-num" : getFullAttackNumber(n)}, {"silent" : true});
	});
});

// Melee Weapon
on("change:repeating_wpn:melee", function(e) {
	let u = {};
	u[`repeating_wpn_${e.sourceAttribute.split("_")[2]}_abi-atk`] = e.newValue == "1" ? "@{str-mod}" : "@{dex-mod}";
	setAttrs(u, {"silent" : true});
});

// Autofill Weapons
const autofillWeapon = function(e) { // e = event
	let k = e.newValue;
	let a = weapons;
	let id = e.sourceAttribute.substr(15, 19);
	if (a.hasOwnProperty(k)) {
		getAttrs(["roll-die"], v => {
			let u = {};
			let t = a[k].type || 2;
			let r = t == 4;
			let c = a[k]["crit-min"] || 20;
			let s = a[k]["str"] || false;
			u[`repeating_wpn${id}_name`] = getTranslation(`wpn-${k}`);
			u[`repeating_wpn${id}_melee`] = r ? 0 : 1;
			u[`repeating_wpn${id}_cat`] = a[k].cat || "";
			u[`repeating_wpn${id}_type`] = a[k].type || "";
			u[`repeating_wpn${id}_hand`] = (t == 3 ? 2 : a[k].hand) || "";
			u[`repeating_wpn${id}_range`] = a[k].range ? feetToMeter(a[k].range) + " m" : "";
			u[`repeating_wpn${id}_abi-atk`] = r ? "@{dex-mod}" : "@{str-mod}";
			u[`repeating_wpn${id}_crit-max`] = c;
			u[`repeating_wpn${id}_crit-min`] = v["roll-die"] != "20" ? 21 - (20 - c) : c;
			u[`repeating_wpn${id}_crit-mult`] = a[k]["crit-mult"] || 2;
			u[`repeating_wpn${id}_dmg-type`] = a[k]["dmg-type"] || "";
			u[`repeating_wpn${id}_dmg-num`] = a[k]["dmg-num"] || 1;
			u[`repeating_wpn${id}_dmg-die`] = a[k]["dmg-die"] || "d3";
			u[`repeating_wpn${id}_abi-dmg`] = r && !s ? "0" : t == 3 ? "(@{str-mod}+floor(@{str-mod}/2))" : "@{str-mod}";
			u[`repeating_wpn${id}_ammo`] = a[k].ammo || 0;
			u[`repeating_wpn${id}_wgt`] = poundsToKilos(a[k].wgt) || 0;
			u[`repeating_wpn${id}_cost`] = a[k].cost || 0;
			u[`repeating_wpn${id}_props`] = a[k].props !== undefined ? getTranslation(`wpn-${weaponProps[a[k].props]}`) : "";
			setAttrs(u, null, updateModifiers);
		});
	}
};

on("change:repeating_wpn:name", function(e) {
	autofillWeapon(e);
});

// =============================================================================
// -----------------------------------------------------------------------------
// # Armor and Shield
// -----------------------------------------------------------------------------
// =============================================================================

// Shield Equipped
on("change:shd-worn", function(e) {
	let k = e.newValue;
	if (k == "0") setAttrs({"shd-eqp" : k});
});

on("change:shd-eqp", function(e) {
	let k = e.newValue;
	if (k == "1") setAttrs({"shd-worn" : k});
});

// Armor and Shield Weight
const updateArmorShieldWeight = function() {
	getAttrs(["arm-wgt", "arm-worn", "shd-wgt", "shd-worn"], v => {
		let n = 0;
		if (v["arm-worn"] == "1") n += toFlt(v["arm-wgt"]);
		if (v["shd-worn"] == "1") n += toFlt(v["shd-wgt"]);
		setAttrs({"def-wgt-tot" : n});
	});
};

on("change:arm-wgt change:arm-worn change:shd-wgt change:shd-worn", updateArmorShieldWeight);

// Autofill Armor
const autofillArmor = function(e) { // e = event
	let k = e.newValue;
	let a = armors;
	if (a.hasOwnProperty(k)) {
		let u = {};
		let b = k == "none";
		u["arm-worn"] = b ? "0" : "1";
		u["arm-name"] = getTranslation(`arm-${k}`);
		u["arm-type"] = armorType[a[k].type] || "nil";
		u["arm-bon"] = a[k].bon || 0;
		u["arm-pen"] = a[k].pen * -1 || 0;
		u["arm-spl"] = a[k].spl || 0;
		u["arm-dex"] = a[k].dex || 99;
		u["arm-wgt"] = poundsToKilos(a[k].wgt) || 0;
		u["arm-cost"] = a[k].cost || 0;
		if (k == "none") {
			u["arm-enh"] = 0;
			u["arm-props"] = "";
		}
		setAttrs(u);
	}
};

on("change:arm-name", function(e) {
	autofillArmor(e);
});

// Autofill Shield
const autofillShield = function(e) { // e = event
	let k = e.newValue;
	let a = shields;
	if (a.hasOwnProperty(k)) {
		let u = {};
		let b = k == "none";
		u["shd-worn"] = b ? "0" : "1";
		u["shd-eqp"] = b ? "0" : "1";
		u["shd-name"] = getTranslation(`shd-${k}`);
		u["shd-bon"] = a[k].bon || 0;
		u["shd-pen"] = a[k].pen * -1 || 0;
		u["shd-spl"] = a[k].spl || 0;
		u["shd-wgt"] = poundsToKilos(a[k].wgt) || 0;
		u["shd-cost"] = a[k].cost || 0;
		if (k == "none") {
			u["shd-enh"] = 0;
			u["shd-props"] = "";
		}
		setAttrs(u);
	}
};

on("change:shd-name", function(e) {
	autofillShield(e);
});

// =============================================================================
// -----------------------------------------------------------------------------
// # Modifiers
// -----------------------------------------------------------------------------
// =============================================================================

// Modifiers
const updateModifiers = function() {
	let k = "mod";
	getSectionIDs(k, sec => {
		let a = [];
		_.each(sec, id => {
			a.push(`repeating_${k}_${id}_active`);
			a.push(`repeating_${k}_${id}_melee-atk`);
			a.push(`repeating_${k}_${id}_melee-dmg`);
			a.push(`repeating_${k}_${id}_range-atk`);
			a.push(`repeating_${k}_${id}_range-dmg`);
			a.push(`repeating_${k}_${id}_ac`);
		});
		getAttrs(a, (v) => {
			let meleeatk = 0;
			let meleedmg = 0;
			let rangeatk = 0;
			let rangedmg = 0;
			let ac = 0;
			let u = {};
			_.each(sec, id => {
				if (v[`repeating_${k}_${id}_active`] == "1") {
					meleeatk += toInt(v[`repeating_${k}_${id}_melee-atk`]);
					meleedmg += toInt(v[`repeating_${k}_${id}_melee-dmg`]);
					rangeatk += toInt(v[`repeating_${k}_${id}_range-atk`]);
					rangedmg += toInt(v[`repeating_${k}_${id}_range-dmg`]);
					ac += toInt(v[`repeating_${k}_${id}_ac`]);
				}
			});
			u["melee-mod-atk"] = meleeatk;
			u["melee-mod-dmg"] = meleedmg;
			u["range-mod-atk"] = rangeatk;
			u["range-mod-dmg"] = rangedmg;
			u["ac-mod"] = ac;
			setAttrs(u, {silent: true});
		});
	});
};

on("change:repeating_mod:active change:repeating_mod:melee-atk change:repeating_mod:melee-dmg change:repeating_mod:range-atk change:repeating_mod:range-dmg change:repeating_mod:ac remove:repeating_mod", function() {
	updateModifiers();
});

// Autofill Conditions
const autofillCondition = function(e) { // e = event
	let k = e.newValue;
	let a = conditions;
	let id = e.sourceAttribute.substr(15, 19);
	if (a.hasOwnProperty(k)) {
		let u = {};
		u[`repeating_mod${id}_name`] = getTranslation(`cond-${k}`);
		u[`repeating_mod${id}_melee-atk`] = a[k]["melee-atk"] || 0;
		u[`repeating_mod${id}_melee-dmg`] = a[k]["melee-dmg"] || 0;
		u[`repeating_mod${id}_range-atk`] = a[k]["range-atk"] || 0;
		u[`repeating_mod${id}_range-dmg`] = a[k]["range-dmg"] || 0;
		u[`repeating_mod${id}_ac`] = a[k].ac || 0;
		setAttrs(u, {"silent" : true}, updateModifiers);
	}
};

on("change:repeating_mod:name", function(e) {
	autofillCondition(e);
});

// =============================================================================
// -----------------------------------------------------------------------------
// # Load
// -----------------------------------------------------------------------------
// =============================================================================

const loadBase = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 115, 130, 150, 175, 200, 230, 260, 300, 350, 400, 460, 520, 600, 700, 800, 920, 1040, 1200, 1400];

const loadPenalties = {};
loadPenalties["lgt"] = {"dex" : "–", "pen" : 0, "spd" : 1, "run" : "–"};
loadPenalties["med"] = {"dex" : 3, "pen" : -3, "spd" : 0.75, "run" : 4};
loadPenalties["hvy"] = {"dex" : 1, "pen" : -6, "spd" : 0.75, "run" : 3};
loadPenalties["min"] = loadPenalties.lgt;
loadPenalties["max"] = loadPenalties.hvy;

const updateLoad = function() {
	let a = ["str-base", "str-misc", "str-temp", "brb-rage", "brb-fat", "char-aging"];
	let b = ["wpn-wgt-tot", "def-wgt-tot", "eqp-wgt-tot", "mag-wgt-tot", "itm-wgt-tot", "mny-wgt-tot", "gem-wgt-tot", "art-wgt-tot"];
	getAttrs([...a, ...b, "char-size", "char-legs", "load-mod", "mvt-land-base"], v => {
		let i = Math.floor(a.reduce(function(t, n) {return t + toInt(v[n])}, 0));
		let n = Math.floor(b.reduce(function(t, n) {return t + toFlt(v[n])}, 0));
		let hvy, med, lft;
		let s;
		let m = 1;
		let l = toInt(v["char-legs"]) > 3;
		switch(v["char-size"]) {
			case "f" : m = l ? 0.25 : 0.125; break;
			case "d" : m = l ? 0.5 : 0.25; break;
			case "t" : m = l ? 0.75 : 0.5; break;
			case "s" : m = l ? 1 : 0.75; break;
			case "m" : m = l ? 1.5 : 1; break;
			case "l" : m = l ? 3 : 2; break;
			case "h" : m = l ? 6 : 4; break;
			case "g" : m = l ? 12 : 8; break;
			case "c" : m = l ? 24 : 16; break;
		}
		if (i < 1) i = 1;
		i += toInt(v["load-mod"]);
		hvy = i <= 29 ? loadBase[i] : loadBase[("2" + i.toString().slice(-1))] * (Math.floor((i - 20) / 10) * 4);
		med = Math.floor(hvy *2 / 3);
		lgt = Math.floor(med / 2);
		if (true) {
			hvy = poundsToKilos(hvy);
			med = poundsToKilos(med);
			lgt = poundsToKilos(lgt);
		}
		if (n == 0) s = "min";
		else if (n <= lgt) s = "lgt";
		else if (n <= med) s = "med";
		else if (n <= hvy) s = "hvy";
		else s = "max";
		let u = {};
		let q = loadPenalties;
		u["load-tot-str"] = getTranslation(`load-${s}-subt`);
		u["load-tot"] = s;
		u["load-lgt"] = lgt;
		u["load-med"] = med;
		u["load-hvy"] = hvy;
		u["load-lift"] = hvy;
		u["load-drag"] = hvy * 2;
		u["load-dex-str"] = signInt(q[s].dex);
		u["load-dex"] = Number.isInteger(q[s].dex) ? q[s].dex : 99;
		u["load-pen"] = q[s].pen;
		u["load-spd-str"] = toStr(toFlt(v["mvt-land-base"]) * q[s].spd, 1, true) + " m" || "";
		u["load-spd"] = q[s].spd;
		u["load-run-str"] = (Number.isInteger(q[s].run) ? "×" : "") + q[s].run;
		u["load-run"] = Number.isInteger(q[s].run) ? q[s].run : 10;
		u["load-size"] = "×" + toStr(m);
		setAttrs(u);
	});
};

on("change:char-size change:char-legs change:str change:char-wgt-tot change:load-mod", updateLoad);

// =============================================================================
// -----------------------------------------------------------------------------
// # Items
// -----------------------------------------------------------------------------
// =============================================================================

const moveItem = function(s, k) { // s = section name, k = item id
	let a = [`${k}_name`, `${k}_type`, `${k}_qty`, `${k}_slot`, `${k}_bag`, `${k}_loc`, `${k}_hard`, `${k}_hp`, `${k}_wgt`, `${k}_cost`];
	getAttrs(a, (v) => {
		let u = {};
		let n = generateRowID();
		u[`repeating_${s}_${n}_name`] = v[`${k}_name`];
		u[`repeating_${s}_${n}_type`] = v[`${k}_type`];
		u[`repeating_${s}_${n}_qty`] = v[`${k}_qty`];
		u[`repeating_${s}_${n}_slot`] = v[`${k}_slot`];
		u[`repeating_${s}_${n}_bag`] = v[`${k}_bag`];
		u[`repeating_${s}_${n}_loc`] = v[`${k}_loc`];
		u[`repeating_${s}_${n}_hard`] = v[`${k}_hard`];
		u[`repeating_${s}_${n}_hp`] = v[`${k}_hp`];
		u[`repeating_${s}_${n}_wgt`] = v[`${k}_wgt`];
		u[`repeating_${s}_${n}_cost`] = v[`${k}_cost`];
		removeRepeatingRow(`${k}`);
		setAttrs(u, {"silent" : true}, () => {
			updateWeight(s);
			updateWeight(k.split("_")[1]);
		});
	});
};

on("clicked:repeating_eqp:mag clicked:repeating_eqp:itm clicked:repeating_eqp:tra clicked:repeating_eqp:sta clicked:repeating_mag:eqp clicked:repeating_mag:itm clicked:repeating_mag:tra clicked:repeating_mag:sta clicked:repeating_itm:eqp clicked:repeating_itm:mag clicked:repeating_itm:tra clicked:repeating_itm:sta clicked:repeating_tra:eqp clicked:repeating_tra:mag clicked:repeating_tra:itm clicked:repeating_tra:sta clicked:repeating_sta:eqp clicked:repeating_sta:mag clicked:repeating_sta:itm clicked:repeating_sta:tra", (e) => {
	let r = e.sourceAttribute.split("_");
	moveItem(r[3], r[0] + "_" + r[1] + "_" + r[2]);
});

// =============================================================================
// -----------------------------------------------------------------------------
// # Wealth
// -----------------------------------------------------------------------------
// =============================================================================

const wealthGems = ["agate", "azurite", "cat-s-eye", "hematite", "lapis-lazuli", "malachite", "obsidian", "pearl-irregular", "quartz-blue", "rhodochrosite", "tiger-eye", "turquoise", "bloodstone", "carnelian", "chalcedony", "chrysoprase", "citrine", "iolite", "jasper", "moonstone", "onyx", "peridot", "quartz", "rock-crystal", "sardonyx", "zircon", "amber", "amethyst", "chrysoberyl", "coral", "garnet", "jade", "jet", "pearl", "spinel", "tourmaline", "alexandrite", "aquamarine", "garnet-violet", "pearl-black", "spinel-deep-blue", "topaz", "corundum", "emerald", "opal", "ruby", "sapphire", "diamond", "emerald-flawless", "jacinth"];
const wealthArtObjects = ["silver-ewer", "ivory-statuette", "gold-bracelet", "gold-cloth", "velvet-mask", "silver-chalic", "wool-tapestry", "brass-mug", "silver-comb", "silver-longsword", "carved-harp", "gold-idol", "gold-comb", "gold-bottle", "electrum-dagger", "sapphire-eyepatch", "opal-pendant", "masterpiece-painting", "embroidered-mantle", "sapphire-pendant", "embroidered-glove", "jeweled-anklet", "gold-music-box", "gold-circlet", "pearl-necklace", "gold-crown", "electrum-ring", "gold-ring", "gold-cup-set"];

on("change:repeating_gem:name change:repeating_art:name", function(e) {
	let src = e.sourceAttribute.split("_");
	let q = src[1];
	let a;
	switch(q) {
		case "gem" : a = wealthGems; break;
		case "art" : a = wealthArtObjects; break;
	}
	let k = e.newValue;
	if (a.includes(k)) {
		let u = {};
		let p = `repeating_${q}_${src[2]}_`;
		u[p + "name"] = getTranslation(`${q}_${k}`);
		setAttrs(u, {"silent" : true});
	}
});

// =============================================================================
// -----------------------------------------------------------------------------
// # Weights
// -----------------------------------------------------------------------------
// =============================================================================

// All Weights
const updateWeight = function(k, b, x) { // k = section key, b = update with loc, x = weight mutiplier
	TAS.repeating(k)
		.attr(k + "-wgt-tot")
		.field(["wgt", "qty", "loc"])
		.reduce(function(m, r) {
			let n = !b || b && r["loc"] == "" ? r["wgt"] : 0;
			if (x) {
				n *= x;
				r["wgt"] = n;
			}
			return m + n * r["qty"];
		}, null, function(m, r, a) {
			a[k + "-wgt-tot"] = toStr(m, 1);
		})
		.execute();
};

const weightSections = {
	"weapons" : ["wpn"],
	"equipment" : ["eqp", "mag", "itm"],
	"wealth" : ["gem", "art"]
};

const weightListeners = function() {
	let o = weightSections;
	let k;
	let s = "";
	for (k in o) {
		o[k].forEach(v => {
			s += `change:repeating_${v}:qty change:repeating_${v}:wgt remove:repeating_${v} `;
			if (k == "wealth") s += `change:repeating_${v}:loc `;
		});
	}
	return s;
};

on(weightListeners(), function(e) {
	let k = e.sourceAttribute.split("_")[1];
	let b = weightSections.wealth.includes(k) ? true : false;
	updateWeight(k, b);
});

// Money Weight
const updateMoneyWeights = function() {
	TAS.repeating("mny")
		.attr("mny-wgt-tot")
		.field(["pp", "gp", "sp", "cp", "loc", "wgt"])
		.reduce(function(m, r) {
			let n = r["loc"] == "" ? (r.I["pp"] + r.I["gp"] + r.I["sp"] + r.I["cp"]) / 100 : 0;
			r["wgt"] = toStr(n, 1);
			return m + n;
		}, null, function(m, r, a) {
			a["mny-wgt-tot"] = toStr(m, 1);
		})
		.execute();
};

on("change:repeating_mny:pp change:repeating_mny:gp change:repeating_mny:sp change:repeating_mny:cp change:repeating_mny:loc remove:repeating_mny", updateMoneyWeights);

// =============================================================================
// -----------------------------------------------------------------------------
// # Subsections
// -----------------------------------------------------------------------------
// =============================================================================

const subsection = {
	"character" : ["languages", "physical", "psychical", "relational"],
	"race" : ["human", "halfelf", "halforc", "elf", "dwarf", "gnome", "halfling"],
	"class" : ["barbarian", "bard", "cleric", "druid", "fighter", "monk", "paladin", "ranger", "rogue", "sorcerer", "warlock", "wizard"],
	"spell" : ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"],
	"equipment" : ["worn", "magical", "usable", "travel", "stash"],
	"wealth" : ["money", "gems", "art"]
};

const getSubsectionsListener = function() {
	let k, l = subsection, s = "";
	for (k in l) {
		l[k].forEach(v => {
			s += `clicked:hide-${k}-${v} `;
		});
	}
	return s;
};

const switchAllSubsections = function(q) { // q = value (1 for shown, 0 for hidden)
	let k, l = subsection, a = [];
	for (k in l) {
		l[k].forEach(v => {
			a.push(`show-${k}-${v}`);
		});
	}
	let u = {};
	a.forEach(v => {
		u[v] = q;
	});
	setAttrs(u, {"silent" : true});
};

on(getSubsectionsListener(), function(e) {
	let u = {};
	u[`show-${e.triggerName.substr(13)}`] = "0";
	setAttrs(u, {"silent" : true});
});

// =============================================================================
// -----------------------------------------------------------------------------
// # Options
// -----------------------------------------------------------------------------
// =============================================================================

const options = ["feat", "trick", "spl-0", "spl-1", "spl-2", "spl-3", "spl-4", "spl-5", "spl-6", "spl-7", "spl-8", "spl-9", "wpn", "eqp", "mag", "itm", "tra", "sta"];

const switchOptions = function(k, v) { // k = repeating section key, v = value (1 for shown, 0 for hidden)
	TAS.repeating(k, true)
		.field("show-options")
		.each(function(r) {
			r["show-options"] = v;
		})
		.execute();
};

const switchAllOptions = function(v) { // v = value (1 for shown, 0 for hidden)
	let i, a = options, b = ["show-ac", "show-hp"], u = {};
	for (i = 0; i < a.length ; i++) switchOptions(a[i], v);
	for (i = 0; i < b.length ; i++) u[b[i]] = v;
	setAttrs(u);
};

on("clicked:hide-all-options", function() {
	switchAllOptions(0);
	switchAllSubsections(0);
});

on("clicked:show-all-options", function() {
	switchAllOptions(1);
	switchAllSubsections(1);
});

// =============================================================================
// -----------------------------------------------------------------------------
// # Toggles
// -----------------------------------------------------------------------------
// =============================================================================

// Roll Modifier
on("change:ask-mod", function(e) {
	let s = e.newValue == "1" ? "?{" + getTranslationByKey("ui_modifier") + "|0}" : "0";
	setAttrs({"r-mod" : s});
});

// Whisper to GM
on("change:ask-gm", function(e) {
	let s = e.newValue == "1" ? "/w gm " : "";
	setAttrs({"w-gm" : s});
});

// Roll Modifier
on("change:ask-mod", function(e) {
	let s = e.newValue == "1" ? "?{" + getTranslationByKey("ui_modifier") + "|0}" : "0";
	setAttrs({"r-mod" : s});
});

// =============================================================================
// -----------------------------------------------------------------------------
// # Settings
// -----------------------------------------------------------------------------
// =============================================================================

// Show Name
on("change:show-name", function(e) {
	let v = e.newValue == "1" ? "@{char-name}" : "";
	setAttrs({"roll-name": v}, {"silent": true});
});

// Use d23
on("change:use-d23", function(e) {
	let u = {};
	if (e.newValue == "1") {
		u["roll-die"] = "23";
		u["roll-cf-ope"] = ">";
		u["roll-cf-val"] = "22";
		u["roll-nil"] = "22";
	} else {
		u["roll-die"] = "20";
		u["roll-cf-ope"] = "<";
		u["roll-cf-val"] = "1";
		u["roll-nil"] = "100";
	}
	setAttrs(u);
});

// Rest
const rest = function() {
	console.info("-- Rest character (8 hours) --"); // DEBUG
	let a = ["str-dmg", "dex-dmg", "con-dmg", "int-dmg", "wis-dmg", "cha-dmg"], i;
	let b = ["cls1-lvl", "cls2-lvl", "cls3-lvl", "cls4-lvl", "race-lvl"];
	let c = ["con", "hp-roll1", "hp-roll2", "hp-roll3", "hp-roll4", "hp-feat", "hp-item"];
	let d = ["con-base", "con-dmg", "con-race", "con-item", "con-misc", "con-temp", "brb-rage", "char-aging"];
	getAttrs([...a, ...b, ...c, ...d, "hp", "nld"], v => {
		let u = {};
		let hp = toInt(v["hp"]);
		let nld = toInt(v["nld"]);
		let lvl = getCharacterLevel(v);
		let mod = getConstitutionModifier(v, lvl);
		let hpm = getHitPointsMax(v, mod);
		for(i = 0; i < a.length; i++) u[a[i]] = Math.min(toInt(v[a[i]]) + 1, 0);
		u["hp"] = Math.min(hp + lvl, hpm);
		u["nld"] = Math.max(nld - (lvl * 8), 0);
		setAttrs(u);
	});
};

on("clicked:rest", rest);

// Clear
const clear = function() {
	console.info("-- Clear temporary values --"); // DEBUG
	let i, a = ["str-temp", "dex-temp", "con-temp", "int-temp", "wis-temp", "cha-temp", "fort-temp", "refl-temp", "will-temp", "hp-temp", "sk-temp"];
	let u = {};
	for (i = 0; i < a.length; i++) u[a[i]] = 0;
	setAttrs(u);
};

on("clicked:clear", clear);

// Recalc
const recalc = function() {
	console.info("-- Recalculate --"); // DEBUG
	Object.keys(skillSynergies).forEach(k => { // Skill synergies
		checkSkillSynergy(k);
	});
};

on("clicked:recalc", recalc);

// =============================================================================
// -----------------------------------------------------------------------------
// # Translations
// -----------------------------------------------------------------------------
// =============================================================================

on("sheet:opened", function() {
	let u = {};
	u["sk-craftalchemy-name"] = getTranslationByKey("sk_craftalchemy");
	setAttrs(u);
});

// =============================================================================
// -----------------------------------------------------------------------------
// # Constants
// -----------------------------------------------------------------------------
// =============================================================================

// Languages
const languages = ["abyssal", "aquan", "auran", "celestial", "common", "draconic", "druidic", "dwarven", "elven", "giant", "gnome", "goblin", "gnoll", "halfling", "ignan", "infernal", "orc", "sylvan", "terran", "undercommon"];

// Classes
const classes = {
	"barbarian" : {"hd" : "d12", "fort" : true, "sk" : 4, "bab" : 1, "sk-cls" : ["climb", "handleanimal", "intimidate", "jump", "listen", "ride", "survival", "swim"]},
	"bard" : {"cast" : true, "hd" : "d6", "refl" : true, "will" : true, "sk" : 6, "bab" : 0.75, "sk-cls" : ["appraise", "balance", "bluff", "climb", "concentration", "decipher", "diplomacy", "disabledevice", "disguise", "escapeartist", "gatherinformation", "hide", "jump", "knowledgeall", "speaklanguage", "listen", "movesilently", "perform", "sensemotive", "sleightofhand", "spellcraft", "swim", "tumble", "usemagicdevice"]},
	"cleric" : {"cast" : true, "hd" : "d8", "fort" : true, "will" : true, "sk" : 2, "bab" : 0.75, "sk-cls" : ["concentration", "heal", "knowledgearcana", "knowledgehistory", "knowledgeplanes", "knowledgereligion", "spellcraft"]},
	"druid" : {"cast" : true, "hd" : "d8", "fort" : true, "will" : true, "sk" : 4, "bab" : 0.75, "sk-cls" : ["concentration", "diplomacy", "handleanimal", "heal", "knowledgenature", "listen", "ride", "spellcraft", "spot", "survival", "swim"]},
	"fighter" : {"hd" : "d10", "fort" : true, "sk" : 2, "bab" : 1, "sk-cls" : ["climb", "handleanimal", "intimidate", "jump", "ride", "swim"]},
	"monk" : {"hd" : "d8", "fort" : true, "refl" : true, "will" : true, "sk" : 4, "bab" : 0.75, "sk-cls" : ["balance", "climb", "concentration", "diplomacy", "escapeartist", "hide", "jump", "knowledgearcana", "knowledgereligion", "listen", "movesilently", "perform", "sensemotive", "spot", "swim", "tumble"]},
	"paladin" : {"cast" : true, "hd" : "d10", "fort" : true, "sk" : 2, "bab" : 1, "sk-cls" : ["concentration", "diplomacy", "handleanimal", "heal", "knowledgenobility", "knowledgereligion", "ride", "sensemotive"]},
	"ranger" : {"cast" : true, "hd" : "d8", "fort" : true, "refl" : true, "sk" : 6, "bab" : 1, "sk-cls" : ["climb", "concentration", "handleanimal", "heal", "hide", "jump", "knowledgedungeon", "knowledgegeography", "knowledgenature", "listen", "movesilently", "search", "spot", "survival", "swim", "userope"]},
	"rogue" : {"hd" : "d6", "refl" : true, "sk" : 8, "bab" : 0.75, "sk-cls" : ["appraise", "balance", "bluff", "climb", "decipher", "diplomacy", "disabledevice", "disguise", "escapeartist", "forgery", "gatherinformation", "hide", "intimidate", "jump", "knowledgelocal", "listen", "movesilently", "openlock", "perform", "search", "sensemotive", "sleightofhand", "spot", "swim", "tumble", "usemagicdevice", "userope"]},
	"sorcerer" : {"cast" : true, "hd" : "d4", "will" : true, "sk" : 2, "bab" : 0.5, "sk-cls" : ["bluff", "concentration", "knowledgearcana", "spellcraft"]},
	"warlock" : {"cast" : true, "hd" : "d6", "will" : true, "sk" : 2, "bab" : 0.75, "sk-cls" : ["bluff", "concentration", "disguise", "intimidate", "jump", "knowledgearcana", "knowledgeplanes", "knowledgereligion", "sensemotive", "spellcraft", "usemagicdevice"]},
	"wizard" : {"cast" : true, "hd" : "d4", "will" : true, "sk" : 2, "bab" : 0.5, "sk-cls" : ["concentration", "decipher", "knowledgeall", "spellcraft"]},
	"adept" : {"cast" : true, "hd" : "d6", "will" : true, "sk" : 2, "bab" : 0.75, "sk-cls" : ["concentration", "handleanimal", "heal", "knowledgeall", "spellcraft", "survival"]},
	"aristocrat" : {"hd" : "d8", "will" : true, "sk" : 4, "bab" : 0.75, "sk-cls" : ["appraise", "bluff", "diplomacy", "disguise", "forgery", "gatherinformation", "handleanimal", "intimidate", "knowledgeall", "speaklanguage", "listen", "perform", "ride", "sensemotive", "spot", "survival", "swim"]},
	"commoner" : {"hd" : "d4", "sk" : 2, "bab" : 0.75, "sk-cls" : ["climb", "handleanimal", "jump", "listen", "ride", "spot", "swim", "userope"]},
	"expert" : {"hd" : "d6", "will" : true, "sk" : 6, "bab" : 0.75, "sk-cls" : []},
	"warrior" : {"hd" : "d8", "fort" : true, "sk" : 2, "bab" : 1, "sk-cls" : ["climb", "handleanimal", "intimidate", "jump", "ride", "swim", "tumble"]}
};

// Movement
const movement = ["30ft", "20ft"];

// Skills
const skills = ["athletism", "appraise", "balance", "bluff", "climb", "concentration", "craftalchemy", "craft", "decipher", "diplomacy", "disabledevice", "disguise", "escapeartist", "forgery", "gatherinformation", "handleanimal", "heal", "hide", "intimidate", "jump", "knowledgearcana", "knowledgearchitecture", "knowledgedungeon", "knowledgegeography", "knowledgehistory", "knowledgelocal", "knowledgenature", "knowledgenobility", "knowledgereligion", "knowledgeplanes", "listen", "movesilently", "openlock", "perform", "profession", "ride", "search", "sensemotive", "sleightofhand", "speaklanguage", "spellcraft", "spot", "survival", "swim", "tumble", "usemagicdevice", "userope", "other"];

// Weapons
const weaponCategory = ["simple", "martial", "exotic"];
const weaponType = ["unarmed", "light", "one-handed", "two-handed", "ranged"];
const weaponProps = ["nld", "reach", "double"];
const weapons = {

	// Simple Unarmed
	"gauntlet" : {
		"cat" : 1,
		"type" : 0,
		"dmg-type" : "b",
		"dmg-die" : "d3",
		"wgt" : 1,
		"cost" : 2
	},
	"unarmed-strike" : {
		"cat" : 1,
		"type" : 0,
		"dmg-type" : "b",
		"dmg-die" : "d3"
	},

	// Simple Light
	"dagger" : {
		"cat" : 1,
		"type" : 1,
		"range" : 10,
		"crit-min" : 19,
		"dmg-type" : "ps",
		"dmg-die" : "d4",
		"wgt" : 1,
		"cost" : 2
	},
	"dagger-punching" : {
		"cat" : 1,
		"type" : 1,
		"crit-mult" : 3,
		"dmg-type" : "p",
		"dmg-die" : "d4",
		"wgt" : 1,
		"cost" : 2
	},
	"gauntlet-spiked" : {
		"cat" : 1,
		"type" : 1,
		"dmg-type" : "p",
		"dmg-die" : "d4",
		"wgt" : 1,
		"cost" : 5
	},
	"mace-light" : {
		"cat" : 1,
		"type" : 1,
		"dmg-type" : "b",
		"dmg-die" : "d6",
		"wgt" : 4,
		"cost" : 5
	},
	"sickle" : {
		"cat" : 1,
		"type" : 1,
		"dmg-type" : "s",
		"dmg-die" : "d6",
		"wgt" : 2,
		"cost" : 6
	},

	// Simple One-handed
	"club" : {
		"cat" : 1,
		"type" : 2,
		"range" : 10,
		"dmg-type" : "b",
		"dmg-die" : "d6",
		"wgt" : 3
	},
	"mace-heavy" : {
		"cat" : 1,
		"type" : 2,
		"dmg-type" : "b",
		"dmg-die" : "d8",
		"wgt" : 8,
		"cost" : 12
	},
	"morningstar" : {
		"cat" : 1,
		"type" : 2,
		"dmg-type" : "bp",
		"dmg-die" : "d8",
		"wgt" : 6,
		"cost" : 8
	},
	"shortspear" : {
		"cat" : 1,
		"type" : 2,
		"range" : 20,
		"dmg-type" : "p",
		"dmg-die" : "d6",
		"wgt" : 3,
		"cost" : 1
	},

	// Simple Two-handed
	"longspear" : {
		"cat" : 1,
		"type" : 3,
		"crit-mult" : 3,
		"dmg-type" : "p",
		"dmg-die" : "d8",
		"wgt" : 9,
		"cost" : 5,
		"props" : 1
	},
	"quarterstaff" : {
		"cat" : 1,
		"type" : 3,
		"crit-mult" : 2,
		"dmg-type" : "b",
		"dmg-die" : "d6",
		"wgt" : 4,
		"props" : 2
	},
	"spear" : {
		"cat" : 1,
		"type" : 3,
		"range" : 20,
		"crit-mult" : 3,
		"dmg-type" : "p",
		"dmg-die" : "d6",
		"wgt" : 6,
		"cost" : 2
	},

	// Simple Ranged
	"crossbow-heavy" : {
		"cat" : 1,
		"type" : 4,
		"hand" : 2,
		"range" : 120,
		"crit-min" : 19,
		"dmg-type" : "p",
		"dmg-die" : "d10",
		"ammo" : 10,
		"wgt" : 8,
		"cost" : 50
	},
	"crossbow-light" : {
		"cat" : 1,
		"type" : 4,
		"hand" : 2,
		"range" : 80,
		"crit-min" : 19,
		"dmg-type" : "p",
		"dmg-die" : "d8",
		"ammo" : 10,
		"wgt" : 4,
		"cost" : 35
	},
	"dart" : {
		"cat" : 1,
		"type" : 4,
		"range" : 20,
		"dmg-type" : "p",
		"dmg-die" : "d4",
		"str" : true,
		"wgt" : 0.5,
		"cost" : 0.5
	},
	"javelin" : {
		"cat" : 1,
		"type" : 4,
		"range" : 30,
		"dmg-type" : "p",
		"dmg-die" : "d6",
		"str" : true,
		"wgt" : 2,
		"cost" : 1
	},
	"sling" : {
		"cat" : 1,
		"type" : 4,
		"hand" : 2,
		"range" : 50,
		"dmg-type" : "b",
		"dmg-die" : "d4",
		"ammo" : 10,
		"str" : true,
		"wgt" : 0
	},

	// Martial Light
	"axe-throwing" : {
		"cat" : 2,
		"type" : 1,
		"range" : 10,
		"dmg-type" : "s",
		"dmg-die" : "d6",
		"wgt" : 0,
		"cost" : 8
	},
	"hammer-light" : {
		"cat" : 2,
		"type" : 1,
		"range" : 20,
		"dmg-type" : "b",
		"dmg-die" : "d4",
		"wgt" : 2,
		"cost" : 1
	},
	"handaxe" : {
		"cat" : 2,
		"type" : 1,
		"dmg-type" : "s",
		"dmg-die" : "d6",
		"crit-mult" : 3,
		"wgt" : 2,
		"cost" : 6
	},
	"kukri" : {
		"cat" : 2,
		"type" : 1,
		"dmg-type" : "s",
		"dmg-die" : "d4",
		"crit-min" : 18,
		"wgt" : 3,
		"cost" : 8
	},
	"pick-light" : {
		"cat" : 2,
		"type" : 1,
		"dmg-type" : "p",
		"dmg-die" : "d4",
		"crit-mult" : 4,
		"wgt" : 2,
		"cost" : 4
	},
	"sap" : {
		"cat" : 2,
		"type" : 1,
		"dmg-type" : "b",
		"dmg-die" : "d6",
		"wgt" : 2,
		"cost" : 1,
		"props" : 0
	},
	"shield-light" : {
		"cat" : 2,
		"type" : 1,
		"dmg-type" : "b",
		"dmg-die" : "d3",
		"wgt" : 0
	},
	"spiked-armor" : {
		"cat" : 2,
		"type" : 1,
		"dmg-type" : "p",
		"dmg-die" : "d6",
		"wgt" : 0
	},
	"spiked-shield-light" : {
		"cat" : 2,
		"type" : 1,
		"dmg-type" : "p",
		"dmg-die" : "d4",
		"wgt" : 0
	},
	"sword-short" : {
		"cat" : 2,
		"type" : 1,
		"dmg-type" : "p",
		"dmg-die" : "d6",
		"crit-min" : 19,
		"wgt" : 2,
		"cost" : 10
	},

	// Martial One-handed
	"battleaxe" : {
		"cat" : 2,
		"type" : 2,
		"crit-mult" : 3,
		"dmg-type" : "s",
		"dmg-die" : "d8",
		"wgt" : 6,
		"cost" : 10
	},
	"flail" : {
		"cat" : 2,
		"type" : 2,
		"dmg-type" : "b",
		"dmg-die" : "d8",
		"wgt" : 5,
		"cost" : 8
	},
	"longsword" : {
		"cat" : 2,
		"type" : 2,
		"crit-min" : 19,
		"dmg-type" : "s",
		"dmg-die" : "d8",
		"wgt" : 4,
		"cost" : 15
	},
	"pick-heavy" : {
		"cat" : 2,
		"type" : 2,
		"crit-mult" : 4,
		"dmg-type" : "p",
		"dmg-die" : "d6",
		"wgt" : 6,
		"cost" : 8
	},
	"rapier" : {
		"cat" : 2,
		"type" : 2,
		"crit-min" : 18,
		"dmg-type" : "p",
		"dmg-die" : "d6",
		"wgt" : 2,
		"cost" : 20
	},
	"scimitar" : {
		"cat" : 2,
		"type" : 2,
		"crit-min" : 18,
		"dmg-type" : "s",
		"dmg-die" : "d6",
		"wgt" : 4,
		"cost" : 15
	},
	"shield-heavy" : {
		"cat" : 2,
		"type" : 2,
		"dmg-type" : "b",
		"dmg-die" : "d4"
	},
	"spiked-shield-heavy" : {
		"cat" : 2,
		"type" : 2,
		"dmg-type" : "p",
		"dmg-die" : "d6"
	},
	"trident" : {
		"cat" : 2,
		"type" : 2,
		"range" : 10,
		"dmg-type" : "p",
		"dmg-die" : "d8",
		"wgt" : 4,
		"cost" : 15
	},
	"warhammer" : {
		"cat" : 2,
		"type" : 2,
		"crit-mult" : 3,
		"dmg-type" : "b",
		"dmg-die" : "d8",
		"wgt" : 5,
		"cost" : 12
	},

	// Martial Two-handed
	"falchion" : {
		"cat" : 2,
		"type" : 3,
		"crit-min" : 18,
		"dmg-type" : "s",
		"dmg-num" : 2,
		"dmg-die" : "d4",
		"wgt" : 8,
		"cost" : 75
	},
	"glaive" : {
		"cat" : 2,
		"type" : 3,
		"crit-mult" : 3,
		"dmg-type" : "s",
		"dmg-die" : "d10",
		"wgt" : 10,
		"cost" : 8,
		"props" : 1
	},
	"greataxe" : {
		"cat" : 2,
		"type" : 3,
		"crit-mult" : 3,
		"dmg-type" : "s",
		"dmg-die" : "d12",
		"wgt" : 12,
		"cost" : 20
	},
	"greatclub" : {
		"cat" : 2,
		"type" : 3,
		"dmg-type" : "b",
		"dmg-die" : "d10",
		"wgt" : 8,
		"cost" : 5
	},
	"flail-heavy" : {
		"cat" : 2,
		"type" : 3,
		"crit-min" : 19,
		"dmg-type" : "b",
		"dmg-die" : "d10",
		"wgt" : 10,
		"cost" : 15
	},
	"greatsword" : {
		"cat" : 2,
		"type" : 3,
		"crit-min" : 19,
		"dmg-type" : "s",
		"dmg-num" : 2,
		"dmg-die" : "d6",
		"wgt" : 8,
		"cost" : 50
	},
	"guisarme" : {
		"cat" : 2,
		"type" : 3,
		"crit-mult" : 3,
		"dmg-type" : "s",
		"dmg-num" : 2,
		"dmg-die" : "d4",
		"wgt" : 12,
		"cost" : 9,
		"props" : 1
	},
	"halberd" : {
		"cat" : 2,
		"type" : 3,
		"crit-mult" : 3,
		"dmg-type" : "ps",
		"dmg-die" : "d10",
		"wgt" : 12,
		"cost" : 10
	},
	"lance" : {
		"cat" : 2,
		"type" : 3,
		"crit-mult" : 3,
		"dmg-type" : "p",
		"dmg-die" : "d8",
		"wgt" : 10,
		"cost" : 10,
		"props" : 1
	},
	"ranseur" : {
		"cat" : 2,
		"type" : 3,
		"crit-mult" : 3,
		"dmg-type" : "p",
		"dmg-num" : 2,
		"dmg-die" : "d4",
		"wgt" : 12,
		"cost" : 10,
		"props" : 1
	},
	"scythe" : {
		"cat" : 2,
		"type" : 3,
		"crit-mult" : 4,
		"dmg-type" : "ps",
		"dmg-num" : 2,
		"dmg-die" : "d4",
		"wgt" : 10,
		"cost" : 18
	},

	// Martial Ranged
	"longbow" : {
		"cat" : 2,
		"type" : 4,
		"hand" : 2,
		"range" : 100,
		"crit-mult" : 3,
		"dmg-type" : "p",
		"dmg-die" : "d8",
		"ammo" : 20,
		"wgt" : 3,
		"cost" : 75
	},
	"longbow-composite" : {
		"cat" : 2,
		"type" : 4,
		"hand" : 2,
		"range" : 110,
		"crit-mult" : 3,
		"dmg-type" : "p",
		"dmg-die" : "d8",
		"str" : true,
		"ammo" : 20,
		"wgt" : 3,
		"cost" : 100
	},
	"shortbow" : {
		"cat" : 2,
		"type" : 4,
		"hand" : 2,
		"range" : 60,
		"crit-mult" : 3,
		"dmg-type" : "p",
		"dmg-die" : "d6",
		"ammo" : 20,
		"wgt" : 2,
		"cost" : 30
	},
	"shortbow-composite" : {
		"cat" : 2,
		"type" : 4,
		"hand" : 2,
		"range" : 70,
		"crit-mult" : 3,
		"dmg-type" : "p",
		"dmg-die" : "d6",
		"str" : true,
		"ammo" : 20,
		"wgt" : 2,
		"cost" : 75
	},

	// Exotic Light
	"kama" : {
		"cat" : 3,
		"type" : 1,
		"dmg-type" : "s",
		"dmg-die" : "d6",
		"wgt" : 2,
		"cost" : 2
	},
	"nunchaku" : {
		"cat" : 3,
		"type" : 1,
		"dmg-type" : "b",
		"dmg-die" : "d6",
		"wgt" : 2,
		"cost" : 2
	},
	"sai" : {
		"cat" : 3,
		"type" : 1,
		"range" : 10,
		"dmg-type" : "b",
		"dmg-die" : "d4",
		"wgt" : 1,
		"cost" : 1
	},
	"siangham" : {
		"cat" : 3,
		"type" : 1,
		"dmg-type" : "p",
		"dmg-die" : "d6",
		"wgt" : 1,
		"cost" : 3
	},

	// Exotic One-handed
	"sword-bastard" : {
		"cat" : 3,
		"type" : 2,
		"crit-min" : 19,
		"dmg-type" : "s",
		"dmg-die" : "d10",
		"wgt" : 6,
		"cost" : 35
	},
	"waraxe-dwarven" : {
		"cat" : 3,
		"type" : 2,
		"crit-mult" : 3,
		"dmg-type" : "s",
		"dmg-die" : "d10",
		"wgt" : 8,
		"cost" : 30
	},
	"whip" : {
		"cat" : 3,
		"type" : 2,
		"dmg-type" : "s",
		"dmg-die" : "d3",
		"wgt" : 2,
		"cost" : 1,
		"props" : 1
	},

	// Exotic Two-handed
	"axe-orc-double" : {
		"cat" : 3,
		"type" : 3,
		"crit-mult" : 3,
		"dmg-type" : "s",
		"dmg-die" : "d8",
		"wgt" : 15,
		"cost" : 60,
		"props" : 2
	},
	"chain-spiked" : {
		"cat" : 3,
		"type" : 3,
		"dmg-type" : "p",
		"dmg-die" : "d4",
		"wgt" : 10,
		"cost" : 25,
		"props" : 1
	},
	"flail-dire" : {
		"cat" : 3,
		"type" : 3,
		"dmg-type" : "b",
		"dmg-die" : "d8",
		"wgt" : 10,
		"cost" : 90
	},
	"hammer-gnome-hooked" : {
		"cat" : 3,
		"type" : 3,
		"crit-mult" : 3,
		"dmg-type" : "bp",
		"dmg-die" : "d8",
		"wgt" : 6,
		"cost" : 20,
		"props" : 2
	},
	"sword-two-bladed" : {
		"cat" : 3,
		"type" : 3,
		"crit-min" : 19,
		"dmg-type" : "s",
		"dmg-die" : "d8",
		"wgt" : 10,
		"cost" : 100,
		"props" : 2
	},
	"urgrosh-dwarven" : {
		"cat" : 3,
		"type" : 3,
		"crit-mult" : 3,
		"dmg-type" : "s-p",
		"dmg-die" : "d8",
		"wgt" : 12,
		"cost" : 50
	},

	// Exotic Ranged
	"bolas" : {
		"cat" : 3,
		"type" : 4,
		"range" : 10,
		"dmg-type" : "b",
		"dmg-die" : "d4",
		"str" : true,
		"wgt" : 2,
		"cost" : 5
	},
	"crossbow-hand" : {
		"cat" : 3,
		"type" : 4,
		"range" : 30,
		"crit-min" : 19,
		"dmg-type" : "p",
		"dmg-die" : "d4",
		"ammo" : 10,
		"wgt" : 2,
		"cost" : 100
	},
	"crossbow-repeating-heavy" : {
		"cat" : 3,
		"type" : 4,
		"hand" : 2,
		"range" : 120,
		"crit-min" : 19,
		"dmg-type" : "p",
		"dmg-die" : "d10",
		"ammo" : 5,
		"wgt" : 12,
		"cost" : 400
	},
	"crossbow-repeating-light" : {
		"cat" : 3,
		"type" : 4,
		"hand" : 2,
		"range" : 80,
		"crit-min" : 19,
		"dmg-type" : "p",
		"dmg-die" : "d8",
		"ammo" : 5,
		"wgt" : 6,
		"cost" : 250
	},
	"net" : {
		"cat" : 3,
		"type" : 4,
		"hand" : 2,
		"range" : 10,
		"dmg-num" : "0",
		"dmg-die" : "0",
		"wgt" : 6,
		"cost" : 20
	},
	"shuriken" : {
		"cat" : 3,
		"type" : 4,
		"range" : 10,
		"dmg-type" : "p",
		"dmg-die" : "d2",
		"str" : true,
		"wgt" : 0.5,
		"cost" : 1
	},

	// Template
	"name" : {
		"cat" : 1,
		"type" : 1,
		"hand" : 1,
		"range" : 0,
		"crit-min" : 20,
		"crit-mult" : 2,
		"dmg-type" : "",
		"dmg-num" : 1,
		"dmg-die" : "d3",
		"str" : true,
		"ammo" : 0,
		"wgt" : 0,
		"cost" : 0,
		"props" : ""
	}

};

// Armors
const armorCategory = {
	"nil" : {"spd" : 1, "run" : 4},
	"lgt" : {"spd" : 1, "run" : 4},
	"med" : {"spd" : 0.75, "run" : 4},
	"hvy" : {"spd" : 0.75, "run" : 3},
};
const armorType = ["nil", "lgt", "med", "hvy"];
const armors = {

	"none" : {
		"type" : 0,
		"bon" : 0,
		"pen" : 0,
		"spl" : 0,
		"dex" : 0,
		"wgt" : 0,
		"cost" : 0
	},

	// Light
	"padded" : {
		"type" : 1,
		"bon" : 1,
		"pen" : 0,
		"spl" : 5,
		"dex" : 8,
		"wgt" : 10,
		"cost" : 5
	},
	"leather" : {
		"type" : 1,
		"bon" : 2,
		"pen" : 0,
		"spl" : 10,
		"dex" : 6,
		"wgt" : 15,
		"cost" : 10
	},
	"studded-leather" : {
		"type" : 1,
		"bon" : 3,
		"pen" : 1,
		"spl" : 15,
		"dex" : 5,
		"wgt" : 20,
		"cost" : 25
	},
	"chain-shirt" : {
		"type" : 1,
		"bon" : 4,
		"pen" : 2,
		"spl" : 20,
		"dex" : 4,
		"wgt" : 25,
		"cost" : 100
	},

	// Medium
	"hide" : {
		"type" : 2,
		"bon" : 3,
		"pen" : 3,
		"spl" : 20,
		"dex" : 4,
		"wgt" : 25,
		"cost" : 15
	},
	"scale-mail" : {
		"type" : 2,
		"bon" : 4,
		"pen" : 4,
		"spl" : 25,
		"dex" : 3,
		"wgt" : 30,
		"cost" : 50
	},
	"chainmail" : {
		"type" : 2,
		"bon" : 5,
		"pen" : 5,
		"spl" : 30,
		"dex" : 2,
		"wgt" : 40,
		"cost" : 150
	},
	"breastplate" : {
		"type" : 2,
		"bon" : 5,
		"pen" : 4,
		"spl" : 25,
		"dex" : 3,
		"wgt" : 30,
		"cost" : 200
	},

	// Heavy
	"splint-mail" : {
		"type" : 3,
		"bon" : 6,
		"pen" : 7,
		"spl" : 40,
		"dex" : 0,
		"wgt" : 45,
		"cost" : 200
	},
	"banded-mail" : {
		"type" : 3,
		"bon" : 6,
		"pen" : 6,
		"spl" : 35,
		"dex" : 1,
		"wgt" : 35,
		"cost" : 250
	},
	"half-plate" : {
		"type" : 3,
		"bon" : 7,
		"pen" : 7,
		"spl" : 40,
		"dex" : 0,
		"wgt" : 50,
		"cost" : 600
	},
	"full-plate" : {
		"type" : 3,
		"bon" : 8,
		"pen" : 6,
		"spl" : 35,
		"dex" : 1,
		"wgt" : 50,
		"cost" : 1500
	}
};

const shields = {
	"none" : {
		"bon" : 0,
		"pen" : 0,
		"spl" : 0,
		"wgt" : 0,
		"cost" : 0
	},
	"buckler" : {
		"bon" : 1,
		"pen" : 1,
		"spl" : 5,
		"wgt" : 5,
		"cost" : 15
	},
	"shield-light-wooden" : {
		"bon" : 1,
		"pen" : 1,
		"spl" : 5,
		"wgt" : 5,
		"cost" : 3
	},
	"shield-light-steel" : {
		"bon" : 1,
		"pen" : 1,
		"spl" : 5,
		"wgt" : 6,
		"cost" : 9
	},
	"shield-heavy-wooden" : {
		"bon" : 2,
		"pen" : 2,
		"spl" : 15,
		"wgt" : 10,
		"cost" : 7
	},
	"shield-heavy-steel" : {
		"bon" : 2,
		"pen" : 2,
		"spl" : 15,
		"wgt" : 15,
		"cost" : 20
	},
	"shield-tower" : {
		"bon" : 4,
		"pen" : 10,
		"spl" : 50,
		"wgt" : 45,
		"cost" : 30
	}
};

// Modifiers
const conditions = {
	"none" : {"melee-atk" : 0, "range-atk" : 0, "melee-dmg" : 0, "range-dmg" : 0, "ac" : 0},
	"ability-damaged" : {},
	"ability-drained" : {},
	"blinded" : {"ac" : -2},
	"blown-away" : {},
	"checked" : {},
	"confused" : {},
	"cowering" : {"ac" : -2},
	"dazed" : {},
	"dazzled" : {"melee-atk" : -1, "range-atk" : -1},
	"dead" : {},
	"deafened" : {},
	"disabled" : {},
	"dying" : {},
	"energy-drained" : {},
	"entangled" : {"melee-atk" : -2, "range-atk" : -2},
	"exhausted" : {},
	"fascinated" : {},
	"fatigued" : {},
	"flat-footed" : {},
	"frightened" : {"ac" : -2},
	"grappling" : {"melee-atk" : -4},
	"helpless" : {},
	"incorporeal" : {},
	"invisible" : {"melee-atk" : 2},
	"knocked_down" : {},
	"nauseated" : {},
	"panicked" : {},
	"paralyzed" : {},
	"petrified" : {},
	"pinned" : {},
	"prone" : {"melee-atk" : -4, "ac" : -4},
	"shaken" : {"melee-atk" : -2, "range-atk" : -2},
	"sickened" : {"melee-atk" : -2, "range-atk" : -2},
	"stable" : {},
	"staggered" : {},
	"stunned" : {"ac" : -2},
	"turned" : {},
	"unconscious" : {}
};

// =============================================================================
// -----------------------------------------------------------------------------
// # TheAaronSheet
// -----------------------------------------------------------------------------
// =============================================================================

/**
	Github: https://github.com/shdwjk/TheAaronSheet/blob/master/TheAaronSheet.js
	By: The Aaron, Arcane Scriptomancer
	Contact: https://app.roll20.net/users/104025/the-aaron
*/

var TAS = TAS || (function () {
	"use strict";

	var version = "0.2.5",

	queuedUpdates = {},

	prepareUpdate = function (attribute, value) {
		queuedUpdates[attribute] = value;
	},

	applyQueuedUpdates = function (silent) {
		setAttrs(queuedUpdates, {
			silent: silent
		});
		queuedUpdates = {};
	},

	namesFromArgs = function (args, base) {
		return _.chain(args)
		.reduce(function (memo, attr) {
			if ("string" === typeof attr) {
				memo.push(attr);
			} else if (_.isArray(args) || _.isArguments(args)) {
				memo = namesFromArgs(attr, memo);
			}
			return memo;
		}, (_.isArray(base) && base) || [])
		.uniq()
		.value();
	},

	addId = function (obj, value) {
		Object.defineProperty(obj, "id", {
			value: value,
			writable: false,
			enumerable: false
		});
	},

	addProp = function (obj, prop, value, fullname) {
		(function () {
			var pname = (_.contains(["S", "F", "I", "D"], prop) ? "_" + prop : prop),
			full_pname = fullname || prop,
			pvalue = value;

			_.each(["S", "I", "F"], function (p) {
				if (!_.has(obj, p)) {
					Object.defineProperty(obj, p, {
						value: {},
						enumerable: false,
						readonly: true
					});
				}
			});
			if (!_.has(obj, "D")) {
				Object.defineProperty(obj, "D", {
					value: _.reduce(_.range(10), function (m, d) {
						Object.defineProperty(m, d, {
							value: {},
							enumerable: true,
							readonly: true
						});
						return m;
					}, {}),
					enumerable: false,
					readonly: true
				});
			}

			// Raw value
			Object.defineProperty(obj, pname, {
				enumerable: true,
				set: function (v) {
					if (v !== pvalue) {
						pvalue = v;
						prepareUpdate(full_pname, v);
					}
				},
				get: function () {
					return pvalue;
				}
			});

			// string value
			Object.defineProperty(obj.S, pname, {
				enumerable: true,
				set: function (v) {
					var val = v.toString();
					if (val !== pvalue) {
						pvalue = val;
						prepareUpdate(full_pname, val);
					}
				},
				get: function () {
					return pvalue.toString();
				}
			});

			// int value
			Object.defineProperty(obj.I, pname, {
				enumerable: true,
				set: function (v) {
					var val = parseInt(v, 10) || 0;
					if (val !== pvalue) {
						pvalue = val;
						prepareUpdate(full_pname, val);
					}
				},
				get: function () {
					return parseInt(pvalue, 10) || 0;
				}
			});

			// float value
			Object.defineProperty(obj.F, pname, {
				enumerable: true,
				set: function (v) {
					var val = parseFloat(v) || 0;
					if (val !== pvalue) {
						pvalue = val;
						prepareUpdate(full_pname, val);
					}
				},
				get: function () {
					return parseFloat(pvalue) || 0;
				}
			});
			_.each(_.range(10), function (d) {
				Object.defineProperty(obj.D[d], pname, {
					enumerable: true,
					set: function (v) {
						var val = (parseFloat(v) || 0).toFixed(d);
						if (val !== pvalue) {
							pvalue = val;
							prepareUpdate(full_pname, val);
						}
					},
					get: function () {
						return (parseFloat(pvalue) || 0).toFixed(d);
					}
				});
			});

		}
			());
	},

	repeating = function (section, silent) {
		return (function (s) {
			var sectionName = s,
			attrNames = [],
			fieldNames = [],
			operations = [],
			after = [],

			repAttrs = function TAS_Repeating_Attrs() {
				attrNames = namesFromArgs(arguments, attrNames);
				return this;
			},
			repFields = function TAS_Repeating_Fields() {
				fieldNames = namesFromArgs(arguments, fieldNames);
				return this;
			},
			repReduce = function TAS_Repeating_Reduce(func, initial, final, context) {
				operations.push({
					type: "reduce",
					func: (func && _.isFunction(func) && func) || _.noop,
					memo: (_.isUndefined(initial) && 0) || initial,
					final: (final && _.isFunction(final) && final) || _.noop,
					context: context || {}
				});
				return this;
			},
			repMap = function TAS_Repeating_Map(func, final, context) {
				operations.push({
					type: "map",
					func: (func && _.isFunction(func) && func) || _.noop,
					final: (final && _.isFunction(final) && final) || _.noop,
					context: context || {}
				});
				return this;
			},
			repEach = function TAS_Repeating_Each(func, final, context) {
				operations.push({
					type: "each",
					func: (func && _.isFunction(func) && func) || _.noop,
					final: (final && _.isFunction(final) && final) || _.noop,
					context: context || {}
				});
				return this;
			},
			repTap = function TAS_Repeating_Tap(final, context) {
				operations.push({
					type: "tap",
					final: (final && _.isFunction(final) && final) || _.noop,
					context: context || {}
				});
				return this;
			},
			repAfter = function TAS_Repeating_After(callback, context) {
				after.push({
					callback: (callback && _.isFunction(callback) && callback) || _.noop,
					context: context || {}
				});
				return this;
			},
			repExecute = function TAS_Repeating_Execute(callback, context) {
				var rowSet = {},
				attrSet = {},
				fieldIds = [],
				fullFieldNames = [];

				repAfter(callback, context);

				// call each operation per row.
				// call each operation"s final
				getSectionIDs("repeating_" + sectionName, function (ids) {
					fieldIds = ids;
					fullFieldNames = _.reduce(fieldIds, function (memo, id) {
						return memo.concat(_.map(fieldNames, function (name) {
								return "repeating_" + sectionName + "_" + id + "_" + name;
							}));
					}, []);
					getAttrs(_.uniq(attrNames.concat(fullFieldNames)), function (values) {
						_.each(attrNames, function (aname) {
							if (values.hasOwnProperty(aname)) {
								addProp(attrSet, aname, values[aname]);
							}
						});

						rowSet = _.reduce(fieldIds, function (memo, id) {
							var r = {};
							addId(r, id);
							_.each(fieldNames, function (name) {
								var fn = "repeating_" + sectionName + "_" + id + "_" + name;
								addProp(r, name, values[fn], fn);
							});

							memo[id] = r;

							return memo;
						}, {});

						_.each(operations, function (op) {
							var res;
							switch (op.type) {
							case "tap":
								_.bind(op.final, op.context, rowSet, attrSet)();
								break;

							case "each":
								_.each(rowSet, function (r) {
									_.bind(op.func, op.context, r, attrSet, r.id, rowSet)();
								});
								_.bind(op.final, op.context, rowSet, attrSet)();
								break;

							case "map":
								res = _.map(rowSet, function (r) {
									return _.bind(op.func, op.context, r, attrSet, r.id, rowSet)();
								});
								_.bind(op.final, op.context, res, rowSet, attrSet)();
								break;

							case "reduce":
								res = op.memo;
								_.each(rowSet, function (r) {
									res = _.bind(op.func, op.context, res, r, attrSet, r.id, rowSet)();
								});
								_.bind(op.final, op.context, res, rowSet, attrSet)();
								break;
							}
						});

						// finalize attrs
						applyQueuedUpdates(silent);
						_.each(after, function (op) {
							_.bind(op.callback, op.context)();
						});
					});
				});
			};

			return {
				attrs: repAttrs,
				attr: repAttrs,

				column: repFields,
				columns: repFields,
				field: repFields,
				fields: repFields,

				reduce: repReduce,
				inject: repReduce,
				foldl: repReduce,

				map: repMap,
				collect: repMap,

				each: repEach,
				forEach: repEach,

				tap: repTap,
				"do": repTap,

				after: repAfter,
				last: repAfter,
				done: repAfter,

				execute: repExecute,
				go: repExecute,
				run: repExecute
			};
		}
		(section));
	},

	repeatingSimpleSum = function (section, field, destination) {
		repeating(section)
		.attr(destination)
		.field(field)
		.reduce(function (m, r) {
			return m + (r.F[field]);
		}, 0, function (t, r, a) {
			a.S[destination] = t;
		})
		.execute();
	};

	return {
		repeatingSimpleSum: repeatingSimpleSum,
		repeating: repeating,
	};
}
());

</script>
