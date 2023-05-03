/*
	Formatters used during templating time of LR and ALP.
*/
sap.ui.define(["sap/suite/ui/generic/template/js/AnnotationHelper"],
	function(AnnotationHelper) {
		"use strict";

		/*
		 * For analytical table, grid table and tree table only
		 * In case of condensed mode, the wrapping of links will be set to false, because of flickering of the table!
		 */
		function setLinkWrapping(bCondensedTableLayout) {
			var sCompactClass = "sapUiSizeCompact", oBody;
			if (!bCondensedTableLayout) {
				return true;
			}
			oBody = document.body;
			return !(oBody.classList.contains(sCompactClass) && bCondensedTableLayout);
		}

	return {
		setLinkWrapping: setLinkWrapping
	};
}, /* bExport= */ true);
