const Entities = require('./json/entities.json');
const { EventType } = require('../model/event-type.model');

module.exports = async function(manager) {
    const events = await EventType.findAll();
    
    manager.addBetweenCondition('en', 'fromEntity', 'from', 'to');

    manager.addRegexEntity('user.id', 'en', /\<\@\!([^\>]+?)\>/gi);
    manager.addRegexEntity('channel.id', 'en', /\<\#([^\>]+?)\>/gi);

    manager.addAfterFirstCondition('en', 'memberEntity', 'member');
    manager.addBetweenCondition('en', 'memberEntity', 'member', 'to');
    manager.addBetweenCondition('en', 'memberEntity', 'member', 'into');
    manager.addBetweenCondition('en', 'memberEntity', 'member', 'from');

    events.map(item => {
        manager.addNamedEntityText(`event`, item.eventName, 'en');
    });

    Object.keys(Entities).map((key) => {
        manager.addNamedEntityText(key, Entities[key], 'en');
    });
}