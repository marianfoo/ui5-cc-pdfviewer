/*!
 * SAPUI5
 * (c) Copyright 2009-2022 SAP SE. All rights reserved.
 */

// Provides the Design Time Metadata for the sap.ui.comp.smartform.Group control
sap.ui.define(function () {
	"use strict";

	return {
		actions: {
			localReset: "localReset"
		},
		aggregations: {
			groups: {
				propagateRelevantContainer: true,

				childNames: {
					singular: "GROUP_CONTROL_NAME",
					plural: "GROUP_CONTROL_NAME_PLURAL"
				},
				actions: {
					move: "moveGroups",
					remove : {
						removeLastElement: true
					},
					createContainer: {
						changeType: "addGroup",
						isEnabled: true,
						getCreatedContainerId: function(sNewControlID) {
							return sNewControlID;
						}
					}
				}
			},
			customToolbar: {
				propagateMetadata : function (oElement) {
					if (oElement.isA(["sap.m.ToolbarSpacer", "sap.m.ToolbarSeparator"])) {
						return {
							actions: "not-adaptable"
						};
					}
				}
			}
		},
		name: "{name}",
		description: "{description}",
		properties: {
			title: {
				ignore: false
			},
			useHorizontalLayout: {
				ignore: false
			},
			horizontalLayoutGroupElementMinWidth: {
				ignore: true
			},
			checkButton: {
				ignore: false
			},
			entityType: {
				ignore: true
			},
			expandable: {
				ignore: false
			},
			expanded: {
				ignore: false
			},
			editTogglable: {
				ignore: false
			},
			editable: {
				ignore: false
			},
			ignoredFields: {
				ignore: true
			},
			flexEnabled: {
				ignore: true
			},
			validationMode: {
				ignore: true
			},
			importance: {
				ignore: true
			}
		}
	};

}, /* bExport= */true);
