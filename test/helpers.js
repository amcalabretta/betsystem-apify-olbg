const helpers = require('../helpers');

var assert = require('assert');

describe('Helpers', () => {

    describe('extractHomeAway', () => {
        it('should parse corretly home and away', () => {
            assert.strictEqual(helpers.extractHomeAway('Brighton v Liverpool').h, 'Brighton');
            assert.strictEqual(helpers.extractHomeAway('Brighton v Liverpool').a, 'Liverpool');
        });
    });

    describe('getTipster', () => {
        it('should parse corretly ', () => {
            assert.strictEqual(helpers.getTipster('https://www.olbg.com/best-tipsters/Football/1/511157'), 511157);
        });
    });


    describe('extractPrediction', () => {
        it('should parse corretly HDA (normal case)', () => {
            assert.strictEqual(helpers.extractPrediction('Augsburg', 'Darmstadt', 'Darmstadt', '')[0].outcome, 'A');
            assert.strictEqual(helpers.extractPrediction('Augsburg', 'Darmstadt', 'Darmstadt', '')[0].market, 'HDA');
        });
        // vs  rawMarket: outcome:
        it('should parse corretly HDA (with FTR)', () => {
            assert.strictEqual(helpers.extractPrediction('Wycombe', 'Cheltenham', 'Cheltenham', 'Full Time Result')[0].outcome, 'A');
            assert.strictEqual(helpers.extractPrediction('Wycombe', 'Cheltenham', 'Cheltenham', 'Full Time Result')[0].market, 'HDA');
        });
        it('should parse corretly HDA (Draw)', () => {
            assert.strictEqual(helpers.extractPrediction('Coventry', 'Norwich', 'Draw', '')[0].outcome, 'D');
            assert.strictEqual(helpers.extractPrediction('Coventry', 'Norwich', 'Draw', '')[0].market, 'HDA');
        });
        it('should parse corretly Extact result (away)', () => {
            assert.strictEqual(helpers.extractPrediction('Estoril', 'Benfica', 'Benfica #3-0', '')[0].outcome, '0-3');
            assert.strictEqual(helpers.extractPrediction('Estoril', 'Benfica', 'Benfica #3-0', '')[0].market, 'EXR');
        });

        it('should parse corretly U/O 2.5 (Over)', () => {
            assert.strictEqual(helpers.extractPrediction('Wigan', 'Bolton', 'Over +2.50', 'Total Goals')[0].outcome, 'O');
            assert.strictEqual(helpers.extractPrediction('Wigan', 'Bolton', 'Over +2.50', 'Total Goals')[0].market, 'UO25');
        });
    });

    describe('findCountryLeague', () => {
        it('should parse corretly (1)', () => {
            assert.strictEqual(helpers.findCountryLeague('Galatasaray v Antalyaspor', 'https://www.olbg.com/betting-tips/Football/European_Competitions/Turkey_Super_Lig/Galatasaray_v_Antalyaspor/1?event_id=1760291'), 'Turkey Super Lig');
        });
        it('should parse corretly (2)', () => {
            assert.strictEqual(helpers.findCountryLeague('Wycombe v Cheltenham', 'https://www.olbg.com/betting-tips/Football/UK/England_League_One/Wycombe_v_Cheltenham/1?event_id=1760594'), 'England League One');
        });
    });

    describe('extractOdd', () => {
        it('should parse corretly normal case', () => {
            assert.strictEqual(helpers.extractOdd('1.56'), 156);
        });

        it('should parse corretly empty string', () => {
            assert.strictEqual(helpers.extractOdd(''), 0);
        });
    });

    describe('confidence', () => {
        it('should parse corretly', () => {
            assert.strictEqual(helpers.confidence('4/11 Win Tips\n36%\n2 comments'), 4);
        });

    });

    describe('tips', () => {
        it('should parse correctly (1)', () => {
            const res =  helpers.tips('5/11 Win Tips\n36%\n2 comments');
            assert.strictEqual(res.num, 5);
            assert.strictEqual(res.total, 11);
            assert.strictEqual(res.percentage, 45);
        });

        it('should parse correctly (1)', () => {
            const res =  helpers.tips('14/15 Win Tips\n36%\n2 comments');
            assert.strictEqual(res.num, 14);
            assert.strictEqual(res.total, 15);
            assert.strictEqual(res.percentage, 93);
        });

    });
    
    describe('extractExperts', () => {
        it('should parse corretly normal case', () => {
            assert.strictEqual(helpers.experts('1 expert'), 1);
        });

        it('should parse corretly empty string', () => {
            assert.strictEqual(helpers.experts(''), 0);
        });

        it('should parse corretly 2', () => {
            assert.strictEqual(helpers.experts('2 experts'), 2);
        });

        it('should parse corretly 3', () => {
            assert.strictEqual(helpers.experts('2 experts'), 2);
        });

        it('should parse corretly bogus', () => {
            assert.strictEqual(helpers.experts('whatever'), 0);
        });
    });

});

