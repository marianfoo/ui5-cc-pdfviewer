/* FE specific implementation of a Link that preserves whitespaces */
sap.ui.define(["sap/m/Link", "sap/m/LinkRenderer", "sap/base/strings/whitespaceReplacer"
], function (Link, LinkRenderer, whitespaceReplacer){
	"use strict";

	var FELink = Link.extend("Link", {
		init: function(){
			var setText = this.setText.bind(this);
			this.setText = function(sText){
				setText(whitespaceReplacer(sText));	
			};
		},
		renderer: function(oRM, oControl){
			LinkRenderer.render(oRM, oControl);
		}
	});
	
	return FELink;
});