sap.ui.define(["sap/base/util/ObjectPath", "sap/base/util/extend", "sap/suite/ui/generic/template/genericUtilities/FeLogger", "sap/ushell/ui/footerbar/AddBookmarkButton",
	"sap/suite/ui/commons/collaboration/ServiceContainer", "sap/ui/core/CustomData", 'sap/ui/performance/trace/FESRHelper'
], function (ObjectPath, extend, FeLogger, AddBookmarkButton, ServiceContainer, CustomData, FESRHelper) {
	"use strict";

	var ShareUtils = {};
	var oBookmarkButton;

	// function that returns a Promise that resolves to the current url
	function getCurrentUrl(){
		var oUShellContainer = sap.ushell && sap.ushell.Container;
		return oUShellContainer ? new Promise(function(fnResolve){
			oUShellContainer.getFLPUrlAsync(true).done(function (sFLPUrl){
				fnResolve(sFLPUrl);
			}); 
		}) : Promise.resolve(document.URL);
	}

	ShareUtils.getCurrentUrl = getCurrentUrl;

	/**
	 * Pre-populates the given shareModel with localized texts so that they can be used in the ShareSheet fragment.
	 *
	 * @param {sap.ui.core.Control} fragment The fragment instance whose model is to be updated
	 * @param {sap.ui.model.json.JSONModel} shareModel The model instance to be updated
	 * @protected
	 * @static
	 */
	ShareUtils.setStaticShareData = function(fragment, shareModel) {
		var oResource = sap.ui.getCore().getLibraryResourceBundle("sap.m");

		shareModel.setProperty("/emailButtonText", oResource.getText("SEMANTIC_CONTROL_SEND_EMAIL"));
		shareModel.setProperty("/jamButtonText", oResource.getText("SEMANTIC_CONTROL_SHARE_IN_JAM"));

		var fnGetUser = ObjectPath.get("sap.ushell.Container.getUser");
		shareModel.setProperty("/jamVisible", !!fnGetUser && fnGetUser().isJamActive());

	};

	/**
	 * Opens a Sharing Dialog.
	 *
	 * @param {string} text The text of the sharing dialog
	 * @protected
	 * @static
	 */
	ShareUtils.openJamShareDialog = function(text) {
		getCurrentUrl().then(function(sCurrentUrl){
			var oShareDialog = sap.ui.getCore().createComponent({
				name: "sap.collaboration.components.fiori.sharing.dialog",
				settings: {
					object: {
						id: sCurrentUrl,
						share: text
					}
				}
			});
			oShareDialog.open();
		});
	};

	/**
	 * Instantiates and opens the ShareSheet fragment and merges its model data with the SaveAsTile data
	 * returned by the function getModelData of the fragment controller.
	 * It takes collaboration option from CollaborationHelper which gives list of options needed to show in menu.
	 *
	 * @param {sap.suite.ui.template.lib.CommonUtils} oCommonUtils The common utils instance providing common functionality
	 * @param {sap.ui.core.Control} oControlToOpenBy The control by which the popup is to be opened
	 * @param {object} oFragmentController A plain object serving as the share popup's controller
	 * @protected
	 * @static
	 */
	ShareUtils.openSharePopup = function(oCommonUtils, oControlToOpenBy, oFragmentController) {
		var oShareActionSheet;
		oFragmentController.onCancelPressed = function() {
			oShareActionSheet.close();
		};

		oCommonUtils.getDialogFragmentAsync("sap.suite.ui.generic.template.fragments.ShareSheet", oFragmentController, "share", ShareUtils.setStaticShareData, true).then(function (oFragment) {
			oShareActionSheet = oFragment;
			var oShareModel = oShareActionSheet.getModel("share");
			oFragmentController.getModelData().then(function (oFragmentModelData) {
				oShareModel.setData(oFragmentModelData, true);
				var iIndexForCollaborationOptions = 2;
				if (!oShareModel.getData().jamVisible) {
					iIndexForCollaborationOptions = 1;
				}
				ServiceContainer.getServiceAsync().then(function (oTeamsHelper) {
					var aItems = oTeamsHelper.getOptions();
					if (aItems.length > 0) {
						aItems.forEach(function (oMainMenuItem) {
							if (oMainMenuItem.subOptions && oMainMenuItem.subOptions.length > 1) {
								var aMenus = [];
								oMainMenuItem.subOptions.forEach(function (menuItem) {
									var oItem = new sap.m.MenuItem({
										text: menuItem.text,
										icon: menuItem.icon,
										press: this.menuItemPress
									});
									oItem.addCustomData(new CustomData({
										key: "data",
										value: menuItem
									}));
									FESRHelper.setSemanticStepname(oItem, "press", menuItem.fesrStepName);
									aMenus.push(oItem);
								}.bind(this));
								oShareActionSheet.insertItem(new sap.m.MenuItem({
									text: oMainMenuItem.text,
									icon: oMainMenuItem.icon,
									items: aMenus
								}), iIndexForCollaborationOptions);
							} else {
								var oItem = new sap.m.MenuItem({
									text: oMainMenuItem.text,
									icon: oMainMenuItem.icon,
									press: this.menuItemPress
								});
								oItem.addCustomData(new CustomData({
									key: "data",
									value: oMainMenuItem
								}));
								FESRHelper.setSemanticStepname(oItem, "press", oMainMenuItem.fesrStepName);
								oShareActionSheet.insertItem(oItem, iIndexForCollaborationOptions);
							}
							iIndexForCollaborationOptions++;
						}.bind(this));
					}
					oBookmarkButton = new AddBookmarkButton("", {
						customUrl: oShareModel.getData().customUrl,
						serviceUrl: oShareModel.getData().serviceUrl,
						title: oShareModel.getData().title,
						subtitle: oShareModel.getData().subtitle,
						tileIcon: oShareModel.getData().icon
					});
					oShareModel.setProperty("/tileVisible", oBookmarkButton.getEnabled());
					oShareModel.setProperty("/tileIcon", oBookmarkButton.getIcon());
					oShareModel.setProperty("/tileText", oBookmarkButton.getText());

					oShareActionSheet.openBy(oControlToOpenBy);
				}.bind(this));
			}.bind(this));
		}.bind(this));
	};

	/**
	 * Press handler for the Collaboration Helper Option.
	 * This method create Payload that need to pass for invoking Collaboration
	 * Option.
	 */
	ShareUtils.menuItemPress = function () {
		ServiceContainer.getServiceAsync().then(function (oTeamsHelper) {
			var oShareModel = this.getModel("share");
			var sAppTitle = "", sSubtitle = "";
			if (oShareModel.getData().subtitle !== undefined) {
				sAppTitle = oShareModel.getData().appTitle;
				sSubtitle = oShareModel.getData().title + (oShareModel.getData().subtitle.length > 0 ? ' - ' + oShareModel.getData().subtitle : '');
			} else {
				sAppTitle = oShareModel.getData().title;
			}
			var data = {
				url: oShareModel.getData().currentUrl,
				appTitle: sAppTitle,
				subTitle: sSubtitle,
				minifyUrlForChat: true
			};
			oTeamsHelper.share(this.getCustomData()[0].getValue(), data);
		}.bind(this));
	};

	/**
	 * Opnes Save as Tile Dialog
	 */
	ShareUtils.fireBookMarkPress = function() {
        oBookmarkButton.firePress();
    };

	/**
	 * Get custom URL for creating a new tile.
	 *
	 * @returns {string} The custom URL
	 * @protected
	 * @static
	 */
	ShareUtils.getCustomUrl = function() {
		if (!window.hasher) {
			sap.ui.require("sap/ui/thirdparty/hasher");
		}

		var sHash = window.hasher.getHash();
		return sHash ? ("#" + sHash) : window.location.href;
	};


	/**
	 * Opens the Microsoft Teams Sharing Dialog.
	 *
	 * @param {string} sText The text of the sharing dialog
	 * @param {string} sUrl The url to be shared
	 * @protected
	 * @static
	 */
	ShareUtils.openMSTeamsShareDialog = function(sText, sUrl) {
		var newWindow = window.open(
			"",
			"ms-teams-share-popup",
			"width=700,height=600"
		);
		newWindow.opener = null;
		newWindow.location = "https://teams.microsoft.com/share?msgText=" + encodeURIComponent(sText) + "&href=" + encodeURIComponent(sUrl);
	};

	return ShareUtils;
});
