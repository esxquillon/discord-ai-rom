const Discord = require('discord.js');
const cron = require('node-cron');
const natural = require('natural');
const { Op } = require('sequelize');
const { NlpManager } = require('node-nlp');
const DateTime = require('date-and-time');

const InitializeAiKeywords = require('./ai.keywords');
const InitializeAiMessages = require('./ai.messages');
const IntializeAiResponder = require('./answer.message');
const EntityParser = require('./entity.parser');

const { User } = require('../model/user.model');
const { Channel } = require('../model/channel.model');
const { ChannelType } = require('../model/channel-type.model');
const { EventType } = require('../model/event-type.model');
const { RunsEvent } = require('../model/runs-event.model');

Object.defineProperty(Array.prototype, 'chunk_inefficient', {
    value: function(chunkSize) {
        var list = this;
        const middleIndex = Math.ceil(list.length / chunkSize);

        const firstHalf = list.splice(0, middleIndex);   
        const secondHalf = list.splice(-middleIndex);
        return [firstHalf, secondHalf];
    }
});

Array.prototype.max = function() {
    return Math.max.apply(null, this);
};

module.exports = async function main() {
    const client = new Discord.Client({ partials: ['MESSAGE', 'CHANNEL', 'REACTION'] });

    const manager = new NlpManager({ languages: ['en'], forceNER: true });
    await InitializeAiKeywords(manager);
    await InitializeAiMessages(manager);
    await manager.train();

    const responder = new NlpManager({ languages: ['en'], forceNER: true });
    await IntializeAiResponder(responder);
    await responder.train();

    cron.schedule('0 0 1 * * *', async () => {
        RunsEvent.findAll().then(result => {
            const sessions = result.reduce((obj, item) => {
                if(!obj[item.channelId]) {
                    obj[item.channelId] = [];
                }
                obj[item.channelId].push(item);
                return obj;
            }, {});
            const ids = Object.keys(sessions);
            client.channels.cache.filter(channel => ids.includes(channel.id)).map(async channel => {
                const session = sessions[channel.id];
                for(let sess of session) {
                    const message = await channel.messages.fetch(sess.session);
                    if(message.deletable && !message.deleted) {
                        message.delete();
                    }
                    await sess.destroy();
                }
            });
        }).catch(console.error);
    });
    
    
    client.once('ready', () => {
        console.log('Ready!');
    });

    client.on('messageReactionRemove', async (reaction, user) => {
        if (reaction.partial) {
            try {
                await reaction.fetch();
            } catch (error) {
                console.error('Something went wrong when fetching the message: ', error);
                return;
            }
        }

        if(user.username !== 'Alicel') {
            const messageData = await RunsEvent.findOne({
                where: { session: reaction.message.id }
            });
            if(messageData !== null) {
                const db = messageData.get();
                const data = JSON.parse(db.data);
                if(data.values.includes(user.id)) {
                    const index = data.values.indexOf(user.id);
                    data.values.splice(index, 1);
                    messageData.update({
                        data: JSON.stringify(data)
                    });
                    reaction.message.edit(generateEmbedRun(db.id, data, db.type.split(',').reduce((o, i) => {
                        o[i] = true;
                        return o;
                    }, {})));
                }
            }
        }
    });
    
    client.on('messageReactionAdd', async (reaction, user) => {
        if (reaction.partial) {
            try {
                await reaction.fetch();
            } catch (error) {
                console.error('Something went wrong when fetching the message: ', error);
                return;
            }
        }

        if(user.username !== 'Alicel') {
            const messageData = await RunsEvent.findOne({
                where: { session: reaction.message.id }
            });
            if(messageData !== null) {
                const db = messageData.get();
                const data = JSON.parse(db.data);
                if(![...data.values, ...data.fixed].includes(user.id) && data.max !== data.values.length + data.fixed.length) {
                    data.values.push(user.id);
                    messageData.update({
                        data: JSON.stringify(data)
                    });
                    const isReady = data.max === data.values.length + data.fixed.length;
                    await reaction.message.edit(generateEmbedRun(db.id, data, db.type.split(',').reduce((o, i) => {
                        o[i] = true;
                        return o;
                    }, {}), isReady));
                    if(isReady) {
                        await reaction.message.reactions.removeAll();
                    }
                }
            }
        }
    });
    
    client.on('message', async message => {
        if(message.author.id === client.user.id) {
            return;
        }

        // Mention match
        if(new RegExp(`\<\@\!${client.user.id}\>`, 'g').test(message.content)) {
            const cleanMessage = message.content.replace(new RegExp(`\<\@\!${client.user.id}\>`, 'g'), '');
            const tokenizer = new natural.WordTokenizer();
            const packet = tokenizer.tokenize(cleanMessage);

            if(packet.length !== 0) {
                const response = await manager.process('en', cleanMessage);
                const parse = new EntityParser(response);

                await parse.parse(async (intent, answer, entities) => {
                    const userLists = await User.findAll();
                    const targetUser = await User.findOne({ where: { userId: message.author.id } });

                    if(intent === 'register.master') {
                        if(userLists.length === 0) {
                            await User.create({ userId: message.author.id, type: 'MASTER' });
                            await EventType.create({ eventName: 'et', memberCount: 6 });
                            await EventType.create({ eventName: 'vr', memberCount: 6 });
                            await EventType.create({ eventName: 'ora', memberCount: 6 });
                            await EventType.create({ eventName: 'ttn', memberCount: 12 });
                            await EventType.create({ eventName: 'boc', memberCount: 6 });
                            message.channel.send(answer);
                        } else if(targetUser && targetUser.type === 'MASTER') {
                            message.channel.send('Yes you are my master~');
                        } else {
                            message.channel.send('Im sorry i have my master already.');
                        }
                    } else if(targetUser) {
                        switch(intent) {
                            case 'create.event':
                                let createEventLists = [...entities.events];
                                const availableChannels = await ChannelType.findAll({ type: 'EVENTS' }).then(result => {
                                    return result.map(i => i.channelId.toString());
                                });

                                if(availableChannels.length === 0) {
                                    await message.channel.send('Master i don\'t have room 😞');
                                    break;
                                }

                                if(createEventLists.length === 0) {
                                    const filter = m => m.author.id === message.author.id
                                    const questionEvent = await message.channel.send('Master what kind of run?');
                                    const answerEvent = await questionEvent.channel.awaitMessages(filter, { max: 1, time: 60000 });
                                    const masterAnswer = await responder.process('en', answerEvent.first().content);
                                    createEventLists = masterAnswer.entities.filter(i => i.entity === 'event');

                                    if(masterAnswer.intent === 'answer.no') {
                                        break;
                                    } else if(createEventLists.length === 0) {
                                        message.channel.send('Think about on it master~');
                                        break;
                                    }
                                }

                                await message.channel.send('Creating forms~');
                                await Promise.all(client.channels.cache.filter(channel => {
                                    return availableChannels.includes(channel.id);
                                }).map(async channel => {
                                    const eventRun = createEventLists.map(i => i.option);
                                    const maxParties = await EventType.findAll({ where: { eventName: {
                                        [Op.in]: eventRun
                                    } } }).then(result => {
                                        return result.map(i => i.memberCount).max();
                                    });
                                    const createEvent = async (time) => {
                                        const data = {
                                            max: maxParties,
                                            time: time ? time + ' ~ ' : '',
                                            values: [],
                                            fixed: [
                                                ...(entities.me ? [message.author.id] : []),
                                                ...entities.users.map(i => getIdFromMetion(i.sourceText))
                                            ]
                                        };
                                        
                                        const createdEvent = await RunsEvent.create({
                                            channelId: channel.id,
                                            type: eventRun.join(','),
                                            data: JSON.stringify(data),
                                            status: 'PROGRESS'
                                        });
    
                                        const msg = await channel.send(generateEmbedRun(createdEvent.id, data, eventRun.reduce((obj, item) => {
                                            obj[item] = true;
                                            return obj;
                                        }, {})));
    
                                        await msg.react('👍');
                                        await createdEvent.update({
                                            session: msg.id
                                        });
                                    };

                                    if(entities.time.length !== 0) {
                                        await Promise.all(entities.time.map(i => {
                                            return Promise.all(i.resolution.values.map(async t => {
                                                const time = DateTime.transform(t.value, 'HH:mm:ss', 'hA');
                                                await createEvent(time);
                                            }));
                                        }));
                                    } else {
                                        await createEvent();
                                    }

                                    await message.channel.send(answer.replace(/\{([a-zA-Z0-9]+?)\}/g, function(m) {
                                        const replacer = {
                                            '{event}': eventRun.map(i => i.toUpperCase()).join(' and '),
                                            '{channel}': `<#${channel.id}>`
                                        };
                                        return replacer[m];
                                    }));
                                    
                                }));
                                break;
                            case 'update.event':
                                
                                message.channel.send(answer);
                                break;
                            case 'delete.event':
                                const removeEvent = async (messageData) => {
                                    await Promise.all(messageData.map(item => {
                                        return Promise.all(client.channels.cache.filter(channel => channel.id === item.channelId).map(async channel => {
                                            const msg = await channel.messages.fetch(item.session);
                                            if(msg.deletable && !msg.deleted) {
                                                msg.delete();
                                            }
                                            await item.destroy();
                                        }));
                                    }));
                                };
                                if(entities.all) {
                                    const messageData = await RunsEvent.findAll();
                                    await message.channel.send('Ok master, please wait...');
                                    await removeEvent(messageData);
                                    if(messageData.length === 0) {
                                        await message.channel.send('Master i din\'t see the events that you mention~');
                                    } else {
                                        await message.channel.send(answer.replace(/\{[a-zA-Z0-9]+?\}/g, (match) => {
                                            const replacer = {
                                                '{event}': 'All events'
                                            };
                                            return replacer[match];
                                        }));
                                    }
                                } else {
                                    let hashtag = entities.hashtag.map(i => {
                                        return parseInt(i.resolution.value.replace(/^\#/g, ''));
                                    });
                                    if(hashtag.length === 0) {
                                        const filter = m => m.author.id === message.author.id
                                        const questionEvent = await message.channel.send('Which runs master?');
                                        const answerEvent = await questionEvent.channel.awaitMessages(filter, { max: 1, time: 60000 });
                                        const masterAnswer = await responder.process('en', answerEvent.first().content);
                                        createEventLists = masterAnswer.entities.filter(i => i.entity === 'hashtag');
                                        if(masterAnswer.intent === 'answer.no') {
                                            break;
                                        } else if(createEventLists.length === 0) {
                                            message.channel.send('Think about on it master~');
                                            break;
                                        }
                                        hashtag = createEventLists.map(i => {
                                            return parseInt(i.resolution.value.replace(/^\#/g, ''));
                                        });
                                    }
                                    const messageData = await RunsEvent.findAll({
                                        where: { id: { [Op.in]: hashtag } }
                                    });
                                    await removeEvent(messageData);
                                    if(messageData.length === 0) {
                                        await message.channel.send('Master i din\'t see the events that you mention~');
                                    } else {
                                        await message.channel.send(answer.replace(/\{[a-zA-Z0-9]+?\}/g, (match) => {
                                            const replacer = {
                                                '{event}': hashtag.map(i => '#' + hashtag).join(', ')
                                            };
                                            return replacer[match];
                                        }));
                                    }
                                }
                                break;
                            case 'record.users':

                                message.channel.send(answer);
                                break;
                            case 'join.user.event':
                            case 'remove.user.event':
                                console.log(intent);

                                let hashtagRunNumber = entities.hashtag.map(i => {
                                    return parseInt(i.resolution.value.replace(/^\#/g, ''));
                                });
                                const members = [
                                    ...[...entities.member, ...entities.users].map(i => {
                                        return getIdFromMetion(i.sourceText);
                                    }),
                                    ...(entities.me ? [message.author.id] : [])
                                ];
                                if(members.length === 0) {
                                    message.channel.send('I can’t get my head around it!');
                                    break;
                                }
                                if(hashtagRunNumber.length === 0) {
                                    const filter = m => m.author.id === message.author.id
                                    const questionEvent = await message.channel.send('Which run number master?');
                                    const answerEvent = await questionEvent.channel.awaitMessages(filter, { max: 1, time: 60000 });
                                    const masterAnswer = await responder.process('en', answerEvent.first().content);
                                    const createEventLists = masterAnswer.entities.filter(i => i.entity === 'hashtag');
                                    if(masterAnswer.intent === 'answer.no') {
                                        break;
                                    } else if(createEventLists.length === 0) {
                                        message.channel.send('Think about on it master~');
                                        break;
                                    }
                                    hashtagRunNumber = createEventLists.map(i => {
                                        return parseInt(i.resolution.value.replace(/^\#/g, ''));
                                    });
                                }

                                const eventLists = await RunsEvent.findAll({
                                    where: { id: { [Op.in]: hashtagRunNumber } }
                                });

                                if(eventLists.length === 0) {
                                    message.channel.send('I can’t find any runs that you mention master~');
                                    break;
                                }

                                const updateBoard = async (eventId, channelId, sessionId, data, eventRun) => {
                                    await client.channels.cache.filter(channel => channel.id === channelId).map(async channel => {
                                        const message = await channel.messages.fetch(sessionId);
                                        message.edit(generateEmbedRun(eventId, data, eventRun.reduce((obj, item) => {
                                            obj[item] = true;
                                            return obj;
                                        }, {})));
                                    });
                                };

                                await Promise.all(eventLists.map(async item => {
                                    const data = JSON.parse(item.data);
                                    if(intent === 'join.user.event') {
                                        members.map(i => {
                                            const indexValues = data.values.indexOf(i);
                                            const indexFixed = data.fixed.indexOf(i);
                                            if(indexValues === -1 && indexFixed === -1) {
                                                data.fixed.push(i);
                                            }
                                        });
                                        await item.update({
                                            data: JSON.stringify(data)
                                        });
                                        await updateBoard(item.id, item.channelId, item.session, data, item.type.split(','));
                                    } else {
                                        const data = JSON.parse(item.data);
                                        members.map(i => {
                                            const indexValues = data.values.indexOf(i);
                                            const indexFixed = data.fixed.indexOf(i);
                                            if(indexValues !== -1) {
                                                data.values.splice(indexValues, 1);
                                            }
                                            if(indexFixed !== -1) {
                                                data.fixed.splice(indexFixed, 1);
                                            }
                                        });
                                        await item.update({
                                            data: JSON.stringify(data)
                                        });
                                        await updateBoard(item.id, item.channelId, item.session, data, item.type.split(','));
                                    }
                                }));

                                await message.channel.send(answer.replace(/\{[a-zA-Z0-9]+?\}/g, (m) => {
                                    const replacer = {
                                        '{event}': hashtagRunNumber.map(i => `#${i}`).join(', '),
                                        '{members}': members.map(i => {
                                            if(!isNaN(i)) {
                                                return `<@!${i}>`
                                            } else {
                                                return i;
                                            }
                                        }).join(', ')
                                    };
                                    return replacer[m];
                                }));
                                break;
                            case 'register.channel':
                                if(entities.channel.length !== 0) {
                                    await Promise.all(entities.channel.map(async item => {
                                        const channelId = item.sourceText.replace(/^\<\#|\>$/g, '');
                                        await Channel.findOrCreate({ where: { channelId, channelName: '' } });
                                        await ChannelType.findOrCreate({
                                            where: { channelId, type: 'EVENTS' }
                                        });
                                    }));
                                    await message.channel.send(answer);
                                } else {
                                    message.channel.send('Master?');
                                }
                                break;
                            case 'remove.channel':
                                if(entities.channel.length !== 0) {
                                    Promise.all(entities.channel.map(async item => {
                                        const channelId = item.sourceText.replace(/^\<\#|\>$/g, '');
                                        await ChannelType.destroy({
                                            where: { channelId: message.channel.id, type: 'EVENTS' }
                                        });
                                        await Channel.destroy({ where: { channelId, channelName: '' } });
                                    }));
                                    await message.channel.send(answer);
                                } else {
                                    message.channel.send('Master?');
                                }
                                break;
                            default:
                                const randUnknownMessage = [
                                    'I (just) don’t get it!',
                                    'It makes no sense to me!',
                                    'It’s a mystery to me!',
                                    'It’s completely beyond me!',
                                    'I can’t get my head around it!'
                                ];
                                const random = Math.floor(Math.random() * randUnknownMessage.length);
                                message.channel.send(randUnknownMessage[random]);
                        }
                    } else {
                        const randMessage = [
                            'Im not taking any command except from my master..',
                            'Im sorry~',
                            'Leave me alone!!'
                        ];
                        const random = Math.floor(Math.random() * randMessage.length);
                        message.channel.send(randMessage[random]);
                    }
                });

            }/* else {
                let filter = m => m.author.id === message.author.id

                const q = await message.channel.send('yes master?');

                q.channel.awaitMessages(filter, { max: 1 }).then(m => {
                    const c = m.first();

                    console.log(c);

                }).catch(console.log);
            }*/
        }
    });
    
    client.login('ODMyMTUwNTE0MDU2NTYwNjUw.YHfmjw.3L5LBFffELtTQ7Awl6DloP6rW0g');
    // client.login('ODMyODY1NTg0MjIzNDg1OTkz.YHqAhQ.SAMZGO54ZPatp3YtPHiVnwQ7G8A');
};

function getIdFromMetion(mention) {
    return mention.replace(new RegExp(`^\<\@(\!|)|\>$`, 'g'), '');
}

function generateEmbedRun(id, data, eventRun, isReady) {
    // const lists = [...data.fixed, ...data.values];
    const partyMembers = [...data.values];
    const fixedMembers = data.max === 12 ? [...data.fixed].chunk_inefficient(2) : [...data.fixed];
    let members = [...Array(data.max).keys()].map(index => {
        let mention = '---';
        let separator = '';

        if(data.max === 12) {
            if(index >= 0 && index <= 5) {
                if(fixedMembers[0].length !== 0) {
                    const item = fixedMembers[0].shift();
                    mention = !isNaN(item) ? `<@${item}>` : item;
                } else if(partyMembers.length !== 0) {
                    const item = partyMembers.shift();
                    mention =!isNaN(item) ? `<@${item}>` : item;
                }
            } else if(index >= 6 && index <= 11) {
                if(fixedMembers[1].length !== 0) {
                    const item = fixedMembers[1].shift();
                    mention =!isNaN(item) ? `<@${item}>` : item;
                } else if(partyMembers.length !== 0) {
                    const item = partyMembers.shift();
                    mention = !isNaN(item) ? `<@${item}>` : item;
                }
            }
        } else {
            if(fixedMembers.length !== 0) {
                const item = fixedMembers.shift();
                mention = !isNaN(item) ? `<@${item}>` : item;
            } else if(partyMembers.length !== 0) {
                const item = partyMembers.shift();
                mention = !isNaN(item) ? `<@${item}>` : item;
            }
        }

        if(data.max === 12) {
            if(index === 0) {
                separator = 'TEAM 1\r\n';
            } else if(index === 6) {
                separator = '\r\nTEAM 2\r\n';
            }
        }
        return `${separator}${(index % 6) + 1}. ${mention}`;
    });

    
    
    const exampleEmbed = new Discord.MessageEmbed()
        .setColor('#0099ff')
        .setTitle(`${data.time}Run for ${Object.keys(eventRun).map(i => i.toUpperCase()).join(' and ')} - #${id}`)
        // .setURL('https://discord.js.org/')
        .setAuthor('ᵐˢ᭄ᴀʟɪᴢ', 'https://i.imgur.com/dq9GWaK.png'/*, 'https://discord.js.org'*/)
        .setDescription(`Party Members (In-Progress)\r\n\r\n${members.join('\r\n')}\r\n`)
        .setThumbnail(/*'https://i.imgur.com/t9dKXek.jpg'*/'https://i.imgur.com/T7L1SF2.png')
        // .addFields(
        //     { name: '\u200B', value: '\u200B' },
        // )
        // .addField('Inline field title', 'Some value here', true)
        // .setImage('https://i.imgur.com/wSTFkRM.png')
        // .setTimestamp()
        .setFooter(isReady ? 'Team is ready~' : 'Please "(👍) THUMBS UP" if you want to join on this run~');
    return exampleEmbed;
}