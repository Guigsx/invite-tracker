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

// Método útil para criar um atraso sem bloquear todo o script.
const wait = require("timers/promises").setTimeout;

client.on("ready", async () => {
    // O evento "ready" não está totalmente pronto. Precisamos esperar um pouco.
    await wait(1000);

    // Itera sobre todos os servidores (guilds).
    client.guilds.cache.forEach(async (guild) => {
        // Obtém todos os convites do servidor.
        const firstInvites = await guild.invites.fetch();
        // Define a chave como o ID do servidor (Guild ID) e cria um mapa com o código do convite e o número de usos.
        invites.set(guild.id, new Collection(firstInvites.map((invite) => [invite.code, invite.uses])));
    });
});

client.on("inviteDelete", (invite) => {
    // Remove o convite do cache.
    invites.get(invite.guild.id).delete(invite.code);
});

client.on("inviteCreate", (invite) => {
    // Atualiza o cache com novos convites.
    invites.get(invite.guild.id).set(invite.code, invite.uses);
});

client.on("guildCreate", (guild) => {
    // Fomos adicionados a um novo servidor. Vamos obter todos os convites e salvá-los em nosso cache.
    guild.invites.fetch().then(guildInvites => {
        // Isso é semelhante ao evento "ready".
        invites.set(guild.id, new Collection(guildInvites.map((invite) => [invite.code, invite.uses])));
    });
});

client.on("guildDelete", (guild) => {
    // Fomos removidos de um servidor. Vamos excluir todos os convites desse servidor.
    invites.delete(guild.id);
});

client.on("guildMemberAdd", async (member) => {
    // Para comparar, precisamos carregar a lista de convites atual.
    const newInvites = await member.guild.invites.fetch();
    // Estes são os convites *existentes* para o servidor.
    const oldInvites = invites.get(member.guild.id);
    // Procura pelos convites nos quais o número de usos aumentou.
    const invite = newInvites.find(i => i.uses > oldInvites.get(i.code));
    // Isso é apenas para simplificar a mensagem abaixo (o convidador não possui uma propriedade tag).
    const inviter = await client.users.fetch(invite.inviter.id);
    // Obtém o canal de log (altere conforme preferir).
    const logChannel = member.guild.channels.cache.find(channel => channel.id === "1171140282633420811");
    // Uma mensagem básica com as informações que precisamos.
    inviter
        ? logChannel.send(`${member.user.tag} entrou usando o código do convite ${invite.code} de ${inviter.tag}. O convite foi usado ${invite.uses} vezes desde a sua criação.`)
        : logChannel.send(`${member.user.tag} entrou, mas não consegui encontrar através de qual convite.`);
});

client.login("MTA1ODgwOTU1NjI5OTQyMzc0NA.GehWue.gJeRHGQ0h8NHrex7jdrkw5WjcPTdfr4yonIBCY");