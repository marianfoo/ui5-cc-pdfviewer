/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

        (c) Copyright 2009-2015 SAP SE. All rights reserved
    
 */

// Provides control sap.ui.vk.Annotation
sap.ui.define([
	"sap/ui/core/Control",
	"./Core",
	"./AnnotationStyle",
	"./NodeUtils",
	"sap/m/FormattedText",
	"sap/ui/richtexteditor/RichTextEditor",
	"sap/ui/richtexteditor/library",
	"./AnnotationRenderer",
	"sap/ui/core/Core"

], function(
	Control,
	vkCore,
	AnnotationStyle,
	NodeUtils,
	FormattedText,
	RTE,
	rteLibrary,
	AnnotationRenderer,
	core
) {
	"use strict";

	/**
	 * Constructor for a new Annotation.
	 *
	 * @class
	 * Annotation allows applications to display custom html annotation on top of Viewport and associate it with 3D object
	 *
	 * @public
	 * @author SAP SE
	 * @version 1.108.1
	 * @extends sap.ui.core.Control
	 * @alias sap.ui.vk.Annotation
	 * @experimental Since 1.76.0 This class is experimental and might be modified or removed in future versions.
	 */

	var Annotation = Control.extend("sap.ui.vk.Annotation", /** @lends sap.ui.vk.Annotation.prototype */ {
		metadata: {
			library: "sap.ui.vk",
			properties: {
				/**
				 * Reference to the annotation Id
				 */
				annotationId: "string",
				/**
				 * Reference to the annotation name
				 */
				name: "string",
				/**
				 * Reference to the node that represents the annotation
				 */
				nodeRef: "any",
				/**
				 * The text that will be displayed in the annotation
				 */
				text: {
					type: "string",
					defaultValue: ""
				},
				/**
				 * The style of the annotation
				 */
				style: {
					type: "sap.ui.vk.AnnotationStyle",
					defaultValue: AnnotationStyle.Default
				},
				/**
				 * Controls the visibility of the annotation
				 */
				display: {
					type: "boolean",
					defaultValue: false
				},
				/**
				 * Controls the animation of the annotation. If set to <code>false</code> then animation is not played.
				 */
				animate: {
					type: "boolean",
					defaultValue: true
				},
				/**
				 * Amount of time in seconds to wait before animation is played. Default value of -1 means that this is not set.
				 */
				animationDelay: {
					type: "float",
					defaultValue: -1
				},
				/**
				 * Controls the annotation selected state
				 */
				selected: {
					type: "boolean",
					defaultValue: false
				},
				/**
				 * If annotation is editable then double click event is fired when user double clicks on the annotation
				 * and text editing is allowed by calling openEditor() method.
				 * If annotation is also selected then resize and reposition handles will be displayed.
				 */
				editable: {
					type: "boolean",
					defaultValue: false
				},
				/**
				 * Sets the X Coordinate of the annotation. This uses a scale of -0.5 to 0.5, left to right respectively.
				 * This is relative to the Viewport's safe area if present, otherwise it is relative to the Viewport.
				 */
				xCoordinate: {
					type: "float",
					defaultValue: 0
				},
				/**
				 * Sets the Y Coordinate of the annotation. This uses a scale of -0.5 to 0.5, top to bottom respectively.
				 * This is relative to the Viewport's safe area if present, otherwise it is relative to the Viewport.
				 */
				yCoordinate: {
					type: "float",
					defaultValue: 0
				},
				/**
				 * Sets horizontal offset of annotation's position relative to the point where it should be normally placed.
				 * Can be used to offset annotation from attachment node (if set).
				 * This uses a scale of -0.5 to 0.5, left to right respectively.
				 */
				xOffset: {
					type: "float",
					defaultValue: 0
				},
				/**
				 * Sets horizontal offset of annotation's position relative to the point where it should be normally placed.
				 * Can be used to offset annotation from attachment node (if set).
				 * This uses a scale of -0.5 to 0.5, top to bottom respectively.
				 */
				yOffset: {
					type: "float",
					defaultValue: 0
				},
				/**
				 * Sets the height of the annotation. This uses a scale of 0 to 1, 0% to 100% respectively.
				 * This is relative to the Viewport's safe area if present, otherwise it is relative to the Viewport.
				 * Negative values will be ignored.
				 */
				height: {
					type: "float"
				},
				/**
				 * Sets the width of the annotation. This uses a scale of 0 to 1, 0% to 100% respectively.
				 * This is relative to the Viewport's safe area if present, otherwise it is relative to the Viewport.
				 * Negative values will be ignored.
				 */
				width: {
					type: "float"
				}
			},
			associations: {
				viewport: {
					type: "sap.ui.vk.Viewport",
					multiple: false
				}
			},
			aggregations: {
				textEditor: {
					type: "sap.ui.core.Control",
					multiple: false
				}
			}
		},

		constructor: function(sId, mSettings) {
			Control.apply(this, arguments);
			if (this._viewport == null) {
				this._topLimit = -0.5;
				this._leftLimit = -0.5;
			}
		}
	});

	Annotation.prototype.setViewport = function(vp) {
		this.setAssociation("viewport", vp);

		this._viewport = core.byId(this.getViewport());
		// Get the normalized visible range (x: _leftLimit and y: _topLimit) based on the current viewport.
		if (this._viewport.getSafeArea().getDomRef()) {
			var safeBox = this._viewport.getSafeArea().getDomRef().getBoundingClientRect();
			var viewBox = this._viewport.getDomRef().getBoundingClientRect();
			var widthMargin = viewBox.left - safeBox.left;
			var heightMargin = viewBox.top - safeBox.top;
			var rect = this._viewport.normalizeRectangle(0, 0, widthMargin, heightMargin);
			this._topLimit = -0.5 + rect.height;
			this._leftLimit = -0.5 + rect.width;
		}
	};

	Annotation.prototype._firePositionChanged = function(annotation) {
		vkCore.getEventBus().publish("sap.ui.vk", "annotationPositionChanged", {
			annotation: annotation,
			x: annotation.getXCoordinate(),
			y: annotation.getYCoordinate()
		});
	};

	Annotation.prototype._fireSizeChanged = function(annotation, annotationWidth, annotationHeight) {
		vkCore.getEventBus().publish("sap.ui.vk", "annotationSizeChanged", {
			annotation: annotation,
			width: annotationWidth,
			height: annotationHeight
		});
	};

	/**
	 * Return list of target nodes.
	 * @return {any[]} Target nodes for leader lines
	 * @public
	 */
	Annotation.prototype.getTargetNodes = function() {
		this._targetNodes = this._targetNodes || [];
		return this._targetNodes;
	};

	/**
	 * Returns attached node. If set annotation will follow it on the screen
	 * @returns {any} Attachment node
	 */
	Annotation.prototype.getAttachmentNode = function() {
		return this._attachmentNode;
	};

	/**
	 * Sets attached node. If set then annotation will follow it on the screen
	 * @param {any} attNode Attachment node reference
	 */
	Annotation.prototype.setAttachmentNode = function(attNode) {
		this._attachmentNode = attNode;
		if (attNode) {
			this.rerender(); // Replay animation
		}
	};

	Annotation.prototype.getDisplay = function() {
		if (this.getNodeRef()) {
			var vsm = core.byId(this._viewport.getViewStateManager());
			return vsm.getVisibilityState(this.getNodeRef());
		}
		// We can't use property "visible" as it's already used by sap.ui.core.Control to control rendering
		return this.getProperty("display");
	};

	Annotation.prototype.setDisplay = function(visible) {
		var vsm = core.byId(this._viewport.getViewStateManager());
		var nodeRef = this.getNodeRef();
		if (nodeRef && vsm.getVisibilityState(nodeRef) !== visible) {
			vsm.setVisibilityState(nodeRef, visible);
		}

		if (this.getProperty("display") === visible) {
			return this;
		}

		this.setProperty("display", visible, true);

		var annotation = this.getDomRef();
		if (annotation) {
			if (visible) {
				this._reverse = false;
				this.rerender();
			} else {
				this._reverse = true;
				this.rerender();
			}
		}
		return this;
	};

	Annotation.prototype.getSelected = function() {
		if (this.getNodeRef()) {
			var vsm = core.byId(this._viewport.getViewStateManager());
			return vsm.getSelectionState(this.getNodeRef());
		}
		return this.getProperty("selected");
	};

	Annotation.prototype.setSelected = function(selected) {
		// Rerender control only if it's editable because it changes style
		this.setProperty("selected", selected, !this.getEditable());
		if (selected) {
			this._setMaxZ();
		}
		var vsm = core.byId(this._viewport.getViewStateManager());
		var nodeRef = this.getNodeRef();
		if (vsm.getSelectionState(nodeRef) !== selected) {
			vsm.setSelectionState(nodeRef, selected);
		}

		// Assign local listener for event wheel for each item. When multiple texts are selected,
		// scroll operation will occur on each text.
		var that = this;
		var onscroll = function(ev) {
			var textDivDom = that._textDiv.getDomRef();
			if (textDivDom == null) {
				return;
			}
			ev.stopPropagation();
			textDivDom.scrollTo(textDivDom.scrollLeft + ev.deltaX, textDivDom.scrollTop + ev.deltaY);
		};
		if (selected) {
			this._localScroll = onscroll;
			document.addEventListener("wheel", onscroll, true);
		} else {
			if (this._localScroll) {
				document.removeEventListener("wheel", this._localScroll, true);
			}
			this._localScroll = undefined;
		}

		this._moving = false;
		return this;
	};

	Annotation.prototype.setAnnotationId = function(newId) {
		this.setProperty("annotationId", newId, true);

		if (this._viewport && this.sourceData) {
			this._viewport.getScene().setAnnotationPersistentId(this.sourceData.annotation, newId);
		}
	};

	Annotation.prototype._getNodeRefScreenCenter = function(viewport, node) {
		var center = NodeUtils.centerOfNodes([node]);

		// Return object with screen coordinates in pixels and normalized z coordinate (node's depth)
		return viewport.projectToScreen(center[0], center[1], center[2], viewport.getCamera());
	};

	Annotation.prototype._getSortIndex = function(viewport) {
		this.zIndex = this.zIndex || "auto";
		var aNode = this.getTargetNodes()[0];
		if (aNode) {
			var center = NodeUtils.centerOfNodes([aNode]);
			var screenPoint = viewport.projectToScreen(center[0], center[1], center[2], viewport.getCamera());
			this.zIndex = Math.floor(10000 * (1 - screenPoint.depth));
		}
		return this.zIndex;
	};

	Annotation.prototype._getOpacity = function() {
		if (this._viewport) {
			var zIndex = this.zIndex;
			var annotations = [];
			this._viewport.getAnnotations().forEach(function(atn) {
				if (atn.getDisplay() === true) {
					annotations.push(atn);
				}
			});
			if (annotations.length > 1) {
				var zIndexes = Array.from(annotations, function(atn) {
					return atn.zIndex;
				});
				var zMax = Math.max.apply(null, zIndexes);
				var zMin = Math.min.apply(null, zIndexes);
				return 0.7 + (zIndex - zMin) * 0.3 / (zMax - zMin);
			}
		}
		return 1;
	};

	Annotation.prototype._updateBlocked = function() {
		// Hide annotation when target node is obscured
		var targetNode = this.getTargetNodes()[0];
		if (this.getDisplay() && targetNode) {
			var viewport = this._viewport;
			var nodeScreen = this._getNodeRefScreenCenter(viewport, targetNode);
			var hitNode = viewport.hitTest(nodeScreen.x, nodeScreen.y);
			var annotation = this.getDomRef();
			if (targetNode.visible == false) {
				annotation.style.visibility = "hidden";
			} else {
				annotation.style.visibility = "visible";
			}
			if (hitNode && annotation) {
				var subNodes = [];
				targetNode._vkTraverseMeshNodes(function(node) { subNodes.push(node); });
				if (subNodes.indexOf(hitNode.object) >= 0) {
					// Display annotation when hit node is the target node
					annotation.style.visibility = "visible";
				} else {
					var vsm = core.byId(viewport.getViewStateManager());
					var worldPos = vsm.getTransformationWorld(hitNode.object).translation;
					var hitPos = viewport.projectToScreen(worldPos[0], worldPos[1], worldPos[2], viewport.getCamera());
					// Hide annotation when target node is deeper than the hit node
					if (hitPos.depth < nodeScreen.depth) {
						annotation.style.visibility = "hidden";
					}
				}
			}
		}
		return this.getDisplay();
	};

	Annotation.prototype.setName = function(name) {
		this.setProperty("name", name);

		if (this.getNodeRef()) {
			this.getNodeRef().name = name;
		}
	};

	Annotation.prototype.getName = function() {
		if (this.getNodeRef()) {
			return this.getNodeRef().name;
		}
		return this.getProperty("name");
	};

	Annotation.prototype.setText = function(text) {
		this.setProperty("text", text, true);

		if (this.sourceData) {
			this.sourceData.annotation.text = { html: text };
		}

		if (this.getTextEditor()) {
			// We have editor open, set text to RTE control
			this._textDiv.value = text;
			return this;
		}

		if (this._textDiv == null) {
			this._textDiv = new FormattedText({
				width: this._textWidth ? this._textWidth + "px" : "auto",
				height: this._textHeight ? this._textHeight + "px" : "auto"
			});
			this._textDiv.addStyleClass("sapUiVizKitAnnotationText");
		}
		if (this.getStyle() === AnnotationStyle.Random && this.getAnimate()) {
			this._setRandomText(text);
		} else if (this.getStyle() === AnnotationStyle.Expand && this.getAnimate()) {
			this._setExpandText(text);
		} else {
			this._textDiv.setHtmlText(text);
		}
		this._textDiv.rerender();
		this.update();
		return this;
	};

	Annotation.prototype._setRandomText = function(textValue) {
		if (this.getTextEditor()) {
			// No random text while editor is open
			return this;
		}
		var newText = "";
		for (var i = 0; i < textValue.length; i++) {
			if (textValue[i] === "<") {
				newText += "<";
				while (textValue[i] !== ">") {
					i++;
					newText += textValue[i];
				}
			}
			if (textValue[i] !== ">") {
				newText += "<span class=vitAnnotation>";
				newText += textValue[i];
				newText += "</span>";
			}
		}
		this._textDiv.setHtmlText(newText);

		return this;
	};

	Annotation.prototype._setExpandText = function(textValue) {
		if (this.getTextEditor()) {
			// No expand text while editor is open
			return this;
		}
		var newText = "";
		var length = textValue.length;
		for (var i = 0; i < length; i++) {
			if (textValue[i] === "<") {
				newText += "<";
				while (textValue[i] !== ">") {
					i++;
					newText += textValue[i];
				}
			}
			if (textValue[i] !== ">") {
				newText += "<span class=vitAnnotation>";
				newText += textValue[i];
				newText += "</span>";
			}
		}
		this._textDiv.setHtmlText(newText);

		return this;
	};

	Annotation.prototype.setStyle = function(val) {
		this.setProperty("style", val);

		if (this.sourceData) {
			this.sourceData.annotation.style = val;
		}

		// Re-set text here as some styles may require different text rendering
		this.setText(this.getText());
	};

	Annotation.prototype.setAnimate = function(val) {
		this.setProperty("animate", val);
		if (this.sourceData) {
			this.sourceData.annotation.animate = val;
		}
		// Re-set text here as some styles may have text animation
		this.setText(this.getText());
	};

	Annotation.prototype._setMaxZ = function() {
		// Set annotation element with max z-Index
		var annotation = this.getDomRef();
		if (annotation) {
			var maxZ = Math.max.apply(
				null,
				this._viewport.getAnnotations().map(function(ant) { return ant.zIndex || 1; }));
			if (!this.zIndex || this.zIndex < maxZ) {
				this.zIndex = maxZ + 1;
			}
			annotation.style.zIndex = this.zIndex;
		}
	};

	Annotation.prototype.onclick = function(evt) {
		// Handle click event only if we are not editing text and not moving/resizing annotation.
		if (this.getTextEditor() == null && !this._moving) {
			// Avoid two single clicks when user performs double click. Wait short period of time before accept single click.
			if (this._firstClick) {
				// First click is not cleared yet which means that this is second click of double click event.
				vkCore.getEventBus().publish("sap.ui.vk", "annotationDoubleClicked", {
					annotation: this
				});
				this._firstClick = false;
			} else {
				// First time here, just set this flag and wait little bit
				this._firstClick = true;
				setTimeout(function() {
					if (this._firstClick) {
						// Second click didn't happen, this is genuine single click event. Proceed with selection change.
						this._firstClick = false;
						this._viewport.tapObject(this.getNodeRef());
					}
				}.bind(this), 250);
			}
		}

		// Always stop propagation to viewport which would cause another selectionChanged event
		evt.stopPropagation();
	};

	Annotation.prototype.openEditor = function() {
		if (!this.getEditable()) {
			return null;
		}
		var rte = new RTE({
			editorType: rteLibrary.EditorType.TinyMCE4,
			width: this._textDiv.getWidth(),
			height: this._textDiv.getHeight(),
			value: this.getText()
		});
		if (this._textDiv) {
			this._textDiv.destroy();
		}
		rte.addStyleClass("sapUiVizKitRichTextEditor");
		this._textDiv = rte;
		this.setTextEditor(rte);

		return rte;
	};

	Annotation.prototype.closeEditor = function() {
		if (this.getTextEditor() == null) {
			// Editor is not open
			return;
		}
		var text = this._textDiv.getValue();
		this.destroyTextEditor(); // Destroy editor aggregation, this will also destroy editor control
		this._textDiv = null;
		this.setText(text);
	};

	Annotation.prototype.onAfterRendering = function() {
		var annotation = this.getDomRef();
		if (annotation) {
			this._initialOffsetWidth = annotation.offsetWidth;
			this._initialOffsetHeight = annotation.offsetHeight;
			if (!this.getDisplay()) {
				annotation.style.visibility = "hidden";
			}
			if (this.getAnimate() && this.getAnimationDelay() > 0) {
				annotation.style.animationDelay = this.getAnimationDelay() + "s";
			}
			if (this._textDiv) {
				var domRef = this._textDiv.getDomRef();
				if (domRef) {
					var delay = this.getAnimationDelay();
					if (delay === -1) {
						delay = 0;
					}
					var animationName = "";
					var children = domRef.getElementsByTagName("span");
					var style;
					var styleObjects = [];
					for (var i = 0; i < children.length; i++) {
						if (children[i].className === "vitAnnotation") {
							styleObjects.push(children[i].style);
						}
					}
					if (this.getStyle() === AnnotationStyle.Random) {
						animationName = this.getAnimate() ? "annotationRandomTextSpan" : "annotationStatic";
						for (var j = 0; j < styleObjects.length; j++) {
							style = styleObjects[j];

							var randomDelay = (delay + Math.random()) + "s";

							style.animationName = animationName;
							style.animationDuration = "4s";
							style.animationTimingFunction = "linear";
							style.animationDelay = randomDelay;
							style.animationIterationCount = "1";
							style.animationDirection = "alternate";
							style.animationFillMode = "both";
						}
					} else if (this.getStyle() === AnnotationStyle.Expand) {
						animationName = this.getAnimate() ? "annotationExpandTextSpan" : "annotationStatic";
						for (var k = 0; k < styleObjects.length; k++) {
							style = styleObjects[k];

							style.animationName = animationName;
							style.animationDuration = ((0.1 / styleObjects.length) * (k + 1)) + "s";
							style.animationTimingFunction = "linear";
							style.animationDelay = (delay + 0.5) + "s";
						}
					}
				}
			}
			this.setXCoordinate(this.getXCoordinate());
			this.setYCoordinate(this.getYCoordinate());
			this.setWidth(this.getWidth());
			this.setHeight(this.getHeight());

			this.update();
		}

		this.setEditableState(this.getEditable() && this.getSelected());

		if (this.zIndex) {
			annotation.style.zIndex = this.zIndex;
		}
	};

	Annotation.prototype.setEditable = function(editable) {
		if (this.getEditable() == editable) {
			return;
		}
		this.setProperty("editable", editable);

		if (this.sourceData) {
			this.sourceData.annotation.editable = editable;
		}

		this._previousState = this._previousState || {};
		var annotation = this.getDomRef();
		if (annotation && editable) {
			var annotationRect = annotation.getBoundingClientRect();
			this._previousState.x = annotationRect.x;
			this._previousState.y = annotationRect.y;
		}
	};

	Annotation.prototype.setHeight = function(height) {
		if (height < 0) {
			return;
		}

		this.setProperty("height", height, true);

		if (this.getNodeRef()) {
			this.getNodeRef().scale.setY(height);
		}

		if (this._viewport && this._textDiv && this._textDiv.getDomRef()) {
			var textDivDom = this._textDiv.getDomRef();
			var rect = this._viewport.deNormalizeRectangle(0, 0, 0, height);
			var testHeight = rect.height;
			if (this._textDiv.getNativeApi) {
				if (this._resized) {
					textDivDom.style.height = "calc(" + rect.height + "px)";
				} else {
					textDivDom.style.height = "calc(" + rect.height + "px + 0.6rem)";
				}
			} else {
				textDivDom.style.height = "calc(" + rect.height + "px - 1rem)";
			}

			var rectText = textDivDom.getBoundingClientRect();
			var bBox = this._viewport.getDomRef().getBoundingClientRect();
			if (textDivDom.clientHeight < textDivDom.scrollHeight) {
				textDivDom.style.height = "calc(" + textDivDom.scrollHeight + "px - 1rem)";
				testHeight = textDivDom.scrollHeight;
			}
			if (testHeight + rectText.y > bBox.y + bBox.height) {
				textDivDom.style.height = Math.round(bBox.y + bBox.height - rectText.y).toString() + "px";
			}
			// Avoid different rendering with "auto" and style.height.
			this._textDiv.setHeight(textDivDom.style.height);
		}
	};

	Annotation.prototype.setWidth = function(width) {
		if (width < 0) {
			return;
		}

		this.setProperty("width", width, true);

		if (this.getNodeRef()) {
			this.getNodeRef().scale.setX(width);
		}

		if (this._viewport && this._textDiv && this._textDiv.getDomRef()) {
			var rect = this._viewport.deNormalizeRectangle(0, 0, width, 0);
			var textDivDom = this._textDiv.getDomRef();
			var testWidth = rect.width;
			if (this._textDiv.getNativeApi) {
				if (this._resized) {
					textDivDom.style.width = "calc(" + rect.width + "px)";
				} else {
					textDivDom.style.width = "calc(" + rect.width + "px + 0.6rem)";
				}
			} else {
				textDivDom.style.width = "calc(" + rect.width + "px - 1rem)";
			}

			if (textDivDom.clientWidth < textDivDom.scrollWidth) {
				textDivDom.style.maxWidth = textDivDom.style.width;
			} else {
				textDivDom.style.maxWidth = textDivDom.style.width;
			}
			var rectText = textDivDom.getBoundingClientRect();
			var bBox = this._viewport.getDomRef().getBoundingClientRect();
			if (testWidth + rectText.x + 26 > bBox.x + bBox.width) {
				textDivDom.style.width = Math.round(bBox.x + bBox.width - rectText.x - 26).toString() + "px";
			}
			// Avoid different rendering with "auto" and style.width.
			this._textDiv.setWidth(textDivDom.style.width);
		}
	};

	Annotation.prototype.setXCoordinate = function(x) {
		if (this._viewport && this._textDiv && this._textDiv.getDomRef()) {
			// set x to be always in the visible range of the current viewport.
			if (x < this._leftLimit) {
				x = this._leftLimit;
			}
			var rightEnd = this._viewport.normalizeRectangle(0, 0, 96, 0);
			if (x > -this._leftLimit - rightEnd.width) {
				x = -this._leftLimit - rightEnd.width;
			}
			if (x < this._leftLimit) {
				x = this._leftLimit;
			}
			var rect = this._viewport.deNormalizeRectangle(x, 0, 0, 0);
			this.getDomRef().style.left = rect.x + "px";
		}

		this.setProperty("xCoordinate", x, true);

		if (this.getNodeRef()) {
			this.getNodeRef().position.setX(x);
		}

	};

	Annotation.prototype.setYCoordinate = function(y) {
		if (this._viewport && this._textDiv && this._textDiv.getDomRef()) {
			var textDivDom = this._textDiv.getDomRef();
			var textRect = this._viewport.normalizeRectangle(0, 0, 0, textDivDom.clientHeight);
			// scrollbar may be needed when there are more contents.
			if (textDivDom.scrollHeight > textDivDom.clientHeight || textRect.height > 1) {
				textDivDom.style.setProperty("--overflow", "auto");
			}
			// set y to be always in the visible range of the current viewport.
			if (y < this._topLimit) {
				y = this._topLimit;
			}
			if (y > -this._topLimit - textRect.height) {
				y = -this._topLimit - textRect.height;
			}
			if (y < this._topLimit) {
				y = this._topLimit;
			}
			var rect = this._viewport.deNormalizeRectangle(0, y, 0, 0);
			this.getDomRef().style.top = rect.y + "px";
		}

		this.setProperty("yCoordinate", y, true);

		if (this.getNodeRef()) {
			this.getNodeRef().position.setY(y);
		}

	};

	Annotation.prototype._resizeEnd = function() {
		this._handleViewportStop();
		var textDivDom = this._textDiv.getDomRef();
		var rect = this._viewport.normalizeRectangle(0, 0, textDivDom.clientWidth, textDivDom.clientHeight);
		this._resized = true;
		this.setWidth(rect.width);
		this.setHeight(rect.height);
		this._fireSizeChanged(this, rect.width, rect.height);
	};

	Annotation.prototype.setEditableState = function(editable) {
		if (!editable) {
			this.ontouchstart = null;
			return;
		}

		var currentSize = new Map();
		var editableAnnotations = [];
		var vp = this._viewport;

		var getEditableAnnotations = function() {
			editableAnnotations = vp.getAnnotations().filter(function(ant) { return ant.getEditable() && ant.getSelected(); });
			editableAnnotations.forEach(function(annotation) {
				var computedStyle = window.getComputedStyle(annotation._textDiv.getDomRef());
				var textWidth = parseInt(computedStyle.width.slice(0, -2), 10);
				var textHeight = parseInt(computedStyle.height.slice(0, -2), 10);
				var textMaxWidth = parseInt(computedStyle.maxWidth.slice(0, -2), 10);
				currentSize.set(annotation.getAnnotationId(), {
					width: textWidth,
					height: textHeight,
					maxWidth: textMaxWidth
				});
			});
		};

		var that = this;
		var annotation = this.getDomRef();
		var gripElements = annotation.childNodes;
		var resizer = {
			strategies: {
				"sapUiVizKitAnnotationElement0": gripNW,
				"sapUiVizKitAnnotationElement1": gripN,
				"sapUiVizKitAnnotationElement2": gripNE,
				"sapUiVizKitAnnotationElement3": gripE,
				"sapUiVizKitAnnotationElement4": gripSE,
				"sapUiVizKitAnnotationElement5": gripS,
				"sapUiVizKitAnnotationElement6": gripSW,
				"sapUiVizKitAnnotationElement7": gripW
			},
			resize: gripHandler
		};

		this.ontouchstart = function(ev) {
			var oEvent = ev || event;
			oEvent.stopPropagation();
			getEditableAnnotations();
			var resizeHandler = resizer.strategies[oEvent.targetTouches[0].target.className];
			if (resizeHandler) {
				// resize annotations
				resizer.resize(oEvent, resizeHandler);
			} else {
				// move annotations
				that._previousState.offsetTop = that._offsetTop;
				that._previousState.offsetLeft = that._offsetTop;

				editableAnnotations.forEach(function(annotation) {
					annotation._initialX = oEvent.clientX ? oEvent.clientX : oEvent.targetTouches[0].clientX;
					annotation._initialY = oEvent.clientY ? oEvent.clientY : oEvent.targetTouches[0].clientY;
				});
				var onMouseMove = function(ev) {
					oEvent = ev || event;
					that._viewport._viewportGestureHandler._gesture = false;
					oEvent.stopPropagation();
					editableAnnotations.forEach(function(annotation) {
						annotation._moving = true;
						var clientX = oEvent.clientX ? oEvent.clientX : oEvent.targetTouches[0].clientX;
						var clientY = oEvent.clientY ? oEvent.clientY : oEvent.targetTouches[0].clientY;
						annotation._currentX = clientX - annotation._initialX;
						annotation._currentY = clientY - annotation._initialY;
						setTranslate(annotation._currentX, annotation._currentY, annotation.getDomRef());
						annotation.update();
					});
				};
				var onMouseUp = function(ev) {
					oEvent = ev || event;
					oEvent.stopPropagation();
					editableAnnotations.forEach(function(annotation) {
						annotation._handleViewportStop();
					});
					document.removeEventListener("mousemove", onMouseMove);
					document.removeEventListener("mouseup", onMouseUp);
					document.removeEventListener("touchmove", onMouseMove);
					document.removeEventListener("touchend", onMouseUp);
				};

				document.addEventListener("mousemove", onMouseMove);
				document.addEventListener("mouseup", onMouseUp);
				document.addEventListener("touchmove", onMouseMove);
				document.addEventListener("touchend", onMouseUp);

				that.update();
			}
		};

		/**
		 * DISABLED FOR THE MOMENT
		 */
		// move leader line arrowhead
		// var annotationNodeElement = annotation.nextSibling;
		// annotationNodeElement.onmousedown = function(ev) {
		// 	var oEvent = ev || event;
		// 	var hitNode;
		// 	var annotationNode = {
		// 		_initialX: oEvent.clientX,
		// 		_initialY: oEvent.clientY
		// 	};
		// 	var currentNode = that.getNodeRef();
		// 	document.onmousemove = function(ev) {
		// 		that._moving = true;
		// 		that._viewport._viewportGestureHandler._gesture = false;
		// 		oEvent = ev || event;
		// 		setTranslate(oEvent.clientX - annotationNode._initialX, oEvent.clientY - annotationNode._initialY, annotationNodeElement);
		// 		hitNode = that._viewport.hitTest(oEvent.clientX - viewportRect.x, oEvent.clientY - viewportRect.y);
		// 	};
		// 	document.onmouseup = function() {
		// 		that._moving = false;
		// 		var computedStyle = window.getComputedStyle(annotationNodeElement);
		// 		var transform = annotationNodeElement.style.transform;
		// 		annotationNodeElement.style.transform = "";
		// 		var x = parseFloat(transform.substring(transform.indexOf("(") + 1, transform.indexOf(",")));
		// 		var y = parseFloat(transform.substring(transform.indexOf(",") + 1, transform.indexOf(")")));
		// 		annotationNodeElement.style.left = parseFloat(computedStyle.left) + x + "px";
		// 		annotationNodeElement.style.top = parseFloat(computedStyle.top) + y + "px";
		// 		if (hitNode) {
		// 			that.setNodeRef(hitNode.object);
		// 		} else {
		// 			that.setNodeRef(currentNode);
		// 		}
		// 		that._shouldRenderVp = true;
		// 		document.onmousemove = null;
		// 		document.onmouseup = null;
		// 	};
		// };

		// resize annotations
		function gripHandler(oEvent, resizeHandler) {
			var clientX = oEvent.clientX ? oEvent.clientX : oEvent.targetTouches[0].clientX;
			var clientY = oEvent.clientY ? oEvent.clientY : oEvent.targetTouches[0].clientY;
			var disX = clientX - gripElements[0].offsetLeft;
			var disY = clientY - gripElements[0].offsetTop;

			var oTarget = jQuery(oEvent.currentTarget).control()[0]._viewport.$();
			// get the iframe in RTE
			var rteIfr = jQuery("iframe[id$='-textarea_ifr']");
			if (rteIfr.length) {
				var cover = jQuery("<div></div>");
				cover.attr("id", "rte_ifr_cov");
				cover.css({ position: "absolute" });
				cover.css({ opacity: 0 });
				cover.css({ top: oTarget.offset().top, left: oTarget.offset().left });
				cover.height(oTarget.height());
				cover.width(oTarget.width());
				jQuery("body").append(cover[0]);
			}
			document.onmousemove = function(ev) {
				that._viewport._viewportGestureHandler._gesture = false;
				var oEvent = ev || event;
				var clientX = oEvent.clientX ? oEvent.clientX : oEvent.targetTouches[0].clientX;
				var clientY = oEvent.clientY ? oEvent.clientY : oEvent.targetTouches[0].clientY;
				var deltaWidth = clientX - disX;
				var deltaHeight = clientY - disY;
				editableAnnotations.forEach(function(annotation) {
					annotation._moving = true;
					resizeHandler(annotation, deltaWidth, deltaHeight);
					annotation.update();
				});
			};
			document.onmouseup = function() {
				var rteIfr = jQuery("#rte_ifr_cov");
				if (rteIfr) {
					rteIfr.remove();
				}
				editableAnnotations.forEach(function(annotation) {
					var size = currentSize.get(annotation.getAnnotationId());
					size.width = annotation._textWidth;
					size.height = annotation._textHeight;
					size.maxWidth = annotation._textMaxWidth;
					annotation._resizeEnd();
				});
				document.onmousemove = null;
				document.onmouseup = null;
				document.ontouchmove = null;
				document.ontouchend = null;
			};
			document.ontouchmove = document.onmousemove;
			document.ontouchend = document.onmouseup;
		}

		var setSize = function(annotation, width, maxWidth, height) {
			var domRef = annotation._textDiv.getDomRef();
			if (width) {
				annotation._textWidth = width;
				domRef.style.width = annotation._textWidth + "px";
				annotation._textDiv.setProperty("width", domRef.style.width, true);
			}
			if (maxWidth) {
				annotation._textMaxWidth = maxWidth;
				domRef.style.maxWidth = annotation._textMaxWidth + "px";
			}
			if (height) {
				annotation._textHeight = height;
				domRef.style.height = annotation._textHeight + "px";
				annotation._textDiv.setProperty("height", domRef.style.height, true);
			}
		};

		// north west
		function gripNW(annotation, deltaWidth, deltaHeight) {
			setSize(
				annotation,
				currentSize.get(annotation.getAnnotationId()).width - deltaWidth,
				currentSize.get(annotation.getAnnotationId()).maxWidth - deltaWidth,
				currentSize.get(annotation.getAnnotationId()).height - deltaHeight
			);
			annotation._currentX = deltaWidth;
			annotation._currentY = deltaHeight;
			setTranslate(deltaWidth, deltaHeight, annotation.getDomRef());
		}

		// north
		function gripN(annotation, deltaWidth, deltaHeight) {
			setSize(
				annotation,
				null,
				null,
				currentSize.get(annotation.getAnnotationId()).height - deltaHeight
			);
			annotation._currentX = 0;
			annotation._currentY = deltaHeight;
			setTranslate(0, deltaHeight, annotation.getDomRef());
		}

		// north east
		function gripNE(annotation, deltaWidth, deltaHeight) {
			setSize(
				annotation,
				currentSize.get(annotation.getAnnotationId()).width + deltaWidth,
				currentSize.get(annotation.getAnnotationId()).maxWidth + deltaWidth,
				currentSize.get(annotation.getAnnotationId()).height - deltaHeight
			);
			annotation._currentX = 0;
			annotation._currentY = deltaHeight;
			setTranslate(0, deltaHeight, annotation.getDomRef());
		}

		// east
		function gripE(annotation, deltaWidth, deltaHeight) {
			setSize(
				annotation,
				currentSize.get(annotation.getAnnotationId()).width + deltaWidth,
				currentSize.get(annotation.getAnnotationId()).maxWidth + deltaWidth,
				null
			);
		}

		// south east
		function gripSE(annotation, deltaWidth, deltaHeight) {
			setSize(
				annotation,
				currentSize.get(annotation.getAnnotationId()).width + deltaWidth,
				currentSize.get(annotation.getAnnotationId()).maxWidth + deltaWidth,
				currentSize.get(annotation.getAnnotationId()).height + deltaHeight
			);
		}

		// south
		function gripS(annotation, deltaWidth, deltaHeight) {
			setSize(
				annotation,
				null,
				null,
				currentSize.get(annotation.getAnnotationId()).height + deltaHeight
			);
		}

		// south west
		function gripSW(annotation, deltaWidth, deltaHeight) {
			setSize(
				annotation,
				currentSize.get(annotation.getAnnotationId()).width - deltaWidth,
				currentSize.get(annotation.getAnnotationId()).maxWidth - deltaWidth,
				currentSize.get(annotation.getAnnotationId()).height + deltaHeight
			);
			annotation._currentX = deltaWidth;
			annotation._currentY = 0;
			setTranslate(deltaWidth, 0, annotation.getDomRef());
		}

		// west
		function gripW(annotation, deltaWidth, deltaHeight) {
			setSize(
				annotation,
				currentSize.get(annotation.getAnnotationId()).width - deltaWidth,
				currentSize.get(annotation.getAnnotationId()).maxWidth - deltaWidth,
				null
			);
			annotation._currentX = deltaWidth;
			annotation._currentY = 0;
			setTranslate(deltaWidth, 0, annotation.getDomRef());
		}
	};

	Annotation.prototype.update = function() {
		var annotation = this.getDomRef();
		if (!annotation) {
			return;
		}

		var isVisible = this._updateBlocked();
		if (this.getProperty("display") != isVisible) {
			// Annotation visibility is different from its scene node visibility.
			this.setDisplay(isVisible);
		}

		if (!this.getText()) {
			// Disable showing with empty annotations
			annotation.style.display = this.getDisplay() ? "block" : "none";
		}

		var isSelected = this.getSelected();
		if (this.getProperty("selected") != isSelected) {
			// Annotation selection state is different from annotation node selection state.
			this.setSelected(isSelected);
		}

		// These two elements are node and leader - see AnnotationRenderer for order of elements
		var annotationNodeElement = annotation.childNodes[8];
		var annotationLeaderLine = annotation.childNodes[9];

		if (this.getWidth() && !this._moving) {
			this.setWidth(this.getWidth());
		}
		if (this.getHeight() && !this._moving) {
			this.setHeight(this.getHeight());
		}

		this._resized = false;

		if (!this.getAnimate()) {
			annotation.style.setProperty("--animation-name", "annotationStatic");
		}
		var aNode = this.getTargetNodes()[0];
		var nodeScreen = aNode ? this._getNodeRefScreenCenter(this._viewport, aNode) : { x: 0, y: 0, depth: 0 };
		var viewportRect = this._viewport.getDomRef().getBoundingClientRect();

		// Existence of attachmentNode determines if annotation is relative or fixed.
		if (this.getAttachmentNode()) {
			var attNodeScreen = this._getNodeRefScreenCenter(this._viewport, this.getAttachmentNode());
			if (attNodeScreen.depth > 1) {
				// If node is behind the camera then move annotation out of viewport
				attNodeScreen.x = viewportRect.width + 1000;
			}
			var normRect = this._viewport.normalizeRectangle(attNodeScreen.x, attNodeScreen.y, 0, 0);
			this.setXCoordinate(normRect.x + this.getXOffset());
			this.setYCoordinate(normRect.y + this.getYOffset());
		}

		var annotationNodeScreen = this._viewport.deNormalizeRectangle(this.getXCoordinate(), this.getYCoordinate(), 0, 0);

		if (this.getEditable() && this.getSelected()) {
			if (this._previousState.x === undefined) {
				var annotationRect = annotation.getBoundingClientRect();
				this._previousState.x = annotationRect.x;
				this._previousState.y = annotationRect.y;
			}
			annotation.style.left = this._previousState.x - viewportRect.x + "px";
			annotation.style.top = this._previousState.y - viewportRect.y + "px";
		} else {
			switch (this.getStyle()) {
				case AnnotationStyle.Default:
					annotation.childNodes[0].style.visibility = "hidden";
					annotation.childNodes[1].style.visibility = "hidden";
					annotation.childNodes[2].style.visibility = "hidden";
					annotation.childNodes[3].style.visibility = "hidden";
					annotation.childNodes[4].style.visibility = "hidden";
					break;
				case AnnotationStyle.Explode:
					annotation.childNodes[0].style.visibility = "hidden";
					annotation.childNodes[1].style.visibility = "hidden";
					annotation.childNodes[2].style.visibility = "hidden";
					break;
				case AnnotationStyle.Square:
					annotation.childNodes[0].style.visibility = "hidden";
					annotation.childNodes[1].style.visibility = "hidden";
					annotation.childNodes[2].style.visibility = "hidden";
					break;
				case AnnotationStyle.Random:
					annotation.childNodes[0].style.visibility = "hidden";
					break;
				default:
					break;
			}
		}
		if (aNode) {
			var posX = nodeScreen.x - annotationNodeScreen.x;
			var posY = nodeScreen.y - annotationNodeScreen.y;
			if (this._moving) {
				posX -= this._currentX;
				posY -= this._currentY;
			}
			annotationNodeElement.style.left = posX + "px";
			annotationNodeElement.style.top = posY + "px";

			// this.setLeaderLine(annotationNodeElement, annotation, annotationLeaderLine);

			// config leader line options for different style
			var leaderOptions = new Map([
				[AnnotationStyle.Default, { isElbow: true, toHeight: 0.5 }],
				[AnnotationStyle.Explode, { isElbow: true, toHeight: 0.5 }],
				[AnnotationStyle.Square, { isElbow: false, toHeight: 0.95 }],
				[AnnotationStyle.Random, { isElbow: false, toHeight: 0.5 }],
				[AnnotationStyle.Expand, { isElbow: true, toHeight: 0.5 }]
			]).get(this.getStyle());

			// draw leader line using svg path
			setLeaderLineSVG(annotationNodeElement, annotation, annotation.childNodes[10], {
				isElbow: leaderOptions.isElbow,  // draw elbow or not
				toHeight: leaderOptions.toHeight  // leader line point to height percentage: 0 top, 0.5 middle, 1 bottom
			});
		} else {
			annotationNodeElement.style.visibility = "hidden";
			annotationLeaderLine.style.visibility = "hidden";
		}

		var nodeRef = this.getNodeRef();
		this.setXCoordinate(nodeRef ? nodeRef.position.x : this.getProperty("xCoordinate"));
		this.setYCoordinate(nodeRef ? nodeRef.position.y : this.getProperty("yCoordinate"));
	};

	Annotation.prototype._handleViewportStop = function() {
		setTimeout(function() {
			// Delay clearing of this flag to avoid click event after we stop moving or resizing
			this._moving = false;
			this.update();
		}.bind(this), 300);
		var domRef = this.getDomRef();
		var computedStyle = window.getComputedStyle(domRef);
		var transform = domRef.style.transform;
		domRef.style.transform = "";
		this._currentX = 0;
		this._currentY = 0;
		var x = parseFloat(transform.substring(transform.indexOf("(") + 1, transform.indexOf(",")));
		var y = parseFloat(transform.substring(transform.indexOf(",") + 1, transform.indexOf(")")));
		if (x || y) {
			domRef.style.left = (parseFloat(computedStyle.left) + x) + "px";
			domRef.style.top = (parseFloat(computedStyle.top) + y) + "px";
			this._offsetTop = domRef.offsetTop;
			this._offsetLeft = domRef.offsetLeft;
			var normRect = this._viewport.normalizeRectangle(this._offsetLeft, this._offsetTop, 0, 0);
			this.setXCoordinate(normRect.x);
			this.setYCoordinate(normRect.y);
			this._firePositionChanged(this);
		}
	};

	function setTranslate(x, y, annotation) {
		annotation.style.transform = "translate(" + x + "px, " + y + "px)";
	}

	function setLeaderLineSVG(from, to, leaderLineSVG, options) {
		options = options || {};
		var fromRect = from.getBoundingClientRect();
		var toRect = to.getBoundingClientRect();

		var x1 = fromRect.x - toRect.x + fromRect.width / 2;
		var y1 = fromRect.y - toRect.y + fromRect.height / 2;

		var x2 = x1 < 0 ? 0 : toRect.width;
		var y2 = toRect.height * (options.toHeight || 0.5);

		if (x1 < 0 && !to.classList.contains("leaderlineLeft")) {
			to.classList.remove("leaderlineRight");
			to.classList.add("leaderlineLeft");
		}

		if (x1 >= 0 && !to.classList.contains("leaderlineRight")) {
			to.classList.remove("leaderlineLeft");
			to.classList.add("leaderlineRight");
		}

		var svgLeft = Math.min(x1, x2);
		var svgTop = Math.min(y1, y2);

		leaderLineSVG.style.left = svgLeft + "px";
		leaderLineSVG.style.top = svgTop + "px";

		leaderLineSVG.style.width = Math.abs(x2 - x1) + "px";
		leaderLineSVG.style.height = Math.abs(y2 - y1) + "px";

		var startX = x2 > x1 ? 0 : x1 - x2;
		var startY = y2 > y1 ? 0 : y1 - y2;
		var deltaX = x2 - x1;
		var deltaY = y2 - y1;

		var pathway = "M" + startX + " " + startY + "v" + deltaY + "h" + deltaX;
		if (x1 > 0 && x1 < toRect.width) {
			pathway = "M" + startX + " " + startY + "h" + deltaX + "v" + deltaY + "h-2";
		}

		if (!options.isElbow) {
			// draw straight leaderline
			pathway = "M" + startX + " " + startY + "l" + deltaX + " " + deltaY;
		}

		var leaderLine = leaderLineSVG.childNodes[0];
		if (pathway !== leaderLine.getAttribute("d")) {
			// update leaderLine when path attribute changes
			leaderLine.setAttribute("d", pathway);
			leaderLine.style.setProperty("--stroke-dasharray", leaderLine.getTotalLength());
			leaderLine.style.setProperty("--stroke-dashoffset", leaderLine.getTotalLength());
		}
	}

	Annotation.prototype.setLeaderLine = function(from, to, line) {
		var toRect = to.getBoundingClientRect();

		var fT = from.offsetTop + from.offsetHeight / 2;
		var tT = toRect.height / 2;
		var fL = from.offsetLeft + from.offsetWidth / 2;
		var tL = 0;
		if (fL > tL) {
			tL = toRect.width;
		}
		var topSide = Math.abs(tT - fT);
		var leftSide = Math.abs(tL - fL);
		var height = Math.sqrt(topSide * topSide + leftSide * leftSide);
		var angle = 180 / Math.PI * Math.acos(topSide / height);
		var top, left;
		if (tT > fT) {
			top = (tT - fT) / 2 + fT;
		} else {
			top = (fT - tT) / 2 + tT;
		}
		if (tL > fL) {
			left = (tL - fL) / 2 + fL;
		} else {
			left = (fL - tL) / 2 + tL;
		}

		if ((fT < tT && fL < tL) || (tT < fT && tL < fL) || (fT > tT && fL > tL) || (tT > fT && tL > fL)) {
			angle *= -1;
		}
		top -= height / 2;

		line.style.transform = "rotate(" + angle + "deg)";
		line.style.top = top + "px";
		line.style.left = left + "px";
		line.style.height = height + "px";
	};

	/**
	 * Get transformation matrix from the annotation node
	 *
	 * @returns {number[]} The transformation matrix
	 * @public
	 */
	Annotation.prototype.getTransform = function() {
		var annotationNode = this.getNodeRef();
		annotationNode.updateMatrix();
		return sap.ui.vk.TransformationMatrix.convertTo4x3(annotationNode.matrix.elements);
	};

	/**
	 * Set transformation matrix to the annotation node
	 *
	 * @param {number[]} transform The transformation matrix
	 * @returns {sap.ui.vk.Annotation} <code>this</code> to allow method chaining.
	 * @public
	 */
	Annotation.prototype.setTransform = function(transform) {
		var annotationNode = this.getNodeRef();
		annotationNode.position.set(transform[9], transform[10], transform[11]);
		annotationNode.scale.set(transform[0], transform[4], transform[8]);
		annotationNode.updateMatrix();
		this.setXCoordinate(annotationNode.position.x);
		this.setYCoordinate(annotationNode.position.y);
		this.setWidth(annotationNode.scale.x);
		this.setHeight(annotationNode.scale.y);
		this.update();
		return this;
	};

	Annotation.prototype.updateNodeId = function(nodeId) {
		var annotationNode = this.getNodeRef();
		annotationNode.userData.nodeId = nodeId;
		this.sourceData.annotation.nodeId = nodeId;
		this._viewport.getScene().setNodePersistentId(annotationNode, nodeId);
		return this;
	};

	/**
	 * Adjust annotation size and position so it is placed close to the object it's pointing to.
	 * This method can be used if precise position is not known by the application.
	 * @returns {sap.ui.vk.Annotation} <code>this</code> to allow method chaining
	 * @public
	 */
	Annotation.prototype.setInitialOffset = function() {
		var targetNode = this.getTargetNodes().values().next().value;
		var nomPos = { x: 0, y: 0, width: 0.1, height: 0.08 };
		// set initial offset when no x, y provided, and there is attachment node
		if (targetNode && this.getXCoordinate() === 0 && this.getYCoordinate() === 0) {
			var targetNodePos = this._getNodeRefScreenCenter(this._viewport, targetNode);
			var viewportRect = this._viewport.getDomRef().getBoundingClientRect();
			var initialX = targetNodePos.x >= viewportRect.width / 2
				? targetNodePos.x - 150
				: targetNodePos.x + 50;
			var initialY = targetNodePos.y >= viewportRect.height / 2
				? initialY = targetNodePos.y + 20
				: targetNodePos.y - 120;
			nomPos = this._viewport.normalizeRectangle(initialX, initialY, 0, 0);
		}

		if (nomPos.x < -0.5) {
			nomPos.x = -0.5;
		} else if (nomPos.x > 0.5) {
			nomPos.x = 0.4;
		}

		if (nomPos.y < -0.5) {
			nomPos.y = -0.5;
		} else if (nomPos.y > 0.5) {
			nomPos.y = 0.35;
		}

		this.setTransform([0.1, 0, 0, 0, 0.08, 0, 0, 0, 1, nomPos.x, nomPos.y, 0]);
		return this;
	};

	/**
	 * Adjust annotation size to fit text
	 * @param {number} [maxWidth] If set then maximum width of annotation will be limited to this number in pixels.
	 * @param {number} [maxHeight] If set then maximum height of annotation will be limited to this number in pixels.
	 * @returns {sap.ui.vk.Annotation} <code>this</code> to allow method chaining
	 * @public
	 */
	Annotation.prototype.fitToText = function(maxWidth, maxHeight) {
		if (this._textDiv == null || this._textDiv.getDomRef() == null) {
			return this;
		}

		var div = document.createElement("div");
		div.style.setProperty("whiteSpace", "nowrap", "important");
		div.style.setProperty("visibility", "hidden", "important");
		div.style.setProperty("position", "absolute");
		if (maxWidth != null) {
			div.style.maxWidth = maxWidth + "px";
		}
		if (maxHeight != null) {
			div.style.maxHeight = maxHeight + "px";
		}
		div.innerHTML = this._textDiv.getDomRef().innerHTML;

		document.body.appendChild(div);
		div.style.setProperty("width", "calc(" + div.clientWidth + "px + 1rem)");
		div.style.setProperty("height", "calc(" + div.clientHeight + "px + 1rem)");
		var normRect = this._viewport.normalizeRectangle(0, 0, div.clientWidth, div.clientHeight);
		document.body.removeChild(div);
		this.setWidth(normRect.width);
		this.setHeight(normRect.height);

		return this;
	};

	Annotation.getStyles = function() {
		var styles = [
			{
				style: AnnotationStyle.Default,
				src: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGAAAABACAYAAAGSM0KYAAAACXBIWXMAAAsTAAALEwEAmpwYAAALC2lUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNi4wLWMwMDIgNzkuMTY0MzUyLCAyMDIwLzAxLzMwLTE1OjUwOjM4ICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtbG5zOmRjPSJodHRwOi8vcHVybC5vcmcvZGMvZWxlbWVudHMvMS4xLyIgeG1sbnM6eG1wTU09Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9tbS8iIHhtbG5zOnN0RXZ0PSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvc1R5cGUvUmVzb3VyY2VFdmVudCMiIHhtbG5zOnN0UmVmPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvc1R5cGUvUmVzb3VyY2VSZWYjIiB4bWxuczpwaG90b3Nob3A9Imh0dHA6Ly9ucy5hZG9iZS5jb20vcGhvdG9zaG9wLzEuMC8iIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIDIxLjEgKE1hY2ludG9zaCkiIHhtcDpDcmVhdGVEYXRlPSIyMDIwLTAzLTI2VDExOjEwOjAyKzEzOjAwIiB4bXA6TWV0YWRhdGFEYXRlPSIyMDIwLTAzLTI2VDE0OjM1OjIzKzEzOjAwIiB4bXA6TW9kaWZ5RGF0ZT0iMjAyMC0wMy0yNlQxNDozNToyMysxMzowMCIgZGM6Zm9ybWF0PSJpbWFnZS9wbmciIHhtcE1NOkluc3RhbmNlSUQ9InhtcC5paWQ6MmZhNTI3NDEtOGZkZi00NTM0LWE0N2UtMWRmZWMyOTc3NTliIiB4bXBNTTpEb2N1bWVudElEPSJhZG9iZTpkb2NpZDpwaG90b3Nob3A6MDRkNjFiNzktZDUxMC01MDQwLThjNjYtYjk4ZWIyZWMxOWI0IiB4bXBNTTpPcmlnaW5hbERvY3VtZW50SUQ9InhtcC5kaWQ6ZWU1NTEwZjgtNmI2ZC00NDJhLTkwOTMtMzQ4NmNlNDA0ZDU0IiBwaG90b3Nob3A6Q29sb3JNb2RlPSIzIiBwaG90b3Nob3A6SUNDUHJvZmlsZT0ic1JHQiBJRUM2MTk2Ni0yLjEiPiA8eG1wTU06SGlzdG9yeT4gPHJkZjpTZXE+IDxyZGY6bGkgc3RFdnQ6YWN0aW9uPSJjcmVhdGVkIiBzdEV2dDppbnN0YW5jZUlEPSJ4bXAuaWlkOmVlNTUxMGY4LTZiNmQtNDQyYS05MDkzLTM0ODZjZTQwNGQ1NCIgc3RFdnQ6d2hlbj0iMjAyMC0wMy0yNlQxMToxMDowMisxMzowMCIgc3RFdnQ6c29mdHdhcmVBZ2VudD0iQWRvYmUgUGhvdG9zaG9wIDIxLjEgKE1hY2ludG9zaCkiLz4gPHJkZjpsaSBzdEV2dDphY3Rpb249InNhdmVkIiBzdEV2dDppbnN0YW5jZUlEPSJ4bXAuaWlkOjEyYTg4Mjg4LWYzOWItNDU4My04M2FlLTk0NTExY2FjZGU5OCIgc3RFdnQ6d2hlbj0iMjAyMC0wMy0yNlQxNDoxNTozMisxMzowMCIgc3RFdnQ6c29mdHdhcmVBZ2VudD0iQWRvYmUgUGhvdG9zaG9wIDIxLjEgKE1hY2ludG9zaCkiIHN0RXZ0OmNoYW5nZWQ9Ii8iLz4gPHJkZjpsaSBzdEV2dDphY3Rpb249InNhdmVkIiBzdEV2dDppbnN0YW5jZUlEPSJ4bXAuaWlkOjcyOWFhOWVjLTE0ZmItNDdiZS1hNTNhLTAyYzgyOWEyMjlhOCIgc3RFdnQ6d2hlbj0iMjAyMC0wMy0yNlQxNDozNToyMysxMzowMCIgc3RFdnQ6c29mdHdhcmVBZ2VudD0iQWRvYmUgUGhvdG9zaG9wIDIxLjEgKE1hY2ludG9zaCkiIHN0RXZ0OmNoYW5nZWQ9Ii8iLz4gPHJkZjpsaSBzdEV2dDphY3Rpb249ImNvbnZlcnRlZCIgc3RFdnQ6cGFyYW1ldGVycz0iZnJvbSBhcHBsaWNhdGlvbi92bmQuYWRvYmUucGhvdG9zaG9wIHRvIGltYWdlL3BuZyIvPiA8cmRmOmxpIHN0RXZ0OmFjdGlvbj0iZGVyaXZlZCIgc3RFdnQ6cGFyYW1ldGVycz0iY29udmVydGVkIGZyb20gYXBwbGljYXRpb24vdm5kLmFkb2JlLnBob3Rvc2hvcCB0byBpbWFnZS9wbmciLz4gPHJkZjpsaSBzdEV2dDphY3Rpb249InNhdmVkIiBzdEV2dDppbnN0YW5jZUlEPSJ4bXAuaWlkOjJmYTUyNzQxLThmZGYtNDUzNC1hNDdlLTFkZmVjMjk3NzU5YiIgc3RFdnQ6d2hlbj0iMjAyMC0wMy0yNlQxNDozNToyMysxMzowMCIgc3RFdnQ6c29mdHdhcmVBZ2VudD0iQWRvYmUgUGhvdG9zaG9wIDIxLjEgKE1hY2ludG9zaCkiIHN0RXZ0OmNoYW5nZWQ9Ii8iLz4gPC9yZGY6U2VxPiA8L3htcE1NOkhpc3Rvcnk+IDx4bXBNTTpEZXJpdmVkRnJvbSBzdFJlZjppbnN0YW5jZUlEPSJ4bXAuaWlkOjcyOWFhOWVjLTE0ZmItNDdiZS1hNTNhLTAyYzgyOWEyMjlhOCIgc3RSZWY6ZG9jdW1lbnRJRD0ieG1wLmRpZDplZTU1MTBmOC02YjZkLTQ0MmEtOTA5My0zNDg2Y2U0MDRkNTQiIHN0UmVmOm9yaWdpbmFsRG9jdW1lbnRJRD0ieG1wLmRpZDplZTU1MTBmOC02YjZkLTQ0MmEtOTA5My0zNDg2Y2U0MDRkNTQiLz4gPHBob3Rvc2hvcDpUZXh0TGF5ZXJzPiA8cmRmOkJhZz4gPHJkZjpsaSBwaG90b3Nob3A6TGF5ZXJOYW1lPSJURVhUIiBwaG90b3Nob3A6TGF5ZXJUZXh0PSJURVhUIi8+IDxyZGY6bGkgcGhvdG9zaG9wOkxheWVyTmFtZT0iVGV4dCIgcGhvdG9zaG9wOkxheWVyVGV4dD0iVGV4dCIvPiA8cmRmOmxpIHBob3Rvc2hvcDpMYXllck5hbWU9IlRleHQiIHBob3Rvc2hvcDpMYXllclRleHQ9IlRleHQiLz4gPHJkZjpsaSBwaG90b3Nob3A6TGF5ZXJOYW1lPSJUZXh0IiBw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"
			}, {
				style: AnnotationStyle.Explode,
				src: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGAAAABACAYAAAGSM0KYAAAACXBIWXMAAAsTAAALEwEAmpwYAAALC2lUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNi4wLWMwMDIgNzkuMTY0MzUyLCAyMDIwLzAxLzMwLTE1OjUwOjM4ICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtbG5zOmRjPSJodHRwOi8vcHVybC5vcmcvZGMvZWxlbWVudHMvMS4xLyIgeG1sbnM6eG1wTU09Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9tbS8iIHhtbG5zOnN0RXZ0PSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvc1R5cGUvUmVzb3VyY2VFdmVudCMiIHhtbG5zOnN0UmVmPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvc1R5cGUvUmVzb3VyY2VSZWYjIiB4bWxuczpwaG90b3Nob3A9Imh0dHA6Ly9ucy5hZG9iZS5jb20vcGhvdG9zaG9wLzEuMC8iIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIDIxLjEgKE1hY2ludG9zaCkiIHhtcDpDcmVhdGVEYXRlPSIyMDIwLTAzLTI2VDExOjEwOjAyKzEzOjAwIiB4bXA6TWV0YWRhdGFEYXRlPSIyMDIwLTAzLTI2VDE0OjM0OjQyKzEzOjAwIiB4bXA6TW9kaWZ5RGF0ZT0iMjAyMC0wMy0yNlQxNDozNDo0MisxMzowMCIgZGM6Zm9ybWF0PSJpbWFnZS9wbmciIHhtcE1NOkluc3RhbmNlSUQ9InhtcC5paWQ6MTkxNWVjMTctNGM5Mi00YzljLWE0MTUtMjA0NDFhMmQwNTFhIiB4bXBNTTpEb2N1bWVudElEPSJhZG9iZTpkb2NpZDpwaG90b3Nob3A6ZDNjNTE2ZDgtOTgxOC1hYzQwLWJiM2EtNmNiYjI5Nzg3NTcwIiB4bXBNTTpPcmlnaW5hbERvY3VtZW50SUQ9InhtcC5kaWQ6ZWU1NTEwZjgtNmI2ZC00NDJhLTkwOTMtMzQ4NmNlNDA0ZDU0IiBwaG90b3Nob3A6Q29sb3JNb2RlPSIzIiBwaG90b3Nob3A6SUNDUHJvZmlsZT0ic1JHQiBJRUM2MTk2Ni0yLjEiPiA8eG1wTU06SGlzdG9yeT4gPHJkZjpTZXE+IDxyZGY6bGkgc3RFdnQ6YWN0aW9uPSJjcmVhdGVkIiBzdEV2dDppbnN0YW5jZUlEPSJ4bXAuaWlkOmVlNTUxMGY4LTZiNmQtNDQyYS05MDkzLTM0ODZjZTQwNGQ1NCIgc3RFdnQ6d2hlbj0iMjAyMC0wMy0yNlQxMToxMDowMisxMzowMCIgc3RFdnQ6c29mdHdhcmVBZ2VudD0iQWRvYmUgUGhvdG9zaG9wIDIxLjEgKE1hY2ludG9zaCkiLz4gPHJkZjpsaSBzdEV2dDphY3Rpb249InNhdmVkIiBzdEV2dDppbnN0YW5jZUlEPSJ4bXAuaWlkOjEyYTg4Mjg4LWYzOWItNDU4My04M2FlLTk0NTExY2FjZGU5OCIgc3RFdnQ6d2hlbj0iMjAyMC0wMy0yNlQxNDoxNTozMisxMzowMCIgc3RFdnQ6c29mdHdhcmVBZ2VudD0iQWRvYmUgUGhvdG9zaG9wIDIxLjEgKE1hY2ludG9zaCkiIHN0RXZ0OmNoYW5nZWQ9Ii8iLz4gPHJkZjpsaSBzdEV2dDphY3Rpb249InNhdmVkIiBzdEV2dDppbnN0YW5jZUlEPSJ4bXAuaWlkOjYzNzdjM2ExLTQ0OGQtNDVmOC05YmRjLTdlZmZmZjMxM2Y5OCIgc3RFdnQ6d2hlbj0iMjAyMC0wMy0yNlQxNDozNDo0MisxMzowMCIgc3RFdnQ6c29mdHdhcmVBZ2VudD0iQWRvYmUgUGhvdG9zaG9wIDIxLjEgKE1hY2ludG9zaCkiIHN0RXZ0OmNoYW5nZWQ9Ii8iLz4gPHJkZjpsaSBzdEV2dDphY3Rpb249ImNvbnZlcnRlZCIgc3RFdnQ6cGFyYW1ldGVycz0iZnJvbSBhcHBsaWNhdGlvbi92bmQuYWRvYmUucGhvdG9zaG9wIHRvIGltYWdlL3BuZyIvPiA8cmRmOmxpIHN0RXZ0OmFjdGlvbj0iZGVyaXZlZCIgc3RFdnQ6cGFyYW1ldGVycz0iY29udmVydGVkIGZyb20gYXBwbGljYXRpb24vdm5kLmFkb2JlLnBob3Rvc2hvcCB0byBpbWFnZS9wbmciLz4gPHJkZjpsaSBzdEV2dDphY3Rpb249InNhdmVkIiBzdEV2dDppbnN0YW5jZUlEPSJ4bXAuaWlkOjE5MTVlYzE3LTRjOTItNGM5Yy1hNDE1LTIwNDQxYTJkMDUxYSIgc3RFdnQ6d2hlbj0iMjAyMC0wMy0yNlQxNDozNDo0MisxMzowMCIgc3RFdnQ6c29mdHdhcmVBZ2VudD0iQWRvYmUgUGhvdG9zaG9wIDIxLjEgKE1hY2ludG9zaCkiIHN0RXZ0OmNoYW5nZWQ9Ii8iLz4gPC9yZGY6U2VxPiA8L3htcE1NOkhpc3Rvcnk+IDx4bXBNTTpEZXJpdmVkRnJvbSBzdFJlZjppbnN0YW5jZUlEPSJ4bXAuaWlkOjYzNzdjM2ExLTQ0OGQtNDVmOC05YmRjLTdlZmZmZjMxM2Y5OCIgc3RSZWY6ZG9jdW1lbnRJRD0ieG1wLmRpZDplZTU1MTBmOC02YjZkLTQ0MmEtOTA5My0zNDg2Y2U0MDRkNTQiIHN0UmVmOm9yaWdpbmFsRG9jdW1lbnRJRD0ieG1wLmRpZDplZTU1MTBmOC02YjZkLTQ0MmEtOTA5My0zNDg2Y2U0MDRkNTQiLz4gPHBob3Rvc2hvcDpUZXh0TGF5ZXJzPiA8cmRmOkJhZz4gPHJkZjpsaSBwaG90b3Nob3A6TGF5ZXJOYW1lPSJURVhUIiBwaG90b3Nob3A6TGF5ZXJUZXh0PSJURVhUIi8+IDxyZGY6bGkgcGhvdG9zaG9wOkxheWVyTmFtZT0iVGV4dCIgcGhvdG9zaG9wOkxheWVyVGV4dD0iVGV4dCIvPiA8cmRmOmxpIHBob3Rvc2hvcDpMYXllck5hbWU9IlRleHQiIHBob3Rvc2hvcDpMYXllclRleHQ9IlRleHQiLz4gPHJkZjpsaSBwaG90b3Nob3A6TGF5ZXJOYW1lPSJUZXh0IiBw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"
			}, {
				style: AnnotationStyle.Square,
				src: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGAAAABACAYAAAGSM0KYAAAACXBIWXMAAAsTAAALEwEAmpwYAAALC2lUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNi4wLWMwMDIgNzkuMTY0MzUyLCAyMDIwLzAxLzMwLTE1OjUwOjM4ICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtbG5zOmRjPSJodHRwOi8vcHVybC5vcmcvZGMvZWxlbWVudHMvMS4xLyIgeG1sbnM6eG1wTU09Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9tbS8iIHhtbG5zOnN0RXZ0PSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvc1R5cGUvUmVzb3VyY2VFdmVudCMiIHhtbG5zOnN0UmVmPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvc1R5cGUvUmVzb3VyY2VSZWYjIiB4bWxuczpwaG90b3Nob3A9Imh0dHA6Ly9ucy5hZG9iZS5jb20vcGhvdG9zaG9wLzEuMC8iIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIDIxLjEgKE1hY2ludG9zaCkiIHhtcDpDcmVhdGVEYXRlPSIyMDIwLTAzLTI2VDExOjEwOjAyKzEzOjAwIiB4bXA6TWV0YWRhdGFEYXRlPSIyMDIwLTAzLTI2VDE0OjM1OjA4KzEzOjAwIiB4bXA6TW9kaWZ5RGF0ZT0iMjAyMC0wMy0yNlQxNDozNTowOCsxMzowMCIgZGM6Zm9ybWF0PSJpbWFnZS9wbmciIHhtcE1NOkluc3RhbmNlSUQ9InhtcC5paWQ6NTk0ZjlmZWYtYzE5MS00Nzc3LWFhZjgtZDEyYTdkNjhmZWJiIiB4bXBNTTpEb2N1bWVudElEPSJhZG9iZTpkb2NpZDpwaG90b3Nob3A6YmUxMTFiMDktOWRjOC03YjQ4LTllYzQtMTBmNDYxNjllZTY5IiB4bXBNTTpPcmlnaW5hbERvY3VtZW50SUQ9InhtcC5kaWQ6ZWU1NTEwZjgtNmI2ZC00NDJhLTkwOTMtMzQ4NmNlNDA0ZDU0IiBwaG90b3Nob3A6Q29sb3JNb2RlPSIzIiBwaG90b3Nob3A6SUNDUHJvZmlsZT0ic1JHQiBJRUM2MTk2Ni0yLjEiPiA8eG1wTU06SGlzdG9yeT4gPHJkZjpTZXE+IDxyZGY6bGkgc3RFdnQ6YWN0aW9uPSJjcmVhdGVkIiBzdEV2dDppbnN0YW5jZUlEPSJ4bXAuaWlkOmVlNTUxMGY4LTZiNmQtNDQyYS05MDkzLTM0ODZjZTQwNGQ1NCIgc3RFdnQ6d2hlbj0iMjAyMC0wMy0yNlQxMToxMDowMisxMzowMCIgc3RFdnQ6c29mdHdhcmVBZ2VudD0iQWRvYmUgUGhvdG9zaG9wIDIxLjEgKE1hY2ludG9zaCkiLz4gPHJkZjpsaSBzdEV2dDphY3Rpb249InNhdmVkIiBzdEV2dDppbnN0YW5jZUlEPSJ4bXAuaWlkOjEyYTg4Mjg4LWYzOWItNDU4My04M2FlLTk0NTExY2FjZGU5OCIgc3RFdnQ6d2hlbj0iMjAyMC0wMy0yNlQxNDoxNTozMisxMzowMCIgc3RFdnQ6c29mdHdhcmVBZ2VudD0iQWRvYmUgUGhvdG9zaG9wIDIxLjEgKE1hY2ludG9zaCkiIHN0RXZ0OmNoYW5nZWQ9Ii8iLz4gPHJkZjpsaSBzdEV2dDphY3Rpb249InNhdmVkIiBzdEV2dDppbnN0YW5jZUlEPSJ4bXAuaWlkOmJlMjcwOTQwLWZlNjctNGQyMS04ZTI5LWE5MzIzMzM1YjliZCIgc3RFdnQ6d2hlbj0iMjAyMC0wMy0yNlQxNDozNTowOCsxMzowMCIgc3RFdnQ6c29mdHdhcmVBZ2VudD0iQWRvYmUgUGhvdG9zaG9wIDIxLjEgKE1hY2ludG9zaCkiIHN0RXZ0OmNoYW5nZWQ9Ii8iLz4gPHJkZjpsaSBzdEV2dDphY3Rpb249ImNvbnZlcnRlZCIgc3RFdnQ6cGFyYW1ldGVycz0iZnJvbSBhcHBsaWNhdGlvbi92bmQuYWRvYmUucGhvdG9zaG9wIHRvIGltYWdlL3BuZyIvPiA8cmRmOmxpIHN0RXZ0OmFjdGlvbj0iZGVyaXZlZCIgc3RFdnQ6cGFyYW1ldGVycz0iY29udmVydGVkIGZyb20gYXBwbGljYXRpb24vdm5kLmFkb2JlLnBob3Rvc2hvcCB0byBpbWFnZS9wbmciLz4gPHJkZjpsaSBzdEV2dDphY3Rpb249InNhdmVkIiBzdEV2dDppbnN0YW5jZUlEPSJ4bXAuaWlkOjU5NGY5ZmVmLWMxOTEtNDc3Ny1hYWY4LWQxMmE3ZDY4ZmViYiIgc3RFdnQ6d2hlbj0iMjAyMC0wMy0yNlQxNDozNTowOCsxMzowMCIgc3RFdnQ6c29mdHdhcmVBZ2VudD0iQWRvYmUgUGhvdG9zaG9wIDIxLjEgKE1hY2ludG9zaCkiIHN0RXZ0OmNoYW5nZWQ9Ii8iLz4gPC9yZGY6U2VxPiA8L3htcE1NOkhpc3Rvcnk+IDx4bXBNTTpEZXJpdmVkRnJvbSBzdFJlZjppbnN0YW5jZUlEPSJ4bXAuaWlkOmJlMjcwOTQwLWZlNjctNGQyMS04ZTI5LWE5MzIzMzM1YjliZCIgc3RSZWY6ZG9jdW1lbnRJRD0ieG1wLmRpZDplZTU1MTBmOC02YjZkLTQ0MmEtOTA5My0zNDg2Y2U0MDRkNTQiIHN0UmVmOm9yaWdpbmFsRG9jdW1lbnRJRD0ieG1wLmRpZDplZTU1MTBmOC02YjZkLTQ0MmEtOTA5My0zNDg2Y2U0MDRkNTQiLz4gPHBob3Rvc2hvcDpUZXh0TGF5ZXJzPiA8cmRmOkJhZz4gPHJkZjpsaSBwaG90b3Nob3A6TGF5ZXJOYW1lPSJURVhUIiBwaG90b3Nob3A6TGF5ZXJUZXh0PSJURVhUIi8+IDxyZGY6bGkgcGhvdG9zaG9wOkxheWVyTmFtZT0iVGV4dCIgcGhvdG9zaG9wOkxheWVyVGV4dD0iVGV4dCIvPiA8cmRmOmxpIHBob3Rvc2hvcDpMYXllck5hbWU9IlRleHQiIHBob3Rvc2hvcDpMYXllclRleHQ9IlRleHQiLz4gPHJkZjpsaSBwaG90b3Nob3A6TGF5ZXJOYW1lPSJUZXh0IiBw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"
			}, {
				style: AnnotationStyle.Random,
				src: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGAAAABACAYAAAGSM0KYAAAACXBIWXMAAAsTAAALEwEAmpwYAAALC2lUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNi4wLWMwMDIgNzkuMTY0MzUyLCAyMDIwLzAxLzMwLTE1OjUwOjM4ICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtbG5zOmRjPSJodHRwOi8vcHVybC5vcmcvZGMvZWxlbWVudHMvMS4xLyIgeG1sbnM6eG1wTU09Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9tbS8iIHhtbG5zOnN0RXZ0PSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvc1R5cGUvUmVzb3VyY2VFdmVudCMiIHhtbG5zOnN0UmVmPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvc1R5cGUvUmVzb3VyY2VSZWYjIiB4bWxuczpwaG90b3Nob3A9Imh0dHA6Ly9ucy5hZG9iZS5jb20vcGhvdG9zaG9wLzEuMC8iIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIDIxLjEgKE1hY2ludG9zaCkiIHhtcDpDcmVhdGVEYXRlPSIyMDIwLTAzLTI2VDExOjEwOjAyKzEzOjAwIiB4bXA6TWV0YWRhdGFEYXRlPSIyMDIwLTAzLTI2VDE0OjM0OjU0KzEzOjAwIiB4bXA6TW9kaWZ5RGF0ZT0iMjAyMC0wMy0yNlQxNDozNDo1NCsxMzowMCIgZGM6Zm9ybWF0PSJpbWFnZS9wbmciIHhtcE1NOkluc3RhbmNlSUQ9InhtcC5paWQ6OWZkYTc5MGItNmU4NC00ZWY1LWE0ZjEtODRlYWIwYjA1YmM4IiB4bXBNTTpEb2N1bWVudElEPSJhZG9iZTpkb2NpZDpwaG90b3Nob3A6OGFkNDQ1MGUtN2ZmNS1iZTQyLTlmNTAtOGE0ZDBlYTU4MmFlIiB4bXBNTTpPcmlnaW5hbERvY3VtZW50SUQ9InhtcC5kaWQ6ZWU1NTEwZjgtNmI2ZC00NDJhLTkwOTMtMzQ4NmNlNDA0ZDU0IiBwaG90b3Nob3A6Q29sb3JNb2RlPSIzIiBwaG90b3Nob3A6SUNDUHJvZmlsZT0ic1JHQiBJRUM2MTk2Ni0yLjEiPiA8eG1wTU06SGlzdG9yeT4gPHJkZjpTZXE+IDxyZGY6bGkgc3RFdnQ6YWN0aW9uPSJjcmVhdGVkIiBzdEV2dDppbnN0YW5jZUlEPSJ4bXAuaWlkOmVlNTUxMGY4LTZiNmQtNDQyYS05MDkzLTM0ODZjZTQwNGQ1NCIgc3RFdnQ6d2hlbj0iMjAyMC0wMy0yNlQxMToxMDowMisxMzowMCIgc3RFdnQ6c29mdHdhcmVBZ2VudD0iQWRvYmUgUGhvdG9zaG9wIDIxLjEgKE1hY2ludG9zaCkiLz4gPHJkZjpsaSBzdEV2dDphY3Rpb249InNhdmVkIiBzdEV2dDppbnN0YW5jZUlEPSJ4bXAuaWlkOjEyYTg4Mjg4LWYzOWItNDU4My04M2FlLTk0NTExY2FjZGU5OCIgc3RFdnQ6d2hlbj0iMjAyMC0wMy0yNlQxNDoxNTozMisxMzowMCIgc3RFdnQ6c29mdHdhcmVBZ2VudD0iQWRvYmUgUGhvdG9zaG9wIDIxLjEgKE1hY2ludG9zaCkiIHN0RXZ0OmNoYW5nZWQ9Ii8iLz4gPHJkZjpsaSBzdEV2dDphY3Rpb249InNhdmVkIiBzdEV2dDppbnN0YW5jZUlEPSJ4bXAuaWlkOmEwMDkzM2E5LTA4NzctNDRlYi04YThmLTZlZDYyZjA1ZDhlZCIgc3RFdnQ6d2hlbj0iMjAyMC0wMy0yNlQxNDozNDo1NCsxMzowMCIgc3RFdnQ6c29mdHdhcmVBZ2VudD0iQWRvYmUgUGhvdG9zaG9wIDIxLjEgKE1hY2ludG9zaCkiIHN0RXZ0OmNoYW5nZWQ9Ii8iLz4gPHJkZjpsaSBzdEV2dDphY3Rpb249ImNvbnZlcnRlZCIgc3RFdnQ6cGFyYW1ldGVycz0iZnJvbSBhcHBsaWNhdGlvbi92bmQuYWRvYmUucGhvdG9zaG9wIHRvIGltYWdlL3BuZyIvPiA8cmRmOmxpIHN0RXZ0OmFjdGlvbj0iZGVyaXZlZCIgc3RFdnQ6cGFyYW1ldGVycz0iY29udmVydGVkIGZyb20gYXBwbGljYXRpb24vdm5kLmFkb2JlLnBob3Rvc2hvcCB0byBpbWFnZS9wbmciLz4gPHJkZjpsaSBzdEV2dDphY3Rpb249InNhdmVkIiBzdEV2dDppbnN0YW5jZUlEPSJ4bXAuaWlkOjlmZGE3OTBiLTZlODQtNGVmNS1hNGYxLTg0ZWFiMGIwNWJjOCIgc3RFdnQ6d2hlbj0iMjAyMC0wMy0yNlQxNDozNDo1NCsxMzowMCIgc3RFdnQ6c29mdHdhcmVBZ2VudD0iQWRvYmUgUGhvdG9zaG9wIDIxLjEgKE1hY2ludG9zaCkiIHN0RXZ0OmNoYW5nZWQ9Ii8iLz4gPC9yZGY6U2VxPiA8L3htcE1NOkhpc3Rvcnk+IDx4bXBNTTpEZXJpdmVkRnJvbSBzdFJlZjppbnN0YW5jZUlEPSJ4bXAuaWlkOmEwMDkzM2E5LTA4NzctNDRlYi04YThmLTZlZDYyZjA1ZDhlZCIgc3RSZWY6ZG9jdW1lbnRJRD0ieG1wLmRpZDplZTU1MTBmOC02YjZkLTQ0MmEtOTA5My0zNDg2Y2U0MDRkNTQiIHN0UmVmOm9yaWdpbmFsRG9jdW1lbnRJRD0ieG1wLmRpZDplZTU1MTBmOC02YjZkLTQ0MmEtOTA5My0zNDg2Y2U0MDRkNTQiLz4gPHBob3Rvc2hvcDpUZXh0TGF5ZXJzPiA8cmRmOkJhZz4gPHJkZjpsaSBwaG90b3Nob3A6TGF5ZXJOYW1lPSJURVhUIiBwaG90b3Nob3A6TGF5ZXJUZXh0PSJURVhUIi8+IDxyZGY6bGkgcGhvdG9zaG9wOkxheWVyTmFtZT0iVGV4dCIgcGhvdG9zaG9wOkxheWVyVGV4dD0iVGV4dCIvPiA8cmRmOmxpIHBob3Rvc2hvcDpMYXllck5hbWU9IlRleHQiIHBob3Rvc2hvcDpMYXllclRleHQ9IlRleHQiLz4gPHJkZjpsaSBwaG90b3Nob3A6TGF5ZXJOYW1lPSJUZXh0IiBwaG90b3Nob3A6TGF5ZXJUZXh0PSJUZXh0Ii8+IDxyZGY6bGkgcGhvdG9zaG9wOkxheWVyTmFtZT0iVGV4dCIgcGhvdG9zaG9wOkxheWVyVGV4dD0iVGV4dCIvPiA8L3JkZjpCYWc+IDwvcGhvdG9zaG9wOlRleHRMYXllcnM+IDwvcmRmOkRlc2NyaXB0aW9uPiA8L3JkZjpSREY+IDwveDp4bXBtZXRhPiA8P3hwYWNrZXQgZW5kPSJyIj8+/+COBQAABfZJREFUeJztnD1sE0kYht9vZCBBRL7oBLnqKO+q0B0VKeniNFwEhUmWzCAhHR1UR5mrKO8kS2dHUZQGOVSmupRQpU13ZahOoMixguQU0XxXsBPWm/2b9dq7TvaRRnK865l5552Znb8NMTOEEKy1JoTgvV5xv5sWQkyF/cAbmfBfVEr1w34IAGBmENGUNzx58kR5/2ZmmECuhtDsuFk6MZ+NhhOtdegPhPiWc+HGEJlt93oDwNcsJcFNpUFElNgDwNUQI3p6IALvH7EeAAARsbfMpZQvlpaW5kJ9ICL2J+vH60MS0YM5SlKs54yzwdSlWB0JCKxe1jkKI6w6VgCg22bMLoeWK2q1WvXmzZvPiajaarVeBt3Te0sMgKoPBss8syLyVgUvmRWRv/qc4a21wwYiahARvCHrBEz4llDS/iVNMXXbzF6TEdVEYyIObd6JOu0kjLwWhZFfAisrKwtKqb6Uctf7vZSybZNApAfuI+Lj6enpCyHEbSFEnZl7rVbrvv/ebpv71Qd8zuiK/ws/zHwghLgjhFgEME9EH4PuC4o8VoENF7cWmSICED+GCSOsJ9VaZ9cXBSWitb4AHozH5CwIehYMJJDR2CgLIofvfkZuwagpnADbvqRwAmwZSoB3xrW2tvbq4cOHt81nAHAcp+44Tl0p9W/SOHtv6SwkIRMHlFJ9Ilq4ceNGU0r5emNjY10p1T88POxsbm5uM/NBFukE4hkTD0xNbcPjx49/Cbvmn+JGBeuxfNG60bBxTxiXuxGPgtBJagiZTv2yQgjRAPAs7r6xDOdSYjLfiLuxqAIMsUKKLsAQKqSobSDyuhlKAwV1QGsdGbz4H2QmglTrRGnxpm2bvlcAAAy9gpABfRsBhaxCNlwcAWlXVfLm4jgwqUy8gNgV3iD8u4/NZjN0IuQ4zuLm5ua7NOkkgplxtAMc7eDcrnNckFKuE9HUo0ePfjKfV1dX75vppZRy/enTpwfmWsLARzvJt5BMFWI3pGJmZmbPTOS3trbeT01N7Sml/vv8+fOfzHywsbGxnjSubtsuG0YAucGalZWVBQA9KeUuM38AAK31SwC9TqfTs40vauM0CAEA1QcM/05pUra2tt4D+PHLly+KiO4BgBDildZ623GcReBMZGKs8uLbbky9rLK6uno/zZJLUBtItazillw5mBs3pYC8ORNgu6BUFCYz1x78U0oA458b+NxnJHiomjwWblnFFfM9gMOo+4yAolahQ3wVEUtRBQAJRRRZAJBARNEFADEiJkEAECFiUgQAISImSQAQIKKoz4FQ3ClnsZfXbSicAJu9ASCgCrlr9YFjkUldP01KRPWNPP4+DFELc+emx5M6ZRgSq5MPtlzKEi0SgQZc9K7GhlGXRdkCcqY0IGdKA3Im1fZkGmq1WnV2dvZO2HWt9dH29vb+uPJTFHJrAVevXv3nypUr9SziklLu+t+1mhQGJmLuK50AgNllGunpY6VUX2v9h9k6dhxnsVKpmBfU9gHMM/OHT58+/Xr9+vXvZmZm9gAcNJvNu+ZeZv4LAIioDgDMvB/0/tkwdNvsPYxAgOXmaQxj64KiqNVqVbfw97XW5jTFOyHE77du3dpxC/UHKWXbPZ3ROzk5uWu6LCnlHQDIuvDHgd8Aml0m7raZMMZTf51Op6eUAjP3vIcp1tbWjrTWBwBQr9fniWiBmT8Q0b1r1649B6DGkD1vmWQfedBakNaaRr1T7++CarVadW5ubhfAvHtLj5nftVotJaV8TUS/nZ6eLpvzRkqpPQC3j4+P705PTy9UKpW/AeD4+PjnN2/eZPaai9b6JO5/cAxDbgZMCqM2oJwH5ExpQM6UBuRMoAGXdN0/kFGXRVnSOVMakDNhM+HAufa43yUbN/5313zXYo+8JcW7yXOuBWitKSxkkXiRidBN+Fr4DSQ8tpeUsguy4xkyNqI0IB2ZGVEaMBxDG1EakA2pjSgNyBZrI0oDRkNiIwp3vLiIZLAc0QDwqtvmc/OI0oAEDGuA/0z6QNxDxXxJiDtybnsk3UtpQM78D6oZB7/ZFWiVAAAAAElFTkSuQmCC"
			}, {
				style: AnnotationStyle.Expand,
				src: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGAAAABACAYAAAGSM0KYAAAACXBIWXMAAAsTAAALEwEAmpwYAAALC2lUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNi4wLWMwMDIgNzkuMTY0MzUyLCAyMDIwLzAxLzMwLTE1OjUwOjM4ICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtbG5zOmRjPSJodHRwOi8vcHVybC5vcmcvZGMvZWxlbWVudHMvMS4xLyIgeG1sbnM6eG1wTU09Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9tbS8iIHhtbG5zOnN0RXZ0PSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvc1R5cGUvUmVzb3VyY2VFdmVudCMiIHhtbG5zOnN0UmVmPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvc1R5cGUvUmVzb3VyY2VSZWYjIiB4bWxuczpwaG90b3Nob3A9Imh0dHA6Ly9ucy5hZG9iZS5jb20vcGhvdG9zaG9wLzEuMC8iIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIDIxLjEgKE1hY2ludG9zaCkiIHhtcDpDcmVhdGVEYXRlPSIyMDIwLTAzLTI2VDExOjEwOjAyKzEzOjAwIiB4bXA6TWV0YWRhdGFEYXRlPSIyMDIwLTAzLTI2VDE0OjM1OjIzKzEzOjAwIiB4bXA6TW9kaWZ5RGF0ZT0iMjAyMC0wMy0yNlQxNDozNToyMysxMzowMCIgZGM6Zm9ybWF0PSJpbWFnZS9wbmciIHhtcE1NOkluc3RhbmNlSUQ9InhtcC5paWQ6MmZhNTI3NDEtOGZkZi00NTM0LWE0N2UtMWRmZWMyOTc3NTliIiB4bXBNTTpEb2N1bWVudElEPSJhZG9iZTpkb2NpZDpwaG90b3Nob3A6MDRkNjFiNzktZDUxMC01MDQwLThjNjYtYjk4ZWIyZWMxOWI0IiB4bXBNTTpPcmlnaW5hbERvY3VtZW50SUQ9InhtcC5kaWQ6ZWU1NTEwZjgtNmI2ZC00NDJhLTkwOTMtMzQ4NmNlNDA0ZDU0IiBwaG90b3Nob3A6Q29sb3JNb2RlPSIzIiBwaG90b3Nob3A6SUNDUHJvZmlsZT0ic1JHQiBJRUM2MTk2Ni0yLjEiPiA8eG1wTU06SGlzdG9yeT4gPHJkZjpTZXE+IDxyZGY6bGkgc3RFdnQ6YWN0aW9uPSJjcmVhdGVkIiBzdEV2dDppbnN0YW5jZUlEPSJ4bXAuaWlkOmVlNTUxMGY4LTZiNmQtNDQyYS05MDkzLTM0ODZjZTQwNGQ1NCIgc3RFdnQ6d2hlbj0iMjAyMC0wMy0yNlQxMToxMDowMisxMzowMCIgc3RFdnQ6c29mdHdhcmVBZ2VudD0iQWRvYmUgUGhvdG9zaG9wIDIxLjEgKE1hY2ludG9zaCkiLz4gPHJkZjpsaSBzdEV2dDphY3Rpb249InNhdmVkIiBzdEV2dDppbnN0YW5jZUlEPSJ4bXAuaWlkOjEyYTg4Mjg4LWYzOWItNDU4My04M2FlLTk0NTExY2FjZGU5OCIgc3RFdnQ6d2hlbj0iMjAyMC0wMy0yNlQxNDoxNTozMisxMzowMCIgc3RFdnQ6c29mdHdhcmVBZ2VudD0iQWRvYmUgUGhvdG9zaG9wIDIxLjEgKE1hY2ludG9zaCkiIHN0RXZ0OmNoYW5nZWQ9Ii8iLz4gPHJkZjpsaSBzdEV2dDphY3Rpb249InNhdmVkIiBzdEV2dDppbnN0YW5jZUlEPSJ4bXAuaWlkOjcyOWFhOWVjLTE0ZmItNDdiZS1hNTNhLTAyYzgyOWEyMjlhOCIgc3RFdnQ6d2hlbj0iMjAyMC0wMy0yNlQxNDozNToyMysxMzowMCIgc3RFdnQ6c29mdHdhcmVBZ2VudD0iQWRvYmUgUGhvdG9zaG9wIDIxLjEgKE1hY2ludG9zaCkiIHN0RXZ0OmNoYW5nZWQ9Ii8iLz4gPHJkZjpsaSBzdEV2dDphY3Rpb249ImNvbnZlcnRlZCIgc3RFdnQ6cGFyYW1ldGVycz0iZnJvbSBhcHBsaWNhdGlvbi92bmQuYWRvYmUucGhvdG9zaG9wIHRvIGltYWdlL3BuZyIvPiA8cmRmOmxpIHN0RXZ0OmFjdGlvbj0iZGVyaXZlZCIgc3RFdnQ6cGFyYW1ldGVycz0iY29udmVydGVkIGZyb20gYXBwbGljYXRpb24vdm5kLmFkb2JlLnBob3Rvc2hvcCB0byBpbWFnZS9wbmciLz4gPHJkZjpsaSBzdEV2dDphY3Rpb249InNhdmVkIiBzdEV2dDppbnN0YW5jZUlEPSJ4bXAuaWlkOjJmYTUyNzQxLThmZGYtNDUzNC1hNDdlLTFkZmVjMjk3NzU5YiIgc3RFdnQ6d2hlbj0iMjAyMC0wMy0yNlQxNDozNToyMysxMzowMCIgc3RFdnQ6c29mdHdhcmVBZ2VudD0iQWRvYmUgUGhvdG9zaG9wIDIxLjEgKE1hY2ludG9zaCkiIHN0RXZ0OmNoYW5nZWQ9Ii8iLz4gPC9yZGY6U2VxPiA8L3htcE1NOkhpc3Rvcnk+IDx4bXBNTTpEZXJpdmVkRnJvbSBzdFJlZjppbnN0YW5jZUlEPSJ4bXAuaWlkOjcyOWFhOWVjLTE0ZmItNDdiZS1hNTNhLTAyYzgyOWEyMjlhOCIgc3RSZWY6ZG9jdW1lbnRJRD0ieG1wLmRpZDplZTU1MTBmOC02YjZkLTQ0MmEtOTA5My0zNDg2Y2U0MDRkNTQiIHN0UmVmOm9yaWdpbmFsRG9jdW1lbnRJRD0ieG1wLmRpZDplZTU1MTBmOC02YjZkLTQ0MmEtOTA5My0zNDg2Y2U0MDRkNTQiLz4gPHBob3Rvc2hvcDpUZXh0TGF5ZXJzPiA8cmRmOkJhZz4gPHJkZjpsaSBwaG90b3Nob3A6TGF5ZXJOYW1lPSJURVhUIiBwaG90b3Nob3A6TGF5ZXJUZXh0PSJURVhUIi8+IDxyZGY6bGkgcGhvdG9zaG9wOkxheWVyTmFtZT0iVGV4dCIgcGhvdG9zaG9wOkxheWVyVGV4dD0iVGV4dCIvPiA8cmRmOmxpIHBob3Rvc2hvcDpMYXllck5hbWU9IlRleHQiIHBob3Rvc2hvcDpMYXllclRleHQ9IlRleHQiLz4gPHJkZjpsaSBwaG90b3Nob3A6TGF5ZXJOYW1lPSJUZXh0IiBw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"

			}
		];
		return styles;
	};

	/**
	 * The main method for creation of annotations
	 * @param {any} divAnnotation Object with annotation settings
	 * @param {sap.ui.vk.Viewport} viewport Viewport where annotation are displayed
	 * @returns {sap.ui.vk.Annotation} Newly create annotation
	 * @public
	 */
	Annotation.createAnnotation = function(divAnnotation, viewport) {
		// Order of these properties is important as many of them depend on values of style and nodeRef
		var annotation = new Annotation({
			viewport: viewport,
			annotationId: divAnnotation.annotation.id,
			nodeRef: divAnnotation.node,
			style: divAnnotation.annotation.style,
			animate: divAnnotation.annotation.animate === undefined ? true : divAnnotation.annotation.animate,
			editable: !!divAnnotation.annotation.editable,
			name: divAnnotation.node.name,
			text: divAnnotation.annotation.text ? divAnnotation.annotation.text.html : "",
			xCoordinate: divAnnotation.node.position.x,
			yCoordinate: divAnnotation.node.position.y,
			width: divAnnotation.node.scale.x,
			height: divAnnotation.node.scale.y
		});

		annotation._attachmentNode = divAnnotation.attachment;

		if (divAnnotation.targetNodes) {
			divAnnotation.targetNodes.forEach(function(targetNode) {
				annotation.getTargetNodes().push(targetNode);
			});
		}
		annotation.sourceData = divAnnotation;
		return annotation;
	};

	Annotation.prototype._getBackgroundColor = function() {
		var color = "rgba(221, 221, 221, 0.5)";
		var annotation = this.sourceData.annotation;
		if (annotation.label && annotation.label.colour) {
			var colorArray = annotation.label.colour;
			color = "rgba(" + colorArray[0] * 255
				+ ", " + colorArray[1] * 255
				+ ", " + colorArray[2] * 255
				+ ", " + colorArray[3]
				+ ")";
		}
		return color;
	};

	return Annotation;
});
