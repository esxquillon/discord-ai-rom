module.exports = async function(manager) {
    manager.addDocument('en', 'im your master', 'register.master');
    manager.addDocument('en', 'you are my servant', 'register.master');
    manager.addDocument('en', 'your my assistant', 'register.master');
    manager.addDocument('en', 'lets do a contract', 'register.master');
    manager.addDocument('en', 'ill be your master from now on', 'register.master');

    manager.addAnswer('en', 'register.master', 'Master im looking for you~');
    manager.addAnswer('en', 'register.master', 'Its great to have a master');
    manager.addAnswer('en', 'register.master', 'I will serve you.. master~');


    manager.addDocument('en', 'add a new event run for', 'create.event');
    manager.addDocument('en', 'create a new event run for', 'create.event');
    manager.addDocument('en', 'set schedule for event run', 'create.event');
    manager.addDocument('en', 'make a new event run for', 'create.event');
    manager.addDocument('en', 'lets create a new event run', 'create.event');
    manager.addDocument('en', 'prepair for a new event run', 'create.event');
    manager.addDocument('en', 'create a new run', 'create.event');

    manager.addAnswer('en', 'create.event', 'I created a new run for {event} please check here {channel}, thanks~');

    manager.addDocument('en', 'update the event for', 'update.event');
    manager.addDocument('en', 'change the event status', 'update.event');
    manager.addDocument('en', 'change the event date and time', 'update.event');
    manager.addDocument('en', 'change the event for', 'update.event');

    manager.addAnswer('en', 'update.event', 'I updated the event {event} please see in {channel}, thanks~');

    manager.addDocument('en', 'remove the event run %hashtag%', 'delete.event');
    manager.addDocument('en', 'cancel the event run %hashtag%', 'delete.event');
    manager.addDocument('en', 'delete his event run %hashtag%', 'delete.event');
    manager.addDocument('en', 'can you remove this event run %hashtag%', 'delete.event');
    manager.addDocument('en', 'please cancel this event run %hashtag%', 'delete.event');

    manager.addAnswer('en', 'delete.event', '{event} has been deleted, thanks~');

    manager.addDocument('en', 'remove this member %memberEntity%%user.id% from event run %hastag%', 'remove.user.event');
    manager.addDocument('en', 'delete this member %memberEntity%%user.id% from event run %hastag%', 'remove.user.event');
    manager.addDocument('en', 'can you remove this this member %memberEntity%%user.id% from event runs %hastag%', 'remove.user.event');
    manager.addDocument('en', 'remove me from event run %hastag%', 'remove.user.event');
    manager.addDocument('en', 'remove me on event runs %hastag%', 'remove.user.event');

    manager.addAnswer('en', 'remove.user.event', 'I update the lists on runs {event}, thanks~');

    manager.addDocument('en', 'check every single members here', 'record.users');
    manager.addDocument('en', 'remember all the memebrs here', 'record.users');
    manager.addDocument('en', 'know all members here', 'record.users');
    manager.addDocument('en', 'memorize all the members', 'record.users');
    manager.addDocument('en', 'get all the members', 'record.users');
    manager.addDocument('en', 'check the new members and user', 'record.users');
    
    manager.addAnswer('en', 'record.users', 'Master my head is starting to hurt~');
    manager.addAnswer('en', 'record.users', 'Master all the members that i know is on my data now~');
    manager.addAnswer('en', 'record.users', 'All the members are saved in my memory~');

    manager.addDocument('en', 'join the this member into event run', 'join.user.event');
    manager.addDocument('en', 'and also join this member to event run', 'join.user.event');
    manager.addDocument('en', 'join this to event run %number%', 'join.user.event');
    manager.addDocument('en', 'join those members to event run', 'join.user.event');
    manager.addDocument('en', 'accept those members to event run', 'join.user.event');
    manager.addDocument('en', 'accept this members to event run', 'join.user.event');
    manager.addDocument('en', 'include this member to this event run %hashtag%', 'join.user.event');
    manager.addDocument('en', 'include me into run %hashtag%', 'join.user.event');

    manager.addAnswer('en', 'join.user.event', 'Added {members} into runs {event}, thanks~');

    manager.addDocument('en', 'remember this channel is for the event form', 'register.channel');
    manager.addDocument('en', 'this %channel.id% is for event', 'register.channel');
    manager.addDocument('en', 'this %channel.id% is your channel', 'register.channel');
    manager.addDocument('en', 'make this %channel.id% for you', 'register.channel');
    manager.addDocument('en', 'you are fee to post here %channel.id%', 'register.channel');
    manager.addDocument('en', '%channel.id% this is yours now', 'register.channel');
    manager.addDocument('en', '%channel.id% this will be yours', 'register.channel');
    manager.addDocument('en', 'take this %channel.id%', 'register.channel');

    manager.addAnswer('en', 'register.channel', 'Thank you master~');

    manager.addDocument('en', 'forget about this %channel.id%', 'remove.channel');
    manager.addDocument('en', 'leave on this %channel.id%', 'remove.channel');
    manager.addDocument('en', 'get away on this %channel.id%', 'remove.channel');

    manager.addAnswer('en', 'remove.channel', 'Ok master~');

}