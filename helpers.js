const Apify = require('apify');
const { log } = Apify.utils;

const extractHomeAway = (homeAway) => {
    let split = homeAway.split(' v ');
    return {
        h: split[0].trim(),
        a: split[split.length - 1].trim()
    }
};


const extractId = (link) => {
    return link.split('event_id=')[1].trim();
}


const extractExactResult = (home, away, outcome) => {
    const winner = outcome.split('#')[0].trim();
    const result = outcome.split('#')[1].trim();
    if (winner === home) return [{ market: 'EXR', outcome: result }];
    if (winner === away) {
        const exR = result.split('-');
        return [{ market: 'EXR', outcome: `${exR[1]}-${exR[0]}` }];
    }
    return [{ market: 'EXR', outcome: `0-0` }];
}

const extractPrediction = (home, away, outcome, rawMarket) => {
    log.info(` ${home} vs ${away} rawMarket:${rawMarket} outcome:${outcome}`);
    switch (rawMarket) {
        case '':
            if (outcome === 'Draw') return [{ market: 'HDA', outcome: 'D' }];
            if (home === outcome) return [{ market: 'HDA', outcome: 'H' }];
            if (away === outcome) return [{ market: 'HDA', outcome: 'A' }];
            if (outcome === 'Over +2.50') return [{ market: 'UO25', outcome: 'O' }];
            if (outcome === `${home} +1.50`) return [{ market: 'HDAH', outcome: 'H+1.50' }];
            if (outcome === `${away} +1.50`) return [{ market: 'HDAH', outcome: 'A+1.50' }];
            if (outcome === `${home} +1.00`) return [{ market: 'HDAH', outcome: 'H+1.00' }];
            if (outcome === `${away} +1.00`) return [{ market: 'HDAH', outcome: 'A+1.00' }];
            if (outcome === `${home} -1.00`) return [{ market: 'HDAH', outcome: 'H-1.00' }];
            if (outcome === `${away} -1.00`) return [{ market: 'HDAH', outcome: 'A-1.00' }];
            if (outcome === `${home} +1.25`) return [{ market: 'HDAH', outcome: 'H+1.25' }];
            if (outcome === `${away} +1.25`) return [{ market: 'HDAH', outcome: 'A+1.25' }];
            if (outcome === `${home} +0.50`) return [{ market: 'HDAH', outcome: 'H+0.50' }];
            if (outcome === `${away} +0.50`) return [{ market: 'HDAH', outcome: 'A+0.50' }];
            if (outcome === `${home} -0.75`) return [{ market: 'HDAH', outcome: 'H-0.75' }];
            if (outcome === `${away} -0.75`) return [{ market: 'HDAH', outcome: 'A-0.75' }];
            if (outcome === `${home} +0.75`) return [{ market: 'HDAH', outcome: 'H+0.75' }];
            if (outcome === `${away} +0.75`) return [{ market: 'HDAH', outcome: 'A+0.75' }];
            if (outcome === `${home} -0.50`) return [{ market: 'HDAH', outcome: 'H-0.50' }];
            if (outcome === `${away} -0.50`) return [{ market: 'HDAH', outcome: 'A-0.50' }];
            if (outcome === `${home} +0.25`) return [{ market: 'HDAH', outcome: 'H+0.25' }];
            if (outcome === `${away} +0.25`) return [{ market: 'HDAH', outcome: 'A+0.25' }];
            if (outcome.includes('#')) return extractExactResult(home, away, outcome);
            if (outcome.includes(`Draw or ${away}`)) return [{ market: 'DCH', outcome: 'DA' }];
            if (outcome.includes(`${home} or Draw`)) return [{ market: 'DCH', outcome: 'HD' }];
            if (outcome.includes(`Over 2.75`)) return [{ market: 'UO275', outcome: 'O' }];
            if (outcome.includes(`Under 2.75`)) return [{ market: 'UO275', outcome: 'U' }];
            if (outcome.includes(`Over 3.00`)) return [{ market: 'UO300', outcome: 'O' }];
            if (outcome.includes(`Under 3.00`)) return [{ market: 'UO300', outcome: 'U' }];
            if (outcome.includes(`Under +2.50`)) return [{ market: 'UO250', outcome: 'U' }];
            if (outcome.includes(`Over +2.50`)) return [{ market: 'UO250', outcome: 'O' }];
            if (outcome.includes(`${away} - ${away}`)) return [{ market: 'HTFT', outcome: 'AA' }];
            if (outcome.includes(`${home} - ${home}`)) return [{ market: 'HTFT', outcome: 'HH' }];
            if (outcome.includes(`${home} - ${away}`)) return [{ market: 'HTFT', outcome: 'HA' }];
            if (outcome.includes(`${away} - ${home}`)) return [{ market: 'HTFT', outcome: 'AH' }];
            if (outcome.includes(`Draw - Draw`)) return [{ market: 'HTFT', outcome: 'DD' }];
            if (outcome.includes(`${home} - Draw`)) return [{ market: 'HTFT', outcome: 'HD' }];
            if (outcome.includes(`Draw - ${home}`)) return [{ market: 'HTFT', outcome: 'DH' }];
            if (outcome.includes(`${away} - Draw`)) return [{ market: 'HTFT', outcome: 'AD' }];
            if (outcome.includes(`Draw - ${away}`)) return [{ market: 'HTFT', outcome: 'DA' }];
            if (outcome === 'Over 3.00') return [{ market: 'UO25', outcome: 'O' }];
            //none matched
            return [];
        case 'Both Teams to Score':
            if (outcome === 'Yes') return [{ market: 'BTTS', outcome: 'Y' }];
            if (outcome === 'No') return [{ market: 'BTTS', outcome: 'N' }];
        case 'Result and BTTS':
            let predictions = [{ market: 'HDA', outcome: '' }, { market: 'BTTS', outcome: '' }];
            const both = outcome.split(' & ');
            const hdaOutcome = both[0].trim();
            if (hdaOutcome === 'Draw') predictions[0].outcome = 'D'
            if (home === hdaOutcome) predictions[0].outcome = 'H'
            if (away === hdaOutcome) predictions[0].outcome = 'A'
            const bttsOutcome = both[1].trim();
            if (bttsOutcome === 'Yes') predictions[1].outcome = 'Y'
            if (bttsOutcome === 'No') predictions[1].outcome = 'N'
            return predictions;
        case 'Draw No Bet':
            if (home === outcome) return [{ market: 'DNB', outcome: 'H' }];
            if (away === outcome) return [{ market: 'DNB', outcome: 'A' }];
        case 'First Goalscorer':
            return [{ market: 'FGS', outcome: outcome }];
        case 'Half Time Result':
            if (outcome === 'Draw') return [{ market: 'HTR', outcome: 'D' }];
            if (home === outcome) return [{ market: 'HTR', outcome: 'H' }];
            if (away === outcome) return [{ market: 'HTR', outcome: 'A' }];
        case '1st Half AH':
            if (outcome === `${home} -0.50`) return [{ market: 'HDAHH', outcome: 'H-0.50' }];
            if (outcome === `${away} -0.50`) return [{ market: 'HDAHH', outcome: 'A-0.50' }];
        case '1st Half Goals':
            if (outcome === `Under 1.25`) return [{ market: 'UOFH125', outcome: 'U' }];
            if (outcome === `Over 1.25`) return [{ market: 'UOFH125', outcome: 'O' }];
        case 'Win To Nil':
            if (outcome.includes(`${away}`)) return [{ market: 'WTN', outcome: 'A' }];
            if (outcome.includes(`${home}`)) return [{ market: 'WTN', outcome: 'H' }];
        case 'Score in Both Halves':
            if (outcome.includes(`${away}`)) return [{ market: 'SBH', outcome: 'A' }];
            if (outcome.includes(`${home}`)) return [{ market: 'SBH', outcome: 'H' }];
        case 'Clean Sheet':
            if (outcome.includes(`${away} - Yes`)) return [{ market: 'CS', outcome: 'AY' }];
            if (outcome.includes(`${home} - Yes`)) return [{ market: 'CS', outcome: 'HY' }];
            if (outcome.includes(`${away} - No`)) return [{ market: 'CS', outcome: 'AN' }];
            if (outcome.includes(`${home} - No`)) return [{ market: 'CS', outcome: 'HN' }];
        case 'Half Time Score':
            const exHTResults = extractExactResult(home, away, outcome);
            exHTResults[0].market = 'HTS';
            return exHTResults;
    }
    return ret;
};


