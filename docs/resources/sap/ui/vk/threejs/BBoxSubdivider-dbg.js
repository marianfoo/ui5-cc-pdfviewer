/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

        (c) Copyright 2009-2015 SAP SE. All rights reserved
    
 */

sap.ui.define([
], function() {
    "use strict";

    var Unpacker = function() {

        this.unpack = function(packed) {

            if (!packed || (packed.bytelength < 1)) {
                return false;
            }

            try {
                this.nLevel = packed[0];
                if (this.nLevel > 5) {
                    return false; // currently we get weird value from server. so if it is any suspicious big value. we quit
                    // this is because if we make mesh with this corrupted data, it screws up the rendering
                }
                this.numDivision = Math.pow(2, this.nLevel);


                this.octree = new Uint8Array(Math.pow(this.numDivision, 3));

                this.streamOffset = 1; // first one is nLevel
                this._decodeRecursive(packed, 0, 0, 0, 0);

            } catch (err) {
                // console.log(err);
                return false;
            }
            return true;
        };

        this.getUnpacked = function() {
            return this.octree;
        };

        this._setValue = function(gx, gy, gz, val) {
            this.octree[gz * this.numDivision * this.numDivision + gy * this.numDivision + gx] = val ? 1 : 0;
        };

        this._decodeRecursive = function(packed, gx, gy, gz, level) {
            if (level === this.nLevel) {
                this._setValue(gx, gy, gz, true);
                return true;
            }

            if (this.streamOffset >= packed.length) {
                return false;
            }

            var code = packed[this.streamOffset];
            this.streamOffset++;

            gx *= 2;
            gy *= 2;
            gz *= 2;

            if (level >= this.nLevel) {
                return true;
            }

            for (var z = 0; z < 2; z++) {
                for (var y = 0; y < 2; y++) {
                    for (var x = 0; x < 2; x++) {
                        if ((code & (1 << (z * 4 + y * 2 + x))) !== 0) {
                            if (!this._decodeRecursive(packed, gx + x, gy + y, gz + z, level + 1)) {
                                return false;
                            }
                        } else {
                            this._clearBitsRecursive(gx + x, gy + y, gz + z, level + 1);
                        }
                    }
                }
            }

            return true;
        };

        /* Unpacks the octree data that was previously packed with generated with packOctree() */
        this._clearBitsRecursive = function(gx, gy, gz, level) {
            if (level === this.nLevel) {
                this._setValue(gx, gy, gz, false);
                return;
            }

            gx *= 2;
            gy *= 2;
            gz *= 2;

            if (level >= this.nLevel) {
                return;
            }

            for (var z = 0; z < 2; z++) {
                for (var y = 0; y < 2; y++) {
                    for (var x = 0; x < 2; x++) {
                        this._clearBitsRecursive(gx + x, gy + y, gz + z, level + 1);
                    }
                }
            }
        };
    };

    // absolute x y z point in unit cube size of 1
    var CubePointIndexMapper = function(numDivision) {

        this.numDivision = numDivision;
        this.xyzToIndexMap = new Map();
        this.points = [];

        this.getOrCreatePointAt = function(x, y, z, face, diff) {
            var key = x + ":" + y + ":" + z + ":" + face + ":" + diff;

            var index = this.xyzToIndexMap.get(key);
            if (index) {
                return index;
            }

            this.points.push(x / this.numDivision - 0.5, y / this.numDivision - 0.5, z / this.numDivision - 0.5);
            index = this.points.length / 3 - 1;
            this.xyzToIndexMap.set(key, index);

            return index;
        };
    };

    var SubDividedBox = function(level, numDivision, unpacked) {

        this.level = level;
        this.numDivision = numDivision;
        this.unpacked = unpacked;

        this.getValue = function(gx, gy, gz) {

            if (gx < 0 || gy < 0 || gz < 0 ||
                gx >= this.numDivision ||
                gy >= this.numDivision ||
                gz >= this.numDivision) {
                return 0;
            }

            return this.unpacked[gz * this.numDivision * this.numDivision + gy * this.numDivision + gx];// > 0;
        };
    };

    var BBoxSubdivider = function() { };

    BBoxSubdivider.unpackSubDividedBoundingBox = function(packed) { // packed uint8 array

        var unpacker = new Unpacker();

        if (unpacker.unpack(packed)) {
            return new SubDividedBox(unpacker.nLevel, unpacker.numDivision, unpacker.getUnpacked());
        }

        return null;
    };

    BBoxSubdivider.makeSubDividedBoundingBoxGeometry = function(subDividedBox) {

        if (!subDividedBox) {
            return null;
        }

        var indices = [];
        var nLevel = subDividedBox.level;
        var numDivision = Math.pow(2, nLevel);
        var mapper = new CubePointIndexMapper(numDivision);

        var x, y, z, diff, a, b, c, d;
        // x side
        for (x = 0; x <= numDivision; x++) {
            for (y = 0; y < numDivision; y++) {
                for (z = 0; z < numDivision; z++) {

                    diff = subDividedBox.getValue(x, y, z) - subDividedBox.getValue(x - 1, y, z);
                    if (diff !== 0) {
                        a = mapper.getOrCreatePointAt(x, y, z, 0, diff);
                        b = mapper.getOrCreatePointAt(x, y + 1, z, 0, diff);
                        c = mapper.getOrCreatePointAt(x, y + 1, z + 1, 0, diff);
                        d = mapper.getOrCreatePointAt(x, y, z + 1, 0, diff);

                        if (diff < 0) {
                            indices.push(a, b, c);
                            indices.push(a, c, d);
                        } else {
                            indices.push(c, b, a);
                            indices.push(d, c, a);
                        }
                    }
                }
            }
        }

        // y side
        for (y = 0; y <= numDivision; y++) {
            for (x = 0; x < numDivision; x++) {
                for (z = 0; z < numDivision; z++) {
                    diff = subDividedBox.getValue(x, y, z) - subDividedBox.getValue(x, y - 1, z);
                    if (diff !== 0) {
                        a = mapper.getOrCreatePointAt(x, y, z, 1, diff);
                        b = mapper.getOrCreatePointAt(x + 1, y, z, 1, diff);
                        c = mapper.getOrCreatePointAt(x + 1, y, z + 1, 1, diff);
                        d = mapper.getOrCreatePointAt(x, y, z + 1, 1, diff);

                        if (diff > 0) {
                            indices.push(a, b, c);
                            indices.push(a, c, d);
                        } else {
                            indices.push(c, b, a);
                            indices.push(d, c, a);
                        }
                    }
                }
            }
        }

        // z side
        for (z = 0; z <= numDivision; z++) {
            for (x = 0; x < numDivision; x++) {
                for (y = 0; y < numDivision; y++) {
                    diff = subDividedBox.getValue(x, y, z) - subDividedBox.getValue(x, y, z - 1);
                    if (diff !== 0) {
                        a = mapper.getOrCreatePointAt(x, y, z, 2, diff);
                        b = mapper.getOrCreatePointAt(x + 1, y, z, 2, diff);
                        c = mapper.getOrCreatePointAt(x + 1, y + 1, z, 2, diff);
                        d = mapper.getOrCreatePointAt(x, y + 1, z, 2, diff);

                        if (diff < 0) {
                            indices.push(a, b, c);
                            indices.push(a, c, d);
                        } else {
                            indices.push(c, b, a);
                            indices.push(d, c, a);
                        }
                    }
                }
            }
        }

        var geometry = new THREE.BufferGeometry();
        var indexAttribute = new THREE.BufferAttribute(new Uint16Array(indices), 1);
        var positionAttribute = new THREE.BufferAttribute(new Float32Array(mapper.points), 3);

        geometry.setIndex(indexAttribute);
        geometry.setAttribute("position", positionAttribute);

        geometry.computeFaceNormals();
        geometry.computeVertexNormals();
        geometry.computeBoundingSphere();

        return geometry;
    };

    return BBoxSubdivider;
});
