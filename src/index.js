'use strict'

// const createDebug = require('debug')

// to turn off: unset DEBUG=debug, e.g. set DEBUG= or process.env.DEBUG=''
// for colors: set DEBUG_COLORS=1

// const debug = createDebug('debug')
// const cl = require('get-current-line').default
// const fn = `${cl().file.match(/[\w.-]+$/)[0]} `

// const consola = require('consola')
// consola.level = process.env.CONSOLA_DEBUG || 4

// const assert = require('assert')

if (process.env.IS_DEV) {
  const devtools = require('electron-debug')
  devtools()
  process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = 'true'
}

console.log('IS_DEV: ', process.env.IS_DEV)
// logger.debug('IS_DEV: ', process.env.IS_DEV)
// console.log("debug: ", debug)
// debug('main.js: %s %s', fn, cl().line)

if (process.env.IS_DEV) process.env.TRACER_DEBUG = 'debug'

const logger = require('tracer').colorConsole({
  format: '{{timestamp}} <{{title}}>{{file}}:{{line}}: {{message}}',
  dateformat: 'HH:MM:ss.L',
  level: process.env.TRACER_DEBUG || 'info' // 'debug'
})
logger.debug(' entry ... ')
logger.info(' set TRACER_DEBUG=info or set IS_DEV=1 to turn on debug/verbose ... ')

// const { app, BrowserWindow, ipcMain, dialog } = require('electron')
const { app, BrowserWindow, dialog, ipcMain, Menu } = require('electron')
const ProgressBar = require('electron-progressbar')

const fs = require('fs')
const fsAsync = require('fs/promises')
const path = require('path')
// const { spawn } = require('node:child_process')
const converter = require('json-2-csv')

const file2lines = require('./file2lines')
const genRowdata = require('./genRowdata')
// const zmqAlign = require('./zmqAlign')
const restAlign = require('./restAlign')
// const menuTemplate = require('./menuTemplate')

// const Store = require('./store.js')
const Store = require('electron-store')

const file1 = './data/test-en.txt'
const file2 = './data/test-zh.txt'

// const lines1 = file2lines(file1)
// const lines2 = file2lines(file2)
const lines1 = () => {
  try { return file2lines(file1) } catch (e) { return path.resolve(file1) + ': ' + e.name + ' ' + e.message }
}
const lines2 = () => {
  try { return file2lines(file2) } catch (e) { return path.resolve(file2) + ': ' + e.name + ' ' + e.message }
}

// const zipLongest = (...args) => Array(Math.max(...args.map(a => a.length))).fill('').map((_, i) => args.map(a => a[i] === undefined ? '' : a[i]))
// const headers = ['text1', 'text2', 'metric']
// const columnDefs = headers.map(el => { return { headerName: el, field: el } })

let mainWindow
let col1 = []
let col2 = []
// eslint-disable-next-line prefer-const
let col3 = []

let rowData = ''
let filename1 = ''
let filename2 = ''

const isMac = process.platform === 'darwin'
// const { app, Menu } = require('electron')

/*
const store = new Store({
  // We'll call our data file 'user-preferences'
  configName: 'user-preferences',
  defaults: {
    // 800x600 is the default size of our window
    windowBounds: { width: 800, height: 600 },
    menuCheck: false
  }
})
// */

// const Store = require('electron-store')
const store = new Store()

/*
store.set('engineState', {
  forindo_dezbee: false,
  forindo_mlbee: true,
  localhost_dezbee: false,
  localhost_mlbee: false,
})  // reset
// */

// HERE
const engineNameMap = {
  forindo_dezbee: 'http://forindo.net:5555',
  forindo_mlbee: 'http://forindo.net:7860',
  localhost_dezbee: 'http://localhost:5555',
  localhost_mlbee: 'http://localhost:7860'
}

const defaultPref = {
  splitToSents: false,
  splitToSentsEnabled: true,
  windowBounds: { width: 800, height: 600 },
  menuChecked: false,
  aliEngine: 'http://forindo.net:5555',
  aliEngineChecked: 'forindo_dezbee',
  engineState: {
    forindo_dezbee: true,
    forindo_mlbee: false,
    localhost_dezbee: false,
    localhost_mlbee: false
  },
  engineURL: engineNameMap.forindo_dezbee
}

// let menuChecked = store.get('menuChecked') || false
let menuChecked = store.get('menuChecked') || defaultPref.menuChecked
logger.debug('menuChecked: %s', menuChecked)

