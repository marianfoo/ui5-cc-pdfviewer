// Copyright (c) 2009-2022 SAP SE, All Rights Reserved

/**
 * @fileOverview This file contains the functionality needed to register
 * the Fiori Wave 2 font icons
 */
sap.ui.define([
    "sap/ui/core/IconPool"
], function (IconPool) {
    "use strict";

    var iconfonts = {};

    /**
     * loads SAP Fiori Wave 2 launch icon font and font icons that are needed in
     * launchpad UI itself
     *
     * Note: Used in many test pages.
     *
     * @ui5-restricted cp.client.flp.runtime
     */
    iconfonts.registerFiori2IconFont = function () {
        // register BusinessSuiteInAppSymbols icon font
        IconPool.registerFont({
            fontFamily: "BusinessSuiteInAppSymbols",
            fontURI: sap.ui.require.toUrl("sap/ushell/themes/base/fonts"),
            lazy: true
        });

        // register TNT icon font
        IconPool.registerFont({
            fontFamily: "SAP-icons-TNT",
            fontURI: sap.ui.require.toUrl("sap/tnt/themes/base/fonts"),
            lazy: true
        });

        // register TNT icon font under its legacy name (as it had been removed before and this was incompatible)
        IconPool.registerFont({
            fontFamily: "SAP-icons-TNT",
            collectionName: "TNTIcons",
            fontURI: sap.ui.require.toUrl("sap/tnt/themes/base/fonts"),
            lazy: true
        });

        // the lists of icons as [name, unicode code point] tuples

        // old Fiori1 app icons
        var oFiori1Icons = {
            fontFamily: "SAP-Icons",
            collectionName: "Fiori2",
            icons: [
                ["F0017", "e05e"], ["F0020", "e0c3"], ["F0021", "e10d"], ["F0392", "e04f"],
                ["F0394", "e044"], ["F0395", "e132"], ["F0396", "e064"], ["F0397", "e0a4"],
                ["F0398", "e0a4"], ["F0399", "e044"], ["F0401", "e08d"], ["F0402", "e13e"],
                ["F0403", "e13e"], ["F0404", "e033"], ["F0405", "e0b3"], ["F0406", "e043"],
                ["F0407", "e043"], ["F0408", "e043"], ["F0409", "e075"], ["F0410", "e007"],
                ["F0411", "e075"]
            ]
        },

            // sap-launch-icons - Wave 2 (SAP Fiori launch icons)
            oAppIcons = {
                fontFamily: "Fiori2", // Maps to sap-launch-icons in IconFonts.less
                collectionName: "Fiori2",
                icons: [
                    // transaction app icons
                    ["F0002", "E236"], ["F0003", "E202"], ["F0004", "E203"], ["F0005", "E204"],
                    ["F0006", "E205"], ["F0009", "E206"], ["F0010", "E207"], ["F0012", "E208"],
                    ["F0014", "E209"], ["F0018", "E200"], ["F0019", "E201"], ["F0023", "E20A"],
                    ["F0024", "E20B"], ["F0025", "E20C"], ["F0026", "E20D"], ["F0072", "E23A"],
                    ["F0100", "E23B"], ["F0101", "E23C"], ["F0102", "E23D"], ["F0106", "E20F"],
                    ["F0144", "E210"], ["F0190", "E23E"], ["F0194", "E23F"], ["F0210", "E242"],
                    ["F0211", "E243"], ["F0212", "E244"], ["F0217", "E211"], ["F0220", "E213"],
                    ["F0243", "E215"], ["F0244", "E216"], ["F0245", "E217"], ["F0248", "E21A"],
                    ["F0249", "E21B"], ["F0252", "E21E"], ["F0257", "E21F"], ["F0281", "E220"],
                    ["F0282", "E221"], ["F0283", "E222"], ["F0284", "E223"], ["F0292", "E224"],
                    ["F0295", "E225"], ["F0296", "E226"], ["F0316", "E227"], ["F0317", "E228"],
                    ["F0321", "E229"], ["F0339", "E22A"], ["F0340", "E22B"], ["F0341", "E22C"],
                    ["F0342", "E22D"], ["F0365", "E212"], ["F0366", "E22F"], ["F0367", "E230"],
                    ["F0368", "E231"], ["F0369", "E235"], ["F0370", "E22E"], ["F0372", "E232"],
                    ["F0380", "E233"], ["F0381", "E234"], ["F0382", "E246"], ["F0390", "E20E"],
                    ["F0412", "E214"], ["F0429", "E2A6"],

                    // analytic app icons
                    ["F0013", "E237"], ["F0016", "E238"], ["F0028", "E239"], ["F0029", "E283"],
                    ["F0030", "E284"], ["F0031", "E285"], ["F0032", "E286"], ["F0033", "E287"],
                    ["F0034", "E288"], ["F0036", "E289"], ["F0038", "E28A"], ["F0039", "E28B"],
                    ["F0041", "E28C"], ["F0044", "E28D"], ["F0293", "E28E"], ["F0294", "E28F"],
                    ["F0297", "E290"], ["F0298", "E291"], ["F0299", "E292"], ["F0300", "E293"],
                    ["F0301", "E294"], ["F0302", "E295"], ["F0303", "E296"], ["F0304", "E297"],
                    ["F0305", "E298"], ["F0306", "E299"], ["F0323", "E29A"], ["F0324", "E29B"],
                    ["F0326", "E29C"], ["F0327", "E29D"], ["F0328", "E29E"], ["F0329", "E29F"],
                    ["F0331", "E2A1"], ["F0332", "E2A2"], ["F0343", "E2A3"], ["F0344", "E2A4"],
                    ["F0345", "E2A5"], ["F0388", "E2A7"], ["F0391", "E2A0"], ["F0260", "E2B4"],
                    ["FD10N", "E2B5"], ["FK10N", "E2B6"], ["FS10N", "E2B7"], ["FBL5N", "E2B8"],
                    ["FBL1N", "E2B9"], ["FFS01", "E2BA"], ["FBL3N", "E2BB"], ["FCOA1", "E2BC"]
                ]
            },

            // sap-launch-icons - Wave 3 (SAP Fiori launch icons)
            oFiori3Icons = {
                fontFamily: "Fiori2", // Maps to sap-launch-icons in IconFonts.less
                collectionName: "Fiori3",
                icons: [
                    ["F0246", "E218"], ["F0247", "E219"], ["F0250", "E21C"], ["F0251", "E21D"],
                    ["F0263", "E2A8"], ["F0508", "E2A9"], ["F0509", "E2AA"], ["F0510", "E2AB"],
                    ["F0533", "E2AC"], ["F0534", "E2AD"], ["F0535", "E2AE"], ["F0536", "E2AF"],
                    ["F0537", "E2B0"], ["F0538", "E2B1"], ["Lumira001", "E2B2"]
                ]
            },

            // sap-launch-icons - Wave 4 (SAP Fiori launch icons)
            oFiori4Icons = {
                fontFamily: "Fiori2", // Maps to sap-launch-icons in IconFonts.less
                collectionName: "Fiori4",
                icons: [
                    ["F0194", "E2BD"], ["F0260", "E2B4"], ["F0433", "E2BE"], ["F0499", "E2BF"],
                    ["F0500", "E2C0"], ["F0501", "E2C1"], ["F0502", "E2C2"], ["F0503", "E2C3"],
                    ["F0504", "E2C4"], ["F0507", "E2C5"], ["F0530", "E2C6"], ["F0531", "E2C7"],
                    ["F0539", "E2C8"], ["F0544", "E2C9"], ["F0545", "E2CA"], ["F0547", "E2CB"],
                    ["F0576", "E2CC"], ["F0578", "E2CD"], ["F0579", "E2CE"], ["F0580", "E2CF"],
                    ["F0581", "E2D0"], ["F0582", "E2D1"], ["F0583", "E2D2"], ["F0584", "E2D3"],
                    ["F0586", "E2D4"], ["F0587", "E2D5"], ["F0588", "E2D6"], ["F0589", "E2D7"],
                    ["F0590", "E2D8"], ["F0591", "E2D9"], ["F0593", "E2DA"], ["F0594", "E2DB"],
                    ["F0597", "E2DC"], ["F0603", "E2DD"], ["F0604", "E2DE"], ["F0605", "E2DF"],
                    ["F0606", "E2E0"], ["F0607", "E2E1"], ["F0608", "E2E2"], ["F0609", "E2E3"],
                    ["F0615", "E2E4"], ["F0616", "E2E5"], ["F0618", "E2E6"], ["F0617", "E2E7"],
                    ["F0622", "E2E8"], ["F0623", "E2E9"], ["F0624", "E2EA"], ["F0625", "E2EB"],
                    ["F0626", "E2EC"], ["F0627", "E2ED"], ["F0629", "E2EE"], ["F0630", "E2EF"],
                    ["F0632", "E2F0"], ["F0633", "E2F1"], ["F0634", "E2F2"], ["F0635", "E2F3"],
                    ["F0636", "E2F4"], ["F0638", "E2F5"], ["F0639", "E2F6"], ["F0643", "E2F7"],
                    ["F0644", "E2F8"], ["F0645", "E2F9"], ["F0646", "E2FA"], ["F0648", "E2FB"],
                    ["F0649", "E2FC"], ["F0650", "E2FD"], ["F0654", "E2FE"], ["F0655", "E2FF"],
                    ["F0659", "E300"], ["F0660", "E301"], ["F0661", "E302"], ["F0665", "E303"],
                    ["F0666", "E304"], ["F0667", "E305"], ["F0671", "E306"], ["F0672", "E307"],
                    ["F0673", "E308"], ["F0675", "E309"], ["F0676", "E30A"], ["F0677", "E30B"],
                    ["F0678", "E30C"], ["F0679", "E30D"], ["F0680", "E30E"], ["F0682", "E30F"],
                    ["F0683", "E310"], ["F0684", "E240"], ["F0685", "E312"], ["F0686", "E313"],
                    ["F0687", "E314"], ["F0690", "E315"], ["F0691", "E316"], ["F0692", "E317"],
                    ["F0693", "E318"], ["F0694", "E319"], ["F0695", "E31A"], ["F0700", "E31B"],
                    ["F0598", "E31C"]
                ]
            },
            // sap-launch-icons - Wave 5 (SAP Fiori launch icons)
            oFiori5Icons = {
                fontFamily: "Fiori2", // Maps to sap-launch-icons in IconFonts.less
                collectionName: "Fiori5",
                icons: [
                    ["F0263", "E321"], ["F0266", "E322"], ["F2001", "E31E"], ["F0839", "E320"],
                    ["F0270", "E323"], ["F0273", "E324"], ["F0439", "E325"], ["F0443", "E326"],
                    ["F0549", "E327"], ["F0550", "E328"], ["F0551", "E329"], ["F0577", "E32A"],
                    ["F0585", "E32B"], ["F0637", "E32C"], ["F0668", "E32D"], ["F0669", "E32E"],
                    ["F0670", "E330"], ["F0688", "E331"], ["F0689", "E332"], ["F0701", "E333"],
                    ["F0702", "E334"], ["F0703", "E335"], ["F0706", "E336"], ["F0707", "E337"],
                    ["F0708", "E338"], ["F0711", "E339"], ["F0712", "E33A"], ["F0731", "E33B"],
                    ["F0732", "E33C"], ["F0733", "E33D"], ["F0735", "E33E"], ["F0736", "E340"],
                    ["F0737", "E341"], ["F0742", "E342"], ["F0743", "E343"], ["F0744", "E344"],
                    ["F0745", "E345"], ["F0746", "E346"], ["F0747", "E347"], ["F0748", "E348"],
                    ["F0749", "E349"], ["F0750", "E34A"], ["F0751", "E34B"], ["F0755", "E34C"],
                    ["F0756", "E34D"], ["F0757", "E34E"], ["F0758", "E350"], ["F0759", "E351"],
                    ["F0760", "E352"], ["F0761", "E353"], ["F0763", "E354"], ["F0764", "E355"],
                    ["F0765", "E356"], ["F0768", "E357"], ["F0770", "E358"], ["F0771", "E359"],
                    ["F0772", "E35A"], ["F0774", "E35B"], ["F0776", "E35C"], ["F0777", "E35D"],
                    ["F0778", "E35E"], ["F0788", "E360"], ["F0789", "E361"], ["F0790", "E362"],
                    ["F0791", "E363"], ["F0792", "E364"], ["F0793", "E365"], ["F0794", "E366"],
                    ["F0806", "E367"], ["F0807", "E368"], ["F0808", "E369"], ["F0809", "E36A"],
                    ["F0810", "E36B"], ["F0811", "E36C"], ["F0812", "E36D"], ["F0813", "E36E"],
                    ["F0814", "E370"], ["F0815", "E371"], ["F0816", "E372"], ["F0817", "E373"],
                    ["F0818", "E374"], ["F0819", "E375"], ["F0820", "E376"], ["F0821", "E377"],
                    ["F0822", "E378"], ["F0823", "E379"], ["F0824", "E37A"], ["F0825", "E37B"],
                    ["F0826", "E37C"], ["F0827", "E37D"], ["F0828", "E37E"], ["F0829", "E380"],
                    ["F0830", "E381"], ["F0831", "E382"], ["F0717", "E384"], ["F0718", "E383"],
                    ["F0241", "E385"], ["F0246", "E386"], ["F0250", "E387"], ["F0248", "E388"],
                    ["F0252", "E389"], ["F0600", "E38A"], ["F0674", "E38B"], ["F0247", "E38E"],
                    ["F0251", "E390"]
                ]
            },

            // sap-launch-icons - Wave 6 (SAP Fiori launch icons)
            oFiori6Icons = {
                fontFamily: "Fiori2", // Maps to sap-launch-icons in IconFonts.less
                collectionName: "Fiori6",
                icons: [
                    ["F0795", "E397"], ["F0866", "E3A0"], ["F0865", "E3A1"], ["F0867", "E3A2"],
                    ["F0868", "E3A3"], ["F0869", "E3A4"], ["F0870", "E3A5"], ["F0138", "E3A6"],
                    ["F0752", "E3A7"], ["F0753", "E3A8"], ["F0773", "E3A9"], ["F0891", "E3AA"],
                    ["F0892", "E3AB"], ["F1023", "E3AC"], ["F0767", "E3AD"], ["F0849", "E3AE"],
                    ["F0670-1", "E393"], ["F0670-2", "E394"], ["F0670-3", "E395"], ["F0670-4", "E396"]
                ]
            },

            // sap-launch-icons - Wave 7 (SAP Fiori launch icons)
            oFiori7Icons = {
                fontFamily: "Fiori2", // Maps to sap-launch-icons in IconFonts.less
                collectionName: "Fiori7",
                icons: [
                    ["F1079", "E3B0"], ["F0738", "E3B1"], ["F1301", "E3B2"], ["F1302", "E3B3"],
                    ["F1303", "E3B4"], ["F1338", "E3B5"], ["F1263", "E3B6"], ["F1373", "E3B7"],
                    ["F0863", "E3B8"], ["F1068", "E3BA"], ["F0955", "E3B9"], ["F1242", "E3BB"],
                    ["F1405", "E3BC"], ["F1406", "E3BD"], ["F1407", "E3BE"], ["F1408", "E3BF"],
                    ["F1409", "E3C0"], ["F1410", "E3C1"], ["F1411", "E3C2"], ["F1412", "E3C3"],
                    ["F1413", "E3C4"], ["F1414", "E3C5"], ["F1415", "E3C6"], ["F0797", "E3C8"],
                    ["F0798", "E3C9"], ["F0800", "E3CA"], ["F0801", "E3CB"], ["F0804", "E3CC"],
                    ["F0850", "E3CD"], ["F0890", "E3CE"], ["F1075", "E3CF"], ["F1394", "E3D0"],
                    ["F1061", "E3D1"], ["F1062", "E3D2"], ["F1255", "E3D3"], ["F1077", "E3D4"],
                    ["F0843", "E3D5"], ["F1076", "E3D6"], ["F0859", "E3D7"], ["F1060", "E3D8"],
                    ["F1053", "E3D9"], ["F0900", "E3DA"], ["F0840", "E3DB"], ["F0842-1", "E3A6"],
                    ["F0842-2", "E22C"], ["F1476", "E3C7"]
                ]
            },

            // sap-launch-icons - Wave 8 (SAP Fiori launch icons)
            oFiori8Icons = {
                fontFamily: "Fiori2", // Maps to sap-launch-icons in IconFonts.less
                collectionName: "Fiori8",
                icons: [
                    ["F1317", "E3DC"], ["F1318", "E3DD"], ["F1319", "E3DE"], ["F1369", "E3DF"],
                    ["F1475", "E3E0"], ["F1345", "E3E1"], ["F1248", "E3E2"], ["F1067", "E3E3"],
                    ["F1332", "E3E4"], ["F1333", "E3E5"], ["F1334", "E3E6"], ["F1335", "E3E7"],
                    ["F1520", "E3E8"], ["F1457", "E3E9"], ["F1504", "E3EA"], ["F1505", "E3EB"]
                ]
            },

            // sap-launch-icons - Wave 9 (SAP Fiori launch icons)
            oFiori9Icons = {
                fontFamily: "Fiori2", // Maps to sap-launch-icons in IconFonts.less
                collectionName: "Fiori9",
                icons: [
                    ["F1094", "E3EC"], ["F1096", "E3ED"], ["F1353", "E3EE"], ["F1354", "E3EF"],
                    ["F1428", "E3F0"], ["F1492", "E3F1"], ["F1515", "E3F2"], ["F1516", "E3F3"],
                    ["F0997", "E400"], ["F1512", "E401"], ["F1562", "E402"], ["F1564", "E403"],
                    ["F1599", "E404"], ["F1596", "E405"], ["F1254", "E406"], ["F1618", "E407"],
                    ["F1561", "E408"], ["learning-compass", "E409"], ["partner-enablement", "E40A"]
                ]
            },

            // sap-launch-icons - S/4 Hana Generic Icons
            oS4HanaIcons = {
                fontFamily: "Fiori2", // Maps to sap-launch-icons in IconFonts.less
                collectionName: "S4Hana",
                icons: [
                    ["S0001", "E3F4"], ["S0002", "E3F5"], ["S0003", "E3F6"], ["S0004", "E3F7"],
                    ["S0005", "E3F8"], ["S0006", "E3F9"], ["S0007", "E3FA"], ["S0008", "E3FB"],
                    ["S0009", "E3FC"], ["S0010", "E3FD"], ["S0011", "E3FE"], ["S0012", "E3FF"]
                ]
            },

            // InApp Icons
            oFioriInApp = {
                fontFamily: "FioriInAppIcons",
                collectionName: "FioriInAppIcons",
                icons: [
                    ["Hierarchal Tree", "E700"], ["Open", "E701"], ["Blocked", "E702"],
                    ["Partially Blocked", "E703"], ["Open1", "E704"], ["Partially Adopted", "E705"],
                    ["Due", "E706"], ["Overdue", "E707"], ["Sort", "E708"],
                    ["Missing Parts", "E709"], ["Fire", "E70A"], ["Dangerous Chemicals", "E70B"], ["Share", "E70C"],
                    ["Entertainment", "E70D"], ["Gift", "E70E"], ["QR Code", "E70F"], ["Wifi-Online", "E710"],
                    ["Wifi-Offline", "E711"], ["Sunrise", "E712"], ["Sunset", "E713"], ["Afternoon", "E714"],
                    ["Night", "E715"], ["Loading Date", "E715"], ["Cloudy", "e717"], ["Rain", "e718"],
                    ["Storm", "e719"], ["Partly Sunny", "e71A"], ["Heavy Rain", "e71B"], ["Foggy", "e71C"],
                    ["Snow", "e71D"], ["Risk Assessment", "e71E"], ["Database", "e71f"], ["Marine", "e720"],
                    ["Blister", "e721"], ["Pills", "e722"], ["Main-Sequence", "e723"], ["Parallel Sequence", "e724"],
                    ["Alternative Sequence", "e725"], ["3D", "e726"], ["Presentation", "e727"], ["Mute", "e728"],
                    ["Windy", "e729"], ["Oil Tank", "e72A"], ["Location Assets", "e72B"], ["Transport Systems", "e72C"],
                    ["Field", "e72D"], ["Field Group", "e72E"], ["Record", "e730"], ["Record Group", "e731"]
                ]
            },
            oFioriNonNative = {
                fontFamily: "Fiori2", // Maps to sap-launch-icons in IconFonts.less
                collectionName: "FioriNonNative",
                icons: [
                    ["FN0001", "E392"], ["FN0002", "E398"], ["FN0003", "E399"], ["FN0004", "E39A"],
                    ["FN0005", "E39B"], ["FN0006", "E39C"], ["FN0007", "E39D"], ["FN0008", "E39E"],
                    ["FN0009", "E39F"]
                ]
            };

        this.registerFonts(oFiori1Icons, oFiori3Icons, oAppIcons, oFioriInApp, oFiori4Icons,
            oFiori5Icons, oFioriNonNative, oFiori6Icons, oFiori7Icons, oFiori8Icons, oFiori9Icons, oS4HanaIcons);
    };

    /*
     * loads icon font characters
     *
     * call like <code>sap.ushell.iconfonts.registerFonts(oFontIcons1, oFontIcons2, ...);</code>
     *
     * @param {object} an object with icon font definition (see below). Note that the icon font has
     *          to be registered in CSS before (via @font-face).
     *          <code>
     *          var oIcon = {
     *              fontFamily: "FontFamilyName",   // from @font-face definition in CSS
     *              collectionName: "collection",   // IconPool collection name, e.g. 'Fiori2'
     *              icons : [["icon-name", "E001], [...], ...]  // list of tuples containing ("icon name", "unicode code point") tuples
     *          }
     *          </code>
     *
     * @private
     */
    iconfonts.registerFonts = function () {
        var oIcon,
            i,
            j,
            oIconInfo;

        for (i = 0; i < arguments.length; i = i + 1) {
            oIcon = arguments[i];

            for (j = 0; j < oIcon.icons.length; j = j + 1) {
                oIconInfo = {};
                oIconInfo.fontFamily = oIcon.fontFamily;
                oIconInfo.content = oIcon.icons[j][1];
                oIconInfo.overWrite = false;
                oIconInfo.suppressMirroring = true;

                IconPool.addIcon(oIcon.icons[j][0], oIcon.collectionName, oIconInfo);
            }
        }
    };

    return iconfonts;
}, /* bExport= */ true);
