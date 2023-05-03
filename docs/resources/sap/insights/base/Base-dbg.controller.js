/*!
 * 
		SAP UI development toolkit for HTML5 (SAPUI5)
		(c) Copyright 2009-2015 SAP SE. All rights reserved
	
 */
sap.ui.define(
  [
    'sap/ui/core/mvc/Controller',
    'sap/ui/model/json/JSONModel',
    "../utils/MetadataAnalyser",
    "../utils/SelectionVariantHelper",
    "sap/fe/navigation/SelectionVariant",
    "sap/m/Token",
    "../utils/oDataModelProvider",
    "sap/ui/core/CustomData",
    "sap/m/DynamicDateUtil",
    "sap/ui/comp/util/DateTimeUtil",
    "sap/ui/core/format/DateFormat",
    "../utils/AppConstants",
    "../utils/UrlGenerateHelper",
    'sap/ui/core/IconPool'
  ],
  function (
    Controller,
    JSONModel,
    MetadataAnalyser,
    SelectionVariantHelper,
    SelectionVariant,
    Token,
    oDataModelProvider,
    CustomData,
    DynamicDateUtil,
    DateTimeUtil,
    DateFormat,
    AppConstants,
    UrlGenerateHelper,
    IconPool
  ) {
    "use strict";

    var SMART_FORM_ID = "smartForm";
    var COPY_CARD_SMART_FORM_ID = "copyCardSmartForm";

    return Controller.extend('sap.insights.base.BaseController', {
      constructor: function () {
        this._oParentViewModel = new JSONModel({
          oCard: {}
        });
        this.oSmartFormMap = {};
        this.oDraftCardParams = {};
        this.bEnableCardEdit = true;
      },
      _createOdataModelsforDialog: function (aCards) {
        var aPromises = [];
        aCards.forEach(function (oCard) {
          aPromises.push(
            oDataModelProvider.getOdataModel(oCard.descriptorContent["sap.app"].dataSources)
          );
        });

        if (aPromises.length) {
          return Promise.all(aPromises);
        }
      },

      setFilterTextForNoData: function (smartForm, bLoaded, bSetLayout) {
        sap.ui.getCore()
            .loadLibrary("sap.ui.comp", {
                async: true
            })
            .then(function () {
                sap.ui.require([
                    "sap/ui/comp/smartform/Group",
                    "sap/ui/comp/smartform/GroupElement",
                    "sap/ui/comp/smartform/Layout",
                    "sap/m/Text"
                ], function (Group, GroupElement, Layout, Text) {
                    smartForm.removeAllGroups();
                    var oFilterGroup = new Group();
                    var oFilterGroupElement = new GroupElement();
                    var oFilterTextBox = new Text({
                        text: bLoaded ? this.i18Bundle.getText("noFilterMsg") : this.i18Bundle.getText("noFilterLoaded"),
                        textAlign: "Center"
                      });
                    oFilterGroupElement.addElement(oFilterTextBox);
                    oFilterGroup.addGroupElement(oFilterGroupElement);
                    smartForm.setLayout(new Layout());
                    smartForm.addGroup(oFilterGroup);
                    if (bSetLayout) {
                      smartForm.getAggregation("content").getLayout().setBackgroundDesign("Transparent");
                    }
            }.bind(this));
        }.bind(this));
      },

      _setSmartFormForCardEdit: function(oManifestCard){
        this._oParentViewModel.setProperty("/oCard", oManifestCard);
        var id = oManifestCard.descriptorContent["sap.app"].id,
          oFetchSmartFormPromise = this.oSmartFormMap[id] && !this.smartFormEditable ? Promise.resolve(this.oSmartFormMap[id]) : this._createSmartFormForCardEdit(oManifestCard, this.smartFormEditable);

        oFetchSmartFormPromise.then(function (oSmartForm) {
          if (this.smartFormEditable) {
            oSmartForm.setEditable(true);
          }
          var formElement = this.byId(SMART_FORM_ID) || this.byId(COPY_CARD_SMART_FORM_ID);
          formElement.removeAllItems();
          var oDataSource = oManifestCard.descriptorContent["sap.app"].dataSources;
          oDataModelProvider.getOdataModel(oDataSource).then(function (oModel) {
            var bLoaded = oModel && oModel.loaded;
            var bVisible = false;
            if (oSmartForm.getGroups() && oSmartForm.getGroups().length && oSmartForm.getGroups()[0].getGroupElements()) {
              bVisible = oSmartForm.getGroups()[0].getGroupElements().some(function(oGroupElement){
                  return oGroupElement.getElements().some(function(oElement){
                      return oElement.getVisible();
                  });
              });
            }

            if (oSmartForm.getAggregation("content").getFormContainers().length && bLoaded && bVisible) {
              oSmartForm.setVisible(true);
              setTimeout(function() {
                var oSmartFormLayout = oSmartForm.getAggregation("content").getLayout();
                if (oSmartFormLayout) {
                    oSmartFormLayout.setBackgroundDesign("Transparent");
                }
                formElement.addItem(oSmartForm);
              }, 0);
            } else {
              this.setFilterTextForNoData(oSmartForm, bLoaded, true);
              formElement.addItem(oSmartForm);
            }
          }.bind(this));
        }.bind(this));
      },

      _createSmartFormForCardEdit: function (oManifestCard) {
        return new Promise(function (resolve) {
          sap.ui.getCore()
            .loadLibraries([
              "sap.ui.comp",
              "sap.m"
            ], {
              async: true
            })
            .then(function () {
              sap.ui.require([
                "sap/ui/comp/smartmultiinput/SmartMultiInput",
                "sap/ui/comp/smartform/SmartForm",
                "sap/ui/comp/smartform/Group",
                "sap/ui/comp/smartform/GroupElement",
                "sap/ui/comp/smartform/Layout",
                "sap/m/Title",
                "sap/m/Toolbar"
              ], function (SmartMultiInput, SmartForm, Group, GroupElement, Layout, Title, Toolbar) {
                var oDescriptor = oManifestCard.descriptorContent;
                var oCardParameters = oDescriptor["sap.card"].configuration.parameters;
                var sEntitySet = oDescriptor["sap.insights"].filterEntitySet;
                var sCardEntitySet = oCardParameters && oCardParameters._entitySet.value;
                var oDataSource = oDescriptor["sap.app"].dataSources;
                oDataModelProvider.getOdataModel(oDataSource).then(function (oModel) {
                  var bLoaded = oModel && oModel.loaded;
                  this._oParentViewModel.setProperty("/oCard", oManifestCard);
                  var oConfig = {
                    layout: new Layout({
                      labelSpanS: 6
                    }),
                    customToolbar: new Toolbar({
                      content: [
                        new Title({
                          text: this.i18Bundle.getText("filterBy"),
                          titleStyle: "H5"
                        })
                      ],
                      style: "Clear"
                    })
                  };
                  var oSmartForm = new SmartForm(oConfig);
                  var group = new Group();
                  var aMandatoryParameters = [], aMandatoryFilters = [], aRelevantParameters = [], aRelevantFilters = [], oSemanticDateSetting, oSemanticDateRangeSetting, aSemanticDateFields = [];
                  if (oCardParameters) {
                    aMandatoryParameters =  oCardParameters._mandatoryODataParameters.value || [];
                    aMandatoryFilters = oCardParameters._mandatoryODataFilters.value || [];
                    aRelevantParameters = oCardParameters._relevantODataParameters.value || [];
                    aRelevantFilters = oCardParameters._relevantODataFilters.value || [];
                    oSemanticDateRangeSetting = oCardParameters._semanticDateRangeSetting;
                    if (oSemanticDateRangeSetting) {
                      oSemanticDateSetting = JSON.parse(oSemanticDateRangeSetting.value);
                      aSemanticDateFields = Object.keys(oSemanticDateSetting) || [];
                    }
                  }
                  oSmartForm.attachEditToggled(function (oEvent) {
                    var bEditable = oEvent.getParameters().editable;
                    var oGroup = oEvent.getSource().getGroups() && oEvent.getSource().getGroups().length ? oEvent.getSource().getGroups()[0] : null;
                    if (bEditable && oGroup) {
                      oGroup.getGroupElements().forEach(function (oGroupElem) {
                        oGroupElem.getFields().forEach(function (oField) {
                          oField.attachInnerControlsCreated(function (oControlEvent) {
                            var oSmartMultiInput = oControlEvent.getSource(),
                              sFieldPath = oSmartMultiInput.getBindingPath("value");
                            if ((aMandatoryParameters.includes(sFieldPath) || aMandatoryFilters.includes(sFieldPath)) && oSmartMultiInput.getProperty("editable")) {
                              oSmartMultiInput.setMandatory(true);
                            } else if (oSmartMultiInput.getMandatory()) {
                              oSmartMultiInput.setMandatory(false);
                            }
                            oSmartMultiInput.checkClientError();
                          });
                        });
                      });
                    }
                  });
                  var fnAddDateInformation = function (oToken, oDate) {
                    // Store Date Information in Token as Custom Data
                    if (oDate) {
                      var oCustomData = new CustomData({
                        key: "date",
                        value: oDate
                      });
                      oToken.insertCustomData(oCustomData);
                    }
                  };
                  var sParameterisedEntitySet = oModel && MetadataAnalyser.getParameterisedEntitySetByEntitySet(oModel.oData, sEntitySet);
                  var aParameterisedEntitySetProperties = sParameterisedEntitySet ? MetadataAnalyser.getPropertyNamesOfEntitySet(oModel.oData, sParameterisedEntitySet) : [];
                  if (bLoaded) {
                    if (aRelevantParameters.length) {
                      aRelevantParameters.forEach(function (sParams) {
                        var tempEntySet = sParameterisedEntitySet;
                        var editable = true;
                        if (aParameterisedEntitySetProperties.indexOf(sParams) === -1) {
                          tempEntySet = sCardEntitySet;
                          editable = false;
                        }
                        var bIsFixedValueList = MetadataAnalyser.isValueListWithFixedValues(oModel.oData, tempEntySet, sParams);
                        var bIsDate = MetadataAnalyser.isDate(oModel.oData, tempEntySet, sParams);
                        var bIsSemanticDate = aSemanticDateFields.includes(sParams);
                        var oGroupElement = new GroupElement();
                        var oElement = new SmartMultiInput({
                          entitySet: tempEntySet,
                          value: "{" + sParams + "}",
                          editable: editable,
                          visible: editable,
                          singleTokenMode: true,
                          supportRanges: false,
                          innerControlsCreated: this._handleVisibilityChange.bind(this, bIsSemanticDate, true)
                        });
                        if (bIsFixedValueList) {
                          oElement.attachInnerControlsCreated(function (oEvent) {
                            var oField = oEvent.getSource();
                            if (oField.getMode() === "edit") {
                              var aInnerControls = oField.getInnerControls();
                              if (Array.isArray(aInnerControls) && aInnerControls.length) {
                                var aInitialTokens = oField.getAggregation("_initialTokens");
                                if (oField.getSingleTokenMode()) {
                                  //Handle Single Token Mode
                                  var oSelect = aInnerControls[0],
                                    oInitialToken = Array.isArray(aInitialTokens) && aInitialTokens.length ? aInitialTokens[0] : null;
                                  if (oSelect.setForceSelection) {
                                    oSelect.setForceSelection(false);
                                    if (oInitialToken) {
                                      oSelect.setSelectedKey(oInitialToken.getKey());
                                    } else {
                                      oSelect.setSelectedItem(null);
                                    }
                                  }
                                } else {
                                  //Handle Multi Token Mode
                                  var oMultiComboBox = aInnerControls[0];
                                  if (Array.isArray(aInitialTokens) && aInitialTokens.length) {
                                    oMultiComboBox.setSelectedKeys(aInitialTokens.map(function (oToken) {
                                      return oToken.getKey();
                                    }));
                                  }
                                }
                                if (oField.getMandatory()) {
                                  oField.checkClientError();
                                }
                              }
                            }
                          });
                          oElement.checkClientError = function(){
                            return this._checkClientError(oElement);
                          }.bind(this);
                          oElement.attachSelectionChange(this._handleParameterSelectionChange.bind(this));
                        } else {
                          if (bIsSemanticDate) {
                            oElement.addStyleClass('semanticDateInsight');
                          }
                          oElement.attachTokenUpdate(this._handleParameterTokenUpdate.bind(this, null, bIsSemanticDate));
                        }
                        var sParamValue = oCardParameters[sParams].value;
                        var sParamText =  oCardParameters[sParams].label;
                        if (sParamValue) {
                          var oToken = new Token({
                            key: sParamValue,
                            text: sParamText ? sParamText : sParamValue
                          });
                          if (bIsDate) {
                            if (!aSemanticDateFields.includes(sParams)) {
                              fnAddDateInformation(oToken, new Date(sParamValue));
                            } else {
                              if (oSemanticDateSetting && this.smartFormEditable) {
                                var aDynamicDateFilters = this._getOptionsForDynamicDate(oSemanticDateSetting, sParams);
                                var oDynamicDate = this.byId("hiddenDDR");
                                oDynamicDate.setOptions(aDynamicDateFilters);
                              }
                              sParamValue =  UrlGenerateHelper.formatSemanticDateTime(sParamValue, "Parameter")[0];
                              fnAddDateInformation(oToken, sParamValue);
                            }
                          }
                          if (bIsFixedValueList && oElement.getInnerControls().length) {
                            var oControl = oElement.getInnerControls()[0];
                            oControl.setSelectedKey(oToken.getKey());
                          }
                          oElement.addAggregation("_initialTokens", oToken);
                        }
                        if (sParamValue && oElement.getVisible()) {
                          oGroupElement.addElement(oElement);
                          group.addGroupElement(oGroupElement);
                        } else if (this.bEnableCardEdit && oElement.getVisible()) {
                          oGroupElement.addElement(oElement);
                          group.addGroupElement(oGroupElement);
                        }
                        this._attachInitialiseToGroupElement(oGroupElement);
                      }.bind(this));
                    }

                    var aFilterProperties = MetadataAnalyser.getPropertyNamesOfEntitySet(oModel.oData, sEntitySet);
                    aRelevantFilters.forEach(function (filter) {
                      var sFiltername = filter;
                      if (!(sFiltername === "DisplayCurrency" && aRelevantParameters.indexOf("P_DisplayCurrency") > -1)) {
                        var tempEntySet = sEntitySet;
                        var editable = true;
                        if (aFilterProperties.indexOf(sFiltername) === -1) {
                          var tempFiltername = "P_" + sFiltername;
                          if (aParameterisedEntitySetProperties.indexOf(tempFiltername) > -1) {
                            tempEntySet = sParameterisedEntitySet;
                            sFiltername = tempFiltername;
                          } else {
                            tempEntySet = sCardEntitySet;
                            editable = false;
                          }
                        }
                        var bIsFixedValueList = MetadataAnalyser.isValueListWithFixedValues(oModel.oData, tempEntySet, sFiltername);
                        var bIsDate = MetadataAnalyser.isDate(oModel.oData, tempEntySet, sFiltername);
                        var bIsSemanticDate = aSemanticDateFields.includes(sFiltername);
                        var groupElement = new GroupElement();
                        var bSingleValueRestrictionFilter;
                        if (sFiltername.indexOf("P_") === 0) {
                          bSingleValueRestrictionFilter = true;
                        } else {
                          bSingleValueRestrictionFilter = MetadataAnalyser.getPropertyFilterRestrictionByEntitySet(oModel.oData, tempEntySet, sFiltername);
                        }
                        var oElement = new SmartMultiInput({
                          entitySet: tempEntySet,
                          value: "{" + sFiltername + "}",
                          editable: editable,
                          visible: editable,
                          supportRanges: !bSingleValueRestrictionFilter,
                          singleTokenMode: bSingleValueRestrictionFilter,
                          innerControlsCreated: this._handleVisibilityChange.bind(this, bIsSemanticDate, false)
                        });
                        if (bIsFixedValueList) {
                          oElement.attachInnerControlsCreated(function (oEvent) {
                            var oField = oEvent.getSource();
                            if (oField.getMode() === "edit") {
                              var aInnerControls = oField.getInnerControls();
                              if (Array.isArray(aInnerControls) && aInnerControls.length) {
                                var aInitialTokens = oField.getAggregation("_initialTokens");
                                if (oField.getSingleTokenMode()) {
                                  //Handle Single Token Mode
                                  var oSelect = aInnerControls[0],
                                    oInitialToken = Array.isArray(aInitialTokens) && aInitialTokens.length ? aInitialTokens[0] : null;
                                  if (oSelect.setForceSelection) {
                                    oSelect.setForceSelection(false);
                                    if (oInitialToken) {
                                      oSelect.setSelectedKey(oInitialToken.getKey());
                                    } else {
                                      oSelect.setSelectedItem(null);
                                    }
                                  }
                                } else {
                                  //Handle Multi Token Mode
                                  var oMultiComboBox = aInnerControls[0];
                                  if (Array.isArray(aInitialTokens) && aInitialTokens.length) {
                                    oMultiComboBox.setSelectedKeys(aInitialTokens.map(function (oToken) {
                                      return oToken.getKey();
                                    }));
                                  }
                                }
                                if (oField.getMandatory()) {
                                  oField.checkClientError();
                                }
                              }
                            }
                          });
                          oElement.checkClientError = function(){
                            return this._checkClientError(oElement);
                          }.bind(this);
                          oElement.attachSelectionChange(this._handleFilterSelectionChange.bind(this));
                        } else {
                          if (bIsSemanticDate) {
                            oElement.setSingleTokenMode(true);
                            oElement.addStyleClass('semanticDateInsight');
                          }
                          oElement.attachTokenUpdate(this._handleFilterTokenUpdate.bind(this, null, bIsSemanticDate));
                        }
                        var filterValueSV = new SelectionVariant(oCardParameters[filter].value);
                        var aSelectOptions = filterValueSV.getSelectOption(filter);
                        if (aSelectOptions && aSelectOptions.length) {
                          var aTokens = [], aFilterRange = [];
                          aTokens = SelectionVariantHelper.getTokenFromSelectOptions(aSelectOptions, filter);
                          aTokens.forEach(function (oToken, idx) {
                            if (bIsDate) {
                              if (!aSemanticDateFields.includes(filter)) {
                                fnAddDateInformation(oToken,new Date(oToken.getKey()));
                              } else {
                                  if (oSemanticDateSetting && this.smartFormEditable) {
                                    var aDynamicDateFilters = this._getOptionsForDynamicDate(oSemanticDateSetting, filter);
                                    var oDynamicDate = this.byId("hiddenFilterDDR");
                                    oDynamicDate.setOptions(aDynamicDateFilters);
                                  }
                                  aFilterRange = UrlGenerateHelper.formatSemanticDateTime(null, aSelectOptions[idx], "Filter");
                                  aFilterRange = UrlGenerateHelper.formatSemanticDateTime(aSelectOptions[idx], "Filter");
                                  aFilterRange.forEach(function(sFilterVal){
                                    fnAddDateInformation(oToken, sFilterVal);
                                  });
                              }
                            }
                            if (bIsFixedValueList && oElement.getInnerControls().length) {
                              var oControl = oElement.getInnerControls()[0];
                              oControl.setSelectedKey(oToken.getKey());
                            }
                            oElement.addAggregation("_initialTokens", oToken);
                          }.bind(this));
                          groupElement.addElement(oElement);
                          group.addGroupElement(groupElement);
                        } else if (this.bEnableCardEdit) {
                          groupElement.addElement(oElement);
                          group.addGroupElement(groupElement);
                        }

                        this._attachInitialiseToGroupElement(groupElement);
                      }

                    }.bind(this));
                  }

                  if (group.getAggregation("formElements") && group.getAggregation("formElements").length) {
                    oSmartForm.addGroup(group);
                  }
                  var cardId = oDescriptor["sap.app"].id;
                  if (bLoaded) {
                    oSmartForm.setModel(oModel.oData);
                  }
                  this.oSmartFormMap[cardId] = oSmartForm;
                  resolve(oSmartForm);
                }.bind(this));
              }.bind(this));
            }.bind(this));
        }.bind(this));
      },
      _handleVisibilityChange: function (bIsSemanticDate, bIsParameter, oEvent) {
        var oSmartMultiInput = oEvent.getSource();
        var formElement = this.byId(SMART_FORM_ID);
        var oSmartForm = formElement && formElement.getItems()[0];
        var bIsVisible = false;
        if (bIsSemanticDate && oSmartMultiInput.getMode() === "edit") {
          var oDynamicDate = bIsParameter ? this.byId("hiddenDDR") : this.byId("hiddenFilterDDR");
          oDynamicDate.setValue(null);
          var sProperty = oSmartMultiInput.getBinding("value").sPath;
          var aInnerControls = oSmartMultiInput.getInnerControls();
          if (aInnerControls.length) {
            var oInnerMultiInput = aInnerControls[0];
            oSmartMultiInput.setShowValueHelp(false);
            oSmartMultiInput.setShowSuggestion(false);
            if (!sap.ui.getCore().byId(oInnerMultiInput.getId() + "-dynamicDateIcon")) {
              oInnerMultiInput.addEndIcon({
                id: oInnerMultiInput.getId() + "-dynamicDateIcon",
                src: IconPool.getIconURI("check-availability"),
                press: bIsParameter ? this._handleParameterTokenUpdate.bind(this, oSmartMultiInput, true) : this._handleFilterTokenUpdate.bind(this, oSmartMultiInput, true)
              });
              oInnerMultiInput.attachLiveChange(function (){
                oInnerMultiInput.setValue("");
                oDynamicDate.attachChange(
                  bIsParameter ? this._onSemanticParameterDateChange.bind(this, sProperty, oSmartMultiInput) :
                  this._onSemanticFilterDateChange.bind(this, sProperty, oSmartMultiInput)
                );
                oDynamicDate.openBy(oSmartMultiInput.getDomRef());
              }.bind(this));
            }
          }
        }
        setTimeout(function() {
          if (oSmartForm) {
            var oGroup = oSmartForm.getGroups() && oSmartForm.getGroups().length ? oSmartForm.getGroups()[0] : null;
            var aGroupElements = oGroup && oGroup.getGroupElements();
            if (aGroupElements && aGroupElements.length) {
              aGroupElements.forEach(function (oGroupElement) {
                var aFields = oGroupElement.getFields();
                aFields.forEach(function (oField) {
                  if (!this.smartFormEditable && oField.getId() === oSmartMultiInput.getId() && (oField.getTokens && oField.getTokens().length === 0)) {
                    oGroupElement.removeField(oField);
                  }
                  if (oGroupElement.getVisible() && oField.getTokens && oField.getTokens().length) {
                    bIsVisible = true;
                  }
                }.bind(this));
                if (!oGroupElement.getFields().length) {
                  oGroup.removeGroupElement(oGroupElement);
                }
              }.bind(this));
            }
          }
          // if there are no field visible in filtered by form, then show Filtered by None message
          if (!bIsVisible && formElement) {
            formElement.removeAllItems();
            this.setFilterTextForNoData(oSmartForm, true, false);
            formElement.addItem(oSmartForm);
          }
        }.bind(this), 0);
      },

      _handleFilterTokenUpdate: function (oSourceField, bIsSemanticDate, oEvent) {
        var oSource = oSourceField ? oSourceField : oEvent.getSource();
        if (oSource.getMandatory()) {
          oSource.checkClientError();
        }
        var sProperty = oSource.getBinding("value").sPath;
        var aTokens = oSource.getTokens();
        var oManifestCard = this._oParentViewModel.getProperty("/oCard");
        var cardId = oManifestCard.descriptorContent["sap.app"].id;
        var oModel = oSource.getModel();
        var bIsDate = MetadataAnalyser.isDate(oModel, oSource.getEntitySet(), sProperty);
        var oDynamicDate, sSemanticValue = "";
        if (bIsSemanticDate && (!aTokens.length || oSourceField)) {
          oDynamicDate = this.byId("hiddenFilterDDR");
          oDynamicDate.attachChange(this._onSemanticFilterDateChange.bind(this, sProperty, oSource));
          oDynamicDate.openBy(oSource.getDomRef());
          if (!aTokens.length) {
            this.oDraftCardParams[cardId][sProperty] = SelectionVariantHelper.getEmptySVStringforProperty(sProperty);
          } else {
              sSemanticValue = oDynamicDate._parseValue(aTokens[0].getKey());
              if (sSemanticValue) {
                oDynamicDate.setValue(sSemanticValue);
              }
          }
        } else if (aTokens.length) {
          var oSV = new SelectionVariant();
          var aSelectOptions = [];
          var sText = "";
          aTokens.forEach(function (oToken) {
            sText = "";
            if (bIsSemanticDate) {
              oDynamicDate =  oDynamicDate ? oDynamicDate : this.byId("hiddenFilterDDR");
              sSemanticValue = oDynamicDate._parseValue(aTokens[0].getKey());
              if (sSemanticValue) {
                oDynamicDate.setValue(sSemanticValue);
              }
            }
            if (oToken.data("selectOption")) {
              var oTokenSelectOption = oToken.data("selectOption");
              // in few cases oToken.data("selectOption") does not contain Text property though oToken.getText
              // has value hence adding an additional check
              if (!oTokenSelectOption.Text) {
                oTokenSelectOption.Text = oToken.getText ? oToken.getText() : null;
              }
              aSelectOptions.push(oTokenSelectOption);
            } else if (oToken.data("range")) {
              var oRange = oToken.data("range");
              var oSelectOption = SelectionVariantHelper.getSelectOptionFromRange(oRange, oToken.getText());
              aSelectOptions.push(oSelectOption);
            } else if (bIsDate) {
              var sDateValue = oModel.formatValue(oToken.getKey(), "Edm.DateTime");
              oSV.addSelectOption(sProperty, "I", "EQ", sDateValue, null, sDateValue);
            } else if (oSource._parseValue) {
              var sValue = oSource._parseValue(oToken.getKey());
              sText = oToken.getText() ? oToken.getText() : oToken.getKey();
              oSV.addSelectOption(sProperty, "I", "EQ", sValue, null, sText);
            } else {
              sText = oToken.getText() ? oToken.getText() : oToken.getKey();
              oSV.addSelectOption(sProperty, "I", "EQ", oToken.getKey(), null, sText);
            }
          });
          oSV.massAddSelectOption(sProperty, aSelectOptions);
          this.oDraftCardParams[cardId][sProperty] = oSV.toJSONString();
        } else {
          this.oDraftCardParams[cardId][sProperty] = SelectionVariantHelper.getEmptySVStringforProperty(sProperty);
        }
      },

      getLabelForField: function (sParameterName, oValue, oSourceField, sType) {
        if (sParameterName && oValue) {
          var oControl = sType === "Parameter" ? this.byId("hiddenDDR") : this.byId("hiddenFilterDDR");
          var sIdForLabel = oControl.getIdForLabel() || "";
          sIdForLabel = sIdForLabel.substring(0, sIdForLabel.lastIndexOf("-"));

          if (sIdForLabel) {
            var sInputControl = sap.ui.getCore().byId(sIdForLabel);
            return sInputControl && sInputControl.getValue();
          } else if (oControl && oControl.getProperty("value")) {
            return oControl.getProperty("value");
          } else if (oSourceField && typeof oSourceField.getTokens === 'function') {
            var aTokens = oSourceField.getTokens() || [],
                aTexts = aTokens.map(function(oToken) {
                return oToken.getText();
            });
            return { type: "filters", value: aTexts };
          }
        }
      },

      _handleFilterSelectionChange: function (oEvent) {
        var oEventParams = oEvent.getParameters();
        var sProperty = oEvent.getSource().getBinding("value").getPath();
        var oManifestCard = this._oParentViewModel.getProperty("/oCard");
        var cardId = oManifestCard.descriptorContent["sap.app"].id;
        var oSmartMultiInput = oEvent.getSource();
        var oSV = new SelectionVariant();
        var sText = "";
        if (oEventParams.selectedItem) {
          oSmartMultiInput.setValueState("None");
          var oSelectedItem = oEvent.getParameter("selectedItem");
          if (oSelectedItem) {
            sText = oSelectedItem.getText() ? oSelectedItem.getText() : oSelectedItem.getKey();
            oSmartMultiInput.removeAllAggregation("_initialTokens");
            oSmartMultiInput.addAggregation("_initialTokens", new Token({
              key: oSelectedItem.getKey(),
              text: sText
            }));
            oSV.addSelectOption(sProperty, "I", "EQ", oSelectedItem.getKey(), null, sText);
            this.oDraftCardParams[cardId][sProperty] = oSV.toJSONString();
          } else {
            this.oDraftCardParams[cardId][sProperty] = SelectionVariantHelper.getEmptySVStringforProperty(sProperty);
          }
        } else {
          var aChangedItems = oEvent.getSource().getInnerControls()[0].getSelectedItems();
          if (aChangedItems.length) {
            oSmartMultiInput.setValueState("None");
            oSmartMultiInput.removeAllAggregation("_initialTokens");
            aChangedItems.forEach(function (oChangedItem) {
              sText =  oChangedItem.getText() ?  oChangedItem.getText() :  oChangedItem.getKey();
              oSmartMultiInput.addAggregation("_initialTokens", new Token({
                key: oChangedItem.getKey(),
                text: sText
              }));
              oSV.addSelectOption(sProperty, "I", "EQ", oChangedItem.getKey(), null, sText);
            });
            this.oDraftCardParams[cardId][sProperty] = oSV.toJSONString();
          } else {
            this.oDraftCardParams[cardId][sProperty] = SelectionVariantHelper.getEmptySVStringforProperty(sProperty);
          }
        }
      },
      _handleParameterSelectionChange: function (oEvent) {
        var oSelectedItem = oEvent.getParameter("selectedItem");
        var oSmartMultiInput = oEvent.getSource(), sText = "";
        var oValue = {value: "", label: ""};
        if (oSelectedItem) {
          oSmartMultiInput.setValueState("None");
          sText = oSelectedItem.getText() ? oSelectedItem.getText() : oSelectedItem.getKey();
          oValue.value = oSelectedItem.getKey();
          oValue.label = sText;
        }
        oSmartMultiInput.removeAllAggregation("_initialTokens");
        oSmartMultiInput.addAggregation("_initialTokens", new Token({
          key: oValue.value,
          text: oValue.label
        }));
        var sProperty = oEvent.getSource().getBinding("value").getPath();
        var cardId = this._oParentViewModel.getProperty("/oCard").descriptorContent["sap.app"].id;
        this.oDraftCardParams[cardId][sProperty] = oValue;
      },
      _handleParameterTokenUpdate: function (oSourceField, bIsSemanticDate, oEvent) {
        var oSource = oSourceField ? oSourceField : oEvent.getSource();
        if (oSource.getMandatory()) {
          oSource.checkClientError();
        }
        var sProperty = oSource.getBinding("value").sPath;
        var aTokens = oSource.getTokens();
        var cardId = this._oParentViewModel.getProperty("/oCard").descriptorContent["sap.app"].id;
        var oValue = {value: "", label: ""};
        var oModel = oSource.getModel();
        var bIsDate = MetadataAnalyser.isDate(oModel, oSource.getEntitySet(), sProperty);
        var sValue, oDynamicDate;
        if (bIsSemanticDate && (!aTokens.length || oSourceField)) {
          oDynamicDate = this.byId("hiddenDDR");
          oDynamicDate.attachChange(this._onSemanticParameterDateChange.bind(this,sProperty,oSource));
          oDynamicDate.openBy(oSource.getDomRef());
        }
        if (aTokens.length) {
          oValue.label = aTokens[0].getText() ? aTokens[0].getText() : aTokens[0].getKey();
          if (bIsSemanticDate && !oDynamicDate) {
            oDynamicDate = this.byId("hiddenDDR");
          }
          if (oDynamicDate &&  oDynamicDate._parseValue) {
            sValue = oDynamicDate._parseValue(aTokens[0].getKey());
            if (sValue) {
              oDynamicDate.setValue(sValue);
              oValue.value = UrlGenerateHelper.getDateRangeValue(sValue, true);
              var oLabelInfo = this.getLabelForField(sProperty, sValue, oSourceField, "Parameter");
              var sText = "";
              var bIsDateOperator = sValue.operator === "DATE";
              if (oLabelInfo && typeof oLabelInfo === "string") {
                sText = oLabelInfo.substring(0, oLabelInfo.indexOf("(") - 1);
                if (!sText && bIsDateOperator) {
                  sText = oLabelInfo;
                }
              }
              oValue.label = sText ? sText : sValue.operator;
            } else {
              oValue.value =  aTokens[0].getKey();
            }
          } else  {
            sValue = oSource._parseValue && oSource._parseValue(aTokens[0].getKey());
            if (bIsDate && sValue) {
              sValue = oSource.getModel().formatValue(sValue, oSource.getDataType());
              oValue.value = sValue;
            } else if (sValue) {
              oValue.value = sValue;
            } else {
              sValue = aTokens[0].getKey();
              oValue.value = sValue;
            }
          }
        }
        this.oDraftCardParams[cardId][sProperty] = oValue;
      },
      _mergeDraftParamsIncard: function (oCard) {
        var oCardParams = oCard.descriptorContent["sap.card"].configuration.parameters;
        var cardId = oCard.descriptorContent["sap.app"].id;
        var oParams = this.oDraftCardParams[cardId];
        Object.keys(oParams).forEach(function (sParam) {
          if (oCardParams[sParam]) {
            if (oCardParams[sParam].type === "datetime" && typeof (oCardParams[sParam].value) === "string" && oCardParams[sParam].value.includes("operation")) {
              var tempDateValue = JSON.parse(oCardParams[sParam].value);
              tempDateValue.operation = oParams[sParam];
              oCardParams[sParam].value = JSON.stringify(tempDateValue);
            } else {
                oCardParams[sParam].value = oParams[sParam].value ? oParams[sParam].value : oParams[sParam];
                if (oParams[sParam].label) {
                    oCardParams[sParam].label = oParams[sParam].label;
                }
            }
          } else if (sParam.indexOf("P_") === 0 && oCardParams[sParam.replace("P_", "")]) {
            oParams[sParam.replace("P_", "")] = oParams[sParam].replace("P_", "");
            oCardParams[sParam.replace("P_", "")].value = oParams[sParam].replace("P_", "");
            delete oParams[sParam];
          }
        });
        UrlGenerateHelper.processPrivateParams(oCard, oParams);
        Object.keys(oCardParams).forEach(function(sParam){
          var paramVal = oCardParams[sParam].value;
          if (oCardParams[sParam].type === "datetime" && typeof (paramVal) === "string" && paramVal.includes("datetime")) {
            paramVal = paramVal.split("datetime");
            paramVal = paramVal[paramVal.length - 1];
            paramVal = paramVal.replace(/["']/g, "");
            oCardParams[sParam].value = paramVal;
          }
        });
        return oCard;
      },
      _checkClientError: function (oElement) {
        var bNoKeySelected = oElement.getSingleTokenMode() ?
          !oElement.getInnerControls()[0].getSelectedKey() :
          !oElement.getInnerControls()[0].getSelectedKeys().length,
          bIsError = oElement.getMandatory() && bNoKeySelected;
        oElement.setValueState(bIsError ? "Error" : "None");
        return bIsError;
      },
      _attachInitialiseToGroupElement: function(oGroupElement){
        if (oGroupElement.getFields() && oGroupElement.getFields().length) {
          oGroupElement.getFields()[0].attachInitialise(function () {
            // check if fields present as if field is hidden we remove field from the group element
            if (oGroupElement.getFields().length && oGroupElement.getLabelControl() && !oGroupElement.getLabelControl().getText()) {
              var sBindingPath = oGroupElement.getFields()[0].getBindingPath("value");
              if (sBindingPath && oGroupElement.getFields()[0].getVisible()) {
                oGroupElement.getFields()[0].setTextLabel(sBindingPath);
              }
            }
          });
        }
      },
      _onSemanticParameterDateChange: function(sProperty, oSourceField, oEvent) {
        var sValue = oEvent.getParameter("value");
        var oManifestCard = this._oParentViewModel.getProperty("/oCard");
        var cardId = oManifestCard.descriptorContent["sap.app"].id;
        var oLabelInfo = this.getLabelForField(sProperty, sValue, oSourceField, "Parameter");
        var sText = "";
        var bIsDateOperator = sValue.operator === "DATE";
        if (oLabelInfo && typeof oLabelInfo === "string") {
          sText = oLabelInfo.substring(0, oLabelInfo.indexOf("(") - 1);
          if (!sText && bIsDateOperator) {
            sText = oLabelInfo;
          }
        }
        if (!this.oDraftCardParams[cardId][sProperty]) {
          this.oDraftCardParams[cardId][sProperty] = {};
        }
        this.oDraftCardParams[cardId][sProperty].value = bIsDateOperator ? sValue.values[0] : sValue.operator;
        this.oDraftCardParams[cardId][sProperty].label = bIsDateOperator ? sValue.values[0] : sValue.operator;
        oSourceField.getInnerControls()[0].setTokens([]);
        if (sText) {
          this.oDraftCardParams[cardId][sProperty].label = sText;
        }
        var oToken = new Token({
          key: this.oDraftCardParams[cardId][sProperty].value,
          text: this.oDraftCardParams[cardId][sProperty].label
        });
        oSourceField.getInnerControls()[0].setTokens([oToken]);

        var bIsDateValid = oEvent.getParameter("valid");
        oSourceField.setValueState(bIsDateValid ? "None" : "Error");
      },
      _onSemanticFilterDateChange: function(sProperty, oSourceField, oEvent) {
        var sValue = oEvent.getParameter("value");
        var oLabelInfo = this.getLabelForField(sProperty, sValue, oSourceField, "Filter");
        var oDateRangeValue = UrlGenerateHelper.getDateRangeValue(sValue, false, oLabelInfo);
        var oManifestCard = this._oParentViewModel.getProperty("/oCard");
        var cardId = oManifestCard.descriptorContent["sap.app"].id;
        var oSelectionVariant = new SelectionVariant();
        if (!oDateRangeValue.High) {
          oDateRangeValue.High = "";
        }
        oSelectionVariant.addSelectOption(sProperty, "I", oDateRangeValue.Option, oDateRangeValue.Low, oDateRangeValue.High, oDateRangeValue.Text);
        this.oDraftCardParams[cardId][sProperty] = oSelectionVariant.toJSONString();

        oSourceField.getInnerControls()[0].setTokens([]);
        var aTokens = SelectionVariantHelper.getTokenFromSelectOptions(oSelectionVariant.getSelectOption(sProperty), sProperty);
        oSourceField.getInnerControls()[0].setTokens(aTokens);

        var bIsDateValid = oEvent.getParameter("valid");
        oSourceField.setValueState(bIsDateValid ? "None" : "Error");
      },
      _getOptionsForDynamicDate: function(oSemanticDateSetting, sProperty){
        var aDynamicDateFilters;
        if (oSemanticDateSetting[sProperty]["sap:filter-restriction"] === "single-value"){
            aDynamicDateFilters = AppConstants.DATE_OPTIONS.SINGLE_OPTIONS;
        } else if (oSemanticDateSetting[sProperty]["sap:filter-restriction"] === "interval"){
            aDynamicDateFilters = AppConstants.DATE_OPTIONS.RANGE_OPTIONS;
            aDynamicDateFilters = aDynamicDateFilters.concat(AppConstants.DATE_OPTIONS.SINGLE_OPTIONS);
        }
        if (oSemanticDateSetting && oSemanticDateSetting[sProperty].exclude) {
          aDynamicDateFilters = aDynamicDateFilters.filter(function(sFilterKey) {
              return !oSemanticDateSetting[sProperty].selectedValues.includes(sFilterKey);
          });
        }
        return aDynamicDateFilters;
      }
    });
  });
