//Init block

const { Client, Intents } = require("discord.js");
const { createPool } = require("mysql2");
const config = require("./config.json");

var lang = {
    "en": require("./localization/en.json")
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
            name: "init_report",
            description: lang[config.lang].cmds.description.initReport,
            type: "CHAT_INPUT",
            defaultPermission: false
        },
        {
            name: "mute",
            description: lang[config.lang].cmds.description.mute.cmd,
            type: "CHAT_INPUT",
            defaultPermission: false,
            options: [
                {
                    name: "user",
                    type: "USER",
                    description: lang[config.lang].cmds.description.mute.user,
                    required: true
                },
                {
                    name: "time",
                    type: "NUMBER",
                    description: lang[config.lang].cmds.description.mute.time,
                    required: true
                },
                {
                    name: "reason",
                    type: "STRING",
                    description: lang[config.lang].cmds.description.mute.reason,
                    required: true
                }
            ]
        },
        {
            name: "unmute",
            description: lang[config.lang].cmds.description.unmute.cmd,
            type: "CHAT_INPUT",
            defaultPermission: false,
            options: [
                {
                    name: "user",
                    type: "USER",
                    description: lang[config.lang].cmds.description.unmute.user,
                    required: true
                }
            ]
        },
        {
            name: "warn",
            description: lang[config.lang].cmds.description.warn.cmd,
            type: "CHAT_INPUT",
            defaultPermission: false,
            options: [
                {
                    name: "user",
                    type: "USER",
                    description: lang[config.lang].cmds.description.warn.user,
                    required: true
                },
                {
                    name: "reason",
                    type: "STRING",
                    description: lang[config.lang].cmds.description.warn.reason,
                    required: true
                }
            ]
        },
        {
            name: "unwarn",
            description: lang[config.lang].cmds.description.unwarn.cmd,
            type: "CHAT_INPUT",
            defaultPermission: false,
            options: [
                {
                    name: "user",
                    type: "USER",
                    description: lang[config.lang].cmds.description.unwarn.user,
                    required: true
                }
            ]
        }
    ])
});

//Command block

bot.on('interactionCreate', async interact => {
    if (interact.isCommand()) {
        switch (interact.commandName) {
            case "init_report": {
                interact.reply({
                    content: lang[config.lang].interact.initReport.text,
                    components: [
                        {
                            type: "ACTION_ROW",
                            components: [
                                {
                                    type: "BUTTON",
                                    label: lang[config.lang].interact.initReport.button,
                                    style: "SECONDARY",
                                    customId: "reportCreate",
                                    emoji: '💢'
                                }
                            ],
                        }
                    ]
                });
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
                pool.query("SELECT * FROM `warns` WHERE uuid = ?", [target.id])
                    .then(([res]) => {
                        switch (res.length) {
                            case 0:
                                let reason = interact.options.getString("reason");
                                pool.query("INSERT INTO `warns` (uuid, warns, reasons, gived) VALUES (?,?,?,?)", [target.id, 1, reason, interact.user.id]);
                                interact.reply({
                                    content: lang[config.lang].interact.warn[0].replace("${target}", target.displayName).replace("${reason}", reason)
                                });
                                break;
                            default:
                                if (res[0].warns < 2) {
                                    let reason = interact.options.getString("reason");
                                    let reasons = [];
                                    reasons.push(reason);
                                    reasons.push(res[0].reasons);
                                    let gived = [];
                                    gived.push(interact.user.id);
                                    gived.push(res[0].gived);
                                    pool.query("UPDATE `warns` SET warns = ?, reasons = ?, gived = ? WHERE uuid = ?", [res[0].warns + 1, JSON.stringify(reasons), JSON.stringify(gived), target.id]);
                                    interact.reply({
                                        content: lang[config.lang].interact.warn[2].replace("${target}", target.displayName).replace("${reason}", reason)
                                    });
                                } else {
                                    let reason = [];
                                    reason.push(interact.options.getString("reason"));
                                    let reasons = reason.concat(JSON.parse(res[0].reasons));
                                    let give = [];
                                    give.push(interact.user.id);
                                    let gived = give.concat(JSON.parse(res[0].gived));
                                    pool.query("UPDATE `warns` SET warns = ?, reasons = ?, gived = ? WHERE uuid = ?", [res[0].warns + 1, JSON.stringify(reasons), JSON.stringify(gived), target.id]);
                                    if (target.moderatable) target.timeout(res[0].warns * 30 * 60 * 1000, lang[config.lang].warn_timeout);
                                    interact.reply({
                                        content: lang[config.lang].interact.warn[3].replace("${target}", target.displayName).replace("${time}", res[0].warns * 30).replace("${reason}", reason)
                                    });
                                }
                                break;
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
        }
    }
});

bot.on('messageCreate', async msg => {
    if (!msg.author.bot) {
        if (msg.content.search(/https*:\/\/[db][il1]sc[o0]r[db]\.g[il1][tf][ft]/g) != -1) {
            msg.delete();
        } else if (msg.content.search(/https*:\/\/discord.(gg\/|com\/invite\/)[a-z|0-9]{1,15}/g) != -1) {
            let link = msg.content.match(/https*:\/\/discord.(gg\/|com\/invite\/)[a-z|0-9]{1,15}/g);
            pool.query("SELECT * FROM `links` WHERE link = ?", [link[0]])
                .then(([res]) => {
                    if (res.length == 0) {
                        msg.channel.send({
                            content: lang[config.lang].msg_filter.warn_link.replace("${target}", msg.author.username)
                        });

                        pool.query("SELECT * FROM `warns` WHERE uuid = ?", [msg.author.id])
                            .then(([res]) => {
                                switch (res.length) {
                                    case 0:
                                        pool.query("INSERT INTO `warns` (uuid, warns, reasons, gived) VALUES (?,?,?,?)", [msg.author.id, 1, lang[config.lang].msg_filter.reason_link, "system"]);
                                        break;
                                    default:
                                        if (res[0].warns < 2) {
                                            let reasons = [];
                                            reasons.push(lang[config.lang].msg_filter.reason_link);
                                            reasons.push(res[0].reasons);
                                            let gived = [];
                                            gived.push("system");
                                            gived.push(res[0].gived);
                                            pool.query("UPDATE `warns` SET warns = ?, reasons = ?, gived = ? WHERE uuid = ?", [res[0].warns + 1, JSON.stringify(reasons), JSON.stringify(gived), msg.author.id]);
                                        } else {
                                            let reason = [];
                                            reason.push(lang[config.lang].msg_filter.reason_link);
                                            let reasons = reason.concat(JSON.parse(res[0].reasons));
                                            let give = [];
                                            give.push("system");
                                            let gived = give.concat(JSON.parse(res[0].gived));
                                            pool.query("UPDATE `warns` SET warns = ?, reasons = ?, gived = ? WHERE uuid = ?", [res[0].warns + 1, JSON.stringify(reasons), JSON.stringify(gived), msg.author.id]);
                                            if (msg.member.moderatable) msg.member.timeout(res[0].warns * 30 * 60 * 1000, lang[config.lang].warn_timeout);
                                        }
                                        break;
                                }
                            });

                        msg.delete();
                    }
                })
        }
    }
})