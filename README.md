<img src="https://smartyfeed.me/~server/bakalariStalkin_bot_white.svg" width="30%">

A Discord bot that can send notifications containing information about a user's upcoming lesson from their timetable.
## Features
- Notifications either on class start or end
- Printing timetable for the day

## Supported services
- Majority of Bakaláří servers (with public timetable enabled)
- Soon will be added support for KOS (CTU) and SIS (Charles univerity) systems

## Config example
Create a file `config.json` in project's root
```json
{
	"token":"",
	"apiPort": 1337,
	"clientSecret": "",
	"clientId": "",
	"guildId" : ""
}
```
- token: bot's token from [`Discord developer portal`](https://discord.com/developers/applications)
- apiPort: leave as is or change to preffered port to run the API
- clientSecret: client secret from [`Discord developer portal`](https://discord.com/developers/applications)
- clientId: ID of the bot user
- guildId: ID of the guild to deploy commands using `deploy-commands.js`
## Developing
Once you've installed dependencies with `npm install` start in development mode:

```bash
npm run dev
```
## Running in production
To start a production version:
```bash
node .
```

## Deploying commands
Bot commands can be deployed either globally or to the guild specified in the configuration.

### To deploy to the configured guild
```bash
node deploy-commands.js
```
### To deploy globally
Typically, it takes about an hour to take effect.
```bash
node deploy-commands-global.js
```