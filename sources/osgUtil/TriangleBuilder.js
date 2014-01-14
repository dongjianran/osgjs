define( [
    'osg/Notify',
    'osg/Vec3',
    'osg/PrimitiveSet',
    'osg/Utils'
], function ( Notify, Vec3, PrimitiveSet, MACROUTILS ) {

    var TriangleBuilder = function ( geom ) {
        this._geom = geom;
        this._indices = null; // MACROUTILS.Float32Array
    };

    // #FIXME Use typed array maybe?
    TriangleBuilder.prototype = {
        applyDrawElementsTriangles: function ( count, indexes ) {
            this._indices = new MACROUTILS.Float32Array( count );
            var indices = this._indices;
            for ( var i = 0; i < count; ++i )
                indices[ i ] = indexes[ i ];
        },

        applyDrawElementsTriangleStrip: function ( count, indexes ) {
            this._indices = new MACROUTILS.Float32Array( count - 2 );
            var indices = this._indices;
            for ( var i = 2, idx = 0; i < count; ++i, ++idx ) {
                if ( i % 2 ) {
                    indices[ i - 2 ] = indexes[ idx ];
                    indices[ i - 1 ] = indexes[ idx + 2 ];
                    indices[ i ] = indexes[ idx + 1 ];
                } else {
                    indices[ i - 2 ] = indexes[ idx ];
                    indices[ i - 1 ] = indexes[ idx + 1 ];
                    indices[ i ] = indexes[ idx + 2 ];
                }
            }
        },

        applyDrawElementsTriangleFan: function ( count, indexes ) {
            this._indices = new MACROUTILS.Float32Array( count - 2 );
            var indices = this._indices;
            var idx0 = indexes[ 0 ];
            for ( var i = 2, idx = 1; i < count; ++i, ++idx ) {
                indices[ i - 2 ] = indexes[ idx0 ];
                indices[ i - 1 ] = indexes[ idx ];
                indices[ i ] = indexes[ idx + 1 ];
            }
        },

        applyDrawArraysTriangles: function ( first, count ) {
            this._indices = new MACROUTILS.Float32Array( count - first );
            var indices = this._indices;
            for ( var i = 0, idx = first; i < count; ++i, ++idx ) {
                indices[ i ] = idx;
            }
        },

        applyDrawArraysTriangleStrip: function ( first, count ) {
            this._indices = new MACROUTILS.Float32Array( count - 2 );
            var indices = this._indices;
            for ( var i = 2, idx = first; i < count; ++i, ++idx ) {
                if ( i % 2 ) {
                    indices[ i - 2 ] = idx;
                    indices[ i - 1 ] = idx + 2;
                    indices[ i ] = idx + 1;
                } else {
                    indices[ i - 2 ] = idx;
                    indices[ i - 1 ] = idx + 1;
                    indices[ i ] = idx + 2;
                }
            }
        },

        applyDrawArraysTriangleFan: function ( first, count ) {
            this._indices = new MACROUTILS.Float32Array( count - 2 );
            var indices = this._indices;
            var idx0 = first;
            for ( var i = 2, idx = first + 1; i < count; ++i, ++idx ) {
                indices[ i - 2 ] = idx0;
                indices[ i - 1 ] = idx;
                indices[ i ] = idx + 1;
            }
        },

        apply: function () {
            var geom = this._geom;
            if ( !geom.primitives )
                return;
            for ( var i = 0, l = geom.primitives.length; i < l; i++ ) {
                var primitive = geom.primitives[ i ];
                if ( primitive.getIndices !== undefined ) {
                    var indexes = primitive.indices.getElements();
                    switch ( primitive.getMode() ) {
                    case PrimitiveSet.TRIANGLES:
                        this.applyDrawElementsTriangles( primitive.getCount(), indexes );
                        break;
                    case PrimitiveSet.TRIANGLE_STRIP:
                        this.applyDrawElementsTriangleStrip( primitive.getCount(), indexes );
                        break;
                    case PrimitiveSet.TRIANGLE_FAN:
                        this.applyDrawElementsTriangleFan( primitive.getCount(), indexes );
                        break;
                    }
                } else { // draw array
                    switch ( primitive.getMode() ) {
                    case PrimitiveSet.TRIANGLES:
                        this.applyDrawArraysTriangles( primitive.getFirst(), primitive.getCount() );
                        break;
                    case PrimitiveSet.TRIANGLE_STRIP:
                        this.applyDrawArraysTriangleStrip( primitive.getFirst(), primitive.getCount() );
                        break;
                    case PrimitiveSet.TRIANGLE_FAN:
                        this.applyDrawArraysTriangleFan( primitive.getFirst(), primitive.getCount() );
                        break;
                    }
                }
            }
        }
    };

    return TriangleBuilder;
} );