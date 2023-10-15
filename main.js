const Apify = require('apify');
const helpers = require('./helpers');
const { log } = Apify.utils;
const { sleep } = Apify.utils;
const moment = require('moment');


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
    page.on('console', message =>
        log.info(`${message.text()}`));
    await page.goto('https://www.olbg.com/betting-tips/Football/1');
    await sleep(10000);//load stuff?
    await puppeteer.injectJQuery(page);
    const rawEvents = await page.evaluate((currentDate) => {
        let rawEvents = [];
        $('#tipsListingContainer-Match').find('.tip ').each((idx, row) => {
            const sportId = $(row).attr('data-vc_sport_id');
            if (sportId === '1') {
                let evt = {};
                evt.homeAway = $(row).find('.event-name').first().find('a.tn-trigger').text();//
                evt.countryLeague = $(row).find('.event-league-name').first().text().trim();
                evt.outcome = $(row).find('.selection-name ').find('a.tn-trigger').text();
                evt.experts = $(row).find('.experts-count').text();
                evt.market = $(row).find('.market-name').text();
                evt.ts = $(row).find('.event-date').attr('content');
                evt.odd = $(row).find('.odds').first().attr('odddecimal').trim();
                evt.tips = $(row).find('.tips').first().text().trim();
                evt.confidence = $(row).find('.confidence-count').first().text().trim();
                evt.numComments = $(row).find('.comments-count-holder').first().text().trim();
                evt.numStars = $(row).find('.sti').first().attr('style').trim();
                evt.id = $(row).attr('data-vc_event_id')
                rawEvents.push(evt);
            }
        });
        return rawEvents;
    }, today);
    log.info(` rawEvents:${rawEvents.length}`);
    const events = rawEvents.map((raw, idx) => {
        let rObj = raw;
        rObj.payload = {};
        rObj.predictions = [];
        rObj.home = helpers.extractHomeAway(rObj.homeAway).h;
        rObj.away = helpers.extractHomeAway(rObj.homeAway).a;
        rObj.predictions = helpers.extractPrediction(rObj.home, rObj.away, rObj.outcome, rObj.market);
        rObj.koTime = rObj.ts;
        rObj.payload.experts = helpers.experts(rObj.experts);
        rObj.payload.odd = helpers.extractOdd(rObj.odd);
        rObj.payload.numTips = helpers.tips(rObj.tips).num;
        rObj.payload.totalTips = helpers.tips(rObj.tips).total;
        rObj.payload.confidence = helpers.confidence(rObj.confidence);
        rObj.payload.numComments = helpers.comments(rObj.numComments);
        rObj.payload.stars = helpers.stars(rObj.numStars);
        delete rObj.homeAway;
        delete rObj.outcome;
        delete rObj.ts;
        delete rObj.tips;
        delete rObj.confidence;
        delete rObj.numComments;
        delete rObj.experts;
        delete rObj.market;
        delete rObj.odd;
        delete rObj.numStars;
        return rObj;
    }).filter( ev => ev.predictions.length === 1);//only the ones with one prediction
    events.forEach((ev, idx, events) => {
        //log.info(`[${ev.countryLeague}] ${ev.koTime} ${ev.home} vs ${ev.away} - Market:${ev.predictions[0].market}, Outcome:${ev.predictions[0].outcome}`);
        log.info(`${idx + 1}/${events.length} ID: ${ev.id} - [${ev.countryLeague}] ${ev.koTime} ${ev.home} vs ${ev.away}`);
        log.info(` - Predictions:${ev.predictions.length}`);
        ev.predictions.forEach((pr)=>{
            log.info(`   - Market:${pr.market} Outcome:${pr.outcome}`);
            pr.payload = ev.payload;
        });
        log.info(` - Payload: Tips:${ev.payload.numTips}/${ev.payload.totalTips} confidence:${ev.payload.confidence} comments:${ev.payload.numComments} stars:${ev.payload.stars}`);
        delete ev.payload;
    });
    const output = {
        data: events
    };
    await Apify.setValue('OUTPUT', JSON.stringify(output), { contentType: 'application/json; charset=utf-8' });
    let hrend = process.hrtime(hrstart);
    log.info(`Time:${hrend[0]} seconds and ${hrend[1] / 1000000} ms`)
});
