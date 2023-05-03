// This class contains behaviour information about the OP floorplan which can be used by the framework even before an instance of the OP has been created

sap.ui.define(["sap/ui/core/mvc/XMLView"], function(XMLView){
	"use strict";

	var oPlaceholderInfo = {
				html: "sap/fe/placeholder/view/PlaceholderLR.fragment.html",
				autoClose: false
		};
	
	function getPlaceholderInfo(){
		return oPlaceholderInfo;
	}


	return {
		getPlaceholderInfo: getPlaceholderInfo
	};
});
