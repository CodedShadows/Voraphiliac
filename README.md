# Voraphiliac

This is a bot dedicated to vore because I decided that making a project big enough like this was a good idea.

## Development status

This bot is in the "fast development" stage meaning changes will be made rapidly. Please do not expect any current features to remain the same until V1.0.0 is released. The current version is V0.X

## Self-Host

If you want to host it, just install Node.js and MySQL, clone this repository, and run `npm install` in the directory. Then, run `node index.js` to start the bot.

### ⚠ IMPORTANT NOTE

You MUST set the `configs/config.json`, `configs/responses.json` and `.env` before running, otherwise you might encounter some bugs! Make sure to remove `dist.` from the existing files.
> `.env`

```env
# prod
NODE_ENV=prod
token=
DBhost=db
DBname=voraphiliac
DBuser=voraphiliac
DBpassword=
DBrootPassword=
DBextPort=3306
```

> `configs/config.json`

```json
{
  "bot": {
    "applicationId": "0",
    "guildId": "0"
  },
  "discord": {
    "logChannel": "0",
    "suppressChannel": "0"
  },
  "emojis": {
    "success": "<:emoji:0>",
    "warning": "<:emoji:0>",
    "failure": "<:emoji:0>"
  }
}
```

> `configs/responses.json`

```json
{
  "typeOfVore": [
    "{{pred}} {{prey}}"
  ]
  // And so on and so forth
}
```
