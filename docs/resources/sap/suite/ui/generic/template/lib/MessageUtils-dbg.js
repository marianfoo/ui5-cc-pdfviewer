/* Class containing static methods for message handling. */
sap.ui.define([
	"sap/ui/base/Event",
	"sap/ui/core/ValueState",
	"sap/m/MessageToast",	
	"sap/ui/generic/app/util/MessageUtil",
	"sap/suite/ui/generic/template/genericUtilities/controlHelper",
	"sap/suite/ui/generic/template/genericUtilities/FeLogger",
	"sap/suite/ui/generic/template/lib/TemplateComponent"
], function(Event, ValueState, MessageToast, GenericMessageUtil, controlHelper, FeLogger, TemplateComponent) {
		"use strict";
		
		/**
		 * Logger for this class.
		 *
		 * @type {Log.Logger}
		 * @static
		 * @private
		 * @ignore
		 */
		var oLogger = new FeLogger("lib.MessageUtils").getLogger();
		var oMessageManager = sap.ui.getCore().getMessageManager();

		/**
		 * Handles errors for all of Smart Templates.
		 *
		 * @param {string} sOperation - String defined by the object sap.ui.generic.app.util.MessageUtil.operations.
		 * @param {sap.ui.core.mvc.Controller} oController - Controller instance of the calling function.
		 * @param {object} oServices - Object containing instances of the calling template's services.
		 * @param {object} oError - Error object fired by a variety of classes.
		 * @param {map} mParameters - Additional parameters that can be of use while handling an error.
		 * @private
		 * @ignore
		 */
		function fnHandleError(sOperation, oController, oServices, oError, mParameters, mCallbacks) {
			mParameters = mParameters || {};

			var oErrorResponse = GenericMessageUtil.parseErrorResponse(oError);
			var sMessageText = oErrorResponse.messageText;
			var sMessageDescription;
			var bNavigateToMessagePage = false;

			// This tells this function not to add the
			// transient message at the end. I do this because
			// in the only case where the message popover is shown,
			// the ODataModel has already added the message to the
			// MessageManager's set of messages, and doesn't need to be
			// repeated by calling the GenericMessageUtil.addTransientErrorMessage
			// method at the end of the function.
			var bShowMessagePopover = false;
			var oComponent = oController && oController.getOwnerComponent();
			var oResourceBundle = mParameters.resourceBundle || oComponent.getModel("i18n").getResourceBundle();
			var oNavigationController = mParameters.navigationController || oServices.oNavigationController;
			var oModel = mParameters.model || oComponent.getModel();

			oLogger.debug("handleError has been called with operation " + sOperation + " and HTTP response status code " + oErrorResponse.httpStatusCode);
			var fnCallback = mCallbacks && mCallbacks[oErrorResponse.httpStatusCode];
			if (fnCallback) {
				fnCallback(oErrorResponse.httpStatusCode);
			}
			var sHTTPStatusCode = oErrorResponse.httpStatusCode;
			switch (sHTTPStatusCode) {
				case 400:
					switch (sOperation) {
						case GenericMessageUtil.operations.modifyEntity:
							// if a draft patch failed with a 400 we rely on a meaningful message from the backend
							break;
						case GenericMessageUtil.operations.callAction:
							sMessageText = oResourceBundle.getText("ST_GENERIC_BAD_REQUEST_ACTION");
							break;
						case GenericMessageUtil.operations.deleteEntity:
							sMessageText = oResourceBundle.getText("ST_GENERIC_BAD_REQUEST_DELETE");
							break;
						case GenericMessageUtil.operations.editEntity:
							sMessageText = oResourceBundle.getText("ST_GENERIC_BAD_REQUEST_EDIT");
							break;
						case GenericMessageUtil.operations.saveEntity:
						case GenericMessageUtil.operations.activateDraftEntity:
							if (oServices &&
									oServices.oTemplateCapabilities &&
									oServices.oTemplateCapabilities.oMessageButtonHelper &&
									oServices.oTemplateCapabilities.oMessageButtonHelper.showMessagePopover) {
								oServices.oTemplateCapabilities.oMessageButtonHelper.showMessagePopover();
								bShowMessagePopover = true;
							} else {
								oLogger.info("A MessageButtonHelper class instance could not be found as one of the services' template capabilities.");
							}
							break;
						default:
							sMessageText = oResourceBundle.getText("ST_GENERIC_BAD_REQUEST");
							break;
					}
					break;
				case 401:
					bNavigateToMessagePage = true;
					sMessageText = oResourceBundle.getText("ST_GENERIC_ERROR_AUTHENTICATED_FAILED");
					sMessageDescription = oResourceBundle.getText("ST_GENERIC_ERROR_AUTHENTICATED_FAILED_DESC");
					break;
				case 403:
					switch (sOperation) {
						case GenericMessageUtil.operations.callAction:
							sMessageText = oResourceBundle.getText("ST_GENERIC_ERROR_NOT_AUTORIZED_ACTION");
							break;
					    case GenericMessageUtil.operations.addEntry:
							sMessageText = oResourceBundle.getText("ST_GENERIC_ERROR_NOT_AUTORIZED_CREATE");
							break;
						case GenericMessageUtil.operations.deleteEntity:
							sMessageText = oResourceBundle.getText("ST_GENERIC_ERROR_NOT_AUTORIZED_DELETE");
							break;
						case GenericMessageUtil.operations.editEntity:
							sMessageText = oResourceBundle.getText("ST_GENERIC_ERROR_NOT_AUTORIZED_EDIT");
							break;
						default:
							sMessageText = oResourceBundle.getText("ST_GENERIC_ERROR_NOT_AUTORIZED");
							sMessageDescription = oResourceBundle.getText("ST_GENERIC_ERROR_NOT_AUTORIZED_DESC");
							bNavigateToMessagePage = true;
							break;
					}
					break;
				case 404:
					switch (sOperation) {
						case GenericMessageUtil.operations.callAction:
							sMessageText = oResourceBundle.getText("ST_GENERIC_BAD_REQUEST_ACTION");
							break;
						default:
							sMessageText = oResourceBundle.getText("ST_GENERIC_BAD_REQUEST");
							break;
					}
					break;
				case 409:
				case 412:
					// Warning scenario
					if ((sOperation === GenericMessageUtil.operations.activateDraftEntity || sOperation === GenericMessageUtil.operations.deleteEntity) && oError.response && oError.response.headers && oError.response.headers["preference-applied"] === "handling=strict"){
						return;
					}
					// Conflict, we show the message returned from the backend in a dialog
					break;
				case 422: // Operation not supported (backend is expected to provide a meaningful message)
					break;
				case 423:
				if (sOperation === GenericMessageUtil.operations.activateDraftEntity || sOperation === GenericMessageUtil.operations.saveEntity || sOperation === GenericMessageUtil.operations.deleteEntity){
					return;
				}
				break;
				case 500:
				case 501:
				case 502:
				case 503:
				case 504:
				case 505:
				     bNavigateToMessagePage = !Object.keys(GenericMessageUtil.operations).some(function(sGenericOperation) {
					      return sGenericOperation === sOperation;
				     });
					switch (sOperation) {
						case GenericMessageUtil.operations.callAction:
							sMessageText = oResourceBundle.getText("ST_GENERIC_ERROR_SYSTEM_UNAVAILABLE_FOR_ACTION");
							break;
						default:
							sMessageText = oResourceBundle.getText("ST_GENERIC_ERROR_SYSTEM_UNAVAILABLE");
							break;
					}
					sMessageDescription = oResourceBundle.getText("ST_GENERIC_ERROR_SYSTEM_UNAVAILABLE_DESC");
					break;
				case 0:
					// case when server being offline
					/*adapted to have a reasonable processing for the Apply-Button -
					 * workaround to not leave the page in case of apply */
					bNavigateToMessagePage = false;
					bShowMessagePopover = true;
					break;
				default:
					// Even though the HTTP protocol doesn't specify status codes outside
					// of what is handled in this switch statement, the Checkmarx code scan
					// picks up a missing default case as problematic. This default case
					// is added here for the sake of the Checkmarx scan.
					bNavigateToMessagePage = true;
					sMessageText = oResourceBundle.getText("ST_GENERIC_ERROR_SYSTEM_UNAVAILABLE");
					sMessageDescription = oResourceBundle.getText("ST_GENERIC_ERROR_SYSTEM_UNAVAILABLE_DESC");
					break;
			}

			if (bNavigateToMessagePage) {
				var iViewLevel;
				if (oComponent){
					var oTemplPrivModel = oComponent.getModel("_templPriv");
					iViewLevel = oTemplPrivModel.getProperty("/generic/viewLevel");
				}
				// TODO: we shall remove the transient messages as they might come up later
				oNavigationController.navigateToMessagePage({
					title: oResourceBundle.getText("ST_GENERIC_ERROR_TITLE"),
					text: sMessageText,
					description: sMessageDescription,
					icon: "sap-icon://message-error",
					viewLevel: iViewLevel
				});
			} else {
				// When bShowMessagePopover is true we open the message popover and expect that the service returned either
				// state or transient messages, in case it's false and there's no transient message returned from
				// the backend we add our generic message as transient message
				if (!oErrorResponse.containsTransientMessage && !bShowMessagePopover) {
					GenericMessageUtil.addTransientErrorMessage(sMessageText, sMessageDescription, oModel);
				}
			}
		}

		/**
		 * Navigate and focus to the source of a message as goos as possible
		 *
		 * @param {object} oTemplateUtils - Services that are also passed to the ControllerImplementation of the current view
		 * @param {object} oMessageSource - either the message itself or an event from the meesage popover coming from the message
		 * @param {object} oComponent - the template component the message is assigned t5o
		 * @param {boolean} bPageNavigationAllowed - is it allowed to trigger navigation to another page
		 * @param {string} sBindingPathOfSource - the current binding path of oComponent
		 * @private
		 * @ignore
		 */
		function fnNavigateFromMessageTitleEvent(oTemplateUtils, oMessageSource, oComponent, bPageNavigationAllowed, sBindingPathOfSource) {
			var oMessage;
			if (oMessageSource instanceof Event){
				var oMessageItem = oMessageSource.getParameter("item");
				oMessage = oMessageItem.getBindingContext("msg").getObject();
			} else {
				oMessage = oMessageSource;
			}
			var sId = oTemplateUtils.oCommonUtils.getPositionableControlId(oMessage.controlIds, true);
			if (!sId){ // in this case the call might have come too early (controlIds not yet set in the message)
				oTemplateUtils.oServices.oApplication.registerForMessageNavigation(oTemplateUtils, oMessage, oComponent); // try again later
				return;
			}
			var oAppNavigationPromise = Promise.resolve(false); // resolves to the information whether an inner app navigation was started
			if (bPageNavigationAllowed){
				var oTargetControl = controlHelper.byId(sId);
				if (controlHelper.isTable(oTargetControl)){ // maybe we can find a better control on another page
					// first try to find a control on another page which is currently visible (only applicable in FCL)
					var aNonTableControls = oMessage.controlIds.filter(function(sCandidateControl){
						var oCandidate = controlHelper.byId(sCandidateControl);
						return !controlHelper.isTable(oCandidate);
					}); // identify all controls belonging to this message which are not tables
					var oTargetInfo;
					aNonTableControls.forEach(function(sCandidateControl){ // check the non table controls whether they are placed on a suitable template component 
						var oCandidateInfo = controlHelper.isElementVisibleOnView(sCandidateControl, null, function(oAncestor){
							var oCandidateComponent = controlHelper.isView(oAncestor) && oAncestor.getVisible() && oAncestor.getController().getOwnerComponent();
							return oCandidateComponent instanceof TemplateComponent && {
								component: oCandidateComponent,
								controlId: sCandidateControl
							};
						}); // find the active candidate with the highest view level 
						if (oCandidateInfo && oTemplateUtils.oServices.oApplication.isComponentActive(oCandidateInfo.component)){
							var oPrivateModel = oCandidateInfo.component.getModel("_templPriv");
							oCandidateInfo.level = oPrivateModel.getProperty("/generic/viewLevel");
							if (!oTargetInfo || oTargetInfo.level < oCandidateInfo.level){
								oTargetInfo = oCandidateInfo;
							}
						}
					});
					if (oTargetInfo){ // a target control on a view currently open could be identified
						sId = oTargetInfo.controlId;
						oComponent = oTargetInfo.component;
					} else { // only tables could be found on views currently open -> check whether it is possible to navigate to another page
						var sFullTarget = oMessage.aFullTargets.find(function(sCandidate){
							return sCandidate.startsWith(sBindingPathOfSource) && (sCandidate.lastIndexOf("/") > sBindingPathOfSource.length);
						}); // use the first message target which points to a successor page as candidate 
						if (sFullTarget){ // possibly we can achieve a better result, if we navigate to a child page first
							oAppNavigationPromise = oTemplateUtils.oServices.oApplication.navigateToMessageTarget(oMessage, sFullTarget);
						}
					}
				}
			}
			oAppNavigationPromise.then(function(bAppNavigationStarted){
				if (bAppNavigationStarted){
					return; // navigation to the successor page was triggered. This will call fnNavigateFromMessageTitleEvent once more, after navigation has finished
				}
				var oFocusInfo = {
					targetInfo: oMessage
				};
				oTemplateUtils.oServices.oApplication.prepareForControlNavigation(oComponent, sId).then(controlHelper.focusControl.bind(null, sId, oFocusInfo));				
			});
		}

		/*
		This function shows the given success message in case no transient message is available(in the message model).
		If transient messages are available this function does nothing,
		as it relies on the fact that these transient messages will be shown.
		*/
		function fnShowSuccessMessageIfRequired(sFallbackMessageText, oServices){
			var aMessages  = oMessageManager.getMessageModel().getData();
			var bMessageAvailable = aMessages.some(function(oMessage) {
							return oMessage.persistent;
						});
			if (!bMessageAvailable){
				oServices.oApplication.showMessageToast(sFallbackMessageText);
			}
		}
		
		function fnPrepareForMessageNavigation(aMessages, oTemplateUtils){
			var bNeedsPreparation = aMessages.some(function(oMessage){ // check whether there is at least one message which cannot be positioned on a not-table currently
				var sId = oTemplateUtils.oCommonUtils.getPositionableControlId(oMessage.controlIds, true);
				return !sId || controlHelper.isTable(controlHelper.byId(sId));
			});
			if (bNeedsPreparation){
				oTemplateUtils.oComponentUtils.prepareForMessageNavigation(aMessages);
			}
		}
		
		// Determines whether the given message is an ETag message
		function isMessageETagMessage(oMessage){
			var oTechnicalDetails = oMessage.getTechnicalDetails();
			// current assumption: 412 is either an ETag message or a warning from strict mode. In second case preference-applied would be set.
			return !!oTechnicalDetails && oTechnicalDetails.statusCode === "412" && !oTechnicalDetails.headers["preference-applied"];
		}
		
		function getMessageById(sMessageId){
			var aMessages  = oMessageManager.getMessageModel().getData();
			return aMessages.find(function(oMessage){
				return oMessage.id === sMessageId;
			});
		}
		
		/**
 			* Function returns all the transisent messages.
 			* @param {Boolean} bConsiderResourceNotFound - consider messages that certain resource which doesnt exist although it doesnt include valuable information
			* Note: this is needed for in case of resource not found messages should be able to clear the MessageManager which contains resource not found messages
 			* @returns {Array} Return description.
 		    */

		function fnGetTransientMessages(bConsiderResourceNotFound, fnFilter) {
			var aMessages = oMessageManager.getMessageModel().getProperty("/");
			var aRet = aMessages.filter(function(oMessage){
				return oMessage.persistent && (bConsiderResourceNotFound || !oMessage.technicalDetails || oMessage.technicalDetails.statusCode !== "404" || oMessage.type !== "Error") && fnFilter(oMessage);
			});
			return aRet;
		}
		
		function fnRemoveTransientMessages(fnFilter) {
			// need to clear all messages including resourcenotfound hence parameter as true 
			var aTransientMessages = fnGetTransientMessages(true, fnFilter);
			if (aTransientMessages.length > 0) {
				oMessageManager.removeMessages(aTransientMessages);
			}
		}

		//Function calculate and return highest severity from message list.
		function getHighestSeverity(aMessages) {
			var sState = ValueState.None, iHighestSeverity = 0;
			for (var i = 0; i < aMessages.length; i++) {
				var iSeverityAsNumber = getSeverityAsNumber(aMessages[i]);
				if (iSeverityAsNumber > iHighestSeverity) {
					sState = aMessages[i].type;
					iHighestSeverity = iSeverityAsNumber;
				}
			}
			return sState;
		}

		//Function returns highest severity from message list and relevent title for message view header.
		function getMessageDialogTitleAndSeverity(aMessages, oTemplateContract) {
			var  sState, sTitle = "";
			sState = getHighestSeverity(aMessages);
			var si18nKey = "";
			if (sState === ValueState.Error) {
				si18nKey = aMessages.length > 1 ?  "ST_MESSAGES_DIALOG_TITLE_ERROR_PLURAL" : "ST_MESSAGES_DIALOG_TITLE_ERROR";
			} else if (sState === ValueState.Warning) {
				si18nKey = aMessages.length > 1 ? "ST_MESSAGES_DIALOG_TITLE_WARNING_PLURAL" : "ST_MESSAGES_DIALOG_TITLE_WARNING";
			} else if (sState === ValueState.Information) {
				si18nKey = "ST_MESSAGES_DIALOG_TITLE_INFORMATION";
			} else if (sState === ValueState.Success) {
				si18nKey = "ST_MESSAGES_DIALOG_TITLE_SUCCESS_PLURAL";
			}
			sTitle = oTemplateContract.getText(si18nKey);

			return {
				sTitle: sTitle,
				sSeverity: sState
			};
		}
		
		/**
		 * With this function, all transient messages are taken over from the MessageManager (thereby removed from it) and displayed.
		 *
		 * To show the messages, a custom <code>sap.ui.xmlfragment</code> can be provided via a callback function.
		 *
		 * @param {function|map} vMessageDialogData Either a callback <code>function</code> that returns a message dialog fragment or a
		 * property bag that contains the two parameters <code>owner</code> and <code>contentDensityClass</code>
		 * @param {sap.ui.core.Control} [vMessageDialogData.owner] The owner control on which the message dialog depends
		 * @param {string} [vMessageDialogData.contentDensityClass] The density class which controls the display mode
		 * @param {string} sActionLabel A label for the action
		 * @param {Object} oActionButtonConfig config object, if you want to paas a action and callback for dialog close button. It expects following properties:
		 * oActionButtonConfig.action: function to be executed on click of action button.
		 * oActionButtonConfig.actionLabel: Text to be shown for button.
		 * @returns a Promise that is resolved when the UI is no longer blocked by the message popup.
		 * @param {function} fnCloseCallback A callback which is called on press of close button, when there is an e-Tag error.
		 */
		function fnHandleTransientMessages(oTemplateContract, sActionLabel, oActionButtonConfig) {
			var fnFilter = oTemplateContract.oApplicationProxy.isTransientMessageNoCustomMessage;
			var aTransientMessages = fnGetTransientMessages(false, fnFilter);
			if (aTransientMessages.length === 0) { // no transient messages -> immediate return
				return Promise.resolve();
			}
			fnRemoveTransientMessages(fnFilter); // remove transient messages from the message model. We can use aTransientMessages now.
			
			var sState;
			// Only one message which is a success (or info/None) message -> show as message toast
			if (aTransientMessages.length === 1) {
				sState = aTransientMessages[0].type;
				if (sState === ValueState.Success || sState === ValueState.Information || sState === ValueState.None) {
					MessageToast.show(aTransientMessages[0].message);
					return Promise.resolve(); // message toast does not block the ui
				}
			}

			var oMsgDialogHeaderInfo = getMessageDialogTitleAndSeverity(aTransientMessages, oTemplateContract);
			sState = oMsgDialogHeaderInfo.sSeverity;
			
			// Now we know that we need to send a popup -> return a Promise that is resolved when the popup is closed
			return new Promise(function(fnResolve){
				// Now we prepare the controller of the dialog which will display the messages. However, we have to be careful.
				// fnMessageDialogProvider might use a cache of fragments. If a cached fragment is returned, then it will still have the controller which was set, when it was created.
				// As a consequence the dialog controller must only access variables from the closure which are identical for all usages of the dialog.
				// This is ensured for the following variables:
				var oDialog, oMessageView, oSettingModel;
				var fnDialogClose = function () {
					oDialog.close();
					// clean up after close. Note that the dialog might be reused.
					oSettingModel.setProperty("/backButtonVisible", false);
					oSettingModel.setProperty("/messages", []); // ensure that the message can be garbage collected
					oSettingModel.setProperty("/messageToGroupName", Object.create(null));
					oMessageView.navigateBack();
					oSettingModel.getProperty("/resolve")();
				};
				var oDialogFragmentController = {
					onMessageDialogClose: function () {
						fnDialogClose(oSettingModel);
					},
					onActionButtonPressed: function () {
						oSettingModel.getProperty("/actionButtonCallback")();
						fnDialogClose(oSettingModel);
					},
					onBackButtonPress: function () {
						oSettingModel.setProperty("/backButtonVisible", false);
						oMessageView.navigateBack();
					},
					onMessageSelect: function () {
						oSettingModel.setProperty("/backButtonVisible", true);
					}
				};
				var fnOnFragmentCreated = function(oFragment, oSettingModel){
					oSettingModel.setProperty("/genericGroupName", oTemplateContract.getText("ST_MESSAGE_GENERAL_TITLE"));  // the group name used for all messages, for which no group header could be determined (if necessary)
					oSettingModel.setProperty("/backButtonVisible", false);
					oSettingModel.setProperty("/cancelButtonText", oTemplateContract.getText("CANCEL"));
					oSettingModel.setProperty("/closeButtonText", oTemplateContract.getText("ST_GENERIC_DIALOG_CLOSE_BUT"));
				};
				oTemplateContract.oApplicationProxy.getDialogFragmentAsync("sap.suite.ui.generic.template.fragments.MessageDialog", oDialogFragmentController, "settings", fnOnFragmentCreated, false, true).then(function(odialog){
					oDialog = odialog;
					oMessageView = oDialog.getContent()[0];
					// the following code prepares the grouping of messages.
					// Note that grouping will only be done when at least one message is attached to another group then the generic one
					var oModel = oDialog.getModel();
					var oMetaModel = oModel && oModel.getMetaModel();
					var bGroupMessages = false; // do we need to group?
					var bShowActionButton = !!(oActionButtonConfig && oActionButtonConfig.action);
					var mMessageToGroupName = Object.create(null); // maps the ids of the messages to their group header (if this is non-generic)
					if (oMetaModel) {
						aTransientMessages.forEach(function (oMessage) { // loop over all messages, derive group header from their target and put them to mMessageToGroupName
							var sMessageTarget = oMessage.getTarget();
							if (!sMessageTarget) {
								return;
							}
							if (sMessageTarget.lastIndexOf("/") > 0) {
								sMessageTarget = sMessageTarget.substring(0, sMessageTarget.lastIndexOf("/"));
							}
							var sEntitySet = sMessageTarget.substring(1, sMessageTarget.indexOf("("));
							var oEntitySet = sEntitySet && oMetaModel.getODataEntitySet(sEntitySet);
							var oEntityType = oEntitySet && oMetaModel.getODataEntityType(oEntitySet.entityType);
							var oHeaderInfo = oEntityType && oEntityType["com.sap.vocabularies.UI.v1.HeaderInfo"];
							var sTypeName = oHeaderInfo && oHeaderInfo.Title && oHeaderInfo.Title.Value && oHeaderInfo.Title.Value.Path;
							var oEntity = oModel.getProperty(sMessageTarget);
							var sGroupName = oEntity && oEntity[sTypeName];
							if (sGroupName) {
								mMessageToGroupName[oMessage.getId()] = sGroupName;
								bGroupMessages = true; // non generic group header found -> we must group
							}
						});
					}
					oSettingModel = oDialog.getModel("settings"); // Try to reuse existing model. This also ensures that oSettingModel can be used in the fragment controller.
					oSettingModel.setProperty("/showActionButton", bShowActionButton);
					if (bShowActionButton) {
						oSettingModel.setProperty("/actionButtonText", oActionButtonConfig.actionLabel);
						// we are setting callback method as a property in model, because fragment is created only 1 time,
						// and thus there is only one controller, with it's function.
						oSettingModel.setProperty("/actionButtonCallback", oActionButtonConfig.action);
					}
					oSettingModel.setProperty("/title", oMsgDialogHeaderInfo.sTitle);
					oSettingModel.setProperty("/messages", aTransientMessages);
					oSettingModel.setProperty("/grouping", bGroupMessages);
					oSettingModel.setProperty("/state", sState);
					oSettingModel.setProperty("/resolve", fnResolve); // make the resolve function available to the controller
					oSettingModel.setProperty("/messageToGroupName", mMessageToGroupName); // make the group headers available to the expression binding in the fragment
					oDialog.open();
				});
			});
		}
		
		function getSeverityAsNumber(oMessage) {
			var nCurrentType;
			switch (oMessage.type) {
				case "Error":
					nCurrentType = 4;
					break;
				case "Warning":
					nCurrentType = 3;
					break;
				case "Information":
					nCurrentType = 2;
					break;
				case "Success":
					nCurrentType = 1;
					break;
				default:
					nCurrentType = 0;
			}
			return nCurrentType;
		}				

		return {
			operations: GenericMessageUtil.operations,
			handleTransientMessages: fnHandleTransientMessages,
			prepareForMessageNavigation: fnPrepareForMessageNavigation,
			handleError: fnHandleError,
			navigateFromMessageTitleEvent: fnNavigateFromMessageTitleEvent,
			removeTransientMessages: fnRemoveTransientMessages,
			getTransientMessages: fnGetTransientMessages,
			showSuccessMessageIfRequired: fnShowSuccessMessageIfRequired,
			parseError: GenericMessageUtil.parseErrorResponse,
			isMessageETagMessage: isMessageETagMessage,
			getMessageById: getMessageById,
			getSeverityAsNumber: getSeverityAsNumber,
			getMessageDialogTitleAndSeverity: getMessageDialogTitleAndSeverity
		};
	});
