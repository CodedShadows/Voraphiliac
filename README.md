# Voraphiliac
This is a bot dedicated to vore because I decided that making a project big enough like this was a good idea. If you want to host it, just install Node.js and MySQL, clone this repository, and run `npm install` in the directory. Then, run `node index.js` to start the bot.

**IMPORTANT NOTE**: You MUST set the configs/config.json and configs/responses.json before running, otherwise you might encounter some bugs!
```json
{
  "bot": {
    "applicationId": "0",
    "guildId": "0",
    "token": "token"
  },
  "discord": {
    "logChannel": "0",
    "suppressChannel": "0"
  },
  "emojis": {
    "success": "<:emoji:0>",
    "warning": "<:emoji:0>",
    "failure": "<:emoji:0>"
  },
  "mysql": {
    "host": "host",
    "user": "username",
    "password": "password",
    "database": "database"
  }
}
```

```json
{
  "typeOfVore": [
    "{{pred}} {{prey}}"
  ]
  // And so on and so forth
}
```