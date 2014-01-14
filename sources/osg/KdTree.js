define( [
    'osg/Utils',
    'osg/BoundingBox',
    'osg/Vec3',
    'osgUtil/TriangleBuilder'
], function ( MACROUTILS, BoundingBox, Vec3, TriangleBuilder ) {

    var TriangleHit = function ( index, normal, r1, v1, r2, v2, r3, v3 ) {
        this.index = index;
        this.normal = normal;
        this.r1 = r1;
        this.v1 = v1;
        this.r2 = r2;
        this.v2 = v2;
        this.r3 = r3;
        this.v3 = v3;
    };

    var KdNode = function ( first, second ) {
        this._bb = new BoundingBox();
        this._first = first;
        this._second = second;
    };

    var IntersectKdTree = function ( vertices, nodes, triangles, intersections, start, end, nodePath ) {
        this._vertices = vertices;
        this._kdNodes = nodes;
        this._triangles = triangles;
        this._intersections = intersections;
        this._s = start;
        this._e = end;
        this._nodePath = nodePath;
        this._d = Vec3.sub( end, start, [ 0.0, 0.0, 0.0 ] );
        this._length = 0.0;
        this._inverseLength = 0.0;
        this._dinvX = [ 0.0, 0.0, 0.0 ];
        this._dinvY = [ 0.0, 0.0, 0.0 ];
        this._dinvZ = [ 0.0, 0.0, 0.0 ];
        this.init();
    };

    IntersectKdTree.prototype = {
        init: function () {
            var d = this._d;
            this._length = Vec3.length( d );
            if ( this._length !== 0.0 )
                this._inverseLength = 1.0 / this._length;
            Vec3.mult( d, this._inverseLength, d );
            if ( d[ 0 ] !== 0.0 ) Vec3.mult( d, 1.0 / d[ 0 ], this._dinvX );
            if ( d[ 1 ] !== 0.0 ) Vec3.mult( d, 1.0 / d[ 1 ], this._dinvY );
            if ( d[ 2 ] !== 0.0 ) Vec3.mult( d, 1.0 / d[ 2 ], this._dinvZ );
        },
        intersect: ( function () {

            var v0 = [ 0.0, 0.0, 0.0 ];
            var v1 = [ 0.0, 0.0, 0.0 ];
            var v2 = [ 0.0, 0.0, 0.0 ];
            var normal = [ 0.0, 0.0, 0.0 ];
            var e2 = [ 0.0, 0.0, 0.0 ];
            var e1 = [ 0.0, 0.0, 0.0 ];
            var tvec = [ 0.0, 0.0, 0.0 ];
            var pvec = [ 0.0, 0.0, 0.0 ];
            var qvec = [ 0.0, 0.0, 0.0 ];

            return function ( node, ls, le ) {
                var first = node._first;
                var second = node._second;
                var triangles = this._triangles;
                var vertices = this._vertices;

                if ( first < 0 ) {
                    // treat as a leaf
                    var istart = -first - 1;
                    var iend = istart + second;
                    var d = this._d;
                    var len = this._length;
                    var invLen = this._inverseLength;
                    var start = this._s;
                    var epsilon = 1E-20;

                    for ( var i = istart; i < iend; ++i ) {
                        var id = i * 3;
                        var iv0 = triangles[ id ] * 3;
                        var iv1 = triangles[ id + 1 ] * 3;
                        var iv2 = triangles[ id + 2 ] * 3;

                        v0[ 0 ] = vertices[ iv0 ];
                        v0[ 1 ] = vertices[ iv0 + 1 ];
                        v0[ 2 ] = vertices[ iv0 + 2 ];

                        v1[ 0 ] = vertices[ iv1 ];
                        v1[ 1 ] = vertices[ iv1 + 1 ];
                        v1[ 2 ] = vertices[ iv1 + 2 ];

                        v2[ 0 ] = vertices[ iv2 ];
                        v2[ 1 ] = vertices[ iv2 + 1 ];
                        v2[ 2 ] = vertices[ iv2 + 2 ];

                        Vec3.sub( v2, v0, e2 );
                        Vec3.sub( v1, v0, e1 );
                        Vec3.cross( d, e2, pvec );

                        var det = Vec3.dot( pvec, e1 );
                        if ( det > -epsilon && det < epsilon )
                            continue;
                        var invDet = 1.0 / det;

                        Vec3.sub( start, v0, tvec );

                        var u = Vec3.dot( pvec, tvec ) * invDet;
                        if ( u < 0.0 || u > 1.0 )
                            continue;

                        Vec3.cross( tvec, e1, qvec );

                        var v = Vec3.dot( qvec, d ) * invDet;
                        if ( v < 0.0 || ( u + v ) > 1.0 )
                            continue;

                        var t = Vec3.dot( qvec, e2 ) * invDet;

                        if ( t < epsilon || t > len ) //no intersection
                            continue;

                        var r0 = 1.0 - u - v;
                        var r1 = u;
                        var r2 = v;
                        var r = t * invLen;

                        var interX = v0[ 0 ] * r0 + v1[ 0 ] * r1 + v2[ 0 ] * r2;
                        var interY = v0[ 1 ] * r0 + v1[ 1 ] * r1 + v2[ 1 ] * r2;
                        var interZ = v0[ 2 ] * r0 + v1[ 2 ] * r1 + v2[ 2 ] * r2;

                        Vec3.cross( e1, e2, normal );
                        Vec3.normalize( normal, normal );
                        this._intersections.push( {
                            'ratio': r,
                            'nodepath': this._nodePath.slice( 0 ),
                            'triangleHit': new TriangleHit( i, normal.slice( 0 ), r0, v0.slice( 0 ), r1, v1.slice( 0 ), r2, v2.slice( 0 ) ),
                            'point': [ interX, interY, interZ ]
                        } );
                    }
                } else {
                    var l = [ 0.0, 0.0, 0.0 ];
                    var e = [ 0.0, 0.0, 0.0 ];
                    Vec3.copy( ls, l );
                    Vec3.copy( le, e );
                    if ( first > 0 ) {
                        if ( this.intersectAndClip( l, e, this._kdNodes[ first ]._bb ) ) {
                            this.intersect( this._kdNodes[ first ], l, e );
                        }
                    }
                    if ( second > 0 ) {
                        Vec3.copy( ls, l );
                        Vec3.copy( le, e );
                        if ( this.intersectAndClip( l, e, this._kdNodes[ second ]._bb ) ) {
                            this.intersect( this._kdNodes[ second ], l, e );
                        }
                    }
                }
            };
        } )(),
        intersectAndClip: ( function () {
            var tmp = [ 0.0, 0.0, 0.0 ];
            return function ( s, e, bb ) {
                var min = bb._min;
                var xmin = min[ 0 ];
                var ymin = min[ 1 ];
                var zmin = min[ 2 ];

                var max = bb._max;
                var xmax = max[ 0 ];
                var ymax = max[ 1 ];
                var zmax = max[ 2 ];

                var invX = this._dinvX;
                var invY = this._dinvY;
                var invZ = this._dinvZ;

                if ( s[ 0 ] <= e[ 0 ] ) {
                    // trivial reject of segment wholely outside.
                    if ( e[ 0 ] < xmin ) return false;
                    if ( s[ 0 ] > xmax ) return false;

                    if ( s[ 0 ] < xmin ) {
                        // clip s to xMin.
                        Vec3.mult( invX, xmin - s[ 0 ], tmp );
                        Vec3.add( s, tmp, s );
                    }

                    if ( e[ 0 ] > xmax ) {
                        // clip e to xMax.
                        Vec3.mult( invX, xmax - s[ 0 ], tmp );
                        Vec3.add( s, tmp, e );
                    }
                } else {
                    if ( s[ 0 ] < xmin ) return false;
                    if ( e[ 0 ] > xmax ) return false;

                    if ( e[ 0 ] < xmin ) {
                        // clip s to xMin.
                        Vec3.mult( invX, xmin - s[ 0 ], tmp );
                        Vec3.add( s, tmp, e );
                    }

                    if ( s[ 0 ] > xmax ) {
                        // clip e to xMax.
                        Vec3.mult( invX, xmax - s[ 0 ], tmp );
                        Vec3.add( s, tmp, s );
                    }
                }

                // compate s and e against the yMin to yMax range of bb.
                if ( s[ 1 ] <= e[ 1 ] ) {

                    // trivial reject of segment wholely outside.
                    if ( e[ 1 ] < ymin ) return false;
                    if ( s[ 1 ] > ymax ) return false;

                    if ( s[ 1 ] < ymin ) {
                        // clip s to yMin.
                        Vec3.mult( invY, ymin - s[ 1 ], tmp );
                        Vec3.add( s, tmp, s );
                    }

                    if ( e[ 1 ] > ymax ) {
                        // clip e to yMax.
                        Vec3.mult( invY, ymax - s[ 1 ], tmp );
                        Vec3.add( s, tmp, e );
                    }
                } else {
                    if ( s[ 1 ] < ymin ) return false;
                    if ( e[ 1 ] > ymax ) return false;

                    if ( e[ 1 ] < ymin ) {
                        // clip s to yMin.
                        Vec3.mult( invY, ymin - s[ 1 ], tmp );
                        Vec3.add( s, tmp, e );
                    }

                    if ( s[ 1 ] > ymax ) {
                        // clip e to yMax.
                        Vec3.mult( invY, ymax - s[ 1 ], tmp );
                        Vec3.add( s, tmp, s );
                    }
                }

                // compate s and e against the zMin to zMax range of bb.
                if ( s[ 2 ] <= e[ 2 ] ) {
                    // trivial reject of segment wholely outside.
                    if ( e[ 2 ] < zmin ) return false;
                    if ( s[ 2 ] > zmax ) return false;

                    if ( s[ 2 ] < zmin ) {
                        // clip s to zMin.
                        Vec3.mult( invZ, zmin - s[ 2 ], tmp );
                        Vec3.add( s, tmp, s );
                    }

                    if ( e[ 2 ] > zmax ) {
                        // clip e to zMax.
                        Vec3.mult( invZ, zmax - s[ 2 ], tmp );
                        Vec3.add( s, tmp, e );
                    }
                } else {
                    if ( s[ 2 ] < zmin ) return false;
                    if ( e[ 2 ] > zmax ) return false;

                    if ( e[ 2 ] < zmin ) {
                        // clip s to zMin.
                        Vec3.mult( invZ, zmin - s[ 2 ], tmp );
                        Vec3.add( s, tmp, e );
                    }

                    if ( s[ 2 ] > zmax ) {
                        // clip e to zMax.
                        Vec3.mult( invZ, zmax - s[ 2 ], tmp );
                        Vec3.add( s, tmp, s );
                    }
                }
                return true;
            };
        } )()
    };

    var BuildKdTree = function ( kdTree ) {
        this._kdTree = kdTree;
        this._bb = new BoundingBox();
        this._primitiveIndices = null; // Uint32Array
        this._centers = null; // Float32Array
        this._axisOrder = [ 0, 0, 0 ];
        this._stackLength = 0;
    };

    BuildKdTree.prototype = {
        build: function ( options, geom ) {
            var targetTris = options._targetNumTrianglesPerLeaf;
            var vertexAttrib = geom.getVertexAttributeList().Vertex;
            if ( !vertexAttrib )
                return false;
            var vertices = vertexAttrib.getElements();
            if ( !vertices )
                return false;
            var nbVertices = vertices.length / 3;
            if ( nbVertices < targetTris )
                return false;

            this._bb.copy( geom.getBoundingBox() );
            this._kdTree.setVertices( vertices );

            this.computeDivisions( options );
            options._numVerticesProcessed += nbVertices;

            // compute triangles (triangle fan, strip, drawArrays...)
            // this is the most expansive function for building kdtree
            this.computeTriangles( geom );

            var node = new KdNode( -1, this._primitiveIndices.length );
            node._bb.copy( this._bb );
            var nodeNum = this._kdTree.addNode( node );

            var bb = new BoundingBox();
            bb.copy( this._bb );
            // second most expansive
            nodeNum = this.divide( options, bb, nodeNum, 0 );

            var triangles = this._kdTree.getTriangles();
            var primitives = this._primitiveIndices;
            var nbPrimitives = primitives.length;
            var triangleOrdered = new MACROUTILS.Float32Array( triangles.length );
            for ( var i = 0, j = 0; i < nbPrimitives; ++i, j += 3 ) {
                var id = primitives[ i ] * 3;
                triangleOrdered[ j ] = triangles[ id ];
                triangleOrdered[ j + 1 ] = triangles[ id + 1 ];
                triangleOrdered[ j + 2 ] = triangles[ id + 2 ];
            }
            this._kdTree.setTriangles( triangleOrdered );

            return this._kdTree.getNodes().length > 0;
        },
        computeTriangles: function ( geom ) {
            var tb = new TriangleBuilder( geom );
            tb.apply();

            var indices = tb._indices;
            var nbTriangles = indices.length;

            var kdTree = this._kdTree;
            var vertices = kdTree.getVertices();
            kdTree.setTriangles( indices );

            this._centers = new MACROUTILS.Float32Array( nbTriangles );
            var centers = this._centers;
            this._primitiveIndices = new MACROUTILS.Int32Array( nbTriangles / 3 );
            var primitives = this._primitiveIndices;

            for ( var i = 0, j = 0; i < nbTriangles; i += 3, ++j ) {
                var iv0 = indices[ i ];
                var iv1 = indices[ i + 1 ];
                var iv2 = indices[ i + 2 ];

                // discard degenerate points
                if ( iv0 === iv1 || iv1 === iv2 || iv0 === iv2 )
                    return;

                iv0 *= 3;
                iv1 *= 3;
                iv2 *= 3;

                var v0x = vertices[ iv0 ];
                var v0y = vertices[ iv0 + 1 ];
                var v0z = vertices[ iv0 + 2 ];

                var v1x = vertices[ iv1 ];
                var v1y = vertices[ iv1 + 1 ];
                var v1z = vertices[ iv1 + 2 ];

                var v2x = vertices[ iv2 ];
                var v2y = vertices[ iv2 + 1 ];
                var v2z = vertices[ iv2 + 2 ];

                var minx = Math.min( v0x, Math.min( v1x, v2x ) );
                var miny = Math.min( v0y, Math.min( v1y, v2y ) );
                var minz = Math.min( v0z, Math.min( v1z, v2z ) );

                var maxx = Math.max( v0x, Math.max( v1x, v2x ) );
                var maxy = Math.max( v0y, Math.max( v1y, v2y ) );
                var maxz = Math.max( v0z, Math.max( v1z, v2z ) );
                centers[ i ] = ( minx + maxx ) * 0.5;
                centers[ i + 1 ] = ( miny + maxy ) * 0.5;
                centers[ i + 2 ] = ( minz + maxz ) * 0.5;
                primitives[ j ] = j;
            }
        },
        computeDivisions: function ( options ) {
            this._stackLength = options._maxNumLevels;
            var max = this._bb._max;
            var min = this._bb._min;
            var dx = max[ 0 ] - min[ 0 ];
            var dy = max[ 1 ] - min[ 1 ];
            var dz = max[ 2 ] - min[ 2 ];
            var axisOrder = this._axisOrder;

            // We set the cutting order (longest edge aabb first)
            axisOrder[ 0 ] = ( dx >= dy && dx >= dz ) ? 0 : ( dy >= dz ) ? 1 : 2;
            axisOrder[ 2 ] = ( dx < dy && dx < dz ) ? 0 : ( dy < dz ) ? 1 : 2;
            var sum = axisOrder[ 0 ] + axisOrder[ 2 ];
            axisOrder[ 1 ] = sum === 3 ? 0 : sum === 2 ? 1 : 2;
        },
        divide: function ( options, bb, nodeIndex, level ) {
            var kdTree = this._kdTree;
            var primitives = this._primitiveIndices;
            var nodes = kdTree.getNodes();
            var node = nodes[ nodeIndex ];

            var first = node._first;
            var second = node._second;

            var needToDivide = level < this._stackLength && first < 0 && second > options._targetNumTrianglesPerLeaf;
            var istart = -first - 1;
            var iend = istart + second - 1;

            if ( !needToDivide ) {
                if ( first < 0 ) {
                    // leaf is done, now compute bound on it.
                    this.computeNodeBox( node, istart, iend );
                }
                return nodeIndex;
            }

            if ( first >= 0 )
                return nodeIndex;
            // leaf node as first < 0, so look at dividing it.

            var axis = this._axisOrder[ level % 3 ];
            var originalMin = bb._min[ axis ];
            var originalMax = bb._max[ axis ];

            var mid = ( originalMin + originalMax ) * 0.5;

            var originalLeftChildIndex = 0;
            var originalRightChildIndex = 0;
            var insitueDivision = false;

            var left = istart;
            var right = iend;

            var centers = this._centers;
            while ( left < right ) {
                while ( left < right && ( centers[ primitives[ left ] * 3 + axis ] <= mid ) ) {
                    ++left;
                }

                while ( left < right && ( centers[ primitives[ right ] * 3 + axis ] > mid ) ) {
                    --right;
                }

                while ( left < right && ( centers[ primitives[ right ] * 3 + axis ] > mid ) ) {
                    --right;
                }

                if ( left < right ) {
                    var tmp = primitives[ left ];
                    primitives[ left ] = primitives[ right ];
                    primitives[ right ] = tmp;
                    ++left;
                    --right;
                }
            }

            if ( left === right ) {
                if ( centers[ primitives[ left ] * 3 + axis ] <= mid )++left;
                else --right;
            }

            var leftLeaf = new KdNode( -istart - 1, ( right - istart ) + 1 );
            var rightLeaf = new KdNode( -left - 1, ( iend - left ) + 1 );

            if ( leftLeaf._second <= 0 ) {
                originalLeftChildIndex = 0;
                originalRightChildIndex = nodeIndex;
                insitueDivision = true;
            } else if ( rightLeaf._second <= 0 ) {
                originalLeftChildIndex = nodeIndex;
                originalRightChildIndex = 0;
                insitueDivision = true;
            } else {
                originalLeftChildIndex = kdTree.addNode( leftLeaf );
                originalRightChildIndex = kdTree.addNode( rightLeaf );
            }


            var restore = bb._max[ axis ];
            bb._max[ axis ] = mid;

            var leftChildIndex = originalLeftChildIndex !== 0 ? this.divide( options, bb, originalLeftChildIndex, level + 1 ) : 0;

            bb._max[ axis ] = restore;

            restore = bb._min[ axis ];
            bb._min[ axis ] = mid;

            var rightChildIndex = originalRightChildIndex !== 0 ? this.divide( options, bb, originalRightChildIndex, level + 1 ) : 0;

            bb._min[ axis ] = restore;

            if ( !insitueDivision ) {
                node._first = leftChildIndex;
                node._second = rightChildIndex;

                insitueDivision = true;

                var bnode = node._bb;
                bnode.init();
                if ( leftChildIndex !== 0 ) bnode.expandByBoundingBox( nodes[ leftChildIndex ]._bb );
                if ( rightChildIndex !== 0 ) bnode.expandByBoundingBox( nodes[ rightChildIndex ]._bb );
            }
            return nodeIndex;
        },
        computeNodeBox: function ( node, istart, iend ) {
            var minx = Infinity,
                miny = Infinity,
                minz = Infinity,
                maxx = -Infinity,
                maxy = -Infinity,
                maxz = -Infinity;
            var triangles = this._kdTree.getTriangles();
            var vertices = this._kdTree.getVertices();
            var primitives = this._primitiveIndices;
            for ( var i = istart; i <= iend; ++i ) {
                var id = primitives[ i ] * 3;
                var iv0 = triangles[ id ] * 3;
                var iv1 = triangles[ id + 1 ] * 3;
                var iv2 = triangles[ id + 2 ] * 3;

                var v0x = vertices[ iv0 ];
                var v0y = vertices[ iv0 + 1 ];
                var v0z = vertices[ iv0 + 2 ];

                var v1x = vertices[ iv1 ];
                var v1y = vertices[ iv1 + 1 ];
                var v1z = vertices[ iv1 + 2 ];

                var v2x = vertices[ iv2 ];
                var v2y = vertices[ iv2 + 1 ];
                var v2z = vertices[ iv2 + 2 ];

                minx = Math.min( minx, Math.min( v0x, Math.min( v1x, v2x ) ) );
                miny = Math.min( miny, Math.min( v0y, Math.min( v1y, v2y ) ) );
                minz = Math.min( minz, Math.min( v0z, Math.min( v1z, v2z ) ) );

                maxx = Math.max( maxx, Math.max( v0x, Math.max( v1x, v2x ) ) );
                maxy = Math.max( maxy, Math.max( v0y, Math.max( v1y, v2y ) ) );
                maxz = Math.max( maxz, Math.max( v0z, Math.max( v1z, v2z ) ) );
            }
            var epsilon = 1E-6;
            var bnode = node._bb;
            var bmin = bnode._min;
            var bmax = bnode._max;
            bmin[ 0 ] = minx - epsilon;
            bmin[ 1 ] = miny - epsilon;
            bmin[ 2 ] = minz - epsilon;
            bmax[ 0 ] = maxx + epsilon;
            bmax[ 1 ] = maxy + epsilon;
            bmax[ 2 ] = maxz + epsilon;
        }
    };

    var KdTree = function () {
        this._vertices = null;
        this._kdNodes = [];
        this._triangles = null; // Float32Array
    };

    KdTree.prototype = MACROUTILS.objectLibraryClass( {
        getVertices: function () {
            return this._vertices;
        },
        setVertices: function ( vertices ) {
            this._vertices = vertices;
        },
        getNodes: function () {
            return this._kdNodes;
        },
        getTriangles: function () {
            return this._triangles;
        },
        setTriangles: function ( triangles ) {
            this._triangles = triangles;
        },
        addNode: function ( node ) {
            this._kdNodes.push( node );
            return this._kdNodes.length - 1;
        },
        build: function ( options, geom ) {
            var buildTree = new BuildKdTree( this );
            return buildTree.build( options, geom );
        },
        intersect: function ( start, end, intersections, nodePath ) {
            if ( this._kdNodes.length === 0 ) {
                return false;
            }

            var numIntersectionsBefore = intersections.length;
            var intersector = new IntersectKdTree( this._vertices, this._kdNodes, this._triangles, intersections, start, end, nodePath );
            intersector.intersect( this.getNodes()[ 0 ], start, end );

            return numIntersectionsBefore !== intersections.length;
        }
    }, 'osg', 'KdTree' );

    return KdTree;
} );