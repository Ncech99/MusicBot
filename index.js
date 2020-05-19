const Discord = require("discord.js");
const { prefix, token } = require("./config.json");
const ytdl = require("ytdl-core");

const client = new Discord.Client();

const queue = new Map();

client.once("ready", () => {
  console.log("VeloBot is running...");
});

client.once("reconnecting", () => {
  console.log("Reconnecting!");
});

client.once("disconnect", () => {
  console.log("Disconnect!");
});

client.on("message", async message => {
  if (message.author.bot) return;
  if (!message.content.startsWith(prefix)) return;

  const serverQueue = queue.get(message.guild.id);

  if (message.content.startsWith(`${prefix}play`)) {
    execute(message, serverQueue);
    return;
  } else if (message.content.startsWith(`${prefix}skip`)) {
    skip(message, serverQueue);
    return;
  } else if (message.content.startsWith(`${prefix}stop`)) {
    stop(message, serverQueue);
    return;
  } else if (message.content.startsWith(`${prefix}pause`)) {
    pause(message, serverQueue)
    return;
  } else if (message.content.startsWith(`${prefix}resume`)) {
    resume(message, serverQueue)
    return;
  } else if (message.content.startsWith(`${prefix}nowplaying`)) {
    nowPlaying(message, serverQueue)
    return;
  } else if (message.content.startsWith(`${prefix}queue`)) {
    songQueue(message, serverQueue)
    return;
  } else if (message.content.startsWith(`${prefix}restart`)) {
    restart(message, serverQueue)
    return;
  } else if (message.content.startsWith(`${prefix}clear`)) {
    clear(message, serverQueue)
    return; 
  } else if (message.content.startsWith(`${prefix}search`)) {
    search(message, serverQueue)
    return; 
  } else if (message.content.startsWith(`${prefix}f`)) {
    search(message, serverQueue)
    return; 
  } else if (message.content.startsWith(`${prefix}p`)) {
    execute(message, serverQueue);
    return;
  } else if (message.content.startsWith(`${prefix}s`)) {
    skip(message, serverQueue);
    return;
  } else if (message.content.startsWith(`${prefix}r`)) {
    resume(message, serverQueue)
    return;
  } else if (message.content.startsWith(`${prefix}np`)) {
    nowPlaying(message, serverQueue)
    return;
  } else if (message.content.startsWith(`${prefix}q`)) {
    songQueue(message, serverQueue)
    return;
  }
    else {
    message.channel.send("Hey stupid not a valid command!");
  }
});
async function execute(message, serverQueue) {
  const args = message.content.split(" ");

  const voiceChannel = message.member.voice.channel;
  if (!voiceChannel)
    return message.channel.send(
      "Hop in a channel to play music!"
    );
  const permissions = voiceChannel.permissionsFor(message.client.user);
  if (!permissions.has("CONNECT") || !permissions.has("SPEAK")) {
    return message.channel.send(
      "Yo dawg I need permissions join and speak in your voice channel!"
    );
  }
  const songInfo = await ytdl.getInfo(args[1]);
  const song = {
    title: songInfo.title,
    url: songInfo.video_url
  };
                                                  
  if (!serverQueue) {
    const queueContruct = {
      textChannel: message.channel,
      voiceChannel: voiceChannel,
      connection: null,
      songs: [],
      volume: 1,
      playing: true
    };

    queue.set(message.guild.id, queueContruct);

    queueContruct.songs.push(song);

    try {
      var connection = await voiceChannel.join();
      queueContruct.connection = connection;
      play(message.guild, queueContruct.songs[0]);
    } catch (err) {
      console.log(err);
      queue.delete(message.guild.id);
      return message.channel.send(err);
    }
  } else {
    serverQueue.songs.push(song);
    return message.channel.send(`${song.title} has been added to the queue!`);
  }
}

function skip(message, serverQueue) {
  if (!message.member.voice.channel)
    return message.channel.send(
      "You have to be in a voice channel to skip the song!"
    );
  if (!serverQueue)
    return message.channel.send("There is no song that I could skip!"
    );
  serverQueue.connection.dispatcher.end();
}
function stop(message, serverQueue) {
  if (!message.member.voice.channel)
    return message.channel.send(
      "You have to be in a voice channel to stop the music!"
    );
  serverQueue.songs = [];
  serverQueue.connection.dispatcher.end();
}
function pause(message, serverQueue) {
    if(!message.member.voice.channel)
    return message.channel.send(
        "You have to be in a voice channel to pause the song!"
    );
    if(!serverQueue)
    return message.channel.send("There is no song to pause!"
    );
    serverQueue.connection.dispatcher.pause();
}
function resume(message, serverQueue) {
    if(!message.member.voice.channel)
    return message.channel.send(
        "You have to be in a voice channel to resume the song!"
    );
    if(!serverQueue)
    return message.channel.send("There is no song to resumme!"
    );
    serverQueue.connection.dispatcher.resume();
}
function nowPlaying(message, serverQueue) {
    if(!serverQueue)
    return message.channel.send("There is no song that is playing!"
    );
    return message.channel.send(`Now playing: ${serverQueue.songs[0].title}`);
    
}
function songQueue(message, serverQueue) {
    if(!message.member.voice.channel)
    return message.channel.send(
        "You have to be in a channel to view the Queue!"
    );
    if(!serverQueue)
    return message.channel.send("There is no song playing!"
    );
    var queueOutput;
    var count = 1;
    serverQueue.songs.forEach(entry =>{
      queueOutput = count + ". " + entry.title;
      message.channel.send(queueOutput);
      count++;
    });
    
}
function restart(message, serverQueue) {
      message.channel.send("VeloBot restarting..."
      );
       serverQueue.voiceChannel.leave();
       process.exit();
}
function clear(message, serverQueue) {
  if (!message.member.voice.channel)
    return message.channel.send(
      "You have to be in a voice channel to clear the Queue!"
    );
  serverQueue.songs = [];
  message.channel.send("The Queue has been cleared!")
}
function search(message, serverQueue) {
  if (!message.member.voice.channel)
  return message.channel.send(
    "You have to be in a voice channel to search for a song!"
  );
}
function play(guild, song) {
  const serverQueue = queue.get(guild.id);
  if(!song) {
    serverQueue.voiceChannel.leave();
    queue.delete(guild.id);
    return;
  }
  const dispatcher = serverQueue.connection
    .play(ytdl(song.url))
    .on("finish", () => {
      serverQueue.songs.shift();
      play(guild, serverQueue.songs[0]);
    })
    .on("error", error => console.error(error));
  dispatcher.setVolumeLogarithmic(serverQueue.volume / 5);
  serverQueue.textChannel.send(`Started playing: **${song.title}**`);
 }

client.login(token);