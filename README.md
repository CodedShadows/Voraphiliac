# Voraphiliac
This is a bot dedicated to vore because I decided that making a project big enough like this was a good idea.

## Development status
This bot is in the "fast development" stage meaning changes will be made rapidly. Please do not expect any current features to remain the same until Version 1.x is released. The current version can be found in the package.json or in commit messages.

## Hosting
If you want to host the bot on your own server, you can do so by following the instructions below.
### Prerequisites
In order to properly operate this project, you will need the following:
   - MySQL Server (8.0+)
   - NodeJS (16.x+)
   - Discord application with a bot token

### Installation
Once you have obtained the following prerequites, install the project by running the following commands.
```
git clone https://github.com/CodedShadows/Voraphiliac.git && cd Voraphiliac
```
```
npm install --production
```
**Note: Read the section below this once you've reached the last command. You cannot run the bot normally if you don't follow the steps listed down there.**
```
npm start
```

### Startup Requirements
You MUST set the `configs/config.json`, `configs/responses.json` and `.env` files up before running, otherwise you might encounter some bugs! Make sure to remove `dist.` from the existing files.
> `configs/config.json`

```json
{
  "bot": {
    "applicationId": "0",
    "guildId": "0",
    "token": "token"
  },
  "database": {
    "host": "host",
    "username": "username",
    "password": "password",
    "database": "database"
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
    "Use {{pred}} and {{prey}} to represent character names"
  ]
  // And so on and so forth (Make sure to remove this line as comments are not allowed in JSON)
}
```
