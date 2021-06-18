require('dotenv').config();
const { Telegraf } = require('telegraf');
const MongoClient = require('mongodb').MongoClient;

const uri = process.env.DB_URI;
const token = process.env.BOT_TOKEN;

const dbClient = new MongoClient(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});
const bot = new Telegraf(token);

bot.launch();

function escapeMessage(message) {
    return message
        .replace(/\./g, '\\.')
        .replace(/!/g, '\\.')
        .replace(/\-/g, '\\-');
}

dbClient
    .connect()
    .then(() => {
        const svgCollection = dbClient.db('Icobot-API').collection('icons-svg');
        const pngCollection = dbClient.db('Icobot-API').collection('icons-png');

        bot.start((ctx) =>
            ctx.replyWithMarkdownV2(
                escapeMessage(
                    'Welcome! I am glad to see you there. Use `/search %name%` to search for icon with `%name%.`',
                ),
            ),
        );

        bot.help((ctx) =>
            ctx.replyWithMarkdownV2(
                escapeMessage(
                    'So, what should you do: \n 1. Type `/search %name%`, where `%name%` - name of icon you want to get. \n 2. Send message. \n 3. Enjoy! You will get all icons, which are found for you. If we have such icons, of course.',
                ),
            ),
        );

        bot.command('search', async (ctx) => {
            let iconName = ctx.update.message.text.split(' ');
            iconName.shift();

            if (iconName.length === 0) {
                return ctx.replyWithMarkdownV2(
                    escapeMessage(
                        'Empty `/search` detected. Request was not processed.',
                    ),
                );
            }

            iconName = iconName.map((part) => part.toLowerCase()).join(' ');

            const foundSvgIcons = await svgCollection
                .find({
                    name: {
                        $regex: `^${iconName}`,
                    },
                })
                .toArray();

            const foundPngIcons = await pngCollection
                .find({
                    name: {
                        $regex: `^${iconName}`,
                    },
                })
                .toArray();

            const foundIcons = [...foundSvgIcons, ...foundPngIcons];

            const foundIconsFiles = foundIcons.map((icon) => {
                return {
                    name: icon.name,
                    source: icon.path,
                };
            });

            foundIconsFiles.sort((a, b) => (a.name < b.name ? -1 : 1));

            const foundIconsNumber = foundIconsFiles.length / 2;

            if (foundIconsNumber > 0) {
                ctx.replyWithMarkdownV2(
                    escapeMessage(
                        `I have found _${foundIconsNumber}_ ${
                            foundIconsNumber === 1 ? 'icon' : 'icons'
                        } for you. Here they are:`,
                    ),
                );
                for (const fileIcon of foundIconsFiles) {
                    await ctx.replyWithDocument(fileIcon);
                }
            } else {
                ctx.replyWithMarkdownV2(escapeMessage('No icon was found.'));
            }
        });
    })
    .catch((error) => console.error(error));

dbClient.close();
