/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

        (c) Copyright 2009-2015 SAP SE. All rights reserved
    
 */

// Provides the Scene class.
sap.ui.define([
	"sap/ui/core/Element",
	"./Core",
	"./Scene",
	"sap/ui/core/Core"
], function(
	Element,
	vkCore,
	Scene,
	core
) {
	"use strict";

	/**
	 * Constructor for a new ViewManager.
	 *
	 * The objects of this class should not be created directly.
	 * They should be created via {@link sap.ui.vk.ContentConnector sap.ui.vk.ContentConnector}.
	 *
	 * @private
	 * @extends sap.ui.core.Element
	 * @implements sap.ui.vk.IViewManager
	 */
	var ViewManager = Element.extend("sap.ui.vk.ViewManager", /** @lends sap.ui.vk.ViewManager.prototype */ {
		metadata: {
			library: "sap.ui.vk",
			interfaces: ["sap.ui.vk.IViewManager"],
			properties: {
				allowAutoPlayAnimation: {
					type: "boolean",
					defaultValue: true
				},
				autoAdvanceViewTimeout: {
					type: "int",
					defaultValue: 1000
				}
			},
			associations: {
				contentConnector: {
					type: "sap.ui.vk.ContentConnector"
				},

				animationPlayer: {
					type: "sap.ui.vk.AnimationPlayer"
				}
			}
		},

		constructor: function(sId, mSettings) {
			Element.apply(this, arguments);
			vkCore.observeLifetime(this);
			vkCore.observeAssociations(this);
		}
	});

	ViewManager.prototype._setScene = function(scene) {
		if (this._scene !== scene) {
			this._scene = scene;

			if (this._scene) {
				var initialView = scene.getInitialView();
				if (initialView) {
					this.activateView(initialView);
				}
			}
		}

		return this;
	};

	ViewManager.prototype.getScene = function() {
		return this._scene;
	};

	ViewManager.prototype.getActiveView = function() {
		return this._activeView;
	};

	ViewManager.prototype.getNextView = function(view, viewGroup) {
		var scene = this.getScene();
		if (!viewGroup) {
			viewGroup = scene.findViewGroupByView(view);
		}

		var views;
		var index = -1;

		if (!viewGroup) {
			views = scene.getViews();
			index = views.indexOf(view);
		} else {
			views = viewGroup.getViews();
			index = viewGroup.indexOfView(view);
		}

		if (index < 0) {
			// unable to determine index of the current view
			return undefined;
		} else if (index >= views.length - 1) {
			return undefined;
		}
		index++;

		return views[index];
	};

	ViewManager.prototype._setContent = function(content) {
		var scene = null;
		if (content && content instanceof Scene) {
			scene = content;
		}
		this._setScene(scene);
	};

	ViewManager.prototype.onSetContentConnector = function(contentConnector) {
		contentConnector.attachContentReplaced(this._onContentReplaced, this);
		this._setContent(contentConnector.getContent());
	};

	ViewManager.prototype.onUnsetContentConnector = function(contentConnector) {
		this._setContent(null);
		contentConnector.detachContentReplaced(this._onContentReplaced, this);
	};

	ViewManager.prototype._onContentReplaced = function(event) {
		this._setContent(event.getParameter("newContent"));
	};

	//////////////////////////////////////////////////////////////////////////
	//
	// sap.ui.vk.IViewManager methods
	//
	//////////////////////////////////////////////////////////////////////////

	/**
	 * Activate specified view
	 *
	 * @param {sap.ui.vk.View} view view object definition
	 * @param {boolean} notAnimateCameraChange do not animate the change of camera from the previous view to current view
	 * @returns {promise} when resolved the view is fully applied with camera in position
	 * @private
	 */
	ViewManager.prototype.activateView = function(view, notAnimateCameraChange) {
		return this._activateView(view, null, !this.getAllowAutoPlayAnimation(), false, notAnimateCameraChange);
	};

	/**
	 * Play views in the specified view group
	 *
	 * @param {sap.ui.vk.View} view view object definition to start playing
	 * @param {sap.ui.vk.ViewGroup} [viewGroup] view group to play
	 * @returns {sap.ui.vk.ViewManager} return this
	 * @private
	 */
	ViewManager.prototype.playViewGroup = function(view, viewGroup) {
		this._cancelPlayingViewGroup = false;

		if (view === this.getActiveView()) {
			var animationPlayer = core.byId(this.getAnimationPlayer());
			if (animationPlayer) {
				if (animationPlayer.getTime() >= animationPlayer.getTotalDuration()) {
					animationPlayer.setTime(0);
				}
			}
			return this._autoPlay(view, viewGroup, false, true);
		}

		this._activateView(view, viewGroup, false, true);

		return this;
	};

	ViewManager.prototype.stopPlayingViewGroup = function() {
		this._cancelPlayingViewGroup = true;
		var animationPlayer = core.byId(this.getAnimationPlayer());
		if (animationPlayer) {
			animationPlayer.stop();
		}
	};

	ViewManager.prototype._autoPlay = function(view, viewGroup, skipAnimation, autoAdvanceToNextView) {
		var eventBus = vkCore.getEventBus();
		var animationPlayer = core.byId(this.getAnimationPlayer());

		var activateNextView = function() {
			if (this._cancelPlayingViewGroup) {
				return;
			}

			var nextView = this.getNextView(view, viewGroup);

			if (nextView) {
				this._activateView(nextView, viewGroup, skipAnimation, autoAdvanceToNextView);
			} else {
				eventBus.publish("sap.ui.vk", "procedureFinished");
			}
		}.bind(this);

		var onViewPlaybackStateChanged = function(channel, eventId, event) {
			if (event.source !== animationPlayer) {
				return;
			}

			if (event.stopped) {
				eventBus.unsubscribe("sap.ui.vk", "animationPlayStateChanged", onViewPlaybackStateChanged, this);
				if (event.endOfAnimation) {
					activateNextView();
				}
			}
		};

		var onViewApplied = function() {

			var shouldAutoPlayAnimation = view.getAutoPlayAnimation();

			if (autoAdvanceToNextView) {
				if (animationPlayer && view.hasAnimation() && shouldAutoPlayAnimation) {
					eventBus.subscribe("sap.ui.vk", "animationPlayStateChanged", onViewPlaybackStateChanged, this);
				} else {
					setTimeout(function() {
						activateNextView();
					}, this.getAutoAdvanceViewTimeout());
				}
			}

			if ((!skipAnimation || autoAdvanceToNextView) && view.hasAnimation() && shouldAutoPlayAnimation) {
				if (animationPlayer) {
					animationPlayer.play();
				} else {
					// TODO: log a warning
				}
			}

		}.bind(this);

		onViewApplied();
	};

	ViewManager.prototype._activateView = function(view, viewGroup, skipAnimation, autoAdvanceToNextView, notAnimateCameraChange) {

		var animationPlayer = core.byId(this.getAnimationPlayer());
		if (animationPlayer) {
			animationPlayer.stop();
		}
		this._cancelPlayingViewGroup = false;
		var that = this;
		return new Promise(function(resolve, reject) {
			var eventBus = vkCore.getEventBus();

			that._activeView = view;

			var onViewApplied = function(channel, eventId, event) {
				eventBus.unsubscribe("sap.ui.vk", "readyForAnimation", onViewApplied, that);

				if (event.view !== view) {
					return;
				}
				if (that._cancelPlayingViewGroup) {
					return;
				}

				that._autoPlay(view, viewGroup, skipAnimation, autoAdvanceToNextView, true);
				resolve({
					view: event.view
				});
				return;
			};

			eventBus.subscribe("sap.ui.vk", "readyForAnimation", onViewApplied, that);

			eventBus.publish("sap.ui.vk", "activateView", {
				source: that,
				view: view,
				notAnimateCameraChange: notAnimateCameraChange,
				playViewGroup: autoAdvanceToNextView
			});
		});
	};

	return ViewManager;
});
