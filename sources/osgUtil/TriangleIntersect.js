define( [
    'osg/Notify',
    'osg/Vec3',
    'osg/PrimitiveSet'
], function ( Notify, Vec3, PrimitiveSet ) {

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

    var TriangleIntersect = function () {
        this.hits = [];
        this.nodePath = [];
    };

    TriangleIntersect.prototype = {
        setNodePath: function ( np ) {
            this.nodePath = np;
        },
        set: function ( start, end ) {
            this.start = start;
            this.end = end;
            this.dir = Vec3.sub( end, start, [] );
            this.length = Vec3.length( this.dir );
            this.invLength = 1.0 / this.length;
            Vec3.mult( this.dir, this.invLength, this.dir );
        },

        applyDrawElementsTriangles: function ( count, vertexes, indexes ) {
            var v0 = [];
            var v1 = [];
            var v2 = [];

            var idx0, idx1, idx2;
            for ( var idx = 0; idx < count; idx += 3 ) {
                idx0 = indexes[ idx ] * 3;
                v0[ 0 ] = vertexes[ idx0 ];
                v0[ 1 ] = vertexes[ idx0 + 1 ];
                v0[ 2 ] = vertexes[ idx0 + 2 ];

                idx1 = indexes[ idx + 1 ] * 3;
                v1[ 0 ] = vertexes[ idx1 ];
                v1[ 1 ] = vertexes[ idx1 + 1 ];
                v1[ 2 ] = vertexes[ idx1 + 2 ];

                idx2 = indexes[ idx + 2 ] * 3;
                v2[ 0 ] = vertexes[ idx2 ];
                v2[ 1 ] = vertexes[ idx2 + 1 ];
                v2[ 2 ] = vertexes[ idx2 + 2 ];
                this.intersect( v0, v1, v2 );
            }
        },

        applyDrawElementsTriangleStrip: function ( count, vertexes, indexes ) {
            var v0 = [];
            var v1 = [];
            var v2 = [];

            var idx = 0;
            var a = 0;
            var b = 0;
            var c = 0;
            for ( var i = 2; i < count; ++i ) {
                idx = i - 2;
                if ( i % 2 ) {
                    a = indexes[ idx ];
                    b = indexes[ idx + 2 ];
                    c = indexes[ idx + 1 ];
                } else {
                    a = indexes[ idx ];
                    b = indexes[ idx + 1 ];
                    c = indexes[ idx + 2 ];
                }
                if ( a === b || b === c || a === c ) {
                    continue;
                }
                a *= 3;
                b *= 3;
                c *= 3;
                v0[ 0 ] = vertexes[ a ];
                v0[ 1 ] = vertexes[ a + 1 ];
                v0[ 2 ] = vertexes[ a + 2 ];

                v1[ 0 ] = vertexes[ b ];
                v1[ 1 ] = vertexes[ b + 1 ];
                v1[ 2 ] = vertexes[ b + 2 ];

                v2[ 0 ] = vertexes[ c ];
                v2[ 1 ] = vertexes[ c + 1 ];
                v2[ 2 ] = vertexes[ c + 2 ];
                this.intersect( v0, v1, v2 );
            }
        },

        applyDrawElementsTriangleFan: function ( count, vertexes, indexes ) {
            var v0 = [];
            var v1 = [];
            var v2 = [];

            var idx0 = indexes[ 0 ] * 3;
            v0[ 0 ] = vertexes[ idx0 ];
            v0[ 1 ] = vertexes[ idx0 + 1 ];
            v0[ 2 ] = vertexes[ idx0 + 2 ];

            var idx1, idx2;
            for ( var i = 2, idx = 1; i < count; i++, idx++ ) {
                idx1 = indexes[ idx ] * 3;
                idx2 = indexes[ idx + 1 ] * 3;

                v1[ 0 ] = vertexes[ idx1 ];
                v1[ 1 ] = vertexes[ idx1 + 1 ];
                v1[ 2 ] = vertexes[ idx1 + 2 ];

                v2[ 0 ] = vertexes[ idx2 ];
                v2[ 1 ] = vertexes[ idx2 + 1 ];
                v2[ 2 ] = vertexes[ idx2 + 2 ];
                this.intersect( v0, v1, v2 );
            }
        },

        applyDrawArraysTriangles: function ( first, count, vertexes ) {
            var v0 = [];
            var v1 = [];
            var v2 = [];

            var bufFirst = first * 3;
            var bufCount = bufFirst + count * 3;
            for ( var idx = bufFirst; idx < bufCount; idx += 9 ) {
                v0[ 0 ] = vertexes[ idx ];
                v0[ 1 ] = vertexes[ idx + 1 ];
                v0[ 2 ] = vertexes[ idx + 2 ];

                v1[ 0 ] = vertexes[ idx + 3 ];
                v1[ 1 ] = vertexes[ idx + 4 ];
                v1[ 2 ] = vertexes[ idx + 5 ];

                v2[ 0 ] = vertexes[ idx + 6 ];
                v2[ 1 ] = vertexes[ idx + 7 ];
                v2[ 2 ] = vertexes[ idx + 8 ];
                this.intersect( v0, v1, v2 );
            }
        },

        applyDrawArraysTriangleStrip: function ( first, count, vertexes ) {
            var v0 = [];
            var v1 = [];
            var v2 = [];

            var idx = 0;
            var offset = first - 2;
            var a = 0;
            var b = 0;
            var c = 0;
            for ( var i = 2; i < count; ++i ) {
                idx = offset + i;
                if ( i % 2 ) {
                    a = idx;
                    b = idx + 2;
                    c = idx + 1;
                } else {
                    a = idx;
                    b = idx + 1;
                    c = idx + 2;
                }
                if ( a === b || b === c || a === c ) {
                    continue;
                }
                a *= 3;
                b *= 3;
                c *= 3;
                v0[ 0 ] = vertexes[ a ];
                v0[ 1 ] = vertexes[ a + 1 ];
                v0[ 2 ] = vertexes[ a + 2 ];

                v1[ 0 ] = vertexes[ b ];
                v1[ 1 ] = vertexes[ b + 1 ];
                v1[ 2 ] = vertexes[ b + 2 ];

                v2[ 0 ] = vertexes[ c ];
                v2[ 1 ] = vertexes[ c + 1 ];
                v2[ 2 ] = vertexes[ c + 2 ];
                this.intersect( v0, v1, v2 );
            }
        },

        applyDrawArraysTriangleFan: function ( first, count, vertexes ) {
            var v0 = [];
            var v1 = [];
            var v2 = [];

            var idx0 = first * 3;
            v0[ 0 ] = vertexes[ idx0 ];
            v0[ 1 ] = vertexes[ idx0 + 1 ];
            v0[ 2 ] = vertexes[ idx0 + 2 ];

            var idx1, idx2;
            for ( var i = 2, idx = first + 1; i < count; i++, idx++ ) {
                idx1 = idx * 3;
                idx2 = ( idx + 1 ) * 3;

                v1[ 0 ] = vertexes[ idx1 ];
                v1[ 1 ] = vertexes[ idx1 + 1 ];
                v1[ 2 ] = vertexes[ idx1 + 2 ];

                v2[ 0 ] = vertexes[ idx2 ];
                v2[ 1 ] = vertexes[ idx2 + 1 ];
                v2[ 2 ] = vertexes[ idx2 + 2 ];
                this.intersect( v0, v1, v2 );
            }
        },

        apply: function ( node ) {
            if ( !node.getAttributes().Vertex ) {
                return;
            }
            var primitive;
            var vertexes = node.getAttributes().Vertex.getElements();
            this.index = 0;
            for ( var i = 0, l = node.primitives.length; i < l; i++ ) {
                primitive = node.primitives[ i ];
                if ( primitive.getIndices !== undefined ) {
                    var indexes = primitive.indices.getElements();
                    switch ( primitive.getMode() ) {
                    case PrimitiveSet.TRIANGLES:
                        this.applyDrawElementsTriangles( primitive.getCount(), vertexes, indexes );
                        break;
                    case PrimitiveSet.TRIANGLE_STRIP:
                        this.applyDrawElementsTriangleStrip( primitive.getCount(), vertexes, indexes );
                        break;
                    case PrimitiveSet.TRIANGLE_FAN:
                        this.applyDrawElementsTriangleFan( primitive.getCount(), vertexes, indexes );
                        break;
                    }
                } else { // draw array
                    switch ( primitive.getMode() ) {
                    case PrimitiveSet.TRIANGLES:
                        this.applyDrawArraysTriangles( primitive.getFirst(), primitive.getCount(), vertexes );
                        break;
                    case PrimitiveSet.TRIANGLE_STRIP:
                        this.applyDrawArraysTriangleStrip( primitive.getFirst(), primitive.getCount(), vertexes );
                        break;
                    case PrimitiveSet.TRIANGLE_FAN:
                        this.applyDrawArraysTriangleFan( primitive.getFirst(), primitive.getCount(), vertexes );
                        break;
                    }
                }
            }
        },


        intersect: ( function () {
            var normal = [ 0.0, 0.0, 0.0 ];
            var e2 = [ 0.0, 0.0, 0.0 ];
            var e1 = [ 0.0, 0.0, 0.0 ];
            var tvec = [ 0.0, 0.0, 0.0 ];
            var pvec = [ 0.0, 0.0, 0.0 ];
            var qvec = [ 0.0, 0.0, 0.0 ];
            var epsilon = 1E-20;
            return function ( v0, v1, v2 ) {
                this.index++;
                var d = this.dir;

                Vec3.sub( v2, v0, e2 );
                Vec3.sub( v1, v0, e1 );
                Vec3.cross( d, e2, pvec );

                var det = Vec3.dot( pvec, e1 );
                if ( det > -epsilon && det < epsilon )
                    return;
                var invDet = 1.0 / det;

                Vec3.sub( this.start, v0, tvec );

                var u = Vec3.dot( pvec, tvec ) * invDet;
                if ( u < 0.0 || u > 1.0 )
                    return;

                Vec3.cross( tvec, e1, qvec );

                var v = Vec3.dot( qvec, d ) * invDet;
                if ( v < 0.0 || ( u + v ) > 1.0 )
                    return;

                var t = Vec3.dot( qvec, e2 ) * invDet;

                if ( t < epsilon || t > this.length ) //no intersection
                    return;

                var r0 = 1.0 - u - v;
                var r1 = u;
                var r2 = v;
                var r = t * this.invLength;

                var interX = v0[ 0 ] * r0 + v1[ 0 ] * r1 + v2[ 0 ] * r2;
                var interY = v0[ 1 ] * r0 + v1[ 1 ] * r1 + v2[ 1 ] * r2;
                var interZ = v0[ 2 ] * r0 + v1[ 2 ] * r1 + v2[ 2 ] * r2;

                Vec3.cross( e1, e2, normal );
                Vec3.normalize( normal, normal );

                this.hits.push( {
                    'ratio': r,
                    'nodepath': this.nodePath.slice( 0 ),
                    'triangleHit': new TriangleHit( this.index - 1, normal.slice( 0 ), r0, v0.slice( 0 ), r1, v1.slice( 0 ), r2, v2.slice( 0 ) ),
                    'point': [ interX, interY, interZ ]
                } );
                this.hit = true;
            };
        } )()
    };

    return TriangleIntersect;
} );