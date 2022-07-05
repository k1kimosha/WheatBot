//Init block

const { Client, Intents } = require("discord.js");
const { createPool } = require("mysql2");
const config = require("./config.json");

var lang = {
    "en": require("./localization/en.json"),
    "ru": require("./localization/ru.json"),
    "ua": require("./localization/ua.json")
};

const bot = new Client({
    intents: [
        Intents.FLAGS.DIRECT_MESSAGES,
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_MEMBERS,
        Intents.FLAGS.GUILD_MESSAGES,
        Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
        Intents.FLAGS.GUILD_VOICE_STATES
    ]
});

const pool = createPool({
    host: config.mysql.host,
    port: config.mysql.port,
    user: config.mysql.user,
    password: config.mysql.password,
    database: config.mysql.database
}).promise();

bot.login(config.token);

bot.on('guildMemberAdd', member => {
    console.log(`${member.user.tag} join`);
    pool.query("SELECT * FROM `config` WHERE type = ?", [5])
        .then(([res]) => {
            if (res.length != 0) {
                if (member.guild.roles.resolve(res[0].value) != null) {
                    member.guild.roles.fetch(res[0].value)
                        .then(role => {
                            member.roles.add(role).catch();
                        });
                }
            }
        });
    pool.query("SELECT * FROM `config` WHERE type = ?", [4])
        .then(([res]) => {
            if (res.length != 0) {
                if (member.guild.channels.resolve(res[0].value) != null) {
                    member.guild.channels.fetch(res[0].value)
                        .then(channel => {
                            console.log("member count update");
                            channel.setName(lang[config.lang].interact.memberc.channel.replace("${count}", member.guild.memberCount));
                        })
                }
            }
        })
});

bot.on('guildMemberRemove', member => {
    pool.query("SELECT * FROM `config` WHERE type = ?", [4])
        .then(([res]) => {
            if (res.length != 0) {
                if (member.guild.channels.resolve(res[0].value) != null) {
                    member.guild.channels.fetch(res[0].value)
                        .then(channel => {
                            console.log("member count update");
                            channel.setName(lang[config.lang].interact.memberc.channel.replace("${count}", member.guild.memberCount));
                        })
                }
            }
        })
});

function gencode() {
    let ln = "ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890";
    let code = '';
    for (let i = 0; i < 6; i++) {
        let k = Math.floor(Math.random() * 36);
        code += ln[k];
    }
    return code;
}

setInterval(() => {
    pool.query("SELECT * FROM `bans`")
        .then(([res]) => {
            if (res.length != 0) {
                res.forEach(ban => {
                    if (new Date().valueOf() - ban.date > 1000 * 60 * 60 * 24) {
                        bot.guilds.fetch(config.guild).then(guild => {
                            if (guild.members.resolve(ban.uuid) != null) {
                                guild.members.fetch(ban.uuid).then(target => {
                                    target.ban({
                                        reason: ban.reason,
                                        days: 7
                                    });
                                    pool.query("DELETE FROM `bans` WHERE uuid = ?", [ban.uuid]);
                                    console.log(`${target.user.tag} banned`);
                                });
                            }
                        });
                    }
                });
            }
        });
    pool.query("SELECT * FROM `mutes`")
        .then(([res]) => {
            if (res.length != 0) {
                res.forEach(mute => {
                    if (new Date().valueOf() - mute.date > mute.time) pool.query("DELETE FROM `mutes` WHERE uuid = ?", [mute.uuid]);
                });
            }
        });
    pool.query("SELECT * FROM `actions`")
        .then(([res]) => {
            if (res.length != 0) {
                res.forEach(action => {
                    if (new Date().valueOf() - action.date > 1000 * 60 * 15) pool.query("DELETE FROM `actions` WHERE uuid = ? AND type = ? AND date = ?", [action.uuid, action.type, action.date]);
                });
            }
        });
    pool.query("SELECT * FROM `codes`")
        .then(([res]) => {
            if (res.length != 0) {
                res.forEach(code => {
                    pool.query("SELECT * FROM `actions` WHERE uuid = ?", [code.uuid])
                        .then(([res]) => {
                            if (res.length != 0) {
                                var mute = 0, warn = 0, ban = 0;
                                res.forEach(action => {
                                    switch (action.type) {
                                        case 0:
                                            mute++;
                                            break;
                                        case 1:
                                            warn++;
                                            break;
                                        case 2:
                                            ban++;
                                            break;
                                    }
                                });
                                if (mute < 3 && warn < 3 && ban < 3) pool.query("DELETE FROM `codes` WHERE uuid = ?", [code.uuid]);
                            } else {
                                pool.query("DELETE FROM `codes` WHERE uuid = ?", [code.uuid]);
                            }
                        });
                });
            }
        });
}, 10000);

