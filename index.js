
const APP_NAME = "sciter-js-quark";

import * as Sciter from "@sciter";
import {fs} from "@sys";
import * as Settings from "settings.js";
import * as Data from "data.js";
import {FileSelector, FolderSelector} from "utils.js";
import * as Package from "package.js";
import {LogRunner} from "logrunner.js";

// a.k.a. main()
document.ready = function() {
  Settings.init(APP_NAME);
  document.timer(10, () => Window.this.state = Window.WINDOW_SHOWN);
  Package.checkForImageMagic(function(found) {
    if (found) return;
    document.post(function() {
      Window.this.modal(<alert>ImageMagic convert utility not found\nPlease install it and run again!</alert>);
    });
  });
};

// list of projects
export class ProjectsView extends Element {
  componentDidMount() {
    document.on("current-project-property-change", () => this.componentUpdate());
    document.on("current-project-change", () => this.componentUpdate());
  }

  render() {
    let list = [];
    if (Data.projects) {
      list = Data.projects.map((project) => <option value={project.id}>
        <img src={ URL.fromPath(project.logo) } /> {project.name}
      </option>);
    }

    return <section#projects>
      <toolbar>
        <button.new title="new project" />
        <button.clone state-disabled={!Data.project} title="clone project" />
        <button.delete state-disabled={!Data.project} title="delete project" />
      </toolbar>
      <select|list state-value={ Data.project?.id } >{list}</select>
    </section>;
  }

  ["on click at button.new"]() {
    Data.addNewProject();
  }
  ["on click at button.clone"]() {
    Data.cloneCurrentProject();
  }
  ["on click at button.delete"]() {
    Data.deleteCurrentProject();
  }
  ["on change at select"](evt, select) {
    Data.selectProject(select.value);
  }
}

globalThis.ProjectsView = ProjectsView;

// current project

export class ProjectView extends Element {
  componentDidMount() {
    document.on("current-project-change", () => {
      this.patch(this.render());
      this.$("form").value = Data.project;
      document.$("button#assemble").state.disabled = !ProjectView.validate(Data.project);
    });
    if (Data.project)
      this.componentUpdate();
  }

  static validate(vals) {
    return vals.name &&
        vals.exe &&
        vals.resources &&
        vals.entryFileExists &&
        vals.targets &&
        vals.targets.length &&
        vals.out;
  }

  renderEmpty() {
    return <section #project>
      <div.introduction #introduction>
        <img.arrow src="stock:arrow-left"/> Create new project
        <h1>Sciter.JS.Quark v.{Sciter.VERSION}</h1>
      </div>
    </section>;
  }

  render() {
    if (!Data.project)
      return this.renderEmpty();

    return <section #project>
      <form state-disabled={!Data.project}>
        <label>项目：</label>
              <input|text(name) novalue="项目名称"/>
        <label>可执行文件：</label>
              <input|text(exe) novalue="可执行名称(无边框)"/>
        <label>图标：</label>
              <FileSelector(logo) novalue="SVG icon" />
        <label>资源：</label>
              <FolderSelector(resources) novalue="应用程序资源文件夹"/>
        <label>目标位置：</label>
              <input|text(entry) novalue="Main.htm未被发现为“只读”"/>
        <label>名称：</label>
              <input|text(productName) novalue="产品名称"/>
        <label>版本：</label>
              <input|text(productVersion) novalue="产品版本"/>
        <label>描述：</label>
              <input|text(productDescription) novalue="产品描述"/>
        <label>公司：</label>
              <input|text(productCompany) novalue="产品公司"/>
        <label>版权：</label>
              <input|text(productCopyright) novalue="产品的版权"/>
        <label>目标：</label>
            <select|select(targets) multiple="checkmarks">
              <option value="winX32">Windows X32</option>
              <option value="winX64">Windows X64</option>
              <option value="winARM64">Windows/ARM64</option>
              <option value="mac">Mac OSX</option>
              <option value="linuxX64">Linux</option>
              <option value="linuxARM32">Linux/ARM32</option>
              <option value="linuxARM64" disabled>Linux/ARM64</option>
              <option value="ios" disabled>iOS</option>
              <option value="android" disabled>Android</option>
            </select>
        <label>输出位置：</label>
            <FolderSelector(out) novalue="输出文件夹" />
      </form>
      <LogRunner />
      <button #assemble disabled>集成</button>
    </section>;
  }

  ["on change at form"](evt, form) {
    this.updateForm(form);
  }

  ["on click at form"](evt, form) {
    this.updateForm(form);
  }

  ["on input at FileSelector"]() {
    this.updateForm(this.$("form"));
  }

  ["on input at FolderSelector"]() {
    this.updateForm(this.$("form"));
  }

  updateForm(form) {
    const vals = form.value;
    vals.entryFileExists = fs.$stat(`${vals.resources}/main.htm`) ? true : false;

    Data.updateCurrentProject(vals);

    this.$("button#assemble").state.disabled = !ProjectView.validate(vals);
    this.$("input(entry)").value = vals.entryFileExists ? "main.htm found" : "";
  }

  ["on click at button#assemble"]() {
    Package.assemble(Data.project);
  }
}

globalThis.ProjectView = ProjectView;
