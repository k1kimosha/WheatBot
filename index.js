//Init block

const { Client, Intents } = require("discord.js");
const { createPool } = require("mysql2");
const config = require("./config.json");

var lang = {
    "en": require("./localization/en.json"),
    "ru": require("./localization/ru.json")
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

bot.on("ready", () => {
    bot.user.setPresence({ status: "dnd" });

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
                            channel_types: [4],
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
                            channel_types: [0],
                            required: false
                        },
                        {
                            name: "violation",
                            description: lang[config.lang].cmds.logs.channels.violation,
                            type: "CHANNEL",
                            channel_types: [0],
                            required: false
                        }
                    ]
                },
                {
                    name: "enabled",
                    description: lang[config.lang].cmds.logs.enabled,
                    type: "SUB_COMMAND"
                }
            ]
        }
    ])
});

//Command block

bot.on('interactionCreate', async interact => {
    if (interact.isCommand()) {
        switch (interact.commandName) {
            case "report": {
                if (interact.options.getSubcommand() == "init") {
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
                    let channel = interact.options.getChannel("category");
                    pool.query("SELECT * FROM `config` WHERE type = ?", [0])
                        .then(([res]) => {
                            if (res.length == 0) pool.query("INSERT INTO `config` (type, value) VALUES (?, ?)", [0, channel.id]);
                            else pool.query("UPDATE `config` SET value = ? WHERE type = ?", [channel.id, 0]);
                        });
                    interact.reply({
                        content: lang[config.lang].interact.report.manage.category.replace("${channel}", channel),
                        ephemeral: true
                    });
                }
                break;
            }
            case "mute": {
                let target = interact.options.getMember("user");
                let time = interact.options.getNumber("time");
                let reason = interact.options.getString("reason");
                if (target.moderatable) {
                    target.timeout(time * 60 * 1000, reason);
                    interact.reply({
                        content: lang[config.lang].interact.mute.replace("${target}", target.displayName).replace("${time}", time).replace("${reason}", reason)
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
                let target = interact.options.getMember("user");
                if (target.moderatable) {
                    target.timeout(null);
                    interact.reply({
                        content: lang[config.lang].interact.unmute.replace("${target}", target.displayName)
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
                break;
            }
            case "unwarn": {
                let target = interact.options.getMember("user");
                pool.query("SELECT * FROM `warns` WHERE uuid = ?", [target.id])
                    .then(([res]) => {
                        if (res.length > 0) {
                            pool.query("DELETE FROM `warns` WHERE uuid = ?", [target.id]);
                            interact.reply({
                                content: lang[config.lang].interact.unwarn.success.replace("${target}", target.displayName),
                                ephemeral: true
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
                            content: lang[config.lang].interact.links[1].replace("${link}", add)
                        });
                        break;
                    case 2:
                        interact.reply({
                            content: lang[config.lang].interact.links[2].replace("${link}", remove)
                        });
                        break;
                    case 3:
                        interact.reply({
                            content: lang[config.lang].interact.links[3].replace("${link1}", add).replace("${link2}", remove)
                        });
                        break;
                }
                break;
            }
            case "words": {
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
                            content: lang[config.lang].interact.words[1].replace("${word}", add)
                        });
                        break;
                    case 2:
                        interact.reply({
                            content: lang[config.lang].interact.words[2].replace("${word}", remove)
                        });
                        break;
                    case 3:
                        interact.reply({
                            content: lang[config.lang].interact.words[3].replace("${word1}", add).replace("${word2}", remove)
                        });
                        break;
                }
                break;
            }
            case "logs": {
                if (interact.options.getSubcommand() == "channels") {
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
                                p2 = 2;
                            })
                    }
                    switch (p1 + p2) {
                        case 1: {
                            interact.reply({
                                content: lang[config.lang].interact.logs.channels[1].replace("${channel}", admin.name)
                            });
                            break;
                        }
                        case 2: {
                            interact.reply({
                                content: lang[config.lang].interact.logs.channels[2].replace("${channel}", violation.name)
                            });
                            break;
                        }
                        case 3: {
                            interact.reply({
                                content: lang[config.lang].interact.logs.channels[3].replace("${channel1}", admin.name).replace("${channel2}", violation.name)
                            });
                            break;
                        }
                    }
                } else if (interact.options.getSubcommand() == "enabled") {
                    pool.query("SELECT * FROM `config` WHERE type = ?", [1])
                        .then(([res]) => {
                            if (res.length != 0) {
                                switch (res[0].value) {
                                    case "1":
                                        pool.query("UPDATE `config` SET value = ? WHERE type = ?", [false, 1]);
                                        break;
                                    case "0":
                                        pool.query("UPDATE `config` SET value = ? WHERE type = ?", [true, 1]);
                                        break;
                                }
                            } else {
                                pool.query("INSERT INTO `config` (type, value) VALUES (?, ?)", [1, true]);
                            }
                        })
                }
                break;
            }
        }
    }
});

//Filter block

bot.on('messageCreate', async msg => {
    if (!msg.author.bot) {
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
                            msg.delete();
                        }
                    }
                });
        }
    }
})