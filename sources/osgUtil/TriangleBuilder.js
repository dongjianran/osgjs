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
            count += startId;
            for ( var i = startId, idx = 0; i < count; ++i, ++idx )
                indices[ i ] = indexes[ idx ];
            return count;
        },

        applyDrawElementsTriangleStrip: function ( count, indexes, startId ) {
            var indices = this._indices;
            count += startId;
            for ( var i = startId + 2, idx = 0; i < count; ++i, ++idx ) {
                if ( ( i - startId ) % 2 ) {
                    indices[ i - 2 ] = indexes[ idx ];
                    indices[ i - 1 ] = indexes[ idx + 2 ];
                    indices[ i ] = indexes[ idx + 1 ];
                } else {
                    indices[ i - 2 ] = indexes[ idx ];
                    indices[ i - 1 ] = indexes[ idx + 1 ];
                    indices[ i ] = indexes[ idx + 2 ];
                }
            }
            return count - 2;
        },

        applyDrawElementsTriangleFan: function ( count, indexes, startId ) {
            var indices = this._indices;
            var idx0 = indexes[ 0 ];
            count += startId;
            for ( var i = startId + 2, idx = 1; i < count; ++i, ++idx ) {
                indices[ i - 2 ] = indexes[ idx0 ];
                indices[ i - 1 ] = indexes[ idx ];
                indices[ i ] = indexes[ idx + 1 ];
            }
            return count - 2;
        },

        applyDrawArraysTriangles: function ( first, count, startId ) {
            var indices = this._indices;
            count += startId;
            for ( var i = startId, idx = first; i < count; ++i, ++idx ) {
                indices[ i ] = idx;
            }
            return count;
        },

        applyDrawArraysTriangleStrip: function ( first, count, startId ) {
            var indices = this._indices;
            count += startId;
            for ( var i = startId + 2, idx = first; i < count; ++i, ++idx ) {
                if ( ( i - startId ) % 2 ) {
                    indices[ i - 2 ] = idx;
                    indices[ i - 1 ] = idx + 2;
                    indices[ i ] = idx + 1;
                } else {
                    indices[ i - 2 ] = idx;
                    indices[ i - 1 ] = idx + 1;
                    indices[ i ] = idx + 2;
                }
            }
            return count - 2;
        },

        applyDrawArraysTriangleFan: function ( first, count, startId ) {
            var indices = this._indices;
            var idx0 = first;
            count += startId;
            for ( var i = startId + 2, idx = first + 1; i < count; ++i, ++idx ) {
                indices[ i - 2 ] = idx0;
                indices[ i - 1 ] = idx;
                indices[ i ] = idx + 1;
            }
            return count - 2;
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
                totalLenArray += prim.getMode() === prim ? prim.getCount() : prim.getCount() - 2;
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
        }
    };

    return TriangleBuilder;
} );