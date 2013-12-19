/** -*- compile-command: 'jslint-cli osg.js' -*- */

define( [
    'osgUtil/osgPool',
    'osg/StateGraph'
], function ( osgPool, StateGraph ) {

    var Utils = {};

    Utils.init = function () {
        var StateGraph = require( 'osg/StateGraph' );
        osgPool.memoryPools.stateGraph = new osgPool.OsgObjectMemoryPool( StateGraph ).grow( 50 );
    };

    // from jquery
    Utils.isArray = function ( obj ) {
        return toString.call( obj ) === '[object Array]';
    };

    Utils.extend = function () {
        // Save a reference to some core methods
        var toString = Object.prototype.toString,
            hasOwnPropertyFunc = Object.prototype.hasOwnProperty;

        var isFunction = function ( obj ) {
            return toString.call( obj ) === '[object Function]';
        };
        var isArray = Utils.isArray;
        var isPlainObject = function ( obj ) {
            // Must be an Object.
            // Because of IE, we also have to check the presence of the constructor property.
            // Make sure that DOM nodes and window objects don't pass through, as well
            if ( !obj || toString.call( obj ) !== '[object Object]' || obj.nodeType || obj.setInterval ) {
                return false;
            }

            // Not own constructor property must be Object
            if ( obj.constructor && !hasOwnPropertyFunc.call( obj, 'constructor' ) && !hasOwnPropertyFunc.call( obj.constructor.prototype, 'isPrototypeOf' ) ) {
                return false;
            }

            // Own properties are enumerated firstly, so to speed up,
            // if last one is own, then all properties are own.

            var key;
            for ( key in obj ) {}

            return key === undefined || hasOwnPropertyFunc.call( obj, key );
        };

        // copy reference to target object
        var target = arguments[ 0 ] || {}, i = 1,
            length = arguments.length,
            deep = false,
            options, name, src, copy;

        // Handle a deep copy situation
        if ( typeof target === 'boolean' ) {
            deep = target;
            target = arguments[ 1 ] || {};
            // skip the boolean and the target
            i = 2;
        }

        // Handle case when target is a string or something (possible in deep copy)
        if ( typeof target !== 'object' && !isFunction( target ) ) {
            target = {};
        }

        // extend jQuery itself if only one argument is passed
        if ( length === i ) {
            target = this;
            --i;
        }

        for ( ; i < length; i++ ) {
            // Only deal with non-null/undefined values
            if ( ( options = arguments[ i ] ) !== null ) {
                // Extend the base object
                for ( name in options ) {
                    src = target[ name ];
                    copy = options[ name ];

                    // Prevent never-ending loop
                    if ( target === copy ) {
                        continue;
                    }

                    // Recurse if we're merging object literal values or arrays
                    if ( deep && copy && ( isPlainObject( copy ) || isArray( copy ) ) ) {
                        var clone = src && ( isPlainObject( src ) || isArray( src ) ) ? src : isArray( copy ) ? [] : {};

                        // Never move original objects, clone them
                        target[ name ] = Utils.extend( deep, clone, copy );

                        // Don't bring in undefined values
                    } else if ( copy !== undefined ) {
                        target[ name ] = copy;
                    }
                }
            }
        }

        // Return the modified object
        return target;
    };

    Utils.objectInehrit = Utils.objectInherit = function ( base, extras ) {
        function F() {}
        F.prototype = base;
        var obj = new F();

        // let augment object with multiple arguement
        for ( var i = 1; i < arguments.length; i++ ) {
            Utils.objectMix( obj, arguments[ i ], false );
        }
        return obj;
    };
    Utils.objectMix = function ( obj, properties, test ) {
        for ( var key in properties ) {
            if ( !( test && obj[ key ] ) ) {
                obj[ key ] = properties[ key ];
            }
        }
        return obj;
    };

    Utils.objectLibraryClass = function ( object, libName, className ) {
        object.className = function () {
            return className;
        };
        object.libraryName = function () {
            return libName;
        };
        var libraryClassName = libName + '::' + className;
        object.libraryClassName = function () {
            return libraryClassName;
        };
        return object;
    };

    Utils.objectType = {};
    Utils.objectType.type = 0;
    Utils.objectType.generate = function ( arg ) {
        var t = Utils.objectType.type;
        Utils.objectType[ t ] = arg;
        Utils.objectType[ arg ] = t;
        Utils.objectType.type += 1;
        return t;
    };

    Utils.Float32Array = typeof Float32Array !== 'undefined' ? Float32Array : null;
    Utils.Int32Array = typeof Int32Array !== 'undefined' ? Int32Array : null;
    Utils.Uint16Array = typeof Uint16Array !== 'undefined' ? Uint16Array : null;

    Utils.performance = {};
    Utils.performance.now = ( function () {
        // if no window.performance
        if ( window.performance === undefined ) {
            return function () {
                return Date.now();
            };
        }

        var fn = window.performance.now || window.performance.mozNow || window.performance.msNow || window.performance.oNow || window.performance.webkitNow ||
                function () {
                    return Date.now();
            };
        return function () {
            return fn.apply( window.performance, arguments );
        };
    } )();

    return Utils;
} );