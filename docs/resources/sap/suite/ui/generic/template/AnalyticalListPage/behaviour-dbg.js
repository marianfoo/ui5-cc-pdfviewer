// This class contains behaviour information about the ALP floorplan which can be used by the framework even before an instance of the ALP has been created

sap.ui.define(["sap/ui/core/mvc/XMLView"], function(XMLView){
	"use strict";

	var oPlaceholderInfo = {
				html: "sap/fe/placeholder/view/PlaceholderALP.fragment.html",
				autoClose: false
		};
	
	function getPlaceholderInfo(){
		return oPlaceholderInfo;
	}

	return {
		getPlaceholderInfo: getPlaceholderInfo
	};
});
