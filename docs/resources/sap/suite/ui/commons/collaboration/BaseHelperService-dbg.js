/*!
 * 
		SAP UI development toolkit for HTML5 (SAPUI5)
		(c) Copyright 2009-2015 SAP SE. All rights reserved
	
 */
sap.ui.define([
    "sap/ui/base/Object"
], function (BaseObject) {
    "use strict";

    /**
     * Base class for the CollaborationHelpers
     * @namespace
     * @since 1.108
     * @alias module:sap/suite/ui/commons/collaboration/BaseHelperService
     * @private
     * @ui5-restricted
     * @experimental Since 1.108
     */

    var BaseHelperService = BaseObject.extend("sap.suite.ui.commons.collaboration.BaseHelperService", {
        constructor: function (oProviderConfig) {
            this._providerConfig = oProviderConfig;
        }
    });

    /**
     * Method returns the Provider configuration settings
     * @returns {Object} Configuration settings
     * @private
     * @ui5-restricted
     * @experimental Since 1.108
     */
    BaseHelperService.prototype.getProviderConfig = function() {
        return this._providerConfig;
    };

    /**
     * Gives list of all Collaboration Options
     * @param {object} oParams Optional argument in case consumer wants to influence the options, otherwise pass as undefined
     * @param {boolean} oParams.isShareAsLinkEnabled Allow Share as Chat option in case MS Teams is the Collaboration provider
     * @param {boolean} oParams.isShareAsTabEnabled Allow Share as Tab option in case MS Teams is the Collaboration provider
     * @returns {array} Array of available options
     * @private
     * @ui5-restricted
     * @experimental Since 1.108
     */
    BaseHelperService.prototype.getOptions = function() {
        return [];
    };

    /**
     * Method to be called to trigger the share operation
     *
     * @param {Object} oOption Option Object/SubObject which is clicked
     * @param {Object} oParams Parameter object which contain the information to share
     * @param {string} oParams.url Url of the application which needs to be shared
     * @param {string} oParams.appTitle Title of the application which needs to be used while integration
     * @returns {void}
     * @private
     * @ui5-restricted
     * @experimental Since 1.108
     */
    BaseHelperService.prototype.share = function(oOption, oParams) {
    };
    return BaseHelperService;
});