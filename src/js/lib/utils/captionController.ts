import CSInterface from "../cep/csinterface";

const csInterface = new CSInterface();

const xmp = {
  id: "0",
  propertyName: "genAIDescription",
  namespace: "http://ns.adobe.com/xap/1.0/",
  prefix: "xmp",
  displayName: "Gen AI Desc",
  filename: "",
  value: "",
};

export default class CaptionController {
  caption: string;
  filepath: string;

  constructor(caption: string, filepath: string) {
    this.caption = caption;
    this.filepath = filepath;
    console.log(`caption: ${caption}\nfilepath: ${filepath}`);
  }

  writeToFile = () => {
    console.log(`Writing ${this.caption} to ${this.filepath}.txt`);
    let txtFile = this.filepath.replace(/\.[^/.]+$/, ".txt");
    const result = window.cep.fs.writeFile(
      txtFile,
      this.caption,
      window.cep.encoding.utf8
    );
    if (result.err === 0) {
      console.log(`Saved the View to ${txtFile}`);
      return txtFile;
    } else {
      console.log(`Unable to save View. Error writing new file: ${result.err}`);
      throw result.err;
    }
  };

  writeToXmp = () => {
    console.log(`Storing ${this.caption} to XMP for ${this.filepath}.`);
    xmp.filename = this.filepath;
    xmp.value = this.caption;
    csInterface.evalScript(
      `new XMPCEPHelper("KBRG").setXMP(${JSON.stringify(xmp)})`,
      () => {}
    );
  };
}
