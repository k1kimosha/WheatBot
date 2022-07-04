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
                member.guild.roles.fetch(res[0].value)
                    .then(role => {
                        if (role != null) {
                            member.roles.add(role).catch();
                        }
                    });
            }
        });
    pool.query("SELECT * FROM `config` WHERE type = ?", [4])
        .then(([res]) => {
            if (res.length != 0) {
                member.guild.channels.fetch(res[0].value)
                    .then(channel => {
                        if (channel != null) {
                            console.log("member count update");
                            channel.setName(lang[config.lang].interact.memberc.channel.replace("${count}", member.guild.memberCount));
                        }
                    })
            }
        })
});

bot.on('guildMemberRemove', member => {
    pool.query("SELECT * FROM `config` WHERE type = ?", [4])
        .then(([res]) => {
            if (res.length != 0) {
                member.guild.channels.fetch(res[0].value)
                    .then(channel => {
                        if (channel != null) {
                            console.log("member count update");
                            channel.setName(lang[config.lang].interact.memberc.channel.replace("${count}", member.guild.memberCount));
                        }
                    })
            }
        })
})

bot.on("ready", () => {
    bot.user.setPresence({ status: "dnd" });
    pool.query("SELECT * FROM `config` WHERE type = ?", [4])
        .then(([res]) => {
            if (res.length != 0) {
                bot.guilds.fetch(config.guild).then(guild => {
                    guild.channels.fetch(res[0].value)
                        .then(channel => {
                            if (channel != null) {
                                console.log("member count update");
                                channel.setName(lang[config.lang].interact.memberc.channel.replace("${count}", guild.memberCount));
                            }
                        });
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
        }
    ])
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
                }
                break;
            }
            case "mute": {
                console.log(`${interact.user.tag} use /mute`);
                let target = interact.options.getMember("user");
                let time = interact.options.getNumber("time");
                let reason = interact.options.getString("reason");
                if (target.moderatable) {
                    target.timeout(time * 60 * 1000, reason);
                    interact.reply({
                        content: lang[config.lang].interact.mute.success.replace("${target}", target.displayName).replace("${time}", time).replace("${reason}", reason)
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
                } else {
                    interact.reply({
                        content: lang[config.lang].err_not_permission,
                        ephemeral: true
                    });
                }
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
                let target = interact.options.getMember("user");
                let reason = interact.options.getString("reason");
                let gived = interact.member.id;
                pool.query("SELECT * FROM `warns` WHERE uuid = ?", [target.id])
                    .then(([res]) => {
                        switch (res.length) {
                            case 0: {
                                pool.query("INSERT INTO `warns` (uuid, reason, gived) VALUES (?, ?, ?)", [target.id, reason, gived]);
                                interact.reply({
                                    content: lang[config.lang].interact.warn[0].replace("${target}", target.displayName).replace("${reason}", reason)
                                });
                                break;
                            }
                            case 1: {
                                pool.query("INSERT INTO `warns` (uuid, reason, gived) VALUES (?, ?, ?)", [target.id, reason, gived]);
                                interact.reply({
                                    content: lang[config.lang].interact.warn[2].replace("${target}", target.displayName).replace("${reason}", reason)
                                });
                                break;
                            }
                            default: {
                                pool.query("INSERT INTO `warns` (uuid, reason, gived) VALUES (?, ?, ?)", [target.id, reason, gived]);
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
                        pool.query("SELECT * FROM `config` WHERE type = ?", [4])
                            .then(([res]) => {
                                if (res.length != 0) {
                                    interact.guild.channels.fetch(res[0].value)
                                        .then(channel => {
                                            if (channel != null) {
                                                channel.setName(lang[config.lang].interact.memberc.channel.replace("${count}", interact.guild.memberCount))
                                            }
                                        });
                                }
                            });
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
                                interact.guild.roles.fetch(item.role).then(role => {
                                    interact.channel.permissionOverwrites.create(role, { "VIEW_CHANNEL": true });
                                });
                            });
                        }
                    });
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
                            interact.guild.channels.fetch(res[0].value).then(category => {
                                if (category != null) {
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
                                                id: interact.user.id,
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
                                                        interact.guild.roles.fetch(item.role).then(role => {
                                                            channel.permissionOverwrites.create(role, { "VIEW_CHANNEL": true });
                                                        })
                                                    });
                                                }
                                            });

                                        interact.editReply({
                                            content: lang[config.lang].modals.reportCreate.reportRun.cmd.replace("${channel}", channel)
                                        });
                                    });
                                }
                            })
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
                            content: lang[config.lang].msg_filter.warn_link.replace("${target}", msg.author.username)
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
                                content: lang[config.lang].msg_filter.warn_words.replace("${target}", msg.author.username)
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