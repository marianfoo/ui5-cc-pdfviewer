sap.ui.define([
], function() {
		"use strict";
		/**
		 * PolyFill for NodeList.forEach
		 */
		if (window.NodeList && !NodeList.prototype.forEach) {
			NodeList.prototype.forEach = Array.prototype.forEach;
		}
		/**
		 * PolyFill for Element.closest
		 */
		if (!Element.prototype.matches) {
			Element.prototype.matches = Element.prototype.msMatchesSelector ||
										Element.prototype.webkitMatchesSelector;
		}

		if (!Element.prototype.closest) {
			Element.prototype.closest = function(s) {
			var el = this;

			do {
				if (el.matches(s)) {
					return el;
				}
				el = el.parentElement || el.parentNode;
			} while (el !== null && el.nodeType === 1);
			return null;
			};
		}
		/**
		* PolyFill for nextSiblingElement
		*/
		(function (arr) {
			arr.forEach(function (item) {
			if (item.hasOwnProperty('nextElementSibling')) {
				return;
			}
			Object.defineProperty(item, 'nextElementSibling', {
				configurable: true,
				enumerable: true,
				get: function () {
						var el = this;
						el = el.nextSibling;
						while (el) {
						if (el.nodeType === 1) {
							return el;
						}
						el = el.nextSibling;
						}
					return null;
				},
				set: undefined
			});
			});
		})([Element.prototype, CharacterData.prototype]);

	});
