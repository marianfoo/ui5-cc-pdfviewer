# UI5Lab Library PDFViewer

**This is a fork of https://github.com/lemaiwo/UI5LabLibraryPDFViewer!**

The PDFViewer is a custom UI5 control that enables you to view PDF's by using a base64 data uri instead of a file URL. This can be useful in case you want to preview a PDF that you want to upload without uploading it.

## Demo

In folder `test/pdfviewer`, execute `npm install` and upload a PDF file. Then run `npm start`.

## Usage

### Include the library in your project

1. Install Control

```bash
npm install "ui5-cc-pdfviewer"
```

2. Configure the manifest.json

```json
    "resourceRoots": {
      "cc.pdfviewer": "./thirdparty/cc/pdfviewer",
      "pdfjs-dist": "./thirdparty/cc/pdfviewer/pdfjs-dist/build"
    },
```

3. Use the PDF Control

```xml
<mvc:View controllerName="pdfviewer.controller.Main"
    xmlns:mvc="sap.ui.core.mvc" displayBlock="true"
    xmlns="sap.m" xmlns:u="sap.ui.unified" xmlns:pdf ="cc.pdfviewer">
    <Page id="page" title="{i18n>title}">
        <content>
            <u:FileUploader id="upload" fileType="pdf" name="upload" tooltip="Upload your image" change="onFileChange" maximumFileSize="10" sameFilenameAllowed="true"></u:FileUploader>
            <Button text="Open PDF in dialog" press="onOpenPDFViewer"/>
            <pdf:PdfViewer id="pdfViewer" pdfSource="{/pdfsource}" height="700px"/>
        </content>
    </Page>
</mvc:View>
```
