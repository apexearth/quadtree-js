module.exports = Quadtree;
function Quadtree(options) {
    initialize.call(this, options);
}

Quadtree.prototype.add = add;
Quadtree.prototype.remove = remove;
Quadtree.prototype.check = check;
Quadtree.prototype.update = update;


function initialize(options) {
    options = options || {};
    this.isRoot = options.parent == null;
    if (this.isRoot) {
        this.root = this;
        this.allChildSectors = [];
        this.dimension = options.dimension || 1E5;
        this.sectorObjectLimit = options.sectorObjectLimit || 16;
        this.duplicateCoordinateSensitivity = options.duplicateCoordinateSensitivity || .00001;
        configureAsParentSector.call(this);
    } else {
        this.root = options.parent.root;
        this.parent = options.parent;
        increaseSectorCount.call(this);
        configureAsChildSector.call(this);
        this.dimension = options.parent.childDimension;
    }

    this.left = options.left || 0;
    this.top = options.top || 0;
    this.childDimension = this.dimension / 2;
    this.objectCount = 0;
    this.sectorCount = 0;
}



function update() {

}

function check() {

}

// ++ Sector Methods
/**
 * A parent sector contains other sectors. It does not directly contain objects.
 */
function configureAsParentSector() {
    this.tree = [];
    this.children = [];
    if (this.objects) {
        var i = this.objects.length;
        while (i--) {
            var obj = this.objects.pop();
            getLowestSectorAtCoordinates.call(this, obj.x, obj.y, 0, true).add(obj);
        }
    }

    var indexOf = this.root.allChildSectors.indexOf(this);
    if (indexOf > -1) this.root.allChildSectors.splice(indexOf, 1);

    this.isChildSector = false;
    this.objects = null;
}
/**
 * A child sector does not contain other sectors. It directly contains objects.
 */
function configureAsChildSector() {
    if (this.parent.children.indexOf(this) == -1) {
        this.parent.children.push(this);
        // TODO: I once thought this was necessary. I don't currently understand why.
        orderArrayOfSectors.call(this.parent.children);
    }

    if (this.root.allChildSectors.indexOf(this) === -1) {
        this.root.allChildSectors.push(this);
        // TODO: I once thought this was necessary. I don't currently understand why.
        orderArrayOfSectors.call(this.root.allChildSectors);
    }

    this.isChildSector = true;
    this.tree = null;
    this.children = null;
    this.objects = [];
}
function convertToParentSector() {
    configureAsParentSector.call(this);
    this.root.allChildSectors.splice(this.root.allChildSectors.indexOf(this), 1);
}
function increaseSectorCount() {
    var sector = this;
    while (sector.parent != null) {
        sector = sector.parent;
        sector.sectorCount++;
    }
}
function decreaseSectorCount() {
    var sector = this;
    while (sector.parent != null) {
        sector.sectorCount--;
        sector = sector.parent;
    }
}
function orderArrayOfSectors() {
    var i = this.length;
    while (i-- > 1) {
        var c1 = this[i];
        var c2 = this[i - 1];
        if (c1.left < c2.left || c1.left == c2.left && c1.top < c2.top) {
            this.push(this.splice(i - 1, 1)[0]);
        }
    }
}
function isSectorFull() {
    return this.objectCount >= this.root.sectorObjectLimit;
}
function getObjectsInSector() {
    if (this.objects)
        return this.objects;
    else {
        var i = this.children.length, array = [];
        while (i--) {
            var objects = getObjectsInSector.call(this.children[i]);
            var j = objects.length - 1, k = -1;
            while (k++ < j) array.push(objects[k]);
        }
        return array;
    }
}
function getObjectCountAtSameCoordinate(coordinate) {
    var countAtSameCoordinate = 0;
    var childrenIndex = this.objects.length;
    while (childrenIndex--) {
        var treeObject = this.objects[childrenIndex];
        if (Math.abs(treeObject.x - coordinate.x) < this.root.duplicateCoordinateSensitivity &&
            Math.abs(treeObject.y - coordinate.y) < this.root.duplicateCoordinateSensitivity)
            countAtSameCoordinate++;
    }
    return countAtSameCoordinate;
}
// -- Sector Methods


// ++ Get Sector Methods
function getObjectSector(obj) {
    var coordinate = this.root.translate(obj);
    return getLowestSectorAtCoordinates.call(this, coordinate.x, coordinate.y, 0, false);
}
function getLowestSectorAtCoordinates(x, y, dimension, createIfNotFound) {
    var sector = this;
    var left;
    var top;
    while (sector.tree != null) {
        left = Math.floor(x / sector.childDimension);
        top = Math.floor(y / sector.childDimension);
        var treeX = sector.tree[left];
        if (!createIfNotFound && treeX == null) return null;
        if (treeX == null) {
            treeX = sector.tree[left] = [];
            sector = treeX[top] = new Quadtree({parent: sector, left: left, top: top});
        } else {
            var treeY = treeX[top];
            if (!createIfNotFound && treeY == null) return null;
            sector = treeX[top] = (treeY != null ? treeY : new Quadtree({parent: sector, left: left, top: top}));
        }

        var countAtSameCoordinate = getObjectCountAtSameCoordinate.call(sector, {x: x, y: y});
        if (countAtSameCoordinate < this.root.sectorObjectLimit && isSectorFull.call(sector) && sector.isChildSector) {
            convertToParentSector.call(sector);
        }


        if (sector.dimension == dimension) break;
    }
    return sector;
}
function getAllChildSectors() {
    if (this.children == null) return [];
    var i = this.children.length;
    var array = [];
    while (i--) {
        var child = this.children[i];
        array.push(child);
        var childChildren = getAllChildSectors.call(child);
        var k = childChildren.length;
        while (k--) array.push(childChildren[k]);
    }
    return array;
}
// -- Get Sector Methods


// ++ Add / Remove Objects from Sectors
function add(obj) {
    var sector = getLowestSectorAtCoordinates.call(this, obj.x, obj.y, 0, true);
    addObjectToSector.call(sector, obj);
    addObjectToSectorParents.call(sector, obj);
}
function remove(obj) {
    var sector = getObjectSector.call(this, obj);
    removeObjectFromSector.call(sector, obj);
    removeObjectFromSectorParents.call(sector, obj);
}

function addObjectToSector(obj) {
    this.objectCount++;
    this.objects.push(obj);
}
function removeObjectFromSector(obj) {
    var objectIndex = this.objects.indexOf(obj);
    this.objectCount--;
    this.objects.splice(objectIndex, 1);

    if (this.objectCount == 0) {
        var indexOf = this.root.allChildSectors.indexOf(this);
        if (indexOf > -1) this.root.allChildSectors.splice(indexOf, 1);
    }
}

function addObjectToSectorParents() {
    var parent = this.parent;
    while (parent != null) {
        parent.objectCount++;
        parent = parent.parent;
    }
}
function removeObjectFromSectorParents() {
    var parent = this.parent;
    while (parent != null) {
        parent.objectCount--;
        if (parent.objectCount == 0 && parent.parent != null) {
            decreaseSectorCount.call(parent);
            configureAsChildSector.call(parent);
        }
        parent = parent.parent;
    }
}
// -- Add / Remove Objects from Sectors


