'use strict'
const path = require('path')
const createDebug = require('debug')
// const fs = require("fs")

// to turn off: not set DEBUG=debug
// for colors: set DEBUG_COLORS=1
const debug = createDebug('debug')
const cl = require('get-current-line').default
const filename = () => {
  return `${cl().file.match(/[\w.-]+$/)[0]}`
}

if (process.env.IS_DEV) {
  const devtools = require('electron-debug')
  devtools()
  process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = 'true'
  console.log("1 debug: %o", debug)
} else {
  console.log("0 debug", debug)
}

/*
let debug = null, cl = null, filename = null
if (process.env.IS_DEV) {
  debug = createDebug('debug')
  const devtools = require('electron-debug')

  cl = require('get-current-line').default
  filename = () => {
    return `${cl().file.match(/[\w.-]+$/)[0]}`
  }
  process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = 'true'
  // devtools({ showDevTools: false }) // F12
  devtools()
  console.log("1 debug: %o", debug)
} else {
  debug = () => { }
  filename = () => { }
  cl = () => {
    return { line: '' }
  }
  // cl().line = () => {}
  console.log("0 debug: ", debug)
}
*/

console.log("IS_DEV: ", process.env.IS_DEV)
// console.log("debug: ", debug)
debug('main.js: %s %s', filename(), cl().line)

// const { app, BrowserWindow, ipcMain, dialog } = require('electron')
const { app, BrowserWindow, ipcMain, dialog, Menu } = require('electron')
// const fs = require('fs/promises')
const file2lines = require('./file2lines')

if (require('electron-squirrel-startup')) {
  app.quit()
}

const handleCommunication = () => {
  ipcMain.removeHandler('save-to-file')
  ipcMain.removeHandler('restore-from-file')
  ipcMain.handle('save-to-file', async (event, data) => {
    try {
      const { canceled, filePath } = await dialog.showSaveDialog({
        defaultPath: 'todo.json'
      })

      if (!canceled) {
        await fs.writeFile(filePath, data, 'utf8')

        return { success: true }
      }
      return {
        canceled
      }
    } catch (error) {
      return { error }
    }
  })
  ipcMain.handle('restore-from-file', async () => {
    try {
      const { canceled, filePaths } = await dialog.showOpenDialog({
        properties: ['openFile'],
        filters: [
          {
            name: 'json',
            extensions: ['json']
          }
        ]
      })

      if (!canceled) {
        const [filePath] = filePaths
        const data = await fs.readFile(filePath, 'utf8')

        debug('ln-%o: { success: true, data }: %o', cl().line, { success: true, data })

        return { success: true, data }
      } else {
        return { canceled }
      }
    } catch (error) {
      return { error }
    }
  })
}
const createWindow = () => {
  const mainWindow = new BrowserWindow({
    webPreferences: {
      // preload1: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
      preload: path.join(__dirname, 'preload.js'), // use a preload script
      nodeIntegration: true, // + contextIsolation: false to enable require
      contextIsolation: false,
      enableRemoteModule: true
    }
  })

  // mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);
  // mainWindow.loadURL('index.html');
  mainWindow.loadFile(path.join(__dirname, 'index.html'))
  debug(filename() + ' ' + cl().line + ' loadFile index.html loaded')

  // mainWindow.webContents.openDevTools();
  handleCommunication()
}

// app.on('ready', createWindow)
app.on('ready', () => {
  // do menu, from official docs
  const { app, Menu } = require('electron')

  const isMac = process.platform === 'darwin'

  const template = [
    // { role: 'appMenu' }
    ...(isMac ? [{
      label: app.name,
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { role: 'services' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' }
      ]
    }] : []),
    // { role: 'fileMenu' }
    {
      label: 'File',
      submenu: [
        {
          label: "Open File1",
          accelerator: 'CmdOrCtrl+O',
          role: 'open',
          click: async () => {
            debug('open file1')
            try {
              const { canceled, filePaths } = await dialog.showOpenDialog({
                properties: ['openFile'],
                filters: [
                  {
                    name: 'json',
                    extensions: ['json']
                  }
                ]
              })
        
              if (!canceled) {
                const [filePath] = filePaths
                // const data = await fs.readFile(filePath, 'utf8')

                debug("filePath: %o", filePath)
                const lines = (() => {
                  try{
                    debug("executing file2lines...")
                    return file2lines(filePath)
                  } catch (err){
                    debug("%o file2lines err: %o", cl().line, err.message)
                    // throw new Error(err.message)
                    return []
                  }})()
        
                debug('%o-ln-%o: { success: true, data }: %o', filename(), cl().line, { success: true, lines: lines })
        
                return { success: true, data }
              } else {
                return { canceled }
              }
            } catch (error) {
              return { error }
            }
          }
        }, 
        {
          label: "Open File2",
          accelerator: 'CmdOrCtrl+P',
          role: 'open',
          click: async () => {
            debug('open file2')
          }
        },
        isMac ? { role: 'close' } : { role: 'quit' }
      ]
    },
    // { role: 'editMenu' }
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        ...(isMac ? [
          { role: 'pasteAndMatchStyle' },
          { role: 'delete' },
          { role: 'selectAll' },
          { type: 'separator' },
          {
            label: 'Speech',
            submenu: [
              { role: 'startSpeaking' },
              { role: 'stopSpeaking' }
            ]
          }
        ] : [
          { role: 'delete' },
          { type: 'separator' },
          { role: 'selectAll' }
        ])
      ]
    },
    // { role: 'viewMenu' }
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    // { role: 'windowMenu' }
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'zoom' },
        ...(isMac ? [
          { type: 'separator' },
          { role: 'front' },
          { type: 'separator' },
          { role: 'window' }
        ] : [
          { role: 'close' }
        ])
      ]
    },
    {
      role: 'help',
      submenu: [
        {
          label: 'repo',
          click: async () => {
            const { shell } = require('electron')
            // await shell.openExternal('https://electronjs.org')
            await shell.openExternal('https://github.com/ffreemt/ptextpad-electron')
          }
        },
        {
          label: 'qqgroup-316287378',
          click: async () => {
            const { shell } = require('electron')
            // await shell.openExternal('https://electronjs.org')
            // await shell.openExternal('https://github.com/ffreemt/ptextpad-electron')
            await shell.openExternal('https://jq.qq.com/?_wv=1027&k=9018eFSV')
          }
        }
      ]
    }
  ]

  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
  createWindow()
})
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

/*
ipcMain.handle("showDialog1", (e, message) => {
    debug(" ipcMain.handle 1")
    dialog.showMessageBox( { message });
    debug(" ipcMain.handle 2")
    return 'aaa'
})

ipcMain.handle("save-to-file-", async (event, data) => {
  try {
    const { canceled, filePath } = await dialog.showSaveDialog({
      defaultPath: "todo.json",
    });

    if (!canceled) {
      await fs.writeFile(filePath, data, "utf8");

      return { success: true };
    }
    return {
      canceled,
    };
  } catch (error) {
    return { error };
  }
});

// */