let splitToSents = store.get('splitToSents') || defaultPref.splitToSents
let splitToSentsEnabled = store.get('splitToSentsEnabled') || defaultPref.splitToSentsEnabled
const aliEngine = store.get('aliEngine') || defaultPref.aliEngine
const aliEngineChecked = store.get('aliEngineChecked') || defaultPref.aliEngineChecked
const engineState = store.get('engineState') || defaultPref.engineState
let engineURL = store.get('engineURL') || defaultPref.engineURL

store.set('menuChecked', menuChecked)
store.set('splitToSents', splitToSents)
store.set('aliEngine', aliEngine)
store.set('aliEngineChecked', aliEngineChecked)
store.set('engineState', engineState)
store.set('engineURL', engineURL)

// logger.debug("store.store: %j", store.store)
logger.debug('store.store: ', store.store)

const handleRadio = engine => {
  // amened radio states & engineURL
  for (const eng in engineState) {
    if (eng === engine) { engineState[eng] = true } else { engineState[eng] = false }
  }
  engineURL = engineNameMap[engine]
  logger.debug('engineState: ', engineState)
  logger.debug('engineURL: ', engineURL)

  store.set('engineURL', engineURL)
  store.set('engineState', engineState)

  logger.debug('store.store: ', store.store)
}

if (require('electron-squirrel-startup')) {
  app.quit()
}

const saveEdit = async win => {
  win.webContents.send('saveEdit')
}

const loadFile = async (win, file = 1) => {
  // debug('%o open file %o', fn + cl().line, file)
  const properties = ['openFile']
  if (file === 1) {
    properties.push('multiSelections')
  }

  try {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      properties,
      filters: [
        {
          name: 'textfile',
          extensions: ['txt', 'md']
        }
      ]
    })

    // debug('%o, %o', fn + cl().line, filePaths)
    logger.debug('loaded: %s', filePaths)

    if (!canceled) {
      // const [filePath] = filePaths

      // const data = await fs.readFile(filePath, 'utf8')

      // debug('%o filePath: %o', fn + cl().line, filePaths)
      try {
        logger.debug('executing file2lines(%s)... ', file)
        if (file === 1) {
          for (const [idx, filePath] of filePaths.slice(0, 2).entries()) {
            if (idx) {
              col2 = file2lines(filePath)
              filename2 = filePath
            } else {
              col1 = file2lines(filePath)
              filename1 = filePath
            }
          }
        } else {
          const [filePath] = filePaths
          col2 = file2lines(filePath)
          filename2 = filePath
        }
      } catch (err) {
        throw new Error(err.message)
      }

      /*
        [
          {text1: 111, text2: 222, metric: 0},
          {text1: 'aaa', text2: 'bbb', metric: 1},
        ]
      // */

      // const lines0 = [111, 'aaa']
      // const data = lines0.map(el => ({ text1: el }))

      // const _ = { success: true, data }
      // debug('%o %O', fn + cl().line, _)

      /*
       ipcMain.send('file1-content', (evt, data) =>{
        debug('%o, %O', fn + cl().line, _)
      })
      // */
      // mainWindow
      // win.webContents.send('file1-content', _)
      // return _

      rowData = genRowdata({ col1, col2, col3 })

      win.webContents.send('rowData', rowData)
      return { success: true, rowData }
    } else {
      logger.debug(' conceled')
      return { canceled }
    }
  } catch (error) {
    logger.debug('error: %s', error)
    return { error }
  }
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
        await fsAsync.writeFile(filePath, data, 'utf8')

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
        const data = await fsAsync.readFile(filePath, 'utf8')
        return { success: true, data }
      } else {
        return { canceled }
      }
    } catch (error) {
      return { error }
    }
  })
  ipcMain.handle('update-rowdata', async (evt, rowdata) => {
    rowData = rowdata
    logger.debug(" updated rowData: %j", rowData)
    // logger.debug(" updated rowData: %s", JSON.stringify(rowData))
  })
}
const createWindow = () => {
  // Use saved window size in user-preferences
  const { width, height } = store.get('windowBounds') | defaultPref.windowBounds

  // const mainWindow = new BrowserWindow({
  mainWindow = new BrowserWindow({
    webPreferences: {
      // preload1: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
      preload: path.join(__dirname, 'preload.js'), // use a preload script
      nodeIntegration: true, // + contextIsolation: false to enable require
      contextIsolation: false,
      enableRemoteModule: true
    },
    width,
    height
  })

  mainWindow.on('resize', () => {
    // The event doesn't pass us the window size, so we call the `getBounds` method which returns an object with
    // the height, width, and x and y coordinates.
    const { width, height } = mainWindow.getBounds()
    // Now that we have them, save them using the `set` method.
    store.set('windowBounds', { width, height })
  })

  // mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);
  // mainWindow.loadURL('index.html');
  mainWindow.loadFile(path.join(__dirname, 'index.html'))

  logger.debug(' index.html loaded')

  // mainWindow.webContents.openDevTools();
  handleCommunication()
}