bot.on("ready", () => {
    bot.user.setPresence({ status: "dnd" });
    pool.query("SELECT * FROM `config` WHERE type = ?", [4])
        .then(([res]) => {
            if (res.length != 0) {
                bot.guilds.fetch(config.guild).then(guild => {
                    if (guild.channels.resolve(res[0].value) != null) {
                        guild.channels.fetch(res[0].value)
                            .then(channel => {
                                console.log("member count update");
                                channel.setName(lang[config.lang].interact.memberc.channel.replace("${count}", guild.memberCount));
                            });
                    }
                });
            }
        });
    console.log(`${bot.user.tag} runned!`);
    bot.application.commands.set([
        {
            name: "mute",
            description: lang[config.lang].cmds.mute.cmd,
            type: "CHAT_INPUT",
            defaultPermission: false,
            options: [
                {
                    name: "user",
                    type: "USER",
                    description: lang[config.lang].cmds.mute.user,
                    required: true
                },
                {
                    name: "time",
                    type: "NUMBER",
                    description: lang[config.lang].cmds.mute.time,
                    required: true
                },
                {
                    name: "reason",
                    type: "STRING",
                    description: lang[config.lang].cmds.mute.reason,
                    required: true
                }
            ]
        },
        {
            name: "unmute",
            description: lang[config.lang].cmds.unmute.cmd,
            type: "CHAT_INPUT",
            defaultPermission: false,
            options: [
                {
                    name: "user",
                    type: "USER",
                    description: lang[config.lang].cmds.unmute.user,
                    required: true
                }
            ]
        },
        {
            name: "warn",
            description: lang[config.lang].cmds.warn.cmd,
            type: "CHAT_INPUT",
            defaultPermission: false,
            options: [
                {
                    name: "user",
                    type: "USER",
                    description: lang[config.lang].cmds.warn.user,
                    required: true
                },
                {
                    name: "reason",
                    type: "STRING",
                    description: lang[config.lang].cmds.warn.reason,
                    required: true
                }
            ]
        },
        {
            name: "unwarn",
            description: lang[config.lang].cmds.unwarn.cmd,
            type: "CHAT_INPUT",
            defaultPermission: false,
            options: [
                {
                    name: "user",
                    type: "USER",
                    description: lang[config.lang].cmds.unwarn.user,
                    required: true
                }
            ]
        },
        {
            name: "links",
            description: lang[config.lang].cmds.links.cmd,
            type: "CHAT_INPUT",
            defaultPermission: false,
            options: [
                {
                    name: "add",
                    type: "STRING",
                    description: lang[config.lang].cmds.links.add,
                    required: false
                },
                {
                    name: "remove",
                    type: "STRING",
                    description: lang[config.lang].cmds.links.remove,
                    required: false
                }
            ]
        },
        {
            name: "words",
            description: lang[config.lang].cmds.words.cmd,
            type: "CHAT_INPUT",
            defaultPermission: false,
            options: [
                {
                    name: "add",
                    type: "STRING",
                    description: lang[config.lang].cmds.words.add,
                    required: false
                },
                {
                    name: "remove",
                    type: "STRING",
                    description: lang[config.lang].cmds.words.remove,
                    required: false
                }
            ]
        },
        {
            name: "report",
            description: lang[config.lang].cmds.report.cmd,
            type: "CHAT_INPUT",
            defaultPermission: false,
            options: [
                {
                    name: "init",
                    description: lang[config.lang].cmds.report.init,
                    type: "SUB_COMMAND"
                },
                {
                    name: "manage",
                    description: lang[config.lang].cmds.report.manage,
                    type: "SUB_COMMAND",
                    options: [
                        {
                            name: "category",
                            description: lang[config.lang].cmds.report.category,
                            type: "CHANNEL",
                            required: false,
                            channel_types: [4],
                        },
                        {
                            name: "add_manager",
                            description: lang[config.lang].cmds.report.addManager,
                            type: "ROLE",
                            required: false
                        },
                        {
                            name: "del_manager",
                            description: lang[config.lang].cmds.report.delManager,
                            type: "ROLE",
                            required: false
                        }
                    ]
                },
                {
                    name: "setsu",
                    description: lang[config.lang].cmds.report.setsu,
                    type: "SUB_COMMAND",
                    options: [
                        {
                            name: "role",
                            description: lang[config.lang].cmds.report.role,
                            type: "ROLE",
                            required: true
                        }
                    ]
                }
            ]
        },
        {
            name: "logs",
            description: lang[config.lang].cmds.logs.cmd,
            type: "CHAT_INPUT",
            defaultPermission: false,
            options: [
                {
                    name: "channels",
                    description: lang[config.lang].cmds.logs.channels.cmd,
                    type: "SUB_COMMAND",
                    options: [
                        {
                            name: "admin",
                            description: lang[config.lang].cmds.logs.channels.admin,
                            type: "CHANNEL",
                            required: false,
                            channel_types: [0]
                        },
                        {
                            name: "violation",
                            description: lang[config.lang].cmds.logs.channels.violation,
                            type: "CHANNEL",
                            required: false,
                            channel_types: [0]
                        }
                    ]
                },
                {
                    name: "enabled",
                    description: lang[config.lang].cmds.logs.enabled,
                    type: "SUB_COMMAND"
                }
            ]
        },
        {
            name: "memberc",
            description: lang[config.lang].cmds.memberc.cmd,
            type: "CHAT_INPUT",
            defaultPermission: false,
            options: [
                {
                    name: "channel",
                    description: lang[config.lang].cmds.memberc.channel,
                    type: "CHANNEL",
                    channel_types: [2],
                    required: true
                }
            ]
        },
        {
            name: "grantrole",
            description: lang[config.lang].cmds.grantrole.cmd,
            type: "CHAT_INPUT",
            defaultPermission: false,
            options: [
                {
                    name: "role",
                    description: lang[config.lang].cmds.grantrole.role,
                    type: "ROLE",
                    required: true
                }
            ]
        },
        {
            name: "welcomerole",
            description: lang[config.lang].cmds.welcomerole.cmd,
            type: "CHAT_INPUT",
            defaultPermission: false,
            options: [
                {
                    name: "role",
                    description: lang[config.lang].cmds.welcomerole.role,
                    type: "ROLE",
                    required: true
                }
            ]
        },
        {
            name: "ban",
            description: lang[config.lang].cmds.ban.cmd,
            type: "CHAT_INPUT",
            defaultPermission: false,
            options: [
                {
                    name: "user",
                    description: lang[config.lang].cmds.ban.user,
                    type: "USER",
                    required: true
                },
                {
                    name: "reason",
                    description: lang[config.lang].cmds.ban.reason,
                    type: "STRING",
                    required: true
                }
            ]
        },
        {
            name: "unban",
            description: lang[config.lang].cmds.unban.cmd,
            type: "CHAT_INPUT",
            defaultPermission: false,
            options: [
                {
                    name: "user",
                    description: lang[config.lang].cmds.unban.user,
                    type: "USER",
                    required: true
                }
            ]
        },
        {
            name: "undo",
            description: lang[config.lang].cmds.undo.cmd,
            type: "CHAT_INPUT",
            defaultPermission: false,
            options: [
                {
                    name: "user",
                    description: lang[config.lang].cmds.undo.user,
                    type: "USER",
                    required: true
                }
            ]
        },
        {
            name: "code",
            description: lang[config.lang].cmds.code.cmd,
            type: "CHAT_INPUT",
            defaultPermission: false,
            options: [
                {
                    name: "channel",
                    description: lang[config.lang].cmds.code.channel.cmd,
                    type: "SUB_COMMAND",
                    options: [
                        {
                            name: "channel",
                            description: lang[config.lang].cmds.code.channel.channel,
                            type: "CHANNEL",
                            required: true,
                            channel_types: [0]
                        }
                    ]
                },
                {
                    name: "activate",
                    description: lang[config.lang].cmds.code.activate.cmd,
                    type: "SUB_COMMAND",
                    options: [
                        {
                            name: "code",
                            description: lang[config.lang].cmds.code.activate.code,
                            type: "STRING",
                            required: true
                        }
                    ]
                }
            ]
        }
    ], config.guild)
        .then((cmds) => {
            console.log(`${cmds.size} command loaded!`);
        });
});

//Command block

