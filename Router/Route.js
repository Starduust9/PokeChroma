export default class Route {
    constructor(url, title, pathHtml, pathJS = "", titleEn = "") {
      this.url = url;
      this.title = title;
      this.titleEn = titleEn;
      this.pathHtml = pathHtml;
      this.pathJS = pathJS;
    }
}