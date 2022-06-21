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
        }
    ])
});

bot.on('interactionCreate', interact => {
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
                })
            }
            case "mute": {
                let target = interact.options.getMember("user");
                let time = interact.options.getNumber("time");
                let reason = interact.options.getString("reason");
                if (target.moderatable) {
                    target.timeout(time*60*1000, reason);
                    interact.reply({
                        content: lang[config.lang].interact.mute.replace("${target}", target.displayName).replace("${time}", time).replace("${reason}", reason)
                    });
                } else {
                    interact.reply({
                        content: lang[config.lang].err_not_permission,
                        ephemeral: true
                    });
                }
            }
        }
    }
})