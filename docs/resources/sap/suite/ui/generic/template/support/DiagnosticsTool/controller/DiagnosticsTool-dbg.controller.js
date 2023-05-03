sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/m/MessageToast",
	"sap/m/MessageBox",
	"sap/suite/ui/generic/template/genericUtilities/FeLogger",
	"sap/suite/ui/generic/template/support/lib/Documentation",
	"sap/suite/ui/generic/template/genericUtilities/polyFill"

], function (Controller, MessageToast, MessageBox, FeLogger, Documentation) {
	"use strict";
	var oLogger = new FeLogger("support.DiagnosticsTool.controller.DiagnosticsTool").getLogger();
	var diagnosticToolSpace = window.diagnosticToolSpace;

	/**
	 * Will be triggered when controller gets initialised. Adds event listener to listen on DOM changes in the plugin.
	 */
	function fnOnInit() {
		this.getView().attachAfterRendering(function () {
			fnApplyCustomLayout();
		});
	}

	/**
	 * Will be triggered by pressing refresh button in tool instance.
	 * Triggers method onRefresh() of Fiori Elements Plugin to refresh the displayed data.
	 */
	function fnOnRefreshData() {
		var oModel = this.getView().getModel("data");
		// If app is still loading, cancel refresh and show hint.
		if (oModel.getProperty("/status") === "Loading") {
			MessageToast.show("Application is still loading");
			return;
		}

		// clear model so no outdated information will be shown
		var sTime = new Date().toLocaleTimeString([], {
			hour12: false,
			hour: "2-digit",
			minute: "2-digit",
			second: "2-digit"
		});
		oModel.setData({properties: null, retrieval: sTime, copyEnabled: false});
		oModel.updateBindings();

		// trigger data refresh
		this.getView().getViewData().plugin.onRefresh();
	}

	/**
	 * Will be triggered by pressing copy button (default and Plaintext) in tool instance.
	 * Copies collected data to users clipboard by placing the models data to an invisible textarea at XML view and
	 * selecting it afterwards.
	 */
	function fnOnCopyDataPlain() {
		var sNewLine = "\r\n";									// divider between different entries
		var sPrefix = "- ";										// prefix in front of every property
		var oData = this.getView().getModel("data").getData();	// collected data
		// no data available
		if (!(oData && oData.properties && oData.url)) {
			MessageBox.error("Could not copy data to your clipboard! No data collected", {
				title: "Error"
			});
			return;
		}
		var oProperties = oData.properties;						// properties to display in table

		// prepare content and format it as string
		var sContent = "*************+Extracted by SAP Fiori Elements Diagnostics Plugin [FEDiagnostic]+*************" + sNewLine;
		sContent += sPrefix + "Extracted on " + new Date().toUTCString() + sNewLine;
		sContent += sPrefix + "Host: " + oData.origin + sNewLine;
		sContent += sPrefix + "Application status: " + oData.status + sNewLine;
		if (oData.statusMessage) {
			sContent += sPrefix + "Notice: " + oData.statusMessage + sNewLine;
		}
		sContent += sPrefix + "Documentation: " + Documentation.getDocuURL() + sNewLine;
		sContent += sNewLine;
		sContent += "APP DATA" + sNewLine;

		// loop through properties and append them as formatted string to result string
		for (var i = 0, len = oProperties.length; i < len; i++) {
			if (oProperties[i].type === "string") {
				sContent += sPrefix + oProperties[i].name + ": " + oProperties[i].value + sNewLine;
			} else if (oProperties[i].type === "link") {
				sContent += sPrefix + oProperties[i].name + ": " + oProperties[i].target + sNewLine;
			} else if (oProperties[i].type === "group") {
				sContent += "Group: " + oProperties[i].name + sNewLine;
			}
		}
		sContent += sNewLine;
		sContent += "**************************" + sNewLine;
		sContent += sNewLine;
		sContent += sNewLine;
		sContent += "PROVIDE" + sNewLine;
		sContent += sPrefix + "User/Password: <user>/<password>" + sNewLine;
		sContent += sPrefix + "Steps to recreate the issue: <maybe also provide master data, pictures or video…>" + sNewLine;

		// add content to textarea to copy it to clipboard
		var sTextAreaId = this.getView().byId("CopyDataTextArea").getId();
		var oTextArea = document.getElementById(sTextAreaId);
		// to copy data from an input/textarea to the users clipboard, the element must be rendered with
		// at least one pixel => change to display: block;
		oTextArea.style.display = "block";
		oTextArea.value = sContent;
		oTextArea.select();

		// copy content to clipboard
		try {
			var bSuccess = document.execCommand("copy");
			if (bSuccess) {
				MessageToast.show("Ticket relevant information copied to clip board");
			} else {
				MessageBox.error("Could not copy data to your clipboard! You can copy it manually from here: " + sNewLine + sNewLine + sContent, {
					title: "Error"
				});
			}
		} catch (err) {
			MessageBox.error("Could not copy data to your clipboard! You can copy it manually from here: " + sNewLine + sNewLine + sContent, {
				title: "Error"
			});
		} finally {
			// when copying data to clipboard finished, hide textarea again to make it not visible for the user
			oTextArea.style.display = "none";
		}
	}

	/**
	 * Will be triggered by pressing copy button (HTML) in tool instance.
	 * Copies collected data to users clipboard formatted as Rich Text Format.
	 */
	function fnOnCopyDataHTML() {
		var sNewLine = "<br>",									// new line
			sSuffix = "</span>" + sNewLine,						// divider between different entries
			sOpening = "<span>",								// beginning of text
			sPrefix = sOpening + "- ",							// prefix in front of every property
			oData = this.getView().getModel("data").getData();	// collected data
		// no data available
		if (!(oData && oData.properties && oData.url)) {
			MessageBox.error("Could not copy data to your clipboard! No data collected", {
				title: "Error"
			});
			return;
		}
		var oProperties = oData.properties,						// properties to display in table
			oAnchor = document.getElementById(this.getView().byId("CopyDataHTML").getId());

		var sContent = sOpening + "*************+Extracted by SAP Fiori Elements Diagnostics Plugin [FEDiagnostic]+*************" + sSuffix;
		sContent += sPrefix + "Extracted on " + new Date().toUTCString() + sSuffix;
		sContent += sPrefix + "Host: <a href=\"" + oData.url + "\" rel=\"noopener noreferrer\">" + oData.origin + "</a>" + sSuffix;
		sContent += sPrefix + "Application status: " + oData.status + sSuffix;
		if (oData.statusMessage) {
			sContent += sPrefix + "Notice: " + oData.statusMessage + sSuffix;
		}
		sContent += sPrefix + "Documentation: " + "<a href=\"" + Documentation.getDocuURL() + "\" rel=\"noopener noreferrer\">" + Documentation.getDocuURL() + "</a>" + sSuffix;
		sContent += sNewLine;
		sContent += sOpening + "APP DATA" + sSuffix;

		// loop properties, format them and append them to the content.
		for (var i = 0, len = oProperties.length; i < len; i++) {
			if (oProperties[i].type === "string") {
				sContent += sPrefix + oProperties[i].name + ": " + oProperties[i].value + sSuffix;
			} else if (oProperties[i].type === "link") {
				sContent += sPrefix + oProperties[i].name + ": <a href=\"" + oProperties[i].target + "\" rel=\"noopener noreferrer\">" + oProperties[i].value + "</a>" + sSuffix;
			} else if (oProperties[i].type === "group") {
				sContent += sOpening + "Group: " + oProperties[i].name + sSuffix;
			}
		}
		sContent += sOpening + "**************************" + sSuffix;
		sContent += sNewLine;
		sContent += sOpening + "PROVIDE" + sSuffix;
		sContent += sOpening + "User/Password: &lt;user&gt;/&lt;password&gt;" + sSuffix;
		sContent += sOpening + "Steps to recreate the issue: &lt;maybe also provide master data, pictures or video…&gt;" + sSuffix;

		function removeSelection() {
			try {
				document.getSelection().removeAllRanges();
			} catch (ex) {
				Function.prototype();
			}
		}

		// copy content to clipboard
		oAnchor.innerHTML = '';
		oAnchor.insertAdjacentHTML("beforeend", sContent);
		try {
			var range = document.createRange();
			removeSelection();
			range.selectNode(oAnchor);
			document.getSelection().addRange(range);
			document.execCommand("copy");
			removeSelection();
			MessageToast.show("Ticket relevant information copied to clip board with HTML format");
		} catch (ex) {
			removeSelection();
			// if copying as HTML fails, try to copy data with non HTML format (plaintext)
			fnOnCopyDataPlain();
		} finally {
			oAnchor.innerHTML = '';
		}
	}

	/**
	 * Will be triggered by pressing documentation button in tool instance.
	 */
	function fnOnShowDocumentation() {
		Documentation.openDocumentation();
	}

	function remove(element) {
		element.parentNode.removeChild(element);
	}
	/**
	 * Formats group headers with a custom layout.
	 */

	function fnApplyCustomLayout() {
		var groupHeaders = document.querySelectorAll(".diagnosticPropertiesGroupHeaderContent");
		if (groupHeaders.length === 0) {
			oLogger.debug("No headers found which should be customized");
			return;
		}
		var groupHeaderElement, cell;
		for (var i = 0; i < groupHeaders.length; i++) {
			groupHeaderElement = groupHeaders[i];
			cell = groupHeaderElement.closest("td");
			// apply custom class, attribute colspan=2 and remove next cell
			cell.classList.add("diagnosticPropertiesGroupHeader");
			cell.colSpan = 2;
			remove(cell.nextElementSibling);
		}
	}

	/**
	 * Sets model "data" of view with values timeLeft and status to show countdown at tool instance.
	 *
	 * @param {int} iTime time left until timeout
	 * @param {string} sStatus status of application
	 */
	function fnUpdateStatus(iTime, sStatus) {
		var oModel = this.getView().getModel("data");
		oModel.setData({timeLeft: iTime, status: sStatus});
	}

	/**
	 * Shows MessageToast to indicate updated data.
	 */
	function fnShowDataRefreshed() {
		// Check if SAP Fiori Elements tab is visible. If it is open, display Message toast.
		if (diagnosticToolSpace.fioriElementsPluginID) {
			var view = document.getElementById(diagnosticToolSpace.fioriElementsPluginID);
			if (view && view.parentElement && !view.parentElement.classList.contains("sapUiSupportHidden")) {
				MessageToast.show("Data refreshed");
			}
		}
	}

	return Controller.extend("sap.suite.ui.generic.template.support.DiagnosticsTool.controller.DiagnosticsTool", {
		onInit: fnOnInit,
		onRefreshData: fnOnRefreshData,
		onCopyDataPlain: fnOnCopyDataPlain,
		onCopyDataHTML: fnOnCopyDataHTML,
		onShowDocumentation: fnOnShowDocumentation,
		updateStatus: fnUpdateStatus,
		showDataRefreshed: fnShowDataRefreshed
	});
});
