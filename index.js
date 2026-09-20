process.on('unhandledRejection', (reason) => {
    if (reason?.message?.includes("reading 'all'")) return;
    console.error('Unhandled Rejection:', reason);
});

const { Client } = require('discord.js-selfbot-v13');
const { joinVoiceChannel, getVoiceConnection } = require('@discordjs/voice');
const client = new Client({ 
    checkUpdate: false,
    patchVoice: true 
});
const config = require('./config.json');

const TOKEN = process.env.TOKEN || config.Token;
const GUILD_ID = process.env.GUILD || config.Guild;
let CHANNEL_ID = process.env.CHANNEL || config.Channel;
const OWNER_ID = process.env.OWNER_ID || config.OwnerID;

let tempLeave = false;
let leaveTimeout = null;

client.on('ready', async () => {
    console.log(`Successfully logged in as: ${client.user.tag}`);
    joinVC();
});

client.on('voiceStateUpdate', async (oldState, newState) => {
    if (tempLeave) return;
    
    if (oldState.member.id !== client.user.id) return;
    
    if (!newState.channelId || newState.channelId !== CHANNEL_ID) {
        console.log("Detected voice state change. Rejoining target channel...");
        setTimeout(() => joinVC(), 5000);
    }
});

async function sendAndDelete(channel, content) {
    try {
        const sentMessage = await channel.send(content);
        setTimeout(async () => {
            try {
                await sentMessage.delete();
            } catch (err) {}
        }, 3000);
    } catch (error) {
        console.error("Failed to send or delete message:", error);
    }
}

client.on('messageCreate', async (message) => {
    if (message.author.id !== OWNER_ID) return;

    const content = message.content.trim();
    const lowerContent = content.toLowerCase();

    if (lowerContent === '5raj') {
        if (!message.guild) return;

        const ownerChannelId = message.member?.voice?.channelId;
        const botChannelId = message.guild.members.cache.get(client.user.id)?.voice?.channelId;

        if (ownerChannelId && botChannelId && ownerChannelId === botChannelId) {
            console.log("Leaving VC for 1 minute by owner's command.");
            tempLeave = true;

            const connection = getVoiceConnection(message.guild.id);
            if (connection) {
                connection.destroy();
            }

            if (leaveTimeout) clearTimeout(leaveTimeout);

            leaveTimeout = setTimeout(() => {
                tempLeave = false;
                console.log("1 minute up. Rejoining target VC...");
                joinVC();
            }, 60000);
        }
        return;
    }

    if (lowerContent.startsWith('aji')) {
        if (message.mentions.users.has(client.user.id)) {
            const args = content.split(/\s+/);
            const targetChannelId = args[args.length - 1];

            if (/^\d+$/.test(targetChannelId)) {
                console.log("Targeted move requested. Updating target channel to:", targetChannelId);
                
                tempLeave = false;
                if (leaveTimeout) clearTimeout(leaveTimeout);

                CHANNEL_ID = targetChannelId;
                joinVC();
                return;
            }
        }
        
        if (lowerContent === 'aji') {
            if (tempLeave) {
                console.log("aji received. Breaking 1-minute timeout early.");
                tempLeave = false;
                if (leaveTimeout) clearTimeout(leaveTimeout);
                joinVC();
            }
            return;
        }
    }

    if (lowerContent === 'hidi') return sendAndDelete(message.channel, '.v hide');
    if (lowerContent === 'unhide') return sendAndDelete(message.channel, '.v unhide');
    if (lowerContent === 'sd') return sendAndDelete(message.channel, '.v lock');
    if (lowerContent === '7l') return sendAndDelete(message.channel, '.v unlock');
    if (lowerContent === 'd') return sendAndDelete(message.channel, 'd');

    if (lowerContent === '7yd co' || lowerContent.startsWith('7yd co ')) {
        const target = content.substring(6).trim() || OWNER_ID;
        return sendAndDelete(message.channel, `.v cowner remove ${target}`);
    }
    if (lowerContent === 'perm' || lowerContent.startsWith('perm ')) {
        const target = content.substring(4).trim() || OWNER_ID;
        return sendAndDelete(message.channel, `.v perm ${target}`);
    }
    if (lowerContent === 'reject' || lowerContent.startsWith('reject ')) {
        const target = content.substring(6).trim() || OWNER_ID;
        return sendAndDelete(message.channel, `.v reject ${target}`);
    }
    if (lowerContent === 'rejecti zmar' || lowerContent.startsWith('rejecti zmar ')) {
        const target = content.substring(13).trim() || OWNER_ID;
        return sendAndDelete(message.channel, `.v reject ${target}`);
    }
    if (lowerContent === 'co' || lowerContent.startsWith('co ')) {
        const target = content.substring(2).trim() || OWNER_ID;
        return sendAndDelete(message.channel, `.v cowner add ${target}`);
    }
    if (lowerContent === 'blacklisti had w9' || lowerContent.startsWith('blacklisti had w9 ')) {
        const target = content.substring(17).trim() || OWNER_ID;
        return sendAndDelete(message.channel, `.v bl ${target}`);
    }
});

function joinVC() {
    if (tempLeave) return;

    const guild = client.guilds.cache.get(GUILD_ID);
    if (!guild) return console.error("Error: Guild ID not found. Check your Railway Variables!");
    
    const voiceChannel = guild.channels.cache.get(CHANNEL_ID);
    if (!voiceChannel) return console.error("Error: Channel ID not found. Check your Railway Variables!");

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
        console.error("Failed to join voice channel:", error);
    }
}

if (!TOKEN || TOKEN === "tokenhere" || TOKEN === "") {
    console.error("ERROR: No Token found in Railway Variables!");
} else {
    client.login(TOKEN).catch(() => {
        console.error("Login Failed! Check if your Token is still valid.");
    });
}
