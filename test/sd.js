(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
	typeof define === 'function' && define.amd ? define(['exports'], factory) :
	(factory((global.sd = {})));
}(this, (function (exports) { 'use strict';

function hello() {
    console.log('hello world!');
}

exports.element = hello;

Object.defineProperty(exports, '__esModule', { value: true });

})));
