var should = require('should');

var Quadtree = require('../quadtree');

describe('Quadtree Tests', function () {

    it('does stuff', function () {
        var quadtree = new Quadtree({
            dimension: 8,
            sectorObjectLimit: 1
        });
        quadtree.sectorCount.should.equal(0);

        var obj1 = {x: 1, y: 1, width: 1, height: 1};
        quadtree.add(obj1);
        quadtree.objectCount.should.equal(1);

        var obj2 = {x: 1, y: 1, width: 1, height: 1};
        quadtree.add(obj2);
        quadtree.objectCount.should.equal(2);
        quadtree.sectorCount.should.equal(1);

        var intersections = quadtree.check(obj2);
        intersections.length.should.equal(1);
        intersections[0].should.equal(obj1);

        var obj3 = {x: -4, y: -4, width: 1, height: 1};
        quadtree.add(obj3);
        quadtree.objectCount.should.equal(3);
        quadtree.sectorCount.should.equal(2);

        var obj4 = {x: 2, y: 2, width: 1, height: 1};
        quadtree.add(obj4);
        quadtree.objectCount.should.equal(4);
        quadtree.sectorCount.should.equal(4);

        quadtree.remove(obj2);
        quadtree.objectCount.should.equal(3);
        quadtree.sectorCount.should.equal(4);
    })

});