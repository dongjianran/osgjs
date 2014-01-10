define( [
    'osg/Utils',
    'osg/NodeVisitor',
    'osg/KdTree'
], function ( MACROUTILS, NodeVisitor, KdTree ) {

    var KdTreeBuilder = function () {
        NodeVisitor.call( this );
        this._buildOptions = {
            _numVerticesProcessed: 0,
            _targetNumTrianglesPerLeaf: 4,
            _maxNumLevels: 32
        };
    };

    KdTreeBuilder.prototype = MACROUTILS.objectInehrit( NodeVisitor.prototype, {
        apply: function ( node ) {
            if ( node.getShape ) {
                var shape = node.getShape();
                if ( shape === null ) { // we test if the kdTree is already built
                    var kdTree = new KdTree();
                    if ( kdTree.build( this._buildOptions, node ) ) {
                        node.setShape( kdTree );
                    }
                }
            }
            this.traverse( node );
        }
    } );

    return KdTreeBuilder;
} );