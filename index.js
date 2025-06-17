const mineflayer = require('mineflayer');
const { pathfinder, Movements, goals } = require('mineflayer-pathfinder');
const { GoalBlock } = goals;
const {GoalGetToBlock} = goals;
const mineflayerViewer = require('prismarine-viewer').mineflayer
const { Vec3 } = require('vec3');


const bot = mineflayer.createBot({
  host: 'localhost',
  port: 25565,
  username: 'SigmaSnape',
  auth: 'microsoft',
  version: '1.19.4',
});

bot.loadPlugin(pathfinder)


let mcData;

bot.once('spawn', () => {
  mcData = require('minecraft-data')(bot.version);
  const defaultMove = new Movements(bot, mcData);
  bot.pathfinder.setMovements(defaultMove);

  mineflayerViewer(bot, { port: 3007, firstPerson: true});
});


bot.on("message", (message) => {
    if (message.toString().includes("tp pls " + bot.username)) {
        bot.chat("/tp Fello_live");
    }

    if (message.toString().includes("kan du bygga en plattform")) {
      bot.chat("Fixar");
      checkAllChests();
    }

});


bot.on('path_update', (r) => {
  if (r.status === 'success' && bot.viewer) {
    const path = r.path.map(p => new Vec3(p.x, p.y, p.z));
    bot.viewer.drawLine('pathLine', path, 0x00ff00);
  }
});

bot.on('path_stopped', (r) => {
  if (r.status === 'arrived' && bot.viewer) {
    bot.viewer.drawLine('pathLine', [], 0x00ff00); // Rensa linjen när vi är klara
  }
});

async function checkAllChests() {
// Hitta alla kistor inom 100 block
  const chestPositions = bot.findBlocks({
    matching: mcData.blocksByName.chest.id,
    maxDistance: 100,
    count: 10 // ändra om du vill kolla fler/färre
  });

  for (const pos of chestPositions) {
    // Kontrollera om boten redan är vid kistan
    const botPos = bot.entity.position.floored();
    if (!botPos.equals(pos)) {
      try {
        await bot.pathfinder.goto(new GoalGetToBlock(pos.x, pos.y, pos.z , 1));
      } catch (err) {
        bot.chat('Kunde inte hitta en väg till kistan på ' + JSON.stringify(pos));
        continue; // hoppa till nästa kista
      }
    }

    // Kontrollera att det är en kista
    const block = bot.blockAt(pos);
    if (!block || block.name !== 'chest') {
      bot.chat('Blocket är inte en kista!');
      continue;
    }

    // Försök öppna kistan
    try {
      const chest = await bot.openContainer(block);
      if (chest.containerItems().length === 0) {
        bot.chat(`Kistan på ${JSON.stringify(pos)} är tom!`);
      } else {
        bot.chat(`Kistan på ${JSON.stringify(pos)} innehåller saker!`);
      }
      chest.close();
    } catch (err) {
      bot.chat('Kunde inte öppna kistan: ' + err.message);
    }
  }
}