// app.on('ready', createWindow)

app.on('ready', () => {
  // do menu, from official docs

  // const menu = Menu.buildFromTemplate(template)
  // const template = ... moved to ./menuTemplate.js, not quite work
  // moved to bottom
  const menu = Menu.buildFromTemplate(menuTemplate)
  Menu.setApplicationMenu(menu)
  createWindow()

  // console.log('process.cwd()：', process.cwd())
  // consola.log('process.cwd()：', process.cwd())

  // start zmq(zmq.REP) at default port 5555
  // python\install\python.exe -s -m dezmq
  // const python = spawn('python/install/python.exe', ['-s', '-m', 'dezmq']);

  logger.debug('process.cwd()：', process.cwd())
  const pythonExecPath = path.join(__dirname, '../python/install/python.exe')
  logger.debug('python_exc_path： %s', pythonExecPath)

  /*  comment this line to include python
  // const python = spawn(pythonExecPath, ['-s', '-m', 'dezmq'])
  const python = spawn(pythonExecPath, ['-s', '-m', 'dezrest'])

  python.stdout.on('data', (data) => {
    console.log(`stdout: ${data}`)
  })

  python.stderr.on('data', (data) => {
    console.error(`stderr: ${data}`)
  })

  python.on('close', (code) => {
    console.log(`child process exited with code ${code}`)
  })
  // */
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

const menuTemplate = [
  // { role: 'appMenu' }
  ...(isMac
    ? [{
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
      }]
    : []),
  // { role: 'fileMenu' }
  {
    label: 'File',
    submenu: [
      {
        label: 'Open File1',
        accelerator: 'CmdOrCtrl+O',
        role: 'open',
        click: async () => { await loadFile(mainWindow) }
      },
      {
        label: 'Open File2',
        accelerator: 'CmdOrCtrl+P',
        role: 'open',
        click: async () => {
          logger.debug('open file2')
          let res = []
          try {
            res = await loadFile(mainWindow, 2)
          } catch (err) {
            dialog.showErrorBox('Error', err)
          }
          if (res.success) {
            dialog.showMessageBox(
              {
                message: 'File 2 successfully loaded.',
                title: 'Info',
                buttons: ['OK'],
                type: 'info' // none/info/error/question/warning https://newsn.net/say/electron-dialog-messagebox.html
              }
            )
          } else {
            dialog.showMessageBox(
              {
                message: 'Loading File 2 canceled.',
                title: 'Info',
                buttons: ['OK'],
                type: 'warning' // none/info/error/question/warning https://newsn.net/say/electron-dialog-messagebox.html
              }
            )
          }
        }
      },
      { type: 'separator' },
      {
        label: "SaveEdit",
        accelerator: 'CmdOrCtrl+E',
        click: async () => {
            logger.debug('SaveEdit clicked...')
            try {
              await saveEdit(mainWindow)
            } catch (e) {
              logger.error(e.message)
            }
          }
      },
      { type: 'separator' },
      {
        label: 'Align',
        accelerator: 'CmdOrCtrl+L', // CmdOrCtrl+R
        click: async () => {
          logger.debug('Align clicked...')
          logger.debug('\n\n\t=== col1 ', typeof col1, Array.isArray(col1))
          logger.debug('\n\n\t===  col2 ', typeof col2, Array.isArray(col2))
          logger.debug('\n\n\t=== lines1 ', typeof lines1, Array.isArray(lines1))
          logger.debug('\n\n\t===  lines2 ', typeof lines2, Array.isArray(lines2))

          const progressBar = new ProgressBar({
            text: 'diggin...',
            detail: 'Fetching alignment result... make sure the net is up '
          })
          progressBar
            .on('completed', function () {
              console.info('completed...')
              progressBar.detail = 'Task completed. Exiting...'
            })
            .on('aborted', function () {
              console.info('aborted...')
            })
          // let rowData  // moved to top as global
          try {
            // rowData = await zmqAlign(col1, col2)
            // rowData = await zmqAlign(lines1, lines2)
            // rowData = await restAlign(lines1, lines2)
            if (engineURL.match(/5555/) ) {
              rowData = await restAlign(col1, col2)
            } else {
              rowData = await restAlign(col1, col2, 'http://forindo.net:7860/api/predict')
            }
          } catch (e) {
            logger.error(e.message)
            // rowData = { text1: e.name, text2: e.message }
            dialog.showMessageBox(
              {
                message: `${e.name}: ${e.message}`,
                title: 'Warning',
                buttons: ['OK'],
                type: 'warning' // none/info/error/question/warning https://newsn.net/say/electron-dialog-messagebox.html
              }
            )
            return null
          } finally {
            progressBar.setCompleted()
          }

          // logger.debug(' rowData from col1 col2: %j', rowData)

          if (!rowData) {
            logger.error(' rowData is undefined ')
          } else {
            logger.debug(' send to via rowData channel ')
            // rowData.map((el, idx) => {
            rowData.forEach((el, idx) => {
              if (idx < 5) {
                logger.debug(' send via rowData channel ', el)
              }
            })

            // at least one metric not zero or empty
            let metric = rowData.map(el => el.metric)
            let ratio
            if (metric.length > 0) {
              ratio = metric.reduce( (s, e) => s + !!e, 0) / metric.length
              ratio = ratio.toFixed(3)
            } else { ratio = 0 }
            logger.debug("sum of metric: ", )

            let only = ''
            if (ratio < .2) only = 'only '

            if (ratio < 0.01) {
              dialog.showMessageBox(
                {
                  title: 'ratio',
                  message: `
  ptextpad failed to suggest any of aligned pairs, sorry about that.
  There can be various reasons for the failure.
                  `,
                  buttons: ['OK'],
                  type: 'info',
                })
            } else {
             dialog.showMessageBox(
                {
                  title: 'ratio',
                  message: `
  ptextpad ${only}managed to successfully suggest
  about ${ratio * 100}% of aligned pairs
                  `,
                  buttons: ['OK'],
                  type: 'info',
                })
            }

            // if (metric.some( el => !!el )) {
            mainWindow.webContents.send('rowData', rowData)
            if (ratio < 0.1) {
              let extra_msg = ''
              if(engineURL.match(/5555/)) {
                   extra_msg = `

  You may wish to try mlbee (Menu/Preferences/AlignEngin/forind-mlbee)
  instead, which takes a tad longer tho.`
              }

              dialog.showMessageBox(
                {
                  title: 'bummer',
                  message: `
  No meaningful result returned, either because
  there is a bug in the app, or the server is down,
  or there is an issue with your
  data/parameters selected. If possible, feedback to the dev,
  best with some descriptions and/or your data if feasible.${extra_msg}
                  `,
                  buttons: ['OK'],
                  type: 'warning' // none/info/error/question/warning https://newsn.net/say/electron-dialog-messagebox.html
                }
              )
            }
          }
        }
      },
      {
        label: 'Save(csv)',
        accelerator: 'CmdOrCtrl+S',
        click: async () => {
          logger.debug('SaveCsv clicked...')

          if (!rowData) { // undefined or empty
            dialog.showMessageBox(
              {
                message: 'Empty data...Try to Align first.',
                title: 'Warning',
                buttons: ['OK'],
                type: 'warning'
              }
            )
            return null
          }
          // proceed to save rowData
          let savedFilename = `${path.parse(filename1).name}-${path.parse(filename2).name}.csv`

          savedFilename = path.join(path.parse(path.resolve(filename1)).dir, savedFilename)

          logger.debug(' savedFilename: ', savedFilename)

          converter.json2csv(rowData, (err, csv) => {
            if (err) {
              dialog.showMessageBox(
                {
                  message: 'Unable to convert to csv.',
                  title: 'Warning',
                  buttons: ['OK'],
                  type: 'warning'
                }
              )
              return null
              // throw err
            }

            try {
              logger.debug('csv: ', csv.slice(0, 200))
            } catch (e) {
              logger.debug(e.message)
            }

            try {
              // fs.writeFileSync(savedFilename, csv, 'GB2312')
              // fs.writeFileSync(savedFilename, Buffer.from('EFBBBF', 'hex'))
              // fs.writeFileSync(savedFilename, csv)
              // fs.writeFile(`${outputPath}`, `\ufeff${string}`, 'utf8')
              fs.writeFileSync(savedFilename, `\ufeff${csv}`, 'utf8')

              // const arr = iconv.encode (str, 'GB2312')
              // fs.writeFileSync(savedFilename, arr, 'hex')
              dialog.showMessageBox(
                {
                  message: `${path.resolve(savedFilename)} saved`,
                  title: 'Info',
                  buttons: ['OK'],
                  type: 'info'
                }
              )
            } catch (e) {
              logger.error(e)
              dialog.showMessageBox(
                {
                  message: 'Unable to save, ' + e.message,
                  title: 'Warning',
                  buttons: ['OK'],
                  type: 'warning'
                }
              )
            }
          })
        }
      },
      {
        label: app.getName(),
        visible: false,
        submenu: [
          {
            label: 'AlignEngines',
            type: 'checkbox',
            checked: menuChecked,
            click: e => {
              // mainWindow.showResetNotification = e.checked;
              logger.debug(' checkbox ')
              menuChecked = !menuChecked
              store.set('menuChecked', menuChecked)
            }
          },
          {
            label: 'Preferences',
            click: _ => {
              const prefWindow = new BrowserWindow({ width: 500, height: 300, resizable: false })
              // prefWindow.loadURL(htmlPath)
              prefWindow.loadFile(path.join(__dirname, 'preferences.html'))
              prefWindow.show()
              // on window closed
            }
          }
        ]
      },
      { type: 'separator' },
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
      ...(isMac
        ? [
            { role: 'pasteAndMatchStyle' },
            { role: 'delete' },
            // { role: 'selectAll' },
            // { type: 'separator' },
            {
              label: 'Speech',
              submenu: [
                { role: 'startSpeaking' },
                { role: 'stopSpeaking' }
              ]
            }
          ]
        : [
            { role: 'delete' }
            // { type: 'separator' },
            // { role: 'selectAll' },
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
      // { role: 'zoom' },
      ...(isMac
        ? [
            { type: 'separator' },
            { role: 'front' },
            { type: 'separator' },
            { role: 'window' }
          ]
        : [
            { role: 'close' }
          ])
    ]
  },
  {
    label: 'Options', // HERE
    submenu: [
      {
        label: 'AlignEngine',
        submenu: [{
          label: 'forindo-dezbee(5555)',
          type: 'radio',
          checked: engineState.forindo_dezbee,
          click: e => {
            handleRadio('forindo_dezbee')
            splitToSents = false
            splitToSentsEnabled = false
            if (e.checked) {
              // handleRadio('forindo_dezbee')
            }
          }
        },
        {
          label: 'forindo-mlbee(7860)',
          type: 'radio',
          checked: engineState.forindo_mlbee,
          click: e => {
            handleRadio('forindo_mlbee')
          }
        },
        {
          label: 'localhost-dezbee(5555)',
          // enabled: false,
          type: 'radio',
          checked: engineState.localhost_dezbee,
          click: e => { handleRadio('localhost_dezbee') }
        },
        {
          label: 'localhost-mlbee(8501)',
          // enabled: false,
          type: 'radio',
          checked: false,
          click: e => { handleRadio('localhost_dezbee') }
        }]
      },
      {
        label: 'SplitToSents',
        submenu: [{
          label: "yes",
          enabled: false,
          checked: false,
          type: 'radio',
          // checked: splitToSents,
          click: e => {
            logger.debug(' SplitToSents checkbox ')
              dialog.showMessageBox(
                {
                  title: 'coming soon...',
                  message: `Not implemented yet, stay tuned.`,
                  buttons: ['OK'],
                  type: 'info'
                }
              )
            // splitToSents = !splitToSents
            splitToSents = false
            store.set('splitToSents', splitToSents)
            }
          },
        {
          label: 'no',
          type: 'radio',
          checked: true,
        }
        ]}
    ]
  },
  // =================
  {
    role: 'help',
    submenu: [
      {
        label: 'Goto repo',
        click: async () => {
          const { shell } = require('electron')
          // await shell.openExternal('https://electronjs.org')
          await shell.openExternal('https://github.com/ffreemt/ptextpad-electron')
        }
      },
      {
        label: 'Join qqgroup-316287378',
        click: async () => {
          const { shell } = require('electron')
          // await shell.openExternal('https://electronjs.org')
          // await shell.openExternal('https://github.com/ffreemt/ptextpad-electron')
          await shell.openExternal('https://jq.qq.com/?_wv=1027&k=9018eFSV')
        }
      },
      { label: `v.${require('../package.json').version}` }
    ]
  }
]