bot.on('interactionCreate', async interact => {
    if (interact.isCommand()) {
        switch (interact.commandName) {
            case "report": {
                if (interact.options.getSubcommand() == "init") {
                    console.log(`${interact.user.tag} use /report init`);
                    interact.reply({
                        content: lang[config.lang].interact.report.init.text,
                        components: [
                            {
                                type: "ACTION_ROW",
                                components: [
                                    {
                                        type: "BUTTON",
                                        label: lang[config.lang].interact.report.init.button,
                                        style: "SECONDARY",
                                        customId: "reportCreate",
                                        emoji: '💢'
                                    }
                                ],
                            }
                        ]
                    });
                } else if (interact.options.getSubcommand() == "manage") {
                    console.log(`${interact.user.tag} use /report manage`);
                    let channel = interact.options.getChannel("category");
                    let add = interact.options.getRole("add_manager");
                    let del = interact.options.getRole("del_manager");
                    var p1 = 0, p2 = 0, p3 = 0;
                    if (channel != null) {
                        pool.query("SELECT * FROM `config` WHERE type = ?", [0])
                            .then(([res]) => {
                                if (res.length == 0) pool.query("INSERT INTO `config` (type, value) VALUES (?, ?)", [0, channel.id]);
                                else pool.query("UPDATE `config` SET value = ? WHERE type = ?", [channel.id, 0]);
                            });
                        p1 = 1;
                    }
                    if (add != null) {
                        pool.query("SELECT * FROM `managers` WHERE role = ? AND type = ?", [add.id, 0])
                            .then(([res]) => {
                                if (res.length != 0) { }
                                else {
                                    pool.query("INSERT INTO `managers` (role, type) VALUES (?, ?)", [add.id, 0]);
                                }
                            });
                        p2 = 2;
                    }
                    if (del != null) {
                        pool.query("SELECT * FROM `managers` WHERE role = ? AND type = ?", [del.id, 0])
                            .then(([res]) => {
                                if (res.length != 0) {
                                    pool.query("DELETE FROM `managers` WHERE role = ? AND type = ?", [del.id, 0]);
                                }
                            });
                        p3 = 4;
                    }
                    switch (p1 + p2 + p3) {
                        case 0:
                            interact.reply({
                                content: lang[config.lang].interact.report.manage.nothing,
                                ephemeral: true
                            });
                            break;
                        case 1:
                            interact.reply({
                                content: lang[config.lang].interact.report.manage.category.replace("${channel}", channel),
                                ephemeral: true
                            });
                            break;
                        case 2:
                            interact.reply({
                                content: lang[config.lang].interact.report.manage.addManager.replace("${role}", add),
                                ephemeral: true
                            });
                            break;
                        case 3:
                            interact.reply({
                                content: lang[config.lang].interact.report.manage.category.replace("${channel}", channel) + "\n" + lang[config.lang].interact.report.manage.addManager.replace("${role}", add),
                                ephemeral: true
                            });
                            break;
                        case 4:
                            interact.reply({
                                content: lang[config.lang].interact.report.manage.delManager.replace("${role}", del),
                                ephemeral: true
                            });
                            break;
                        case 5:
                            interact.reply({
                                content: lang[config.lang].interact.report.manage.category.replace("${channel}", channel) + "\n" + lang[config.lang].interact.report.manage.delManager.replace("${role}", del),
                                ephemeral: true
                            });
                            break;
                        case 6:
                            interact.reply({
                                content: lang[config.lang].interact.report.manage.addManager.replace("${role}", add) + "\n" + lang[config.lang].interact.report.manage.delManager.replace("${role}", del),
                                ephemeral: true
                            });
                            break;
                        case 7:
                            interact.reply({
                                content: lang[config.lang].interact.report.manage.category.replace("${channel}", channel) + "\n" + lang[config.lang].interact.report.manage.addManager.replace("${role}", add) + "\n" + lang[config.lang].interact.report.manage.delManager.replace("${role}", del),
                                ephemeral: true
                            });
                            break;
                    }
                } else if (interact.options.getSubcommand() == "setsu") {
                    let role = interact.options.getRole("role");
                    pool.query("SELECT * FROM `managers` WHERE role = ?", [role.id])
                        .then(([res]) => {
                            if (res.length != 0) {
                                if (res[0].type == 0) {
                                    pool.query("UPDATE `managers` SET type = ? WHERE role = ?", [1, role.id]);
                                    interact.reply({
                                        content: lang[config.lang].interact.report.setsu.success.replace("${role}", role),
                                        ephemeral: true
                                    });
                                } else {
                                    interact.reply({
                                        content: lang[config.lang].interact.report.setsu.err_already.replace("${role}", role),
                                        ephemeral: true
                                    });
                                }
                            } else {
                                interact.reply({
                                    content: lang[config.lang].interact.report.setsu.err_nothing.replace("${role}", role),
                                    ephemeral: true
                                });
                            }
                        });
                }
                break;
            }
            case "mute": {
                console.log(`${interact.user.tag} use /mute`);
                pool.query("SELECT * FROM `actions` WHERE uuid = ? AND type = ?", [interact.member.id, 0])
                    .then(([res]) => {
                        if (res.length < 3) {
                            let target = interact.options.getMember("user");
                            let time = interact.options.getNumber("time");
                            let reason = interact.options.getString("reason");
                            if (target.moderatable) {
                                target.timeout(time * 60 * 1000, reason);
                                interact.reply({
                                    content: lang[config.lang].interact.mute.success.replace("${target}", target.displayName).replace("${time}", time).replace("${reason}", reason)
                                });
                                pool.query("SELECT * FROM `mutes` WHERE uuid = ?", [target.id])
                                    .then(([res]) => {
                                        if (res.length != 0) {
                                            pool.query("UPDATE `mutes` SET reason = ?, date = ?, time = ?, gived = ? WHERE uuid = ?", [reason, new Date().valueOf(), time * 60 * 1000, interact.member.id]);
                                        } else {
                                            pool.query("INSERT INTO `mutes` (uuid, reason, date, time, gived) VALUES (?, ?, ?, ?, ?)", [target.id, reason, new Date().valueOf(), time * 60 * 1000, interact.member.id]);
                                        }
                                    });
                                pool.query("SELECT * FROM `config`")
                                    .then(([res]) => {
                                        if (res.length != 0) {
                                            let enabled = false;
                                            let admin = null;
                                            res.forEach(item => {
                                                if (item.type == 1 && item.value == 1) enabled = true;
                                                if (item.type == 2) admin = item.value;
                                            });
                                            if (enabled && admin != null) {
                                                interact.guild.channels.cache.get(admin).send({
                                                    content: lang[config.lang].interact.mute.logs.replace("${admin}", interact.member.displayName).replace("${target}", target.displayName).replace("${time}", time).replace("${reason}", reason),
                                                });
                                            }
                                        }
                                    });
                                pool.query("INSERT INTO `actions` (uuid, type, date) VALUES (?, ?, ?)", [interact.member.id, 0, new Date().valueOf()]);
                            } else {
                                interact.reply({
                                    content: lang[config.lang].err_not_permission,
                                    ephemeral: true
                                });
                            }
                        } else {
                            pool.query("SELECT * FROM `config` WHERE type = ?", [6])
                                .then(([res]) => {
                                    pool.query("SELECT * FROM `codes` WHERE uuid = ?", [interact.member.id])
                                        .then(([code]) => {
                                            if (res.length != 0 && code.length == 0) {
                                                let cod = gencode();
                                                pool.query("INSERT INTO `codes` (uuid, code) VALUES (?, ?)", [interact.member.id, cod]);
                                                interact.guild.channels.resolve(res[0].value).send(lang[config.lang].interact.code.lock.replace("${target}", interact.member).replace("${code}", cod));
                                            }
                                        })
                                })
                            interact.reply({
                                content: lang[config.lang].interact.mute.security,
                                ephemeral: true
                            });
                        }
                    });
                break;
            }
            case "unmute": {
                console.log(`${interact.user.tag} use /unmute`);
                let target = interact.options.getMember("user");
                if (target.moderatable) {
                    target.timeout(null);
                    interact.reply({
                        content: lang[config.lang].interact.unmute.success.replace("${target}", target.displayName)
                    });
                    pool.query("SELECT * FROM `mutes` WHERE uuid = ?", [target.id])
                        .then(([res]) => {
                            if (res.length != 0) {
                                pool.query("DELETE FROM `mutes` WHERE uuid = ?", [interact.member.id]);
                            }
                        });
                    pool.query("SELECT * FROM `config`")
                        .then(([res]) => {
                            if (res.length != 0) {
                                let enabled = false;
                                let admin = null;
                                res.forEach(item => {
                                    if (item.type == 1 && item.value == 1) enabled = true;
                                    if (item.type == 2) admin = item.value;
                                });
                                if (enabled && admin != null) {
                                    interact.guild.channels.cache.get(admin).send({
                                        content: lang[config.lang].interact.unmute.logs.replace("${admin}", interact.member.displayName).replace("${target}", target.displayName),
                                    });
                                }
                            }
                        });
                } else {
                    interact.reply({
                        content: lang[config.lang].err_not_permission,
                        ephemeral: true
                    });
                }
                break;
            }
            case "warn": {
                console.log(`${interact.user.tag} use /warn`);
                pool.query("SELECT * FROM `actions` WHERE uuid = ? AND type = ?", [interact.member.id, 1])
                    .then(([res]) => {
                        if (res.length < 3) {
                            let target = interact.options.getMember("user");
                            let reason = interact.options.getString("reason");
                            let gived = interact.member.id;
                            pool.query("SELECT * FROM `warns` WHERE uuid = ?", [target.id])
                                .then(([res]) => {
                                    switch (res.length) {
                                        case 0: {
                                            pool.query("INSERT INTO `warns` (uuid, reason, date, gived) VALUES (?, ?, ?, ?)", [target.id, reason, new Date().valueOf(), gived]);
                                            interact.reply({
                                                content: lang[config.lang].interact.warn[0].replace("${target}", target.displayName).replace("${reason}", reason)
                                            });
                                            break;
                                        }
                                        case 1: {
                                            pool.query("INSERT INTO `warns` (uuid, reason, date, gived) VALUES (?, ?, ?, ?)", [target.id, reason, new Date().valueOf(), gived]);
                                            interact.reply({
                                                content: lang[config.lang].interact.warn[2].replace("${target}", target.displayName).replace("${reason}", reason)
                                            });
                                            break;
                                        }
                                        default: {
                                            pool.query("INSERT INTO `warns` (uuid, reason, date, gived) VALUES (?, ?, ?, ?)", [target.id, reason, new Date().valueOf(), gived]);
                                            interact.reply({
                                                content: lang[config.lang].interact.warn[3].replace("${target}", target.displayName).replace("${time}", (res.length + 1) * 30).replace("${reason}", reason)
                                            });
                                            if (target.moderatable) target.timeout((res.length + 1) * 30 * 60 * 1000, lang[config.lang].warn_timeout);
                                            break;
                                        }
                                    }
                                });
                            pool.query("SELECT * FROM `config`")
                                .then(([res]) => {
                                    if (res.length != 0) {
                                        let enabled = false;
                                        let admin = null;
                                        res.forEach(item => {
                                            if (item.type == 1 && item.value == 1) enabled = true;
                                            if (item.type == 2) admin = item.value;
                                        });
                                        if (enabled && admin != null) {
                                            interact.guild.channels.cache.get(admin).send({
                                                content: lang[config.lang].interact.warn.logs.replace("${admin}", interact.member.displayName).replace("${target}", target.displayName).replace("${reason}", reason),
                                            });
                                        }
                                    }
                                });
                            pool.query("INSERT INTO `actions` (uuid, type, date) VALUES (?, ?, ?)", [interact.member.id, 1, new Date().valueOf()]);
                        } else {
                            pool.query("SELECT * FROM `config` WHERE type = ?", [6])
                                .then(([res]) => {
                                    pool.query("SELECT * FROM `codes` WHERE uuid = ?", [interact.member.id])
                                        .then(([code]) => {
                                            if (res.length != 0 && code.length == 0) {
                                                let cod = gencode();
                                                pool.query("INSERT INTO `codes` (uuid, code) VALUES (?, ?)", [interact.member.id, cod]);
                                                interact.guild.channels.resolve(res[0].value).send(lang[config.lang].interact.code.lock.replace("${target}", interact.member).replace("${code}", cod));
                                            }
                                        })
                                })
                            interact.reply({
                                content: lang[config.lang].interact.warn.security,
                                ephemeral: true
                            });
                        }
                    });
                break;
            }
            case "unwarn": {
                console.log(`${interact.user.tag} use /unwarn`);
                let target = interact.options.getMember("user");
                pool.query("SELECT * FROM `warns` WHERE uuid = ?", [target.id])
                    .then(([res]) => {
                        if (res.length > 0) {
                            pool.query("DELETE FROM `warns` WHERE uuid = ?", [target.id]);
                            interact.reply({
                                content: lang[config.lang].interact.unwarn.success.replace("${target}", target.displayName),
                                ephemeral: true
                            });
                            pool.query("SELECT * FROM `config`")
                                .then(([res]) => {
                                    if (res.length != 0) {
                                        let enabled = false;
                                        let admin = null;
                                        res.forEach(item => {
                                            if (item.type == 1 && item.value == 1) enabled = true;
                                            if (item.type == 2) admin = item.value;
                                        });
                                        if (enabled && admin != null) {
                                            interact.guild.channels.cache.get(admin).send({
                                                content: lang[config.lang].interact.unwarn.logs.replace("${admin}", interact.member.displayName).replace("${target}", target.displayName),
                                            });
                                        }
                                    }
                                });
                        } else {
                            interact.reply({
                                content: lang[config.lang].interact.unwarn.err,
                                ephemeral: true
                            });
                        }
                    });
                break;
            }
            case "links": {
                console.log(`${interact.user.tag} use /links`);
                let add = null;
                let remove = null;
                if (interact.options.getString("add") != null) add = interact.options.getString("add").split("/")[interact.options.getString("add").split("/").length - 1];
                if (interact.options.getString("remove") != null) remove = interact.options.getString("remove").split("/")[interact.options.getString("remove").split("/").length - 1];
                let p1 = 0, p2 = 0;
                if (add != null) {
                    pool.query("INSERT INTO `links` (link) VALUES (?)", [add]);
                    p1 = 1;
                }
                if (remove != null) {
                    pool.query("DELETE FROM `links` WHERE link = ?", [remove]);
                    p2 = 2;
                }
                switch (p1 + p2) {
                    case 1:
                        interact.reply({
                            content: lang[config.lang].interact.links[1].replace("${link}", add),
                            ephemeral: true
                        });
                        pool.query("SELECT * FROM `config`")
                            .then(([res]) => {
                                if (res.length != 0) {
                                    let enabled = false;
                                    let admin = null;
                                    res.forEach(item => {
                                        if (item.type == 1 && item.value == 1) enabled = true;
                                        if (item.type == 2) admin = item.value;
                                    });
                                    if (enabled && admin != null) {
                                        interact.guild.channels.cache.get(admin).send({
                                            content: lang[config.lang].interact.links.logs1.replace("${admin}", interact.member.displayName).replace("${link}", add)
                                        });
                                    }
                                }
                            });
                        break;
                    case 2:
                        interact.reply({
                            content: lang[config.lang].interact.links[2].replace("${link}", remove),
                            ephemeral: true
                        });
                        pool.query("SELECT * FROM `config`")
                            .then(([res]) => {
                                if (res.length != 0) {
                                    let enabled = false;
                                    let admin = null;
                                    res.forEach(item => {
                                        if (item.type == 1 && item.value == 1) enabled = true;
                                        if (item.type == 2) admin = item.value;
                                    });
                                    if (enabled && admin != null) {
                                        interact.guild.channels.cache.get(admin).send({
                                            content: lang[config.lang].interact.links.logs2.replace("${admin}", interact.member.displayName).replace("${link}", remove)
                                        });
                                    }
                                }
                            });
                        break;
                    case 3:
                        interact.reply({
                            content: lang[config.lang].interact.links[3].replace("${link1}", add).replace("${link2}", remove),
                            ephemeral: true
                        });
                        pool.query("SELECT * FROM `config`")
                            .then(([res]) => {
                                if (res.length != 0) {
                                    let enabled = false;
                                    let admin = null;
                                    res.forEach(item => {
                                        if (item.type == 1 && item.value == 1) enabled = true;
                                        if (item.type == 2) admin = item.value;
                                    });
                                    if (enabled && admin != null) {
                                        interact.guild.channels.cache.get(admin).send({
                                            content: lang[config.lang].interact.links.logs3.replace("${admin}", interact.member.displayName).replace("${link1}", add).replace("${link2}", remove)
                                        });
                                    }
                                }
                            });
                        break;
                }
                break;
            }
            case "words": {
                console.log(`${interact.user.tag} use /words`);
                let add = interact.options.getString("add");
                let remove = interact.options.getString("remove");
                let p1 = 0, p2 = 0;
                if (add != null) {
                    pool.query("INSERT INTO `ban-words` (word) VALUES (?)", [add]);
                    p1 = 1;
                }
                if (remove != null) {
                    pool.query("DELETE FROM `ban-words` WHERE word = ?", [remove]);
                    p2 = 2;
                }
                switch (p1 + p2) {
                    case 1:
                        interact.reply({
                            content: lang[config.lang].interact.words[1].replace("${word}", add),
                            ephemeral: true
                        });
                        pool.query("SELECT * FROM `config`")
                            .then(([res]) => {
                                if (res.length != 0) {
                                    let enabled = false;
                                    let admin = null;
                                    res.forEach(item => {
                                        if (item.type == 1 && item.value == 1) enabled = true;
                                        if (item.type == 2) admin = item.value;
                                    });
                                    if (enabled && admin != null) {
                                        interact.guild.channels.cache.get(admin).send({
                                            content: lang[config.lang].interact.words.logs1.replace("${admin}", interact.member.displayName).replace("${word}", add)
                                        });
                                    }
                                }
                            });
                        break;
                    case 2:
                        interact.reply({
                            content: lang[config.lang].interact.words[2].replace("${word}", remove),
                            ephemeral: true
                        });
                        pool.query("SELECT * FROM `config`")
                            .then(([res]) => {
                                if (res.length != 0) {
                                    let enabled = false;
                                    let admin = null;
                                    res.forEach(item => {
                                        if (item.type == 1 && item.value == 1) enabled = true;
                                        if (item.type == 2) admin = item.value;
                                    });
                                    if (enabled && admin != null) {
                                        interact.guild.channels.cache.get(admin).send({
                                            content: lang[config.lang].interact.words.logs2.replace("${admin}", interact.member.displayName).replace("${word}", remove)
                                        });
                                    }
                                }
                            });
                        break;
                    case 3:
                        interact.reply({
                            content: lang[config.lang].interact.words[3].replace("${word1}", add).replace("${word2}", remove),
                            ephemeral: true
                        });
                        pool.query("SELECT * FROM `config`")
                            .then(([res]) => {
                                if (res.length != 0) {
                                    let enabled = false;
                                    let admin = null;
                                    res.forEach(item => {
                                        if (item.type == 1 && item.value == 1) enabled = true;
                                        if (item.type == 2) admin = item.value;
                                    });
                                    if (enabled && admin != null) {
                                        interact.guild.channels.cache.get(admin).send({
                                            content: lang[config.lang].interact.words.logs3.replace("${admin}", interact.member.displayName).replace("${word1}", add).replace("${word2}", remove)
                                        });
                                    }
                                }
                            });
                        break;
                }
                break;
            }
            case "logs": {
                if (interact.options.getSubcommand() == "channels") {
                    console.log(`${interact.user.tag} use /logs channels`);
                    let admin = interact.options.getChannel("admin");
                    let violation = interact.options.getChannel("violation");
                    let p1 = 0, p2 = 0;
                    if (admin != null) {
                        pool.query("SELECT * FROM `config` WHERE type = ?", [2])
                            .then(([res]) => {
                                if (res.length == 0) pool.query("INSERT INTO `config` (type, value) VALUES (?, ?)", [2, admin.id]);
                                else pool.query("UPDATE `config` SET value = ? WHERE type = ?", [admin.id, 2]);
                            });
                        p1 = 1;
                    }
                    if (violation != null) {
                        pool.query("SELECT * FROM `config` WHERE type = ?", [3])
                            .then(([res]) => {
                                if (res.length == 0) pool.query("INSERT INTO `config` (type, value) VALUES (?, ?)", [3, violation.id]);
                                else pool.query("UPDATE `config` SET value = ? WHERE type = ?", [violation.id, 3]);
                            });
                        p2 = 2;
                    }
                    switch (p1 + p2) {
                        case 1: {
                            interact.reply({
                                content: lang[config.lang].interact.logs.channels[1].replace("${channel}", admin.name),
                                ephemeral: true
                            });
                            break;
                        }
                        case 2: {
                            interact.reply({
                                content: lang[config.lang].interact.logs.channels[2].replace("${channel}", violation.name),
                                ephemeral: true
                            });
                            break;
                        }
                        case 3: {
                            interact.reply({
                                content: lang[config.lang].interact.logs.channels[3].replace("${channel1}", admin.name).replace("${channel2}", violation.name),
                                ephemeral: true
                            });
                            break;
                        }
                    }
                } else if (interact.options.getSubcommand() == "enabled") {
                    console.log(`${interact.user.tag} use /logs enabled`);
                    pool.query("SELECT * FROM `config` WHERE type = ?", [1])
                        .then(([res]) => {
                            if (res.length != 0) {
                                switch (res[0].value) {
                                    case "1":
                                        pool.query("UPDATE `config` SET value = ? WHERE type = ?", [false, 1]);
                                        interact.reply({
                                            content: lang[config.lang].interact.logs.disabled,
                                            ephemeral: true
                                        });
                                        break;
                                    case "0":
                                        pool.query("UPDATE `config` SET value = ? WHERE type = ?", [true, 1]);
                                        interact.reply({
                                            content: lang[config.lang].interact.logs.enabled,
                                            ephemeral: true
                                        });
                                        break;
                                }
                            } else {
                                pool.query("INSERT INTO `config` (type, value) VALUES (?, ?)", [1, true]);
                                interact.reply({
                                    content: lang[config.lang].interact.logs.enabled,
                                    ephemeral: true
                                });
                            }
                        })
                }
                break;
            }
            case "memberc": {
                console.log(`${interact.user.tag} use /memberc`);
                pool.query("SELECT * FROM `config` WHERE type = ?", [4])
                    .then(([res]) => {
                        if (res.length != 0) {
                            pool.query("UPDATE `config` SET value = ? WHERE type = ?", [interact.options.getChannel("channel").id, 4]);
                        } else {
                            pool.query("INSERT INTO `config` (type, value) VALUES (?, ?)", [4, interact.options.getChannel("channel").id]);
                        }
                        interact.reply({
                            content: lang[config.lang].interact.memberc.cmd.replace("${channel}", interact.options.getChannel("channel")),
                            ephemeral: true
                        });
                        interact.options.getChannel("channel").setName(lang[config.lang].interact.memberc.channel.replace("${count}", interact.guild.memberCount));
                    });
                break;
            }
            case "grantrole": {
                console.log(`${interact.user.tag} use /grantrole`);
                let role = interact.options.getRole("role");
                if (role.editable) {
                    interact.guild.members.fetch()
                        .then(members => {
                            members.filter(member => !member.roles.cache.has(role) && !member.user.bot).forEach(member => {
                                member.roles.add(role).catch();
                            });
                        })
                        .finally(() => {
                            interact.reply({
                                content: lang[config.lang].interact.grantrole.succes.replace("${role}", role),
                                ephemeral: true
                            });
                        });
                } else {
                    interact.reply({
                        content: lang[config.lang].interact.grantrole.err,
                        ephemeral: true
                    });
                }
                break;
            }
            case "welcomerole": {
                console.log(`${interact.user.tag} use /welcomerole`);
                let role = interact.options.getRole("role");
                if (role.editable) {
                    pool.query("SELECT * FROM `config` WHERE type = ?", [5])
                        .then(([res]) => {
                            if (res.length != 0) pool.query("UPDATE `config` SET value = ? WHERE type = ?", [role.id, 5]);
                            else pool.query("INSERT INTO `config` (type, value) VALUES (?, ?)", [5, role.id]);
                        });
                    interact.reply({
                        content: lang[config.lang].interact.welcomerole.succes.replace("${role}", role),
                        ephemeral: true
                    });
                } else {
                    interact.reply({
                        content: lang[config.lang].interact.welcomerole.err,
                        ephemeral: true
                    });
                }
                break;
            }
            case "ban": {
                console.log(`${interact.user.tag} use /ban`);
                pool.query("SELECT * FROM `actions` WHERE uuid = ? AND type = ?", [interact.member.id, 2])
                    .then(([res]) => {
                        if (res.length < 3) {
                            let target = interact.options.getMember("user");
                            let reason = interact.options.getString("reason");
                            pool.query("SELECT * FROM `bans` WHERE uuid = ?", [target.id])
                                .then(([res]) => {
                                    if (res.length != 0) {
                                        interact.reply({
                                            content: lang[config.lang].interact.ban.err,
                                            ephemeral: true
                                        });
                                    } else {
                                        pool.query("INSERT INTO `bans` (uuid, reason, date, gived) VALUES (?, ?, ?, ?)", [target.id, reason, new Date().valueOf(), interact.member.id]);
                                        target.timeout(1000 * 60 * 60 * 24, reason);
                                        interact.reply({
                                            content: lang[config.lang].interact.ban.success.replace("${target}", target).replace("${reason}", reason),
                                            ephemeral: false
                                        });
                                        pool.query("SELECT * FROM `config`")
                                            .then(([res]) => {
                                                if (res.length != 0) {
                                                    let enabled = false;
                                                    let admin = null;
                                                    res.forEach(item => {
                                                        if (item.type == 1 && item.value == 1) enabled = true;
                                                        if (item.type == 2) admin = item.value;
                                                    });
                                                    if (enabled && admin != null) {
                                                        interact.guild.channels.cache.get(admin).send({
                                                            content: lang[config.lang].interact.ban.logs.replace("${admin}", interact.member.displayName).replace("${target}", target.displayName).replace("${reason}", reason),
                                                        });
                                                    }
                                                }
                                            });
                                        pool.query("INSERT INTO `actions` (uuid, type, date) VALUES (?, ?, ?)", [interact.member.id, 2, new Date().valueOf()]);
                                    }
                                });
                        } else {
                            pool.query("SELECT * FROM `config` WHERE type = ?", [6])
                                .then(([res]) => {
                                    pool.query("SELECT * FROM `codes` WHERE uuid = ?", [interact.member.id])
                                        .then(([code]) => {
                                            if (res.length != 0 && code.length == 0) {
                                                let cod = gencode();
                                                pool.query("INSERT INTO `codes` (uuid, code) VALUES (?, ?)", [interact.member.id, cod]);
                                                interact.guild.channels.resolve(res[0].value).send(lang[config.lang].interact.code.lock.replace("${target}", interact.member).replace("${code}", cod));
                                            }
                                        })
                                })
                            interact.reply({
                                content: lang[config.lang].interact.ban.security,
                                ephemeral: true
                            });
                        }
                    });
                break;
            }
            case "unban": {
                console.log(`${interact.user.tag} use /unban`);
                let target = interact.options.getMember("user");
                pool.query("SELECT * FROM `bans` WHERE uuid = ?", [target.id])
                    .then(([res]) => {
                        if (res.length != 0) {
                            pool.query("DELETE FROM `bans` WHERE uuid = ?", [target.id]);
                            target.timeout(null);
                            interact.reply({
                                content: lang[config.lang].interact.unban.succes.replace("${target}", target),
                                ephemeral: false
                            });
                            pool.query("SELECT * FROM `config`")
                                .then(([res]) => {
                                    if (res.length != 0) {
                                        let enabled = false;
                                        let admin = null;
                                        res.forEach(item => {
                                            if (item.type == 1 && item.value == 1) enabled = true;
                                            if (item.type == 2) admin = item.value;
                                        });
                                        if (enabled && admin != null) {
                                            interact.guild.channels.cache.get(admin).send({
                                                content: lang[config.lang].interact.unban.logs.replace("${admin}", interact.member.displayName).replace("${target}", target.displayName),
                                            });
                                        }
                                    }
                                });
                        } else {
                            interact.reply({
                                content: lang[config.lang].interact.unban.err,
                                ephemeral: true
                            });
                        }
                    })
                break;
            }
            case "undo": {
                console.log(`${interact.user.tag} use /undo`);
                let target = interact.options.getMember("user");
                pool.query("SELECT * FROM `bans` WHERE gived = ?", [target.id])
                    .then(([res]) => {
                        if (res.length != 0) {
                            res.forEach(ban => {
                                if (new Date().valueOf() - ban.date < 1000 * 60 * 60 * 24) if (interact.guild.members.resolve(ban.uuid) != null) interact.guild.members.fetch(ban.uuid).then(member => member.timeout(null));
                            });
                            pool.query("DELETE FROM `bans`WHERE uuid = ?", [ban.uuid]);
                        }
                    });
                pool.query("SELECT * FROM `warns` WHERE gived = ?", [target.id])
                    .then(([res]) => {
                        if (res.length != 0) {
                            res.forEach(warn => {
                                if (new Date().valueOf() - warn.date < 1000 * 60 * 60 * 24) pool.query("DELETE FROM `warns` WHERE uuid = ? AND date = ?", [warn.uuid, warn.date]);
                            });
                        }
                    });
                pool.query("SELECT * FROM `mutes` WHERE gived = ?", [target.id])
                    .then(([res]) => {
                        if (res.length != 0) {
                            res.forEach(mute => {
                                if (new Date().valueOf() - mute.date < 1000 * 60 * 60 * 24) {
                                    pool.query("DELETE FROM `mutes` WHERE uuid = ?", [mute.uuid]);
                                    if (interact.guild.members.resolve(mute.uuid) != null) interact.guild.members.fetch(mute.uuid).then(member => member.timeout(null));
                                }
                            });
                        }
                    });
                interact.reply({
                    content: lang[config.lang].interact.undo.replace("${target}", target),
                    ephemeral: true
                });
                break;
            }
            case "code": {
                if (interact.options.getSubcommand() == "channel") {
                    let channel = interact.options.getChannel("channel");
                    pool.query("SELECT * FROM `config` WHERE type = ?", [6])
                        .then(([res]) => {
                            if (res.length != 0) {
                                pool.query("UPDATE `config` SET value = ? WHERE type = ?", [channel.id, 6]);
                                interact.reply({
                                    content: lang[config.lang].interact.code.channel,
                                    ephemeral: true
                                });
                            } else {
                                pool.query("INSERT INTO `config` (value, type) VALUES (?, ?)", [channel.id, 6]);
                                interact.reply({
                                    content: lang[config.lang].interact.code.channel,
                                    ephemeral: true
                                });
                            }
                        });
                } else if (interact.options.getSubcommand() == "activate") {
                    let code = interact.options.getString("code").toUpperCase();
                    pool.query("SELECT * FROM `codes` WHERE uuid = ?", [interact.member.id])
                        .then(([res]) => {
                            if (res.length != 0) {
                                if (res[0].code == code) {
                                    pool.query("DELETE FROM `actions` WHERE uuid = ?", [interact.member.id]);
                                    pool.query("DELETE FROM `codes` WHERE uuid = ?", [interact.member.id]);
                                    interact.reply({
                                        content: lang[config.lang].interact.code.activate.success,
                                        ephemeral: true
                                    });
                                } else {
                                    interact.reply({
                                        content: lang[config.lang].interact.code.activate.err_valid,
                                        ephemeral: true
                                    });
                                }
                            } else {
                                interact.reply({
                                    content: lang[config.lang].interact.code.activate.err_nothing,
                                    ephemeral: true
                                });
                            }
                        })
                }
            }
        }
    } else if (interact.isButton()) {
        switch (interact.customId) {
            case "reportCreate": {
                interact.showModal({
                    title: lang[config.lang].modals.reportCreate.title,
                    components: [{
                        type: "ACTION_ROW",
                        components: [{
                            label: lang[config.lang].modals.reportCreate.theme,
                            type: "TEXT_INPUT",
                            style: "SHORT",
                            customId: "theme",
                            placeholder: lang[config.lang].modals.reportCreate.themePlaceholder,
                            required: true
                        }]
                    },
                    {
                        type: "ACTION_ROW",
                        components: [{
                            label: lang[config.lang].modals.reportCreate.main,
                            type: "TEXT_INPUT",
                            style: "PARAGRAPH",
                            customId: "main",
                            placeholder: lang[config.lang].modals.reportCreate.mainPlaceholder,
                            required: true
                        }]
                    }],
                    customId: "reportCreate"
                });
                break;
            }
            case "closeReport": {
                interact.channel.permissionOverwrites.set([{
                    id: interact.guildId,
                    type: "role",
                    deny: ["VIEW_CHANNEL"]
                }]);

                interact.channel.edit({ name: `🔴 ${interact.channel.name.substring(1)}` });

                pool.query("SELECT * FROM `managers` WHERE type = ?", [1])
                    .then(([res]) => {
                        if (res.length != 0) {
                            res.forEach(item => {
                                if (interact.guild.roles.resolve(item.role)) {
                                    interact.guild.roles.fetch(item.role).then(role => {
                                        interact.channel.permissionOverwrites.create(role, { "VIEW_CHANNEL": true });
                                    });
                                }
                            });
                        }
                    });

                interact.update({
                    components: [{
                        type: "ACTION_ROW",
                        components: [
                            {
                                label: lang[config.lang].modals.reportCreate.reportClose.deleteReport,
                                type: "BUTTON",
                                style: "DANGER",
                                customId: "deleteReport",
                                emoji: "♻"
                            }
                        ]
                    }]
                });
                break;
            }
            case "deleteReport": {
                interact.channel.delete();
                break;
            }
        }
    } else if (interact.isModalSubmit()) {
        switch (interact.customId) {
            case "reportCreate": {
                interact.deferReply({ ephemeral: true });
                pool.query("SELECT * FROM `config`WHERE type = ?", [0])
                    .then(([res]) => {
                        if (res.length != 0) {
                            if (interact.guild.channels.resolve(res[0].value) != null) {
                                interact.guild.channels.fetch(res[0].value).then(category => {
                                    let theme = interact.components[0].components[0].value;
                                    let main = interact.components[1].components[0].value;
                                    interact.guild.channels.create(`🟢 ${theme}`, {
                                        type: "GUILD_TEXT",
                                        parent: res[0].value,
                                        permissionOverwrites: [
                                            {
                                                id: interact.guildId,
                                                deny: ["VIEW_CHANNEL"],
                                                type: "role"
                                            },
                                            {
                                                id: interact.member.id,
                                                allow: ["VIEW_CHANNEL"],
                                                type: "member"
                                            }
                                        ]
                                    }).then(channel => {
                                        channel.send({
                                            embeds: [{
                                                title: theme,
                                                description: main,
                                                color: "#00FFC6"
                                            }],
                                            components: [{
                                                type: "ACTION_ROW",
                                                components: [
                                                    {
                                                        label: lang[config.lang].modals.reportCreate.reportRun.closeReport,
                                                        type: "BUTTON",
                                                        style: "SECONDARY",
                                                        customId: "closeReport",
                                                        emoji: '❌'
                                                    }
                                                ]
                                            }]
                                        });

                                        pool.query("SELECT * FROM `managers` WHERE type = ?", [0])
                                            .then(([res]) => {
                                                if (res.length != 0) {
                                                    res.forEach(item => {
                                                        if (interact.guild.roles.resolve(item.role) != null) {
                                                            interact.guild.roles.fetch(item.role).then(role => {
                                                                channel.permissionOverwrites.create(role, { "VIEW_CHANNEL": true });
                                                            });
                                                        }
                                                    });
                                                }
                                            });

                                        interact.editReply({
                                            content: lang[config.lang].modals.reportCreate.reportRun.cmd.replace("${channel}", channel)
                                        });
                                    });
                                })
                            }
                        }
                    })
                break;
            }
        }
    }
});

