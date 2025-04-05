const Apify = require('apify');
const helpers = require('./helpers');
const { log } = Apify.utils;
const { sleep } = Apify.utils;
const moment = require('moment');
const crypto = require('crypto');

const { isDocker } = Apify.utils;
const { puppeteer } = Apify.utils;


log.setOptions({
    logger: new log.LoggerText({
        skipTime: false
    }),
    level: log.LEVELS.DEBUG
});

Apify.main(async () => {
    const inDocker = await isDocker(false);
    log.info(`In docker: ${inDocker ? 'yes' : 'no'}`);
    let hrstart = process.hrtime();
    const today = moment().add(1, 'days').format('DD/MM');//yyyy-MM-dd
    const browser = await Apify.launchPuppeteer({
        launchOptions: {
            headless: true,
            args: ['--no-sandbox', 'disable-setuid-sandbox'],
        }
    });
    const page = await browser.newPage();

    page.on('console', message => {
        const messageTxt = message.text();
        if (messageTxt.includes('[olbg]')) log.info(`${message.text()}`);
    });
    await page.exposeFunction('parseExperts', helpers.experts);
    await page.exposeFunction('parseCountryLeague', helpers.findCountryLeague);
    await page.exposeFunction('extractHomeAway', helpers.extractHomeAway);
    await page.exposeFunction('extractPrediction', helpers.extractPrediction);
    await page.exposeFunction('parseDate', helpers.parseDate);
    await page.exposeFunction('stars', helpers.stars);
    await page.exposeFunction('tips', helpers.tips);

    await page.goto('https://www.olbg.com/best-tipsters/Football/1');
    await sleep(1000);//load stuff?
    await puppeteer.injectJQuery(page);
    const controller = {
        rawEvents: [],
        events: []
    }
    const tipsterLinks = await page.evaluate(() => {
        const links = [];
        const allDivs = document.getElementsByClassName('tpstr');
        for (let i = 0; i < allDivs.length; i++) {
            const currentDiv = allDivs[i];
            links.push(currentDiv.getElementsByClassName('h-rst-lnk')[0].href);
        }
        return links;
    });
    log.info(`[olbg] Found ${tipsterLinks.length} links`);
    for (let i = 0; i < tipsterLinks.length; i++) {
        log.info(`[olbg] Going to ${tipsterLinks[i]}`);
        await page.goto(tipsterLinks[i]);
        await sleep(5000);//load stuff?
        const tsName = await page.evaluate(async () => {
            return document.getElementsByClassName('pg-title')[0].innerText;
        });
        const tsId = helpers.getTipster(tipsterLinks[i]);
        const tipsSterEvents = await page.evaluate(async (tipster) => {
            const events = [];
            var mainList = document.getElementById('tipsterListingContainer');
            if (!mainList) {
                console.log(`[olbg] -  No events`);
                return [];
            }
            var allEvents = mainList.getElementsByTagName('li');
            for (let j = 0; j < allEvents.length; j++) {//per event
                const match = { id: '', home: '', away: '', countryLeague: '', koTime: '', predictions: [] }
                const controller = {
                    rawOutcome: allEvents[j].getElementsByTagName('h4')[0].innerText,
                    rawMarket: allEvents[j].getElementsByClassName('market')[0].innerText,
                    experts: 0,
                    winTips: 0,
                    allTips: 0,
                    percentage: 0,
                    numComments: 0,
                    stars: 0,
                    time: '',
                    preds: [],
                    fact: ''
                }
                if (allEvents[j].getElementsByClassName('h-readable') && allEvents[j].getElementsByClassName('h-readable').length > 0) {
                    controller.fact = allEvents[j].getElementsByClassName('h-readable')[0].innerText
                }
                if (allEvents[j].getElementsByClassName('h-rst-lnk') && allEvents[j].getElementsByClassName('h-rst-lnk').length > 0) {
                    const event = allEvents[j].getElementsByClassName('h-rst-lnk')[0].innerText;
                    const eventLink = allEvents[j].getElementsByClassName('h-rst-lnk')[0].href;
                    match.countryLeague = await parseCountryLeague(event, eventLink);
                    const { h, a } = await extractHomeAway(event);
                    match.home = h;
                    match.away = a;
                }
                if (allEvents[j].getElementsByClassName('exp') && allEvents[j].getElementsByClassName('exp').length > 0) {
                    controller.experts = await parseExperts(allEvents[j].getElementsByClassName('exp')[0].innerText);
                }
                if (allEvents[j].getElementsByTagName('time').length > 0) {
                    match.koTime = await parseDate(allEvents[j].getElementsByTagName('time')[0].getAttribute('content'));
                }
                if (allEvents[j].getElementsByClassName('filled') && allEvents[j].getElementsByClassName('filled').length > 0) {
                    controller.stars = await stars(allEvents[j].getElementsByClassName('filled')[0].getAttribute('style'));
                }

                if (allEvents[j].getElementsByClassName('win') && allEvents[j].getElementsByClassName('win').length > 0) {
                    const { num, total, percentage, comments } = await tips(allEvents[j].getElementsByClassName('win')[0].innerText);
                    controller.allTips = total;
                    controller.winTips = num;
                    controller.percentage = percentage;
                    controller.numComments = comments;
                }

                // comments -> allEvents[0].getElementsByClassName('win')[0].innerText '4/11 Win Tips\n36%\n2 comments'
                console.log(`[olbg]  - KO:${match.koTime} [${match.countryLeague}] ${match.home} vs ${match.away}`);
                console.log(`[olbg]  - Finding predictions from ${controller.rawMarket}/${controller.rawOutcome} (${controller.stars} stars, ${controller.experts} experts ${controller.winTips} tips out of ${controller.allTips} (${controller.percentage} %) comments:${controller.numComments})`);
                controller.preds = await extractPrediction(match.home, match.away, controller.rawOutcome, controller.rawMarket);
                controller.preds = controller.preds.map((pred) => { return { ...pred, payload: { tsName: tipster.tsName.replace('\nFootball Tips\nFollow', '').trim(), tsId: tipster.tsId, fact: controller.fact.trim(), experts: controller.experts, winTips: controller.winTips, allTips: controller.allTips,percentage:controller.percentage,comments:controller.numComments,stars:controller.stars } } });
                controller.preds.forEach((pred) => console.log(`[olbg]   - ${pred.market} / ${pred.outcome}`));
                if (controller.preds.length > 0) {
                    match.predictions = controller.preds;
                    events.push(match);
                }
            }
            return events;
        }, { tsName, tsId });
        controller.rawEvents = controller.rawEvents.concat(tipsSterEvents);
    }
    controller.rawEvents = controller.rawEvents.map(ev => {
        const extId = crypto.createHash('md5').update(`${ev.koTime}_${ev.home}_${ev.away}`).digest('hex');
        return { ...ev, id: extId };
    });
    const groupedEvents = new Map();
    controller.rawEvents.forEach((rawEvent) => {
        const currentEvt = groupedEvents.get(rawEvent.id);
        if (currentEvt) {//it's already there
            currentEvt.predictions = currentEvt.predictions.concat(rawEvent.predictions);
        } else {
            groupedEvents.set(rawEvent.id, rawEvent);
        }
    });
    //group the events here.
    for (let [key, value] of groupedEvents) {
        log.info(`[olbg] ${key} [${value.koTime} ${value.countryLeague}] ${value.home} vs ${value.away} ${value.predictions.length}`);
        controller.events.push(value);
    }
    const output = {
        data: controller.events
    };
    const kvName = `olbg-com-${moment().format('YYYY-MM-DD-HH-mm-SS')}`;//yyyy-MM-dd
    await Apify.setValue(kvName, JSON.stringify(output), { contentType: 'application/json; charset=utf-8' });
    let hrend = process.hrtime(hrstart);
    log.info(`Time:${hrend[0]} seconds and ${hrend[1] / 1000000} ms`)
});
