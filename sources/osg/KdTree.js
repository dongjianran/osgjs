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

    var Triangle = function ( p0, p1, p2 ) {
        this._p0 = p0;
        this._p1 = p1;
        this._p2 = p2;
        // bool operator < ( const Triangle & rhs ) const {
        //     if ( p0 < rhs.p0 ) return true;
        //     if ( p0 > rhs.p0 ) return false;
        //     if ( p1 < rhs.p1 ) return true;
        //     if ( p1 > rhs.p1 ) return false;
        //     return p2 < rhs.p2;
        // }
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
        intersect: function ( node, ls, le ) {
            var first = node._first;
            var second = node._second;
            var triangles = this._triangles;
            var vertices = this._vertices;

            if ( first < 0 ) {
                // treat as a leaf
                var istart = -first - 1;
                var iend = istart + second;
                var d = this._d;

                for ( var i = istart; i < iend; ++i ) {
                    var tri = triangles[ i ];
                    var iv0 = tri._p0 * 3;
                    var iv1 = tri._p1 * 3;
                    var iv2 = tri._p2 * 3;

                    var v0 = [ vertices[ iv0 ], vertices[ iv0 + 1 ], vertices[ iv0 + 2 ] ];
                    var v1 = [ vertices[ iv1 ], vertices[ iv1 + 1 ], vertices[ iv1 + 2 ] ];
                    var v2 = [ vertices[ iv2 ], vertices[ iv2 + 1 ], vertices[ iv2 + 2 ] ];

                    var T = [ 0.0, 0.0, 0.0 ];
                    Vec3.sub( this._s, v0, T );
                    var E2 = [ 0.0, 0.0, 0.0 ];
                    Vec3.sub( v2, v0, E2 );
                    var E1 = [ 0.0, 0.0, 0.0 ];
                    Vec3.sub( v1, v0, E1 );
                    var P = [ 0.0, 0.0, 0.0 ];
                    Vec3.cross( d, E2, P );
                    var Q = [ 0.0, 0.0, 0.0 ];
                    var det = Vec3.dot( P, E1 );

                    var r = 0.0;
                    var r0 = 0.0;
                    var r1 = 0.0;
                    var r2 = 0.0;
                    var invDet = 0.0;
                    var t = 0.0;
                    var u = 0.0;
                    var v = 0.0;

                    var epsilon = 1E-20;
                    if ( det > epsilon ) {
                        u = Vec3.dot( P, T );
                        if ( u < 0.0 || u > det ) continue;

                        Vec3.cross( T, E1, Q );
                        v = Vec3.dot( Q, d );
                        if ( v < 0.0 || v > det ) continue;

                        if ( ( u + v ) > det ) continue;

                        invDet = 1.0 / det;
                        t = Vec3.dot( Q, E2 ) * invDet;
                        if ( t < 0.0 || t > this._length ) continue;

                        u *= invDet;
                        v *= invDet;

                        r0 = 1.0 - u - v;
                        r1 = u;
                        r2 = v;
                        r = t * this._inverseLength;
                    } else if ( det < -epsilon ) {
                        u = Vec3.dot( P, T );
                        if ( u > 0.0 || u < det ) continue;

                        Vec3.cross( T, E1, Q );
                        v = Vec3.dot( Q, d );
                        if ( v > 0.0 || v < det ) continue;

                        if ( ( u + v ) < det ) continue;

                        invDet = 1.0 / det;
                        t = Vec3.dot( Q, E2 ) * invDet;
                        if ( t < 0.0 || t > this._length ) continue;

                        u *= invDet;
                        v *= invDet;

                        r0 = 1.0 - u - v;
                        r1 = u;
                        r2 = v;
                        r = t * this._inverseLength;
                    } else {
                        continue;
                    }

                    var interX = v0[ 0 ] * r0 + v1[ 0 ] * r1 + v2[ 0 ] * r2;
                    var interY = v0[ 1 ] * r0 + v1[ 1 ] * r1 + v2[ 1 ] * r2;
                    var interZ = v0[ 2 ] * r0 + v1[ 2 ] * r1 + v2[ 2 ] * r2;
                    var inter = [ interX, interY, interZ ];

                    var normal = [ 0.0, 0.0, 0.0 ];
                    Vec3.cross( E1, E2, normal );
                    Vec3.normalize( normal, normal );

                    this._intersections.push( {
                        'ratio': r,
                        'nodepath': this._nodePath.slice( 0 ),
                        'triangleHit': new TriangleHit( i, normal, r0, v0, r1, v1, r2, v2 ),
                        'point': inter
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
        },
        intersectAndClip: function ( s, e, bb ) {
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

            var tmp = [ 0.0, 0.0, 0.0 ];

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
        }
    };

    var BuildKdTree = function ( kdTree ) {
        this._kdTree = kdTree;
        this._bb = new BoundingBox();
        this._axisStack = [];
        this._primitiveIndices = [];
        this._centers = [];
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

            //compute divisions
            this.computeDivisions( options );

            options._numVerticesProcessed += nbVertices;

            //compute triangles (triangle fan, strip, drawArrays...)
            this.computeTriangles( geom );

            var node = new KdNode( -1, this._primitiveIndices.length );
            node._bb.copy( this._bb );
            var nodeNum = this._kdTree.addNode( node );

            var bb = new BoundingBox();
            bb.copy( this._bb );
            nodeNum = this.divide( options, bb, nodeNum, 0 );

            var triangles = this._kdTree.getTriangles();
            var triangleList = [];
            var primitives = this._primitiveIndices;
            var nbPrimitives = primitives.length;
            for ( var i = 0; i < nbPrimitives; ++i ) {
                triangleList.push( triangles[ primitives[ i ] ] );
            }
            this._kdTree.setTriangles( triangleList );

            return this._kdTree.getNodes().length > 0;
        },
        computeTriangles: function ( geom ) {
            var tb = new TriangleBuilder( geom );
            tb.apply();
            var indices = tb._indices;

            var centers = this._centers;
            var kdTree = this._kdTree;
            var vertices = kdTree.getVertices();

            var bb = new BoundingBox();
            var nbTriangles = indices.length;
            var primitives = this._primitiveIndices;
            for ( var i = 0; i < nbTriangles; i += 3 ) {
                var iv0 = indices[ i ];
                var iv1 = indices[ i + 1 ];
                var iv2 = indices[ i + 2 ];

                // discard degenerate points
                if ( iv0 === iv1 || iv1 === iv2 || iv0 === iv2 )
                    return;

                var id = kdTree.addTriangle( new Triangle( iv0, iv1, iv2 ) );
                iv0 *= 3;
                iv1 *= 3;
                iv2 *= 3;
                var v0 = [ vertices[ iv0 ], vertices[ iv0 + 1 ], vertices[ iv0 + 2 ] ];
                var v1 = [ vertices[ iv1 ], vertices[ iv1 + 1 ], vertices[ iv1 + 2 ] ];
                var v2 = [ vertices[ iv2 ], vertices[ iv2 + 1 ], vertices[ iv2 + 2 ] ];

                bb.init();
                bb.expandByVec3( v0 );
                bb.expandByVec3( v1 );
                bb.expandByVec3( v2 );

                centers.push( bb.center() );
                primitives.push( id );
            }
        },
        computeDivisions: function ( options ) {
            var maxLevels = options._maxNumLevels;
            var axisStack = this._axisStack;
            var dimensions = Vec3.sub( this._bb._max, this._bb._min, [ 0.0, 0.0, 0.0 ] );
            for ( var level = 0; level < maxLevels; ++level ) {
                var axis = 0;
                if ( dimensions[ 0 ] >= dimensions[ 1 ] ) {
                    if ( dimensions[ 0 ] >= dimensions[ 2 ] ) axis = 0;
                    else axis = 2;
                } else if ( dimensions[ 1 ] >= dimensions[ 2 ] ) axis = 1;
                else axis = 2;
                axisStack.push( axis );
                dimensions[ axis ] *= 0.5;
            }
        },
        divide: function ( options, bb, nodeIndex, level ) {
            var kdTree = this._kdTree;
            var vertices = kdTree.getVertices();
            var primitives = this._primitiveIndices;
            var node = kdTree.getNode( nodeIndex );

            var first = node._first;
            var second = node._second;

            var needToDivide = level < this._axisStack.length && first < 0 && second > options._targetNumTrianglesPerLeaf;
            var istart = -first - 1;
            var iend = istart + second - 1;

            if ( !needToDivide ) {
                if ( first < 0 ) {
                    //     // leaf is done, now compute bound on it.
                    var bnode = node._bb;
                    bnode.init();
                    for ( var i = istart; i <= iend; ++i ) {
                        var tri = kdTree.getTriangle( primitives[ i ] );
                        var iv0 = tri._p0 * 3;
                        var iv1 = tri._p1 * 3;
                        var iv2 = tri._p2 * 3;
                        bnode.expandByVec3( [ vertices[ iv0 ], vertices[ iv0 + 1 ], vertices[ iv0 + 2 ] ] );
                        bnode.expandByVec3( [ vertices[ iv1 ], vertices[ iv1 + 1 ], vertices[ iv1 + 2 ] ] );
                        bnode.expandByVec3( [ vertices[ iv2 ], vertices[ iv2 + 1 ], vertices[ iv2 + 2 ] ] );
                    }
                    if ( bnode.valid() ) {
                        var epsilon = 1E-6;
                        var bmin = bnode._min;
                        var bmax = bnode._max;
                        bmin[ 0 ] -= epsilon;
                        bmin[ 1 ] -= epsilon;
                        bmin[ 2 ] -= epsilon;
                        bmax[ 0 ] += epsilon;
                        bmax[ 1 ] += epsilon;
                        bmax[ 2 ] += epsilon;
                    }
                }
                return nodeIndex;
            }


            if ( first >= 0 )
                return nodeIndex;
            // leaf node as first <= 0, so look at dividing it.

            var axis = this._axisStack[ level ];
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
                while ( left < right && ( centers[ primitives[ left ] ][ axis ] <= mid ) ) {
                    ++left;
                }

                while ( left < right && ( centers[ primitives[ right ] ][ axis ] > mid ) ) {
                    --right;
                }

                while ( left < right && ( centers[ primitives[ right ] ][ axis ] > mid ) ) {
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
                if ( centers[ primitives[ left ] ][ axis ] <= mid )++left;
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
                // take a second reference to node we are working on as the std::vector<> resize could
                // have invalidate the previous node ref.
                var newNodeRef = kdTree.getNode( nodeIndex );

                newNodeRef._first = leftChildIndex;
                newNodeRef._second = rightChildIndex;

                insitueDivision = true;

                newNodeRef._bb.init();
                if ( leftChildIndex !== 0 ) newNodeRef._bb.expandByBoundingBox( kdTree.getNode( leftChildIndex )._bb );
                if ( rightChildIndex !== 0 ) newNodeRef._bb.expandByBoundingBox( kdTree.getNode( rightChildIndex )._bb );
            }
            return nodeIndex;
        }
    };

    var KdTree = function () {
        this._vertices = null;
        this._kdNodes = [];
        this._triangles = [];
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
        getNode: function ( nodeNum ) {
            return this._kdNodes[ nodeNum ];
        },
        addTriangle: function ( tri ) {
            this._triangles.push( tri );
            return this._triangles.length - 1;
        },
        getTriangle: function ( num ) {
            return this._triangles[ num ];
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
            intersector.intersect( this.getNode( 0 ), start, end );

            return numIntersectionsBefore !== intersections.length;
        }
    }, 'osg', 'KdTree' );

    return KdTree;
} );