let Discord = require("discord.js")
let axios = require("axios")
let fs = require("fs")
let Bot = new Discord.Client()
let prefix = "!"
const util = require('util')
const exec = util.promisify(require('child_process').exec)
let Embed = function(Des, fields) {
    const Emb = new Discord.MessageEmbed();
    Emb.setDescription(Des)
    Emb.setColor(0x3498DB)
    Emb.setFooter(Bot.user.username, Bot.user.displayAvatarURL())
    if (fields) {
        Emb.addFields(fields)
    }
    Emb.setTitle("coronavirus bot")
    Emb.setTimestamp()
    return Emb
}
function RandomString(length) {
    var result           = ''
    var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'
    var charactersLength = characters.length
    for ( var i = 0; i < length; i++ ) {
       result += characters.charAt(Math.floor(Math.random() * charactersLength))
    }
    return result
}
let Commands = {}
function addcommand(name, callback, DmsOnly) {
    Commands[prefix + name] = {callback: callback, DmsOnly: DmsOnly || false}
}
let Filter = function(name) {
    const ValueName = name
    return function(ValName) {
        if (ValName === ValueName) {
            return false
        } else {
            return true
        }
    }
}
Bot.on("message", function(message) {
    const args = message.content.split(" ");
    const Sender = message.author.id
    const Mention = message.mentions.users.first()
    if (args[0].startsWith(prefix)) {
        const CommandName = args[0]
        if (Commands[CommandName]) {
            if (message.channel.type !== (Commands[CommandName].DmsOnly && "dm" || "text")) return
            if (Mention && Mention.bot) {
                message.channel.send(Embed("The user is a bot"))
                return
            }
            try {
                Commands[CommandName].callback(message, args.filter(Filter(CommandName)))
            }
            catch (err) {
                message.channel.send(Embed("There was an error in the command dm stroketon about it"))
                err.name = `${CommandName}`
                console.log(`${err.stack}`)
            }
        }
    }
})
async function Obfuscate(Script) {
    let FileName = RandomString(10)
    let File = `./${FileName}.lua`
    fs.writeFileSync(File, Script)
    try {
        await exec(`lua ZeroTolerance.lua ${File}`)
        var Results = fs.readFileSync("./" + FileName + "-obfuscated.lua", {encoding: "utf8"})
        fs.unlinkSync(File)
    } catch(err) {
        fs.unlinkSync(File)
        throw err
    }
    return Results, FileName

}
String.prototype.replaceAll = function (find, replace) {
    var str = this.toString();
    return str.replace(new RegExp(find.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'g'), replace);
};
function GetServer() {
    return Bot.guilds.cache.find(guild => guild.id === "703446036231749722")
}
addcommand("obfuscate", async function(msg, args) {
    if (!GetServer().member(msg.author.id).roles.cache.has("703468579223240753")) {
        msg.channel.send(Embed("You are not whitelisted"))
        return
    }
    if (!args[0]) {
        msg.channel.send(Embed("Please submit a codeblock or file"))
        return
    }
    if (!msg.attachments.first()) {
        console.log("a")
        var Script = args.join(" ")
        if (Script.split("\n").length !== 1) {
            let Lines = Script.split("\n")
            if (Lines[0].search("```") == -1) {
                return
            }
            Lines.splice(0, 1)
            Lines.pop()
            Script = Lines.join("\n")
        }
    } else {
        var Attachment = msg.attachments.first()
        let Response = await axios({
            method: "get",
            url: Attachment.url
        })
        Script = Response.data
    }
    try {
        msg.channel.startTyping()
        var a, b = await Obfuscate(Script)
        await msg.channel.send({files: [{
            attachment: __dirname + "\\" + b + "-obfuscated.lua",
            name: b + "-obfuscated.lua"
        }]})
        fs.unlinkSync("./" + b + "-obfuscated.lua")
        msg.channel.stopTyping()
    } catch (err) {
        let aaa = err.toString().split("\n")[1]
        msg.channel.send(Embed(`Syntax error\n\`\`\`${aaa}\`\`\``))
        msg.channel.stopTyping()
    }
}, true)
Bot.login("")