const parseDate = (rawDate) => {
    let splitD = rawDate.split('T');//yyyy-MM-dd
    let splitT = splitD[1].split(':');
    return `${splitD[0]} ${splitT[0]}:${splitT[1]}`
};

const tips = (rawTips) => {
    let splitD = rawTips.split('/');
    let num = parseInt(splitD[0]);
    let splitK = splitD[1].split('Win');
    let total = parseInt(splitK[0]);
    return {
        num: num,
        total: total
    };
};

const confidence = (rawConfidence) => {
    return parseInt(rawConfidence.replace(/% ?/g, ""));
};

const comments = (rawComments) => {
    if (rawComments.trim().length === 0) return 0;
    return parseInt(rawComments.replace(/% comments/g, ""));
};

const extractOdd = (rawOdd) => {
    if (rawOdd.length === 0) return 0;
    const rawFloat = parseFloat(rawOdd);
    return Math.round(rawFloat * 100);
}

const stars = (width) => {
    switch (width) {
        case 'width: 0%':
            return 0;
        case 'width: 20%':
            return 1;
        case 'width: 40%':
            return 2;
        case 'width: 60%':
            return 3;
        case 'width: 80%':
            return 4;
        case 'width: 100%':
            return 5;
        default:
            return 0;
    }
};

const experts = (experts) => {
    const ret = parseInt(experts.trim().split(' ')[0]);
    if (isNaN(ret)) return 0;
    return ret;
}


module.exports = { extractHomeAway, extractPrediction, parseDate, tips, confidence, comments, stars, experts, extractOdd,extractId };
