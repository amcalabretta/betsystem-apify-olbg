const helpers = require('../helpers');

var assert = require('assert');

describe('Helpers', () => {

    describe('extractHomeAway', () => {
        it('should parse corretly home and away', () => {
            assert.strictEqual(helpers.extractHomeAway('Brighton v Liverpool').h, 'Brighton');
            assert.strictEqual(helpers.extractHomeAway('Brighton v Liverpool').a, 'Liverpool');
        });
    });


    describe('extractPrediction', () => {
        it('should parse corretly HDA (normal case)', () => {
            assert.strictEqual(helpers.extractPrediction('Augsburg', 'Darmstadt', 'Darmstadt', '')[0].outcome, 'A');
            assert.strictEqual(helpers.extractPrediction('Augsburg', 'Darmstadt', 'Darmstadt', '')[0].market, 'HDA');
        });
        it('should parse corretly HDA (Draw)', () => {
            assert.strictEqual(helpers.extractPrediction('Coventry', 'Norwich', 'Draw', '')[0].outcome, 'D');
            assert.strictEqual(helpers.extractPrediction('Coventry', 'Norwich', 'Draw', '')[0].market, 'HDA');
        });
        it('should parse corretly Extact result (away)', () => {
            assert.strictEqual(helpers.extractPrediction('Estoril', 'Benfica', 'Benfica #3-0', '')[0].outcome, '0-3');
            assert.strictEqual(helpers.extractPrediction('Estoril', 'Benfica', 'Benfica #3-0', '')[0].market, 'EXR');
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

