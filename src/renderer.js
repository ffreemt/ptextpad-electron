// import "ag-grid-community/dist/styles/ag-grid.css";
// import "ag-grid-community/dist/styles/ag-theme-alpine.css";
// import "./index.css";
// import { Grid } from "./node_modules/ag-grid-community/dist/ag-grid-community.cjs.js";
const { Grid } = require("ag-grid-community")

const path = require("path")
const fs = require("fs")
// const fs = require("fs/promises");

console.log(" entry ")

console.log("to turn log off: console.log = () => {}")
// console.log(" console.log turned off ")
// console.log = () => {}


// this works with <script>require("./renderer.js")</script> in index.HTMLCollection
// and webPreferences nodeIntegration: true,

let rowData = [];

const columnDefs = [
  { field: "task", editable: true, flex: 1 },
  {
    field: "completed",
    width: 120,
    cellRenderer(params) {
      const input = document.createElement("input");

      input.type = "checkbox";
      input.checked = params.value;
      input.classList.add("checkbox");
      input.addEventListener("change", (event) => {
        params.setValue(input.checked);
      });

      return input;
    },
  },
  {
    field: "remove",
    width: 100,
    cellRenderer(params) {
      const button = document.createElement("button");

      button.textContent = "✕";
      button.classList.add("btn", "remove-btn");
      button.addEventListener("click", () => removeTodo(params.rowIndex));

      return button;
    },
  },
];
const gridOptions = {
  columnDefs,
  rowData,
};
const saveBtn = document.getElementById("save-btn");
const restoreBtn = document.getElementById("restore-btn");
const addBtn = document.getElementById("add-btn");
const addTodo = () => {
  rowData = [...rowData, { task: "New Task", completed: false }];
  gridOptions.api.setRowData(rowData);
  console.log("addTodo ", rowData)
};
const removeTodo = (rowIndex) => {
  rowData = rowData.filter((value, index) => {
    return index !== rowIndex;
  });
  gridOptions.api.setRowData(rowData);
};

// https://stackoverflow.com/questions/32979630/how-can-i-display-a-save-as-dialog-in-an-electron-app
// const remote = require('electron').remote
// const dialog = remote.dialog
// const app = remote.app

// https://brainbell.com/javascript/show-save-dialog.html
// const {remote} = require('electron'),

const { ipcRenderer } = require("electron") //https://stackoverflow.com/questions/36637201/requiring-electron-dialog-from-render-process-is-undefined

const saveToFile = async () => {
  // window.electronAPI.saveToFile(JSON.stringify(rowData));
  console.log("renderer.js saveToFile() ")
  // let toLocalPath = path.resolve(app.getPath("desktop"), path.basename(remoteUrl)) 

  let res = ipcRenderer.invoke("save-to-file", JSON.stringify(rowData))
  // console.log(res)
  const v = await res
  console.log("v: ", v)
  // res.then((value)=>
  //   console.log('ipcRenderer.invoke returned: ' + value)
  // )
  return { success: true }
};

const restoreFromFile = async () => {
  // const result = await window.electronAPI.restoreFromFile();
  
  const result = await ipcRenderer.invoke("restore-from-file")
  
  console.log(" result: ", result)
  
  if (result.success) {
    rowData = JSON.parse(result.data);
    gridOptions.api.setRowData(rowData);
  }
};
const setupGrid = () => {
  const gridDiv = document.getElementById("grid");

  new Grid(gridDiv, gridOptions);
  addBtn.addEventListener("click", addTodo);
  saveBtn.addEventListener("click", saveToFile);
  restoreBtn.addEventListener("click", restoreFromFile);
};

document.addEventListener("DOMContentLoaded", setupGrid);
