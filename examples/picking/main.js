'use strict';

function loadUrl( url, viewer, node ) {
    osg.log( 'loading ' + url );
    var req = new XMLHttpRequest();
    req.open( 'GET', url, true );
    req.onload = function ( aEvt ) {
        loadModel( JSON.parse( req.responseText ), viewer, node );
        osg.log( 'success ' + url );
    };
    req.onerror = function ( aEvt ) {
        osg.log( 'error ' + url );
    };
    req.send( null );
};

function loadModel( data, viewer, node ) {
    // var promise = osgDB.parseSceneGraph( data );
    var promise = osg.createTexturedSphere( 1.0, 100, 100 );

    osgDB.Promise.when( promise ).then( function ( child ) {
        node.addChild( child );
        viewer.getManipulator().computeHomePosition();

        var treeBuilder = new osg.KdTreeBuilder();
        treeBuilder.apply( node );
    } );
};

function createScene( viewer ) {
    var canvas = document.getElementById( '3DView' );

    var root = new osg.Node();

    loadModel( getOgre(), viewer, root );
    // loadModel( getPokerScene(), viewer, root );

    return root;
};

window.addEventListener( 'load',
    function () {
        OSG.globalify();

        var canvas = document.getElementById( '3DView' );
        canvas.style.width = canvas.width = window.innerWidth;
        canvas.style.height = canvas.height = window.innerHeight;

        var viewer = new osgViewer.Viewer( canvas );
        viewer.init();
        viewer.setSceneData( createScene( viewer ) );
        viewer.setupManipulator();
        viewer.run();

        canvas.addEventListener( 'mousedown', function ( ev ) {
            console.time( 't' );
            var hits = viewer.computeIntersections( ev.clientX, canvas.height - ev.clientY );
            console.timeEnd( 't' );
            console.log( hits.length );
            hits.sort( function ( a, b ) {
                return a.ratio - b.ratio;
            } );
        }, true );
    }, true );