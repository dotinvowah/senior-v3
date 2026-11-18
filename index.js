process.on('unhandledRejection', (reason) => {
    if (reason?.message?.includes("reading 'all'")) return;
    console.error('Unhandled Rejection:', reason);
});

const { Client } = require('discord.js-selfbot-v13');
const { joinVoiceChannel } = require('@discordjs/voice');

let config = {};
try {
    config = require('./config.json');
} catch {}

const TOKEN = process.env.TOKEN || config.Token;
const GUILD_ID = process.env.GUILD || config.Guild;
const CHANNEL_ID = process.env.CHANNEL || config.Channel;

const client = new Client({
    checkUpdate: false,
    patchVoice: true
});

function joinVC() {
    const guild = client.guilds.cache.get(GUILD_ID);
    if (!guild) return console.error('Error: Guild ID not found. Check your variables!');

    const voiceChannel = guild.channels.cache.get(CHANNEL_ID);
    if (!voiceChannel) return console.error('Error: Channel ID not found. Check your variables!');

    try {
        joinVoiceChannel({
            channelId: voiceChannel.id,
            guildId: guild.id,
            adapterCreator: guild.voiceAdapterCreator,
            selfDeaf: false,
            selfMute: true
        });
        console.log(`Joined VC: ${voiceChannel.name} in ${guild.name}`);
    } catch (error) {
        console.error('Failed to join voice channel:', error);
    }
}

client.on('ready', () => {
    console.log(`Successfully logged in as: ${client.user.tag}`);
    joinVC();
});

// If moved, disconnected, or kicked from the channel, go straight back.
client.on('voiceStateUpdate', (oldState, newState) => {
    if (newState.id !== client.user.id) return;
    if (newState.guild?.id !== GUILD_ID) return;

    if (newState.channelId !== CHANNEL_ID) {
        console.log('Moved or disconnected. Rejoining target channel...');
        joinVC();
    }
});

if (!TOKEN || TOKEN === 'tokenhere') {
    console.error('ERROR: No Token found in variables!');
    process.exit(1);
}

client.login(TOKEN).catch((err) => {
    console.error('Login Failed! Check if your Token is still valid.', err?.message || '');
    process.exit(1);
});
