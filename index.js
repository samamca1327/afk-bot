const mineflayer = require('mineflayer')
const fs = require('fs');
const { keep_alive } = require("./keep_alive");
keep_alive();
let rawdata = fs.readFileSync('config.json');
let data = JSON.parse(rawdata);
var pi = 3.14159;
var host = data["ip"];
var username = data["name"];
var retryDelay = 3000;
var reconnecting = false;
process.on('uncaughtException', function (err) {
  console.log(`Beklenmedik hata: ${err.message}`);
  scheduleReconnect();
});
process.on('unhandledRejection', function (reason) {
  console.log(`Hata: ${reason}`);
});
function scheduleReconnect() {
  if (reconnecting) return;
  reconnecting = true;
  setTimeout(() => {
    reconnecting = false;
    createBot();
  }, retryDelay);
}
function createBot() {
  var connected = 0;
  var afkInterval = null;
  var ended = false;
  console.log(`${host} sunucusuna bağlanılıyor...`);
  var bot;
  try {
    bot = mineflayer.createBot({ host: host, username: username, hideErrors: false });
  } catch (e) {
    console.log(`Bot oluşturulamadı: ${e.message}`);
    scheduleReconnect();
    return;
  }
  function doAntiAfk() {
    if (!connected) return;
    try {
      var yaw = Math.random() * pi * 2 - pi;
      var pitch = Math.random() * pi - (0.5 * pi);
      bot.look(yaw, pitch, false);
      var action = Math.floor(Math.random() * 6);
      if (action === 0) { bot.setControlState('forward', true); setTimeout(() => { try { bot.setControlState('forward', false); } catch(e) {} }, 800); }
      else if (action === 1) { bot.setControlState('back', true); setTimeout(() => { try { bot.setControlState('back', false); } catch(e) {} }, 800); }
      else if (action === 2) { bot.setControlState('left', true); setTimeout(() => { try { bot.setControlState('left', false); } catch(e) {} }, 800); }
      else if (action === 3) { bot.setControlState('right', true); setTimeout(() => { try { bot.setControlState('right', false); } catch(e) {} }, 800); }
      else if (action === 4) { bot.setControlState('jump', true); setTimeout(() => { try { bot.setControlState('jump', false); } catch(e) {} }, 500); }
      else { bot.setControlState('sneak', true); setTimeout(() => { try { bot.setControlState('sneak', false); } catch(e) {} }, 600); }
    } catch (e) {}
  }
  bot.on('login', function () { console.log("Giriş yapıldı ✓"); });
  bot.on('spawn', function () {
    connected = 1;
    console.log("Dünyaya spawn oldu — anti-AFK aktif ✓");
    if (afkInterval) clearInterval(afkInterval);
    afkInterval = setInterval(doAntiAfk, 3000 + Math.random() * 2000);
  });
  function cleanup() {
    if (ended) return;
    ended = true;
    connected = 0;
    if (afkInterval) { clearInterval(afkInterval); afkInterval = null; }
    try { bot.quit(); } catch(e) {}
    scheduleReconnect();
  }
  bot.on('kicked', function (reason) { console.log(`Atıldı: ${reason}`); cleanup(); });
  bot.on('error', function (err) { console.log(`Hata: ${err.message}`); cleanup(); });
  bot.on('end', function () { console.log("Bağlantı kesildi — yeniden bağlanılıyor..."); cleanup(); });
}
createBot();
