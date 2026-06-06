const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');

const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = "1509139975290097746";
const GUILD_ID = "1484978246238994482";
const LOG_KANAL_ID = "1491745736243675288";

// Güncellenmiş Rol ID'leri:
const MODERATOR_EKIBI = "1485187846259085402";
const ORDU_GENERALI = "1484983795663900803";
const KIDEMLI_ORDU_GENERALI = "1484983859492945940";

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers, GatewayIntentBits.MessageContent] });

const commands = [
    new SlashCommandBuilder().setName('destek-kur').setDescription('Destek panelini kurar').setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
].map(c => c.toJSON());

client.once('ready', async () => {
    const rest = new REST({ version: '10' }).setToken(TOKEN);
    await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: commands });
    console.log('Destek botu aktif!');
});

client.on('interactionCreate', async interaction => {
    if (interaction.isChatInputCommand() && interaction.commandName === 'destek-kur') {
        const embed = new EmbedBuilder()
            .setTitle('Destek Merkezi')
            .setDescription('İhtiyacına göre aşağıdaki butonlardan seçim yapabilirsin.')
            .setColor(0x00FF00);
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('ticket_discord').setLabel('Discord Destek').setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId('ticket_oyun').setLabel('Oyun Destek').setStyle(ButtonStyle.Secondary)
        );
        await interaction.reply({ embeds: [embed], components: [row] });
    }

    if (interaction.isButton()) {
        const isDiscord = interaction.customId === 'ticket_discord';
        // Oyun Destek durumunda Ordu Generali ve Kıdemli Ordu Generali etiketleniyor
        const taglar = isDiscord ? `<@&${MODERATOR_EKIBI}>` : `<@&${ORDU_GENERALI}> <@&${KIDEMLI_ORDU_GENERALI}>`;
        
        const channel = await interaction.guild.channels.create({
            name: `ticket-${interaction.user.username}`,
            permissionOverwrites: [
                { id: interaction.guild.id, deny: ['ViewChannel'] },
                { id: interaction.user.id, allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory'] },
                { id: interaction.guild.roles.everyone.id, deny: ['ViewChannel'] }
            ]
        });

        const closeRow = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('close_ticket').setLabel('Bileti Kapat').setStyle(ButtonStyle.Danger));
        await channel.send({ content: `${taglar}, ${interaction.user} bir destek talebi açtı!`, components: [closeRow] });
        
        await interaction.reply({ content: `Destek talebiniz açıldı: ${channel}`, ephemeral: true });
        
        const log = interaction.guild.channels.cache.get(LOG_KANAL_ID);
        if (log) log.send(`🎫 **${isDiscord ? 'Discord' : 'Oyun'} Destek** talebi açıldı. Açan: ${interaction.user.tag}`);
    }

    if (interaction.isButton() && interaction.customId === 'close_ticket') {
        const log = interaction.guild.channels.cache.get(LOG_KANAL_ID);
        if (log) log.send(`🔒 **${interaction.channel.name}** kapatıldı.`);
        interaction.reply('Kanal 5 saniye içinde siliniyor...');
        setTimeout(() => interaction.channel.delete(), 5000);
    }
});

client.login(TOKEN);
