define( [
    'osgUtil/Composer',
    'osgUtil/IntersectVisitor',
    'osgUtil/ParameterVisitor',
    'osgUtil/TriangleIntersect',
    'osgUtil/TriangleBuilder'
], function ( Composer, IntersectVisitor, ParameterVisitor, TriangleIntersect, TriangleBuilder ) {

    var osgUtil = {};

    osgUtil.Composer = Composer;
    osgUtil.IntersectVisitor = IntersectVisitor;
    osgUtil.ParameterVisitor = ParameterVisitor;
    osgUtil.TriangleIntersect = TriangleIntersect;
    osgUtil.TriangleBuilder = TriangleBuilder;

    return osgUtil;
} );