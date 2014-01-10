define( [
    'osg/Notify',
    'osg/Vec3',
    'osg/PrimitiveSet'
], function ( Notify, Vec3, PrimitiveSet ) {

    var TriangleBuilder = function ( geom ) {
        this._geom = geom;
        this._indices = [];
    };

    TriangleBuilder.prototype = {
        applyDrawElementsTriangles: function ( count, indexes ) {
            var indices = this._indices;
            for ( var idx = 0; idx < count; idx += 3 ) {
                indices.push( indexes[ idx ], indexes[ idx + 1 ], indexes[ idx + 2 ] );
            }
        },

        applyDrawElementsTriangleStrip: function ( count, indexes ) {
            var indices = this._indices;
            for ( var i = 2, idx = 0; i < count; i++, idx++ ) {
                if ( i % 2 ) {
                    indices.push( indexes[ idx ], indexes[ idx + 2 ], indexes[ idx + 1 ] );
                } else {
                    indices.push( indexes[ idx ], indexes[ idx + 1 ], indexes[ idx + 2 ] );
                }
            }
        },

        applyDrawElementsTriangleFan: function ( count, indexes ) {
            var indices = this._indices;
            var idx0 = indexes[ 0 ];
            for ( var i = 2, idx = 1; i < count; i++, idx++ ) {
                indices.push( indexes[ idx0 ], indexes[ idx ], indexes[ idx + 1 ] );
            }
        },

        applyDrawArraysTriangles: function ( first, count ) {
            var indices = this._indices;
            count /= 3;
            for ( var idx = first / 3; idx < count; idx++ ) {
                indices.push( idx, idx + 1, idx + 2 );
            }
        },

        applyDrawArraysTriangleStrip: function ( first, count ) {
            var indices = this._indices;
            for ( var i = 2, idx = first; i < count; i++, idx++ ) {
                if ( i % 2 ) {
                    indices.push( idx, idx + 2, idx + 1 );
                } else {
                    indices.push( idx, idx + 1, idx + 2 );
                }
            }
        },

        applyDrawArraysTriangleFan: function ( first, count ) {
            var indices = this._indices;
            var idx0 = first;
            for ( var i = 2, idx = first + 1; i < count; i++, idx++ ) {
                indices.push( idx0, idx, idx + 1 );
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