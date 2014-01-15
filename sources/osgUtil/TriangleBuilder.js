define( [
    'osg/Notify',
    'osg/Vec3',
    'osg/PrimitiveSet',
    'osg/Utils'
], function ( Notify, Vec3, PrimitiveSet, MACROUTILS ) {

    var TriangleBuilder = function ( geom ) {
        this._geom = geom;
        this._indices = null; // MACROUTILS.Uint32Array
    };

    TriangleBuilder.prototype = {
        applyDrawElementsTriangles: function ( count, indexes, startId ) {
            var indices = this._indices;
            for ( var i = 0; i < count; ++i )
                indices[ startId + i ] = indexes[ i ];
            return startId + count;
        },

        applyDrawElementsTriangleStrip: function ( count, indexes, startId ) {
            var indices = this._indices;
            var idx = 0;
            var id = 0;
            var a = 0;
            var b = 0;
            var c = 0;
            var nbDegen = 0;
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
                    ++nbDegen;
                    continue;
                }
                id = startId + ( idx - nbDegen ) * 3;
                indices[ id ] = a;
                indices[ id + 1 ] = b;
                indices[ id + 2 ] = c;
            }
            return startId + ( count - 2 - nbDegen ) * 3;
        },

        applyDrawElementsTriangleFan: function ( count, indexes, startId ) {
            var indices = this._indices;
            var idx0 = indexes[ 0 ];
            var id = 0;
            for ( var i = 2; i < count; ++i ) {
                var idx = i - 1;
                id = startId + ( i - 2 ) * 3;
                indices[ id ] = idx0;
                indices[ id + 1 ] = indexes[ idx ];
                indices[ id + 2 ] = indexes[ idx + 1 ];
            }
            return startId + ( count - 2 ) * 3;
        },

        applyDrawArraysTriangles: function ( first, count, startId ) {
            var indices = this._indices;
            for ( var i = 0; i < count; ++i ) {
                indices[ startId + i ] = first + i;
            }
            return startId + count;
        },

        applyDrawArraysTriangleStrip: function ( first, count, startId ) {
            var indices = this._indices;
            var idx = 0;
            var id = 0;
            var offset = first - 2;
            var a = 0;
            var b = 0;
            var c = 0;
            var nbDegen = 0;
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
                    ++nbDegen;
                    continue;
                }
                id = startId + ( i - 2 - nbDegen ) * 3;
                indices[ id ] = a;
                indices[ id + 1 ] = b;
                indices[ id + 2 ] = c;

            }
            return startId + ( count - 2 - nbDegen ) * 3;
        },

        applyDrawArraysTriangleFan: function ( first, count, startId ) {
            var indices = this._indices;
            var idx0 = first;
            var idx = 0;
            var id = 0;
            var offset = first - 1;
            for ( var i = 2; i < count; ++i ) {
                idx = offset + i;
                id = startId + ( i - 2 ) * 3;
                indices[ id ] = idx0;
                indices[ id + 1 ] = idx;
                indices[ id + 2 ] = idx + 1;
            }
            return startId + ( count - 2 ) * 3;
        },

        apply: function () {
            var geom = this._geom;
            var primitives = geom.primitives;
            if ( !primitives )
                return;
            var nbPrimitives = primitives.length;
            var totalLenArray = 0;
            var i = 0;
            for ( i = 0; i < nbPrimitives; i++ ) {
                var prim = primitives[ i ];
                var mode = prim.getMode();
                if ( mode === PrimitiveSet.TRIANGLES )
                    totalLenArray += prim.getCount();
                else
                    totalLenArray += ( prim.getCount() - 2 ) * 3;
            }
            this._indices = new MACROUTILS.Uint32Array( totalLenArray );
            var startId = 0;

            for ( i = 0; i < nbPrimitives; i++ ) {
                var primitive = primitives[ i ];
                if ( primitive.getIndices !== undefined ) {
                    var indexes = primitive.indices.getElements();
                    switch ( primitive.getMode() ) {
                    case PrimitiveSet.TRIANGLES:
                        startId = this.applyDrawElementsTriangles( primitive.getCount(), indexes, startId );
                        break;
                    case PrimitiveSet.TRIANGLE_STRIP:
                        startId = this.applyDrawElementsTriangleStrip( primitive.getCount(), indexes, startId );
                        break;
                    case PrimitiveSet.TRIANGLE_FAN:
                        startId = this.applyDrawElementsTriangleFan( primitive.getCount(), indexes, startId );
                        break;
                    }
                } else { // draw array
                    switch ( primitive.getMode() ) {
                    case PrimitiveSet.TRIANGLES:
                        startId = this.applyDrawArraysTriangles( primitive.getFirst(), primitive.getCount(), startId );
                        break;
                    case PrimitiveSet.TRIANGLE_STRIP:
                        startId = this.applyDrawArraysTriangleStrip( primitive.getFirst(), primitive.getCount(), startId );
                        break;
                    case PrimitiveSet.TRIANGLE_FAN:
                        startId = this.applyDrawArraysTriangleFan( primitive.getFirst(), primitive.getCount(), startId );
                        break;
                    }
                }
            }
            this._indices = this._indices.subarray( 0, startId );
        }
    };

    return TriangleBuilder;
} );