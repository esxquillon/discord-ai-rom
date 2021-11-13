

module.exports = class {

    constructor(response) {
        this.answer = response.answer;
        this.intent = response.intent;
        this.entities = response.entities.filter(this.removeDimentions);
    }

    removeDimentions(i) {
        return i.entity !== 'dimension';
    }

    async parse(fn) {
        const events = this.entities.filter(i => i.entity === 'event');
        const time = this.entities.filter(i => i.entity === 'time');
        const users = this.entities.filter(i => i.entity === 'user.id');
        const channel = this.entities.filter(i => i.entity === 'channel.id');
        const me = this.entities.filter(i => i.entity === 'meKeyword');
        const all = this.entities.filter(i => i.entity === 'allKeyword');
        const hashtag = this.entities.filter(i => i.entity === 'hashtag');
        const member = this.entities.filter(i => i.entity === 'memberEntity');
        await fn(this.intent, this.answer, {
            events,
            time,
            users,
            channel,
            me: me.length !== 0,
            all: all.length !== 0,
            hashtag,
            member
        });
    }

};