sap.ui.define([],
	function() {
		"use strict";
		
		var mEmbeddedComponents = Object.create(null);  // Temporary map

		function fnEmbeddedComponentMixInto(oEmbeddedComponent, oProxy){
			mEmbeddedComponents[oEmbeddedComponent.getId()] = oProxy;	
		}
				
		function fnTransferEmbeddedComponentProxy(oComponentRegistryEntry, mReuseComponentProxies, sEmbeddedKey, oEmbeddedComponentMeta, oEmbeddedComponent){
			var sEmbeddedComponentId = oEmbeddedComponent.getId();
			var oProxy = mEmbeddedComponents[sEmbeddedComponentId];
			delete mEmbeddedComponents[sEmbeddedComponentId];
			oProxy.fnExtensionAPIAvailable(oEmbeddedComponentMeta.extensionAPI);
			delete oProxy.fnExtensionAPIAvailable;
			mReuseComponentProxies[sEmbeddedKey] = oProxy;
			var oSubSection = oEmbeddedComponentMeta.subSectionId && oComponentRegistryEntry.oController.byId(oEmbeddedComponentMeta.subSectionId);
			var aCustomData =  oSubSection && oSubSection.getCustomData();
			if (aCustomData){ 
				aCustomData.forEach(function(oCustomDataElement) {
						if (oCustomDataElement.getKey() === "stRefreshTrigger") { 
							var oBinding = oCustomDataElement.getBinding("value");
							// UI5 does not gurantee the binding to be already available at this point in time.
							// If the binding is not available, we access the binding info as a fallback
							var oBindingInfo = !oBinding && oCustomDataElement.getBindingInfo("value");
							

							if (!oBinding && !oBindingInfo) { // constant -> No change handler needed, but the value must be transfered to the template private model once
								return; // done
							}
							var sValue;
							var fnRefreshTrigger = function(oEvent){
								var oBindingSource = oEvent.getSource();
								var sNewValue = oBindingSource.getExternalValue();
								if (sValue !== sNewValue){
									sValue = sNewValue;
									oProxy.pathUnchangedCallBack(true); 
								}
							};
							var fnChangeHandler = fnRefreshTrigger;

							if (oBinding) { // If the binding is already available we attach the change handler to the binding
								oBinding.attachChange(fnChangeHandler);
							} else { // otherwise the binding info will be enhanced accordingly -> binding will already be created with the corresponding change-handler
								oBindingInfo.events = {
									change: fnChangeHandler
								};
							}
						}
					});
			}
				
		}
		
		return {
			embeddedComponentMixInto: fnEmbeddedComponentMixInto,
			transferEmbeddedComponentProxy: fnTransferEmbeddedComponentProxy
		};
	});