const { EventType } = require('../model/event-type.model');

module.exports = async function(manager) {
    const events = await EventType.findAll();

    manager.addRegexEntity('user.id', 'en', /\<\@\!([^\>]+?)\>/gi);
    manager.addRegexEntity('channel.id', 'en', /\<\#([^\>]+?)\>/gi);

    events.map(item => {
        manager.addNamedEntityText(`event`, item.eventName, 'en');
    });
    
    manager.addDocument('en', 'no', 'answer.no');
    manager.addDocument('en', 'nevermind', 'answer.no');
    manager.addDocument('en', 'cancel', 'answer.no');
    manager.addDocument('en', 'disagree', 'answer.no');

    manager.addDocument('en', 'yes', 'answer.yes');
    manager.addDocument('en', 'agree', 'answer.yes');
    manager.addDocument('en', 'ok', 'answer.yes');
}