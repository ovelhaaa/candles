import fs from 'fs';

async function check() {
  const url = 'https://raw.githubusercontent.com/mdn/webaudio-examples/main/audio-analyser/viper.mp3';
  const res = await fetch(url);
  console.log("Status:", res.status);
  console.log("Type:", res.headers.get("content-type"));
}

check();