//Filter block

bot.on('messageCreate', async msg => {
    if (!msg.author.bot) {
        console.log(`${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()} ${msg.author.tag}: ${msg.content}`);
        if (msg.content.search(/https*:\/\/[db][il1]sc[o0]r[db]\.g[il1][tf][ft]/g) != -1) {
            msg.delete();
        } else if (msg.content.search(/https*:\/\/discord.(gg\/|com\/invite\/)[a-z|0-9]{1,15}/g) != -1) {
            let link = msg.content.match(/https*:\/\/discord.(gg\/|com\/invite\/)[a-z|0-9]{1,15}/g)[0].split("/")[msg.content.match(/https*:\/\/discord.(gg\/|com\/invite\/)[a-z|0-9]{1,15}/g)[0].split("/").length - 1];
            pool.query("SELECT * FROM `links` WHERE link = ?", [link])
                .then(([res]) => {
                    if (res.length == 0) {
                        msg.channel.send({
                            content: lang[config.lang].msg_filter.warn_link.replace("${target}", msg.author.membername)
                        });
                        let target = msg.member;
                        let reason = lang[config.lang].msg_filter.reason_link;
                        pool.query("SELECT * FROM `warns` WHERE uuid = ?", [msg.author.id])
                            .then(([res]) => {
                                switch (res.length) {
                                    case 0: {
                                        pool.query("INSERT INTO `warns` (uuid, reason, gived) VALUES (?, ?, ?)", [target.id, reason, "system"]);
                                        break;
                                    }
                                    case 1: {
                                        pool.query("INSERT INTO `warns` (uuid, reason, gived) VALUES (?, ?, ?)", [target.id, reason, "system"]);
                                        break;
                                    }
                                    default: {
                                        pool.query("INSERT INTO `warns` (uuid, reason, gived) VALUES (?, ?, ?)", [target.id, reason, "system"]);
                                        if (target.moderatable) target.timeout((res.length + 1) * 30 * 60 * 1000, lang[config.lang].warn_timeout);
                                        break;
                                    }
                                }
                            });
                        pool.query("SELECT * FROM `config`")
                            .then(([res]) => {
                                if (res.length != 0) {
                                    let enabled = false;
                                    let violation = null;
                                    res.forEach(item => {
                                        if (item.type == 1 && item.value == 1) enabled = true;
                                        if (item.type == 3) violation = item.value;
                                    });
                                    if (enabled && violation != null) {
                                        msg.guild.channels.cache.get(violation).send({
                                            content: lang[config.lang].msg_filter.logs_link.replace("${target}", target)
                                        });
                                    }
                                }
                            });

                        msg.delete();
                    }
                });
        } else {
            pool.query("SELECT * FROM `ban-words`")
                .then(([words]) => {
                    if (words.length > 0) {
                        var check = 0;
                        words.forEach(word => {
                            if (msg.content.search(word.word) != -1) {
                                check = 1;
                            }
                        });
                        if (check == 1) {
                            msg.channel.send({
                                content: lang[config.lang].msg_filter.warn_words.replace("${target}", msg.author.membername)
                            });
                            let target = msg.member;
                            let reason = lang[config.lang].msg_filter.reason_words;
                            pool.query("SELECT * FROM `warns` WHERE uuid = ?", [msg.author.id])
                                .then(([res]) => {
                                    switch (res.length) {
                                        case 0: {
                                            pool.query("INSERT INTO `warns` (uuid, reason, gived) VALUES (?, ?, ?)", [target.id, reason, "system"]);
                                            break;
                                        }
                                        case 1: {
                                            pool.query("INSERT INTO `warns` (uuid, reason, gived) VALUES (?, ?, ?)", [target.id, reason, "system"]);
                                            break;
                                        }
                                        default: {
                                            pool.query("INSERT INTO `warns` (uuid, reason, gived) VALUES (?, ?, ?)", [target.id, reason, "system"]);
                                            if (target.moderatable) target.timeout((res.length + 1) * 30 * 60 * 1000, lang[config.lang].warn_timeout);
                                            break;
                                        }
                                    }
                                });
                            pool.query("SELECT * FROM `config`")
                                .then(([res]) => {
                                    if (res.length != 0) {
                                        let enabled = false;
                                        let violation = null;
                                        res.forEach(item => {
                                            if (item.type == 1 && item.value == 1) enabled = true;
                                            if (item.type == 3) violation = item.value;
                                        });
                                        if (enabled && violation != null) {
                                            msg.guild.channels.cache.get(violation).send({
                                                content: lang[config.lang].msg_filter.logs_words.replace("${target}", target)
                                            });
                                        }
                                    }
                                });
                            msg.delete();
                        }
                    }
                });
        }
    }
});