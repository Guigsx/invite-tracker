const Discord = require("discord.js");
const { Client, Collection, GatewayIntentBits } = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMembers,
    ],
});

client.once('ready', async () => {
    console.log('✔ Online!');
});

const invites = new Collection();

const wait = require("timers/promises").setTimeout;

client.on("ready", async () => {
    await wait(1000);

    client.guilds.cache.forEach(async (guild) => {
        const firstInvites = await guild.invites.fetch();
        invites.set(guild.id, new Collection(firstInvites.map((invite) => [invite.code, invite.uses])));
    });
});

client.on("inviteDelete", (invite) => {
    invites.get(invite.guild.id).delete(invite.code);
});

client.on("inviteCreate", (invite) => {
    invites.get(invite.guild.id).set(invite.code, invite.uses);
});

client.on("guildCreate", (guild) => {
    guild.invites.fetch().then(guildInvites => {
        invites.set(guild.id, new Collection(guildInvites.map((invite) => [invite.code, invite.uses])));
    });
});

client.on("guildDelete", (guild) => {
    invites.delete(guild.id);
});

client.on("guildMemberAdd", async (member) => {
    const newInvites = await member.guild.invites.fetch();
    const oldInvites = invites.get(member.guild.id);

    const invite = newInvites.find(i => i.uses > oldInvites.get(i.code));
    const inviter = await client.users.fetch(invite.inviter.id);
    const logChannel = member.guild.channels.cache.find(channel => channel.id === "1171140282633420811");

    inviter
        ? logChannel.send(`${member.user.tag} entrou usando o código do convite ${invite.code} de ${inviter.tag}. O convite foi usado ${invite.uses} vezes desde a sua criação.`)
        : logChannel.send(`${member.user.tag} entrou, mas não consegui encontrar através de qual convite.`);
});

client.login("seu-token")