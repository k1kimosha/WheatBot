var config = require("./config.json");

var lang = {
    "en": require("./localization/en.json"),
    "ru": require("./localization/ru.json"),
    "ua": require("./localization/ua.json")
};

var commands = [
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
        name: "mute",
        description: lang[config.lang].cmds.mute.cmd,
        type: "CHAT_INPUT",
        defaultPermission: false,
        options: [
            {
                name: "user",
                description: lang[config.lang].cmds.mute.user,
                type: "USER",
                required: true
            },
            {
                name: "time",
                description: lang[config.lang].cmds.mute.time,
                type: "NUMBER",
                required: true
            },
            {
                name: "reason",
                description: lang[config.lang].cmds.mute.reason,
                type: "STRING",
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
                description: lang[config.lang].cmds.unmute.user,
                type: "USER",
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
                description: lang[config.lang].cmds.warn.user,
                type: "USER",
                required: true
            },
            {
                name: "reason",
                description: lang[config.lang].cmds.warn.reason,
                type: "STRING",
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
                description: lang[config.lang].cmds.unwarn.user,
                type: "USER",
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
                description: lang[config.lang].cmds.links.add,
                type: "STRING",
                required: false
            },
            {
                name: "remove",
                description: lang[config.lang].cmds.links.remove,
                type: "STRING",
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
                description: lang[config.lang].cmds.words.add,
                type: "STRING",
                required: false
            },
            {
                name: "remove",
                description: lang[config.lang].cmds.words.remove,
                type: "STRING",
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
];

module.exports = { commands